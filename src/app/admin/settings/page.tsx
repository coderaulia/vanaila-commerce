'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { csrfFetch } from '@/lib/clientCsrf';

import { AdminShell } from '@/components/AdminShell';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { ContentRevisionPanel } from '@/components/admin/ContentRevisionPanel';
import { JsonImportExportCard } from '@/components/admin/JsonImportExportCard';
import { MediaPickerField } from '@/components/admin/MediaPickerField';
import { NavigationLinksEditor } from '@/components/admin/NavigationLinksEditor';
import type { Category, LandingPage, SiteSettings } from '@/features/cms/types';

type SettingsResponse = { settings: SiteSettings };
type PageResponse = { pages: LandingPage[] };
type CategoriesResponse = { categories: Category[] };

type SettingsTab = 'general' | 'navigation' | 'reading' | 'store' | 'payments' | 'shipping' | 'media' | 'seo' | 'sitemap';

type ShippingStatus = {
  configured: boolean;
  hasApiKey: boolean;
  hasOriginId: boolean;
  couriers: string[];
  defaultWeightGrams: number;
  freeThreshold: number | null;
  baseUrl: string;
};

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'reading', label: 'Reading' },
  { id: 'store', label: 'Store' },
  { id: 'payments', label: 'Payments' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'media', label: 'Media' },
  { id: 'seo', label: 'Meta Tags' },
  { id: 'sitemap', label: 'Sitemaps' },
];

function parseTab(value: string | null): SettingsTab {
  const candidate = value ?? 'general';
  return tabs.some((tab) => tab.id === candidate) ? (candidate as SettingsTab) : 'general';
}

function SettingsEditor() {
  const params = useSearchParams();
  const activeTab = parseTab(params.get('tab'));

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');
  const [revisionReloadKey, setRevisionReloadKey] = useState(0);
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus | null>(null);
  const [shippingStatusLoading, setShippingStatusLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await csrfFetch('/api/admin/settings');
    if (!res.ok) { setLoading(false); setError('Failed to load settings.'); return; }
    const payload = (await res.json()) as SettingsResponse;
    setSettings(payload.settings);
    setLoading(false);
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (activeTab !== 'reading' || pages.length > 0 || pagesLoading || pagesError) return;
    async function load() {
      setPagesLoading(true); setPagesError('');
      const res = await csrfFetch('/api/admin/pages');
      if (!res.ok) { setPagesLoading(false); setPagesError('Page options failed to load.'); return; }
      setPages(((await res.json()) as PageResponse).pages);
      setPagesLoading(false);
    }
    void load();
  }, [activeTab, pages.length, pagesLoading, pagesError]);

  useEffect(() => {
    if (activeTab !== 'shipping' || shippingStatus || shippingStatusLoading) return;
    async function load() {
      setShippingStatusLoading(true);
      const res = await csrfFetch('/api/admin/shipping/status');
      if (res.ok) setShippingStatus((await res.json()) as ShippingStatus);
      setShippingStatusLoading(false);
    }
    void load();
  }, [activeTab, shippingStatus, shippingStatusLoading]);

  useEffect(() => {
    if (activeTab !== 'general' || categories.length > 0 || categoriesLoading || categoriesError) return;
    async function load() {
      setCategoriesLoading(true); setCategoriesError('');
      const res = await csrfFetch('/api/admin/categories');
      if (!res.ok) { setCategoriesLoading(false); setCategoriesError('Category options failed to load.'); return; }
      setCategories(((await res.json()) as CategoriesResponse).categories);
      setCategoriesLoading(false);
    }
    void load();
  }, [activeTab, categories.length, categoriesLoading, categoriesError]);

  const pageOptions = useMemo(
    () => [
      ...pages.map((page) => ({ id: page.id, label: `${page.navLabel} (${page.id})` })),
      ...[settings?.reading.homepagePageId, settings?.reading.postsPageId]
        .filter((v): v is LandingPage['id'] => Boolean(v))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .filter((v) => !pages.some((p) => p.id === v))
        .map((id) => ({ id, label: `${id} (${id})` }))
    ],
    [pages, settings?.reading.homepagePageId, settings?.reading.postsPageId]
  );

  const categoryOptions = useMemo(() => {
    const entries = categories.map((c) => ({ label: c.name, value: c.slug }));
    if (settings?.writing.defaultPostCategory && !entries.some((e) => e.value === settings.writing.defaultPostCategory)) {
      entries.unshift({ label: settings.writing.defaultPostCategory, value: settings.writing.defaultPostCategory });
    }
    return entries;
  }, [categories, settings?.writing.defaultPostCategory]);

  const usesFallbackBrandMark = !settings?.organizationLogo && !settings?.branding.headerLogo && !settings?.branding.footerLogo;

  const save = async () => {
    if (!settings) return;
    setSaving(true); setNotice(''); setError('');
    const res = await csrfFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    if (!res.ok) { setError('Failed to save settings.'); return; }
    setSettings(((await res.json()) as SettingsResponse).settings);
    setNotice('Settings saved.');
    setRevisionReloadKey((k) => k + 1);
  };

  if (loading) return <p>Loading settings...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!settings) return <p>Settings not available.</p>;

  return (
    <div className="admin-form-wrap">
      <section className="admin-card">
        <div className="admin-inline-header">
          <h2>Website Settings</h2>
          <AdminActionButton icon="save" variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </AdminActionButton>
        </div>

        <div className="admin-actions" style={{ marginBottom: 16 }}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/settings?tab=${tab.id}`}
              className={`v2-btn ${activeTab === tab.id ? 'v2-btn-primary' : 'v2-btn-secondary'}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* ── General ── */}
        {activeTab === 'general' ? (
          <div className="admin-grid-2">
            <label>
              Website title
              <input
                value={settings.general.siteName}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value }, siteName: e.target.value })}
              />
            </label>
            <label>
              Tagline
              <input
                value={settings.general.siteTagline}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteTagline: e.target.value } })}
              />
            </label>
            <label>
              Website URL
              <input
                value={settings.general.baseUrl}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, baseUrl: e.target.value }, baseUrl: e.target.value })}
              />
            </label>
            <label>
              Admin email
              <input
                value={settings.general.adminEmail}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, adminEmail: e.target.value } })}
              />
            </label>
            <label>
              Time zone
              <input
                value={settings.general.timezone}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })}
              />
            </label>
            <label>
              Language
              <input
                value={settings.general.language}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, language: e.target.value } })}
              />
            </label>
            <label>
              Organization name
              <input
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
              />
            </label>
            <label>
              Default post category
              {categoriesLoading ? <span className="admin-subtle"> Loading...</span> : null}
              {categoriesError ? <span className="admin-error-text"> {categoriesError}</span> : null}
              <select
                value={settings.writing.defaultPostCategory}
                onChange={(e) => setSettings({ ...settings, writing: { ...settings.writing, defaultPostCategory: e.target.value } })}
              >
                <option value="">None</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaPickerField
                label="Organization logo"
                value={settings.organizationLogo}
                onChange={(v) => setSettings({ ...settings, organizationLogo: v })}
                helperText="Used for structured data and as fallback brand mark if header/footer logos are not set."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaPickerField
                label="Header logo"
                value={settings.branding.headerLogo}
                onChange={(v) => setSettings({ ...settings, branding: { ...settings.branding, headerLogo: v } })}
                helperText="Optional visual logo shown in the public header."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaPickerField
                label="Footer logo"
                value={settings.branding.footerLogo}
                onChange={(v) => setSettings({ ...settings, branding: { ...settings.branding, footerLogo: v } })}
                helperText="Optional visual logo shown in the public footer."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaPickerField
                label="Site icon / favicon"
                value={settings.branding.siteIcon}
                onChange={(v) => setSettings({ ...settings, branding: { ...settings.branding, siteIcon: v } })}
                helperText="Used for browser tab icons and mobile app icons."
              />
            </div>
            {usesFallbackBrandMark ? (
              <p className="admin-subtle" style={{ gridColumn: '1 / -1', marginTop: -4 }}>
                No uploaded logo set. Public site uses the built-in text logo fallback.
              </p>
            ) : null}
            <label>
              Footer tagline
              <input
                value={settings.branding.footerTagline}
                onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, footerTagline: e.target.value } })}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Copyright text
              <input
                value={settings.branding.copyrightText}
                onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, copyrightText: e.target.value } })}
              />
            </label>
          </div>
        ) : null}

        {/* ── Navigation ── */}
        {activeTab === 'navigation' ? (
          <div className="admin-grid-2">
            <div style={{ gridColumn: '1 / -1' }}>
              <NavigationLinksEditor
                label="Header menu links"
                description="Primary navigation links shown in the site header."
                items={settings.navigation.headerLinks}
                prefix="header-link"
                onChange={(v) => setSettings({ ...settings, navigation: { ...settings.navigation, headerLinks: v } })}
              />
            </div>
            <label>
              Header CTA label
              <input
                value={settings.navigation.headerCtaLabel}
                onChange={(e) => setSettings({ ...settings, navigation: { ...settings.navigation, headerCtaLabel: e.target.value } })}
              />
            </label>
            <label>
              Header CTA href
              <input
                value={settings.navigation.headerCtaHref}
                onChange={(e) => setSettings({ ...settings, navigation: { ...settings.navigation, headerCtaHref: e.target.value } })}
              />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <NavigationLinksEditor
                label="Footer navigator links"
                description="General footer links for company, blog, contact, and portfolio navigation."
                items={settings.navigation.footerNavigatorLinks}
                prefix="footer-nav"
                onChange={(v) => setSettings({ ...settings, navigation: { ...settings.navigation, footerNavigatorLinks: v } })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <NavigationLinksEditor
                label="Footer service links"
                description="Service shortcuts shown in the footer."
                items={settings.navigation.footerServiceLinks}
                prefix="footer-service"
                onChange={(v) => setSettings({ ...settings, navigation: { ...settings.navigation, footerServiceLinks: v } })}
              />
            </div>
            <label>
              Company name
              <input
                value={settings.contact.companyName}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, companyName: e.target.value } })}
              />
            </label>
            <label>
              Address line 1
              <input
                value={settings.contact.addressLine1}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, addressLine1: e.target.value } })}
              />
            </label>
            <label>
              Address line 2
              <input
                value={settings.contact.addressLine2}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, addressLine2: e.target.value } })}
              />
            </label>
            <label>
              Email
              <input
                value={settings.contact.emailValue}
                onChange={(e) =>
                  setSettings({ ...settings, contact: { ...settings.contact, emailValue: e.target.value }, social: { ...settings.social, emailHref: `mailto:${e.target.value}` } })
                }
              />
            </label>
            <label>
              Email href
              <input
                value={settings.contact.emailHref}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, emailHref: e.target.value }, social: { ...settings.social, emailHref: e.target.value } })}
              />
            </label>
            <label>
              WhatsApp
              <input
                value={settings.contact.whatsappValue}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, whatsappValue: e.target.value } })}
              />
            </label>
            <label>
              WhatsApp href
              <input
                value={settings.contact.whatsappHref}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, whatsappHref: e.target.value }, social: { ...settings.social, chatHref: e.target.value } })}
              />
            </label>
            <label>
              Instagram
              <input
                value={settings.contact.instagramValue}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, instagramValue: e.target.value } })}
              />
            </label>
            <label>
              Instagram href
              <input
                value={settings.contact.instagramHref}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, instagramHref: e.target.value }, social: { ...settings.social, instagramHref: e.target.value } })}
              />
            </label>
          </div>
        ) : null}

        {/* ── Reading ── */}
        {activeTab === 'reading' ? (
          <div className="admin-grid-2">
            {pagesLoading ? <p className="admin-subtle" style={{ gridColumn: '1 / -1' }}>Loading page options...</p> : null}
            {pagesError ? (
              <div className="admin-inline-header" style={{ gridColumn: '1 / -1' }}>
                <p className="admin-error-text">{pagesError}</p>
                <AdminActionButton icon="sync_alt" size="sm" variant="secondary" onClick={() => setPagesError('')}>Retry</AdminActionButton>
              </div>
            ) : null}
            <label>
              Homepage displays
              <select
                value={settings.reading.homepageDisplay}
                onChange={(e) => setSettings({ ...settings, reading: { ...settings.reading, homepageDisplay: e.target.value as SiteSettings['reading']['homepageDisplay'] } })}
              >
                <option value="static_page">A static page</option>
                <option value="latest_posts">Latest posts</option>
              </select>
            </label>
            <label>
              Homepage page
              <select
                value={settings.reading.homepagePageId}
                onChange={(e) => setSettings({ ...settings, reading: { ...settings.reading, homepagePageId: e.target.value as SiteSettings['reading']['homepagePageId'] } })}
              >
                <option value="">None</option>
                {pageOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </label>
            <label>
              Posts page
              <select
                value={settings.reading.postsPageId}
                onChange={(e) => setSettings({ ...settings, reading: { ...settings.reading, postsPageId: e.target.value as SiteSettings['reading']['postsPageId'] } })}
              >
                <option value="">None</option>
                {pageOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </label>
            <label>
              Blog posts per page
              <input
                type="number" min={1} max={100}
                value={settings.reading.postsPerPage}
                onChange={(e) => setSettings({ ...settings, reading: { ...settings.reading, postsPerPage: Number(e.target.value) } })}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Discourage search engines from indexing this site
              <input
                type="checkbox"
                checked={settings.reading.discourageSearchEngines}
                onChange={(e) => setSettings({ ...settings, reading: { ...settings.reading, discourageSearchEngines: e.target.checked } })}
              />
            </label>
          </div>
        ) : null}

        {/* ── Store ── */}
        {activeTab === 'store' ? (
          <div className="admin-grid-2">
            <label>
              Store name
              <input
                value={settings.store.storeName}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storeName: e.target.value } })}
              />
            </label>
            <label>
              Store phone
              <input
                value={settings.store.storePhone}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storePhone: e.target.value } })}
              />
            </label>
            <label>
              Currency code
              <input
                placeholder="IDR"
                value={settings.store.currency}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, currency: e.target.value } })}
              />
            </label>
            <label>
              Currency symbol
              <input
                placeholder="Rp"
                value={settings.store.currencySymbol}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, currencySymbol: e.target.value } })}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Store address
              <input
                value={settings.store.storeAddress}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storeAddress: e.target.value } })}
              />
            </label>
            <label>
              City
              <input
                value={settings.store.storeCity}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storeCity: e.target.value } })}
              />
            </label>
            <label>
              Province
              <input
                value={settings.store.storeProvince}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storeProvince: e.target.value } })}
              />
            </label>
            <label>
              Postal code
              <input
                value={settings.store.storePostalCode}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, storePostalCode: e.target.value } })}
              />
            </label>
            <label>
              Minimum order amount ({settings.store.currencySymbol || 'Rp'})
              <input
                type="number" min={0}
                value={settings.store.minOrderAmount}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, minOrderAmount: Number(e.target.value) } })}
              />
              <small className="admin-subtle">Set 0 to disable minimum order requirement.</small>
            </label>
            <label>
              Free shipping threshold ({settings.store.currencySymbol || 'Rp'})
              <input
                type="number" min={0}
                value={settings.store.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, freeShippingThreshold: Number(e.target.value) } })}
              />
              <small className="admin-subtle">Set 0 to disable free shipping offers.</small>
            </label>
          </div>
        ) : null}

        {/* ── Payments ── */}
        {activeTab === 'payments' ? (
          <div className="admin-grid-2">
            <label style={{ gridColumn: '1 / -1' }}>
              <input
                type="checkbox"
                checked={settings.payments.midtransEnabled}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, midtransEnabled: e.target.checked } })}
              />
              {' '}Enable Midtrans (online payment gateway)
              <small className="admin-subtle" style={{ display: 'block', marginTop: 4 }}>
                Requires MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY env vars. Midtrans Snap redirect flow.
              </small>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <input
                type="checkbox"
                checked={settings.payments.manualTransferEnabled}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, manualTransferEnabled: e.target.checked } })}
              />
              {' '}Enable manual bank transfer
            </label>
            <label>
              Bank name
              <input
                placeholder="e.g. BCA, Mandiri, BNI"
                value={settings.payments.bankName}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, bankName: e.target.value } })}
              />
            </label>
            <label>
              Account number
              <input
                value={settings.payments.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, bankAccountNumber: e.target.value } })}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Account holder name
              <input
                value={settings.payments.bankAccountHolder}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, bankAccountHolder: e.target.value } })}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Payment instructions
              <textarea
                rows={4}
                value={settings.payments.paymentInstructions}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, paymentInstructions: e.target.value } })}
              />
              <small className="admin-subtle">Shown to customers on the order confirmation page for manual transfer orders.</small>
            </label>
          </div>
        ) : null}

        {/* ── Shipping ── */}
        {activeTab === 'shipping' ? (
          <div className="admin-grid-2">
            {shippingStatusLoading ? (
              <p className="admin-subtle" style={{ gridColumn: '1 / -1' }}>Loading shipping configuration...</p>
            ) : shippingStatus ? (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="admin-subtle" style={{ marginBottom: 8, fontWeight: 600 }}>RajaOngkir integration status</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span>
                      {shippingStatus.hasApiKey ? '✓' : '✗'}{' '}
                      <code>RAJAONGKIR_API_KEY</code>{' '}
                      <span className="admin-subtle">{shippingStatus.hasApiKey ? 'configured' : 'not set — shipping quotes will be disabled'}</span>
                    </span>
                    <span>
                      {shippingStatus.hasOriginId ? '✓' : '✗'}{' '}
                      <code>SHIPPING_ORIGIN_ID</code>{' '}
                      <span className="admin-subtle">{shippingStatus.hasOriginId ? 'configured' : 'not set — origin city required for quotes'}</span>
                    </span>
                  </div>
                </div>
                {shippingStatus.configured ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="admin-subtle" style={{ marginBottom: 4, fontWeight: 600 }}>Active couriers</p>
                    <p className="admin-subtle">{shippingStatus.couriers.join(', ') || '—'}</p>
                    <p className="admin-subtle" style={{ marginTop: 4 }}>
                      Override via <code>SHIPPING_COURIERS</code> env var (colon-separated, e.g. <code>jne:sicepat:anteraja</code>).
                    </p>
                  </div>
                ) : null}
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="admin-subtle" style={{ marginBottom: 4, fontWeight: 600 }}>Other env vars</p>
                  <p className="admin-subtle">
                    <code>SHIPPING_DEFAULT_WEIGHT_GRAMS</code> — fallback weight per item when product weight is unset (current: {shippingStatus.defaultWeightGrams}g)
                  </p>
                  <p className="admin-subtle" style={{ marginTop: 4 }}>
                    <code>RAJAONGKIR_BASE_URL</code> — API base URL (current: {shippingStatus.baseUrl})
                  </p>
                </div>
              </>
            ) : null}
            <label>
              Free shipping threshold ({settings?.store.currencySymbol || 'Rp'})
              <input
                type="number" min={0}
                value={settings!.store.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings!, store: { ...settings!.store, freeShippingThreshold: Number(e.target.value) } })}
              />
              <small className="admin-subtle">Orders at or above this amount qualify for free shipping. Set 0 to disable.</small>
            </label>
          </div>
        ) : null}

        {/* ── Media ── */}
        {activeTab === 'media' ? (
          <div className="admin-grid-2">
            <label>
              Organize uploads by month
              <input
                type="checkbox"
                checked={settings.media.uploadOrganizeByMonth}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, uploadOrganizeByMonth: e.target.checked } })}
              />
            </label>
            <label>
              Thumbnail width
              <input type="number" min={50} value={settings.media.thumbnailWidth}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, thumbnailWidth: Number(e.target.value) } })}
              />
            </label>
            <label>
              Thumbnail height
              <input type="number" min={50} value={settings.media.thumbnailHeight}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, thumbnailHeight: Number(e.target.value) } })}
              />
            </label>
            <label>
              Medium max width
              <input type="number" min={100} value={settings.media.mediumMaxWidth}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, mediumMaxWidth: Number(e.target.value) } })}
              />
            </label>
            <label>
              Medium max height
              <input type="number" min={100} value={settings.media.mediumMaxHeight}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, mediumMaxHeight: Number(e.target.value) } })}
              />
            </label>
            <label>
              Large max width
              <input type="number" min={100} value={settings.media.largeMaxWidth}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, largeMaxWidth: Number(e.target.value) } })}
              />
            </label>
            <label>
              Large max height
              <input type="number" min={100} value={settings.media.largeMaxHeight}
                onChange={(e) => setSettings({ ...settings, media: { ...settings.media, largeMaxHeight: Number(e.target.value) } })}
              />
            </label>
          </div>
        ) : null}

        {/* ── SEO ── */}
        {activeTab === 'seo' ? (
          <div className="admin-grid-2">
            <label>
              Title template
              <input
                value={settings.seo.titleTemplate}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, titleTemplate: e.target.value } })}
              />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaPickerField
                label="Default OG image"
                value={settings.seo.defaultOgImage}
                onChange={(v) => setSettings({ ...settings, seo: { ...settings.seo, defaultOgImage: v }, defaultOgImage: v })}
                helperText="Fallback social sharing image used when a page or post does not define its own."
              />
            </div>
            <label style={{ gridColumn: '1 / -1' }}>
              Default meta description
              <textarea
                rows={4}
                value={settings.seo.defaultMetaDescription}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, defaultMetaDescription: e.target.value } })}
              />
            </label>
            <label>
              Site-wide noindex by default
              <input
                type="checkbox"
                checked={settings.seo.defaultNoIndex}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, defaultNoIndex: e.target.checked } })}
              />
            </label>
          </div>
        ) : null}

        {/* ── Sitemap ── */}
        {activeTab === 'sitemap' ? (
          <div className="admin-grid-2">
            <label>
              Enable sitemap
              <input
                type="checkbox"
                checked={settings.sitemap.enabled}
                onChange={(e) => setSettings({ ...settings, sitemap: { ...settings.sitemap, enabled: e.target.checked } })}
              />
            </label>
            <label>
              Include pages
              <input
                type="checkbox"
                checked={settings.sitemap.includePages}
                onChange={(e) => setSettings({ ...settings, sitemap: { ...settings.sitemap, includePages: e.target.checked } })}
              />
            </label>
            <label>
              Include posts
              <input
                type="checkbox"
                checked={settings.sitemap.includePosts}
                onChange={(e) => setSettings({ ...settings, sitemap: { ...settings.sitemap, includePosts: e.target.checked } })}
              />
            </label>
            <label>
              Include last modified date
              <input
                type="checkbox"
                checked={settings.sitemap.includeLastModified}
                onChange={(e) => setSettings({ ...settings, sitemap: { ...settings.sitemap, includeLastModified: e.target.checked } })}
              />
            </label>
          </div>
        ) : null}

        {notice ? <p className="mt-3">{notice}</p> : null}
      </section>

      <div className="admin-json-transfer-grid">
        <JsonImportExportCard
          collection="settings"
          title="Settings import / export"
          description="Download the current site settings JSON or restore a full settings object without editing each field manually."
          fixedMode="replace"
          importHint="Settings imports replace the current settings object."
          onImported={async () => {
            setNotice('Settings imported.');
            setPages([]); setCategories([]);
            setPagesError(''); setCategoriesError('');
            await loadSettings();
            setRevisionReloadKey((k) => k + 1);
          }}
        />
        <JsonImportExportCard
          collection="fullSite"
          title="Full-site backup / restore"
          description="Export a full CMS backup including settings, pages, posts, portfolio, categories, and media metadata."
          defaultMode="replace"
          importHint="Use replace to restore a complete backup."
          onImported={async () => {
            setNotice('CMS backup imported.');
            setPages([]); setCategories([]);
            setPagesError(''); setCategoriesError('');
            await loadSettings();
            setRevisionReloadKey((k) => k + 1);
          }}
        />
      </div>

      <ContentRevisionPanel<SiteSettings>
        entityType="site_settings"
        entityId="default"
        reloadKey={revisionReloadKey}
        emptyMessage="Saved settings revisions will appear here."
        onRestore={(restored) => {
          setSettings(restored);
          setNotice('Settings restored from revision history.');
        }}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="Settings"
      description="Configure general, navigation, store location, payment methods, media, SEO, and sitemap behavior."
    >
      {() => <SettingsEditor />}
    </AdminShell>
  );
}
