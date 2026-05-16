import { NextResponse } from 'next/server';

import { notifyContactSubmission } from '@/services/contactNotifications';
import {
  assertCsrfToken,
  assertRateLimit,
  assertTrustedMutationRequest,
  readJsonWithLimit
} from '@/services/requestSecurity';

const contactSubmissionBodyLimitBytes = 16 * 1024;

const maxLengths = {
  name: 120,
  company: 160,
  email: 254,
  serviceCategory: 200,
  projectOverview: 5000
} as const;

function asStr(value: unknown, max: number): string {
  const s = typeof value === 'string' ? value.trim() : '';
  return s.slice(0, max);
}

function validatePayload(body: unknown): {
  name: string;
  company: string;
  email: string;
  serviceCategory: string;
  projectOverview: string;
} | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;

  const name = asStr(b.name, maxLengths.name);
  const company = asStr(b.company, maxLengths.company);
  const email = asStr(b.email, maxLengths.email).toLowerCase();
  const serviceCategory = asStr(b.serviceCategory, maxLengths.serviceCategory);
  const projectOverview = asStr(b.projectOverview, maxLengths.projectOverview);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk || !serviceCategory || !projectOverview) return null;

  return { name, company, email, serviceCategory, projectOverview };
}

export async function POST(request: Request) {
  const originFailure = assertTrustedMutationRequest(request);
  if (originFailure) return originFailure;

  const csrfFailure = assertCsrfToken(request);
  if (csrfFailure) return csrfFailure;

  const rateLimitFailure = await assertRateLimit(request, 'contact-form', 10, 60_000);
  if (rateLimitFailure) return rateLimitFailure;

  const body = await readJsonWithLimit(request, contactSubmissionBodyLimitBytes);
  if (!body.ok) return body.response;

  const payload = validatePayload(body.value);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid contact submission payload.' }, { status: 400 });
  }

  const submission = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  try {
    await notifyContactSubmission(submission);
  } catch {
    // notification is non-blocking
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
