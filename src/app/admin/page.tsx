'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { AdminSessionUser } from '@/features/cms/adminTypes';
import type { DashboardSummary } from '@/features/cms/dashboardSummary';
import type { AdminPermission } from '@/features/cms/types';
import { csrfFetch } from '@/lib/clientCsrf';

type DashboardPanelProps = {
  user: AdminSessionUser;
};

type DashboardPreferences = {
  widgetOrder: string[];
  hiddenWidgets: string[];
};

const WIDGET_IDS = ['store-kpi', 'quick-actions', 'store-activity', 'audit'] as const;
type WidgetId = (typeof WIDGET_IDS)[number];

const widgetLabels: Record<WidgetId, string> = {
  'store-kpi': 'Store Metrics',
  'quick-actions': 'Quick Actions',
  'store-activity': 'Store Activity',
  audit: 'Recent Audit Activity'
};

const quickActions = [
  { href: '/admin/products/new', label: 'Add product', permission: 'store:edit' },
  { href: '/admin/products', label: 'Manage products', permission: 'store:edit' },
  { href: '/admin/product-categories', label: 'Product categories', permission: 'store:edit' },
  { href: '/admin/orders', label: 'Review orders', permission: 'store:manage_orders' },
  { href: '/admin/customers', label: 'Customers', permission: 'store:manage_customers' },
  { href: '/admin/settings', label: 'Store settings', permission: 'settings:edit' }
] satisfies Array<{ href: string; label: string; permission?: AdminPermission }>;

type StoreMetrics = NonNullable<DashboardSummary['storeMetrics']>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);

function resolveWidgetOrder(widgetOrder: string[]): WidgetId[] {
  const validOrder = widgetOrder.filter((id): id is WidgetId => WIDGET_IDS.includes(id as WidgetId));
  const missingWidgets = WIDGET_IDS.filter((id) => !validOrder.includes(id));
  return [...validOrder, ...missingWidgets];
}

function KpiWidget({ metrics }: { metrics: StoreMetrics | null }) {
  if (!metrics) {
    return (
      <section className="admin-card">
        <h2>Store metrics</h2>
        <p className="admin-subtle">Enable the store module with database mode to show revenue, order, customer, and inventory metrics.</p>
      </section>
    );
  }

  return (
    <section className="admin-kpi-grid">
      <article className="admin-card">
        <p className="admin-kpi-label">Paid revenue</p>
        <p className="admin-kpi-value">{formatCurrency(metrics.revenue)}</p>
      </article>
      <article className="admin-card">
        <p className="admin-kpi-label">Open orders</p>
        <p className="admin-kpi-value">{metrics.openOrders}</p>
        <p className="admin-subtle">{metrics.totalOrders} total orders</p>
      </article>
      <article className="admin-card">
        <p className="admin-kpi-label">Active products</p>
        <p className="admin-kpi-value">{metrics.activeProducts}</p>
        <p className="admin-subtle">{metrics.draftProducts} drafts</p>
      </article>
      <article className="admin-card">
        <p className="admin-kpi-label">Customers</p>
        <p className="admin-kpi-value">{metrics.customers}</p>
        <p className="admin-subtle">{metrics.lowStockVariants} low-stock variants</p>
      </article>
    </section>
  );
}

function QuickActionsWidget({ user }: { user: AdminSessionUser }) {
  const allowedQuickActions = useMemo(
    () => quickActions.filter((item) => !item.permission || user.permissions.includes(item.permission)),
    [user.permissions]
  );

  return (
    <section className="admin-card">
      <div className="admin-inline-header">
        <h2>Quick actions</h2>
      </div>
      <div className="admin-grid-3">
        {allowedQuickActions.map((item) => (
          <Link key={item.href} href={item.href} className="v2-btn v2-btn-secondary">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function StoreActivityWidget({ metrics }: { metrics: StoreMetrics | null }) {
  return (
    <section className="admin-grid-2">
      <article className="admin-card">
        <div className="admin-inline-header">
          <h2>Recent orders</h2>
          <Link href="/admin/orders">View all</Link>
        </div>
        <ul className="admin-plain-list">
          {metrics?.recentOrders.map((order) => (
            <li key={order.id}>
              <strong>
                <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
              </strong>
              <span>
                {order.customerName} - {formatCurrency(order.total)} - {order.status.replaceAll('_', ' ')} / {order.paymentStatus}
              </span>
            </li>
          ))}
          {!metrics || metrics.recentOrders.length === 0 ? <li className="admin-subtle">No orders yet.</li> : null}
        </ul>
      </article>
      <article className="admin-card">
        <div className="admin-inline-header">
          <h2>Inventory watch</h2>
          <Link href="/admin/products">Manage products</Link>
        </div>
        <ul className="admin-plain-list">
          <li>
            <strong>{metrics?.lowStockVariants ?? 0} variants</strong>
            <span>at or below {metrics?.lowStockThreshold ?? 5} units</span>
          </li>
          <li>
            <strong>{metrics?.paidOrders ?? 0} paid orders</strong>
            <span>included in revenue</span>
          </li>
          <li>
            <strong>{metrics?.draftProducts ?? 0} draft products</strong>
            <span>not visible in the public store</span>
          </li>
        </ul>
      </article>
    </section>
  );
}

function AuditWidget({ data }: { data: DashboardSummary }) {
  return (
    <section className="admin-card">
      <div className="admin-inline-header">
        <h2>Recent audit activity</h2>
        <Link href="/admin/audit">View all</Link>
      </div>
      <ul className="admin-plain-list">
        {data.auditLogs.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.action}</strong>
            <span>{new Date(entry.createdAt).toLocaleString()} - {entry.entityType} - {entry.ip}</span>
          </li>
        ))}
        {data.auditLogs.length === 0 ? <li className="admin-subtle">No audit events yet.</li> : null}
      </ul>
    </section>
  );
}

function DashboardPanel({ user }: DashboardPanelProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState<DashboardPreferences>({ widgetOrder: [], hiddenWidgets: [] });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load dashboard.');
        }
        setData((await response.json()) as DashboardSummary);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      });

    fetch('/api/admin/dashboard/preferences')
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { preferences: DashboardPreferences };
        if (payload.preferences) {
          setPreferences(payload.preferences);
        }
      })
      .catch(() => {});
  }, []);

  const orderedWidgets = useMemo(() => {
    const order = resolveWidgetOrder(preferences.widgetOrder);
    const hidden = new Set(preferences.hiddenWidgets);
    return order.filter((id) => !hidden.has(id));
  }, [preferences]);

  const toggleWidget = (widgetId: WidgetId) => {
    setPreferences((prev) => ({
      ...prev,
      hiddenWidgets: prev.hiddenWidgets.includes(widgetId)
        ? prev.hiddenWidgets.filter((id) => id !== widgetId)
        : [...prev.hiddenWidgets, widgetId]
    }));
  };

  const moveWidget = (widgetId: WidgetId, direction: 'up' | 'down') => {
    setPreferences((prev) => {
      const order = resolveWidgetOrder(prev.widgetOrder);
      const idx = order.indexOf(widgetId);
      if (idx === -1) return prev;

      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= order.length) return prev;

      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      return { ...prev, widgetOrder: order };
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    await csrfFetch('/api/admin/dashboard/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    setSaving(false);
    setIsCustomizing(false);
  };

  const resetPreferences = () => {
    setPreferences({ widgetOrder: [], hiddenWidgets: [] });
  };

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'store-kpi':
        return <KpiWidget key="store-kpi" metrics={data.storeMetrics} />;
      case 'quick-actions':
        return <QuickActionsWidget key="quick-actions" user={user} />;
      case 'store-activity':
        return <StoreActivityWidget key="store-activity" metrics={data.storeMetrics} />;
      case 'audit':
        return <AuditWidget key="audit" data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-form-wrap">
      <section className="admin-card">
        <div className="admin-inline-header">
          <h2>Dashboard</h2>
          <button type="button" className="v2-btn v2-btn-secondary" onClick={() => setIsCustomizing(!isCustomizing)}>
            {isCustomizing ? 'Done customizing' : 'Customize dashboard'}
          </button>
        </div>
      </section>

      {isCustomizing && (
        <section className="admin-card">
          <div className="admin-inline-header">
            <h3>Customize Widgets</h3>
          </div>
          <div className="admin-widget-settings">
            <div className="admin-widget-list">
              {resolveWidgetOrder(preferences.widgetOrder).map((widgetId) => {
                const id = widgetId as WidgetId;
                const isHidden = preferences.hiddenWidgets.includes(id);
                return (
                  <div key={id} className="admin-widget-item">
                    <span className={`admin-widget-name ${isHidden ? 'hidden' : ''}`}>
                      {widgetLabels[id]}
                      {isHidden && ' (hidden)'}
                    </span>
                    <div className="admin-widget-controls">
                      <button
                        type="button"
                        onClick={() => moveWidget(id, 'up')}
                        disabled={preferences.widgetOrder.indexOf(id) === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(id, 'down')}
                        disabled={preferences.widgetOrder.indexOf(id) === WIDGET_IDS.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWidget(id)}
                        className={isHidden ? 'admin-btn-show' : 'admin-btn-hide'}
                      >
                        {isHidden ? 'Show' : 'Hide'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="admin-widget-actions">
              <button type="button" onClick={() => void savePreferences()} disabled={saving}>
                {saving ? 'Saving...' : 'Save preferences'}
              </button>
              <button type="button" onClick={resetPreferences} className="v2-btn v2-btn-secondary">
                Reset to default
              </button>
            </div>
          </div>
        </section>
      )}

      {orderedWidgets.map(renderWidget)}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard" description="Store revenue, orders, products, customers, and inventory at a glance.">
      {(user) => <DashboardPanel user={user} />}
    </AdminShell>
  );
}
