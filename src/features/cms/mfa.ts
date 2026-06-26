import { createHash, createHmac, randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { adminUsersTable } from '@/db/schema';
import { env } from '@/services/env';
import { logoutAllAdminSessions } from './adminAuth';
import { nowIso } from './storeShared';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BACKUP_CODE_COUNT = 10;
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // accept ±1 period for clock skew

function base32Encode(buf: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(input: string): Buffer {
  const str = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function hotpToken(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  // Write counter as big-endian 64-bit integer
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);
  const hmac = createHmac('sha1', secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

function totpVerify(secret: string, token: string): boolean {
  const secretBuf = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  const trimmed = token.trim().replace(/\s/g, '');
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
    if (hotpToken(secretBuf, now + offset) === trimmed) return true;
  }
  return false;
}

function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function buildOtpauthUrl(email: string, secret: string): string {
  const label = encodeURIComponent(`VanailaCMS:${email}`);
  const issuer = encodeURIComponent('VanailaCMS');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

function hashBackupCode(code: string) {
  return createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
}

function generateRawBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => randomBytes(4).toString('hex'));
}

export function generateMfaSetup(userEmail: string): { secret: string; otpauthUrl: string } {
  const secret = generateTotpSecret();
  const otpauthUrl = buildOtpauthUrl(userEmail, secret);
  return { secret, otpauthUrl };
}

export async function enableMfa(userId: string, secret: string, code: string): Promise<string[] | null> {
  if (!env.databaseUrl) return null;

  const isValid = totpVerify(secret, code);
  if (!isValid) return null;

  const rawCodes = generateRawBackupCodes();
  const hashedCodes = rawCodes.map(hashBackupCode);

  try {
    await getDb()
      .update(adminUsersTable)
      .set({
        mfaSecret: secret,
        mfaEnabled: true,
        mfaBackupCodes: hashedCodes,
        updatedAt: nowIso()
      })
      .where(eq(adminUsersTable.id, userId));

    return rawCodes;
  } catch {
    return null;
  }
}

export async function verifyMfaForUser(userId: string, code: string): Promise<boolean> {
  if (!env.databaseUrl) return false;

  const trimmedCode = code.trim().toLowerCase();

  try {
    const rows = await getDb()
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, userId))
      .limit(1);

    const user = rows[0] ?? null;
    if (!user || !user.mfaEnabled || !user.mfaSecret) return false;

    // Check TOTP first
    if (totpVerify(user.mfaSecret, trimmedCode)) {
      return true;
    }

    // Check backup codes (one-time use)
    const storedCodes: string[] = user.mfaBackupCodes ?? [];
    const incomingHash = hashBackupCode(trimmedCode);
    const matchIndex = storedCodes.indexOf(incomingHash);
    if (matchIndex === -1) return false;

    const updatedCodes = storedCodes.filter((_, i) => i !== matchIndex);
    await getDb()
      .update(adminUsersTable)
      .set({ mfaBackupCodes: updatedCodes, updatedAt: nowIso() })
      .where(eq(adminUsersTable.id, userId));

    return true;
  } catch {
    return false;
  }
}

export async function disableMfa(userId: string): Promise<void> {
  if (!env.databaseUrl) return;

  await getDb()
    .update(adminUsersTable)
    .set({
      mfaSecret: null,
      mfaEnabled: false,
      mfaBackupCodes: null,
      updatedAt: nowIso()
    })
    .where(eq(adminUsersTable.id, userId));

  await logoutAllAdminSessions(userId);
}

export async function getMfaStatus(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
  if (!env.databaseUrl) return { enabled: false, backupCodesRemaining: 0 };

  try {
    const rows = await getDb()
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, userId))
      .limit(1);

    const user = rows[0] ?? null;
    if (!user) return { enabled: false, backupCodesRemaining: 0 };

    return {
      enabled: user.mfaEnabled,
      backupCodesRemaining: user.mfaBackupCodes?.length ?? 0
    };
  } catch {
    return { enabled: false, backupCodesRemaining: 0 };
  }
}
