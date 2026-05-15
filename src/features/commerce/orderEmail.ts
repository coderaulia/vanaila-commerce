import type { Order, OrderItem } from './types';

/**
 * Sends order confirmation email via Resend.
 * Fails silently — order processing should not be blocked by email failures.
 */
export async function sendOrderConfirmationEmail(order: Order, items: OrderItem[], customerEmail: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'orders@example.com';
  if (!apiKey) return;

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.productTitle} — ${item.variantName}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rp ${item.totalPrice.toLocaleString('id-ID')}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Order Confirmation</h2>
      <p>Thank you for your order <strong>${order.orderNumber}</strong>!</p>
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
      ${order.paymentMethod === 'manual_transfer' ? '<p>Please transfer the total amount to our bank account. Your order will be processed after payment confirmation.</p>' : ''}
      <p><strong>Shipping to:</strong><br/>${order.shippingName}<br/>${order.shippingAddress}<br/>${order.shippingCity}, ${order.shippingProvince} ${order.shippingPostalCode}<br/>${order.shippingPhone}</p>
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
      <p>Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong>${label}</strong></p>
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
