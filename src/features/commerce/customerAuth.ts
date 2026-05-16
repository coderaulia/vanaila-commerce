import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getDb } from '@/db/client';
import { customerSessionsTable, customersTable } from '@/db/schema';

const scrypt = promisify(nodeScrypt);

const CUSTOMER_SESSION_COOKIE = 'customer_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const nowIso = () => new Date().toISOString();

export type CustomerSessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hex, 'hex');
  return hash.length === storedBuf.length && timingSafeEqual(hash, storedBuf);
}

export type RegisterInput = {
  email: string;
  name: string;
  phone?: string;
  password: string;
};

export type LoginResult = {
  customer: CustomerSessionUser;
  sessionToken: string;
  expiresAt: string;
};

export type RegisterError = 'email_taken' | 'weak_password';

export async function registerCustomer(
  input: RegisterInput
): Promise<LoginResult | RegisterError> {
  if (input.password.length < 8) return 'weak_password';

  const db = getDb();
  const existing = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.email, input.email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) return 'email_taken';

  const passwordHash = await hashPassword(input.password);
  const now = nowIso();
  const id = randomUUID();

  await db.insert(customersTable).values({
    id,
    email: input.email.toLowerCase().trim(),
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return createSession(id);
}

export type LoginError = 'invalid_credentials';

export async function loginCustomer(
  email: string,
  password: string
): Promise<LoginResult | LoginError> {
  const db = getDb();
  const rows = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, email.toLowerCase().trim()))
    .limit(1);

  const customer = rows[0];
  if (!customer || !customer.passwordHash) return 'invalid_credentials';

  const ok = await verifyPassword(password, customer.passwordHash);
  if (!ok) return 'invalid_credentials';

  return createSession(customer.id);
}

async function createSession(customerId: string): Promise<LoginResult> {
  const db = getDb();
  const sessionToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const now = nowIso();

  await db.insert(customerSessionsTable).values({
    id: randomUUID(),
    customerId,
    sessionToken,
    expiresAt,
    createdAt: now,
  });

  const rows = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, customerId))
    .limit(1);

  const c = rows[0]!;
  return {
    customer: {
      id: c.id,
      email: c.email,
      name: c.name,
      phone: c.phone,
      address: c.address,
      city: c.city,
      province: c.province,
      postalCode: c.postalCode,
    },
    sessionToken,
    expiresAt,
  };
}

export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const now = nowIso();

  const rows = await db
    .select({ customer: customersTable })
    .from(customerSessionsTable)
    .innerJoin(customersTable, eq(customerSessionsTable.customerId, customersTable.id))
    .where(
      and(
        eq(customerSessionsTable.sessionToken, token),
        gt(customerSessionsTable.expiresAt, now)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const c = row.customer;
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    address: c.address,
    city: c.city,
    province: c.province,
    postalCode: c.postalCode,
  };
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return;

  const db = getDb();
  await db
    .delete(customerSessionsTable)
    .where(eq(customerSessionsTable.sessionToken, token));
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: string): void {
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(expiresAt),
    path: '/',
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
