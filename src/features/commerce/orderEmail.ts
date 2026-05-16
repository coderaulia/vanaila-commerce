import type { PaymentSettings } from '@/features/cms/types';

import type { Order, OrderItem } from './types';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends order confirmation email via Resend.
 * Fails silently — order processing should not be blocked by email failures.
 */
export async function sendOrderConfirmationEmail(order: Order, items: OrderItem[], customerEmail: string, paymentSettings?: PaymentSettings): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'orders@example.com';
  if (!apiKey) return;

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.productTitle)} — ${escapeHtml(item.variantName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rp ${item.totalPrice.toLocaleString('id-ID')}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Order Confirmation</h2>
      <p>Thank you for your order <strong>${escapeHtml(order.orderNumber)}</strong>!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left">Item</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Subtotal:</strong> Rp ${order.subtotal.toLocaleString('id-ID')}</p>
      ${order.discount > 0 ? `<p><strong>Discount:</strong> -Rp ${order.discount.toLocaleString('id-ID')}</p>` : ''}
      <p style="font-size:18px"><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
      <hr/>
      <p><strong>Payment method:</strong> ${order.paymentMethod === 'midtrans' ? 'Online Payment (Midtrans)' : 'Manual Bank Transfer'}</p>
      ${order.paymentMethod === 'manual_transfer' ? `
        <div style="background:#f9f9f9;border:1px solid #e0e0e0;padding:16px;margin:12px 0;border-radius:4px">
          <p style="margin:0 0 8px"><strong>Transfer to:</strong></p>
          ${paymentSettings?.bankName ? `<p style="margin:4px 0">Bank: ${escapeHtml(paymentSettings.bankName)}</p>` : ''}
          ${paymentSettings?.bankAccountNumber ? `<p style="margin:4px 0">Account: ${escapeHtml(paymentSettings.bankAccountNumber)}</p>` : ''}
          ${paymentSettings?.bankAccountHolder ? `<p style="margin:4px 0">Name: ${escapeHtml(paymentSettings.bankAccountHolder)}</p>` : ''}
          ${paymentSettings?.paymentInstructions ? `<p style="margin:8px 0 0">${escapeHtml(paymentSettings.paymentInstructions)}</p>` : '<p style="margin:8px 0 0">Include your order number in the transfer description. Your order will be processed after payment confirmation.</p>'}
        </div>
      ` : ''}
      <p><strong>Shipping to:</strong><br/>${escapeHtml(order.shippingName)}<br/>${escapeHtml(order.shippingAddress)}<br/>${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingProvince)} ${escapeHtml(order.shippingPostalCode)}<br/>${escapeHtml(order.shippingPhone)}</p>
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
        to: customerEmail,
        subject: `Order Confirmation — ${order.orderNumber}`,
        html
      })
    });
  } catch {
    // Swallow email failures
  }
}

/**
 * Sends order status update email.
 */
export async function sendOrderStatusEmail(order: Order, customerEmail: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'orders@example.com';
  if (!apiKey) return;

  const statusLabels: Record<string, string> = {
    paid: 'Payment Confirmed',
    processing: 'Being Processed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  };

  const label = statusLabels[order.status] || order.status;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Order Update</h2>
      <p>Your order <strong>${escapeHtml(order.orderNumber)}</strong> status has been updated to: <strong>${escapeHtml(label)}</strong></p>
      ${order.status === 'shipped' ? '<p>Your order is on its way! You will receive it soon.</p>' : ''}
      ${order.status === 'delivered' ? '<p>Your order has been delivered. Thank you for shopping with us!</p>' : ''}
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
        to: customerEmail,
        subject: `Order ${order.orderNumber} — ${label}`,
        html
      })
    });
  } catch {
    // Swallow email failures
  }
}
