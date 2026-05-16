import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { verifyOrderReceiptToken } from '@/features/commerce/orderReceipt';
import { getOrderById } from '@/features/commerce/store';
import { getSettings } from '@/features/cms/contentStore';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string }>;
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const { id } = await params;
  const { token } = (await searchParams) ?? {};
  const [order, settings] = await Promise.all([getOrderById(id), getSettings()]);
  if (!order || !verifyOrderReceiptToken(order, token)) notFound();

  const { payments: paymentSettings } = settings;

  return (
    <main className="order-confirmation-page">
      <div className="order-confirmation">
        <h1>Order Placed</h1>
        <p className="order-number">Order #{order.orderNumber}</p>

        <div className="order-status-card">
          <p><strong>Status:</strong> {order.status.replace(/_/g, ' ')}</p>
          <p><strong>Payment:</strong> {order.paymentMethod === 'midtrans' ? 'Online Payment' : 'Manual Transfer'}</p>
          <p><strong>Total:</strong> Rp {order.total.toLocaleString('id-ID')}</p>
        </div>

        {order.paymentMethod === 'manual_transfer' && order.paymentStatus === 'pending' && (
          <div className="order-transfer-info">
            <h2>Bank Transfer Instructions</h2>
            <p>Please transfer <strong>Rp {order.total.toLocaleString('id-ID')}</strong> to:</p>
            {paymentSettings.bankName && <p><strong>Bank:</strong> {paymentSettings.bankName}</p>}
            {paymentSettings.bankAccountNumber && <p><strong>Account number:</strong> {paymentSettings.bankAccountNumber}</p>}
            {paymentSettings.bankAccountHolder && <p><strong>Account name:</strong> {paymentSettings.bankAccountHolder}</p>}
            <p>Include your order number <strong>{order.orderNumber}</strong> in the transfer description.</p>
            {paymentSettings.paymentInstructions
              ? <p>{paymentSettings.paymentInstructions}</p>
              : <p>Your order will be processed after payment confirmation.</p>
            }
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="order-items-summary">
            <h2>Items</h2>
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productTitle} × {item.quantity} — Rp {item.totalPrice.toLocaleString('id-ID')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="order-shipping-info">
          <h2>Shipping To</h2>
          <p>{order.shippingName}</p>
          <p>{order.shippingAddress}</p>
          <p>{order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}</p>
          <p>{order.shippingPhone}</p>
        </div>
      </div>
    </main>
  );
}
