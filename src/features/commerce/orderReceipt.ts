import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '@/services/env';

import type { Order } from './types';

const RECEIPT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getReceiptSecret() {
  return (
    process.env.ORDER_RECEIPT_SECRET?.trim() ||
    env.passwordPepper ||
    env.adminPassword ||
    env.adminToken ||
    env.databaseUrl
  );
}

function receiptSignature(order: Pick<Order, 'id' | 'orderNumber' | 'customerId'>, expiresAt: number) {
  const secret = getReceiptSecret();
  if (!secret) return '';

  return createHmac('sha256', secret)
    .update(`${order.id}.${order.orderNumber}.${order.customerId}.${expiresAt}`)
    .digest('base64url');
}

export function createOrderReceiptToken(order: Pick<Order, 'id' | 'orderNumber' | 'customerId'>) {
  const expiresAt = Date.now() + RECEIPT_TTL_MS;
  const signature = receiptSignature(order, expiresAt);
  if (!signature) return '';
  return `${expiresAt}.${signature}`;
}

export function verifyOrderReceiptToken(
  order: Pick<Order, 'id' | 'orderNumber' | 'customerId'>,
  token: string | null | undefined
) {
  const [expiresAtRaw, signature = ''] = (token ?? '').split('.');
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || !signature) {
    return false;
  }

  const expected = receiptSignature(order, expiresAt);
  if (!expected) return false;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}
