import { createHash, randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { adminUsersTable } from '@/db/schema';
import { env } from '@/services/env';
import { hashAdminPassword, logoutAllAdminSessions } from './adminAuth';
import { nowIso } from './storeShared';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hashToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

async function sendPasswordResetEmail(toEmail: string, rawToken: string, displayName: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'noreply@example.com';
  if (!apiKey) return;

  const resetUrl = `${env.siteUrl}/admin/login/reset-password?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Reset your admin password</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>You requested a password reset for your admin account. Click the link below to set a new password:</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(resetUrl)}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
          Reset Password
        </a>
      </p>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      <p style="color:#666;font-size:14px">If the button above doesn't work, copy and paste this URL into your browser:<br/>${escapeHtml(resetUrl)}</p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toEmail,
        subject: 'Reset your admin password',
        html
      })
    });
  } catch {
    // Fail silently — do not block the request or leak user existence
  }
}

export async function createPasswordResetToken(email: string): Promise<void> {
  if (!env.databaseUrl) return;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  let user: typeof adminUsersTable.$inferSelect | null = null;
  try {
    const rows = await getDb()
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, normalizedEmail))
      .limit(1);
    user = rows[0] ?? null;
  } catch {
    return;
  }

  if (!user) {
    // Always return silently — do not leak whether the email exists
    return;
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  try {
    await getDb()
      .update(adminUsersTable)
      .set({ resetToken: tokenHash, resetTokenExpiresAt: expiresAt, updatedAt: nowIso() })
      .where(eq(adminUsersTable.id, user.id));
  } catch {
    return;
  }

  await sendPasswordResetEmail(user.email, rawToken, user.displayName);
}

export async function verifyPasswordResetToken(rawToken: string): Promise<string | null> {
  if (!env.databaseUrl || !rawToken.trim()) return null;

  const tokenHash = hashToken(rawToken.trim());

  try {
    const rows = await getDb()
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.resetToken, tokenHash))
      .limit(1);

    const user = rows[0] ?? null;
    if (!user || !user.resetTokenExpiresAt) return null;

    const expiresAt = new Date(user.resetTokenExpiresAt).getTime();
    if (expiresAt <= Date.now()) return null;

    return user.id;
  } catch {
    return null;
  }
}

export async function consumePasswordResetToken(rawToken: string, newPassword: string): Promise<boolean> {
  const userId = await verifyPasswordResetToken(rawToken);
  if (!userId) return false;

  const trimmedPassword = newPassword.trim();
  if (trimmedPassword.length < 8) return false;

  try {
    const passwordHash = await hashAdminPassword(trimmedPassword);
    await getDb()
      .update(adminUsersTable)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        updatedAt: nowIso()
      })
      .where(eq(adminUsersTable.id, userId));

    await logoutAllAdminSessions(userId);
    return true;
  } catch {
    return false;
  }
}
