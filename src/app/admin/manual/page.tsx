'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';

const sections = [
  { id: 'access', label: 'Access & Roles' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'content', label: 'Content Editing' },
  { id: 'media', label: 'Media Library' },
  { id: 'settings', label: 'Settings' },
  { id: 'store', label: 'Store' },
  { id: 'team', label: 'Team' },
  { id: 'audit', label: 'Audit & Analytics' },
  { id: 'checklist', label: 'Publishing Checklist' },
];

type FeatureChipProps = { label: string; variant?: 'default' | 'tip' | 'key' };
function FeatureChip({ label, variant = 'default' }: FeatureChipProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
    borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
    lineHeight: 1.4, whiteSpace: 'nowrap',
  };
  const styles: Record<string, React.CSSProperties> = {
    default: { background: '#eef3fb', color: '#1a2d4c', border: '1px solid #c8d4e8' },
    tip: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    key: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  };
  return <span style={{ ...base, ...styles[variant] }}>{label}</span>;
}

type SectionHeaderProps = { id: string; title: string; href?: string };
function SectionHeader({ id, title, href }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 id={id} style={{ margin: 0, scrollMarginTop: 80 }}>{title}</h2>
      {href && (
        <a
          href={href}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
            background: '#f0f4fa', border: '1px solid #c8d4e8', color: '#1a2d4c',
            textDecoration: 'none',
          }}
        >
          Open →
        </a>
      )}
    </div>
  );
}

type StepProps = { n: number; children: React.ReactNode };
function Step({ n, children }: StepProps) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
        background: '#1a2d4c', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
      }}>{n}</span>
      <span style={{ lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

type CollapsibleProps = { title: string; href?: string; children: React.ReactNode; defaultOpen?: boolean };
function Collapsible({ title, href, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #d2dced', borderRadius: 16, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: open ? '#f0f4fa' : '#f8fafd',
          border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: '#1a2d4c',
          textAlign: 'left', gap: 12,
        }}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {href && (
            <a
              href={href}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '2px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                background: '#fff', border: '1px solid #c8d4e8', color: '#1a2d4c', textDecoration: 'none',
              }}
            >
              Open
            </a>
          )}
          <span style={{ fontSize: '0.8rem', color: '#6b82a6', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ManualContent() {
  return (
    <div className="admin-form-wrap">

      {/* ── Table of Contents ── */}
      <section className="admin-card">
        <h2 style={{ marginBottom: 14 }}>Admin Manual</h2>
        <p className="admin-subtle" style={{ marginBottom: 16 }}>
          Complete guide to the CMS admin panel. Jump to any section below.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: '6px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
                background: '#f0f4fa', border: '1px solid #c8d4e8', color: '#1a2d4c',
                textDecoration: 'none', transition: 'background 0.15s',
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── Access & Roles ── */}
      <section className="admin-card" id="access" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="access-h" title="Access & Roles" href="/admin/login" />

        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          <Step n={1}>Go to <code>/admin/login</code>.</Step>
          <Step n={2}>Sign in with <code>CMS_ADMIN_EMAIL</code> and <code>CMS_ADMIN_PASSWORD</code> from <code>.env.local</code> or production env.</Step>
          <Step n={3}>First login bootstraps the initial admin user if the <code>admin_users</code> table is empty.</Step>
        </div>

        <h3 style={{ marginBottom: 12 }}>Role permissions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f0f4fa' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #d2dced', color: '#6b82a6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Role</th>
                {['Content', 'Settings', 'Media', 'Analytics', 'Audit', 'Team', 'Store'].map((h) => (
                  <th key={h} style={{ padding: '10px 10px', textAlign: 'center', borderBottom: '1px solid #d2dced', color: '#6b82a6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'super_admin', caps: [true, true, true, true, true, true, true] },
                { role: 'admin', caps: [true, true, true, true, true, false, true] },
                { role: 'store_manager', caps: [false, false, true, false, false, false, true] },
                { role: 'editor', caps: [true, false, true, false, false, false, false] },
                { role: 'analyst', caps: [false, false, false, true, true, false, false] },
              ].map(({ role, caps }, i) => (
                <tr key={role} style={{ background: i % 2 ? '#f8fafd' : '#fff' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #edf2f9', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem' }}>{role}</td>
                  {caps.map((has, j) => (
                    <td key={j} style={{ padding: '10px 10px', textAlign: 'center', borderBottom: '1px solid #edf2f9' }}>
                      {has
                        ? <span style={{ color: '#059669', fontSize: '1rem' }}>✓</span>
                        : <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>–</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Navigation ── */}
      <section className="admin-card" id="navigation" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="navigation-h" title="Navigation" />
        <p className="admin-subtle" style={{ marginBottom: 16 }}>
          Sidebar links to all admin areas. Sections only appear when the module is enabled and your role has access.
        </p>
        <div className="admin-grid-2">
          {[
            { label: 'Dashboard', href: '/admin', desc: 'Overview, health checks, quick links' },
            { label: 'Posts', href: '/admin/blog', desc: 'Blog post list and editor' },
            { label: 'Pages', href: '/admin/pages', desc: 'Landing and CMS-managed pages' },
            { label: 'Settings', href: '/admin/settings', desc: 'Site-wide configuration' },
            { label: 'Media Library', href: '/admin/media', desc: 'Images and files' },
            { label: 'Team', href: '/admin/team', desc: 'Admin user management' },
            { label: 'Analytics', href: '/admin/analytics', desc: 'Traffic and conversion data' },
            { label: 'Audit Log', href: '/admin/audit', desc: 'Change history for all admin actions' },
            { label: 'Reviews', href: '/admin/reviews', desc: 'Product reviews moderation (store module)' },
            { label: 'Categories', href: '/admin/categories', desc: 'Blog post categories' },
            { label: 'Sessions', href: '/admin/sessions', desc: 'Active login sessions' },
            { label: 'Products', href: '/admin/products', desc: 'Store products (store module)' },
            { label: 'Orders', href: '/admin/orders', desc: 'Customer orders (store module)' },
            { label: 'Customers', href: '/admin/customers', desc: 'Registered customers (store module)' },
            { label: 'Coupons', href: '/admin/coupons', desc: 'Discount codes (store module)' },
          ].map(({ label, href, desc }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'grid', gap: 2, padding: '12px 14px', borderRadius: 12,
                border: '1px solid #d8e2f1', background: '#f8fbff', textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span style={{ fontWeight: 700, color: '#1a2d4c', fontSize: '0.9rem' }}>{label}</span>
              <span style={{ color: '#6b82a6', fontSize: '0.8rem' }}>{desc}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Dashboard ── */}
      <section className="admin-card" id="dashboard" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="dashboard-h" title="Dashboard" href="/admin" />
        <p style={{ marginBottom: 12 }}>Start here after deployment or a content handoff. The dashboard gives an at-a-glance health check.</p>
        <div className="admin-grid-2">
          {[
            { title: 'First-run checklist', desc: 'Step-by-step setup guide shown on fresh installs' },
            { title: 'Scheduled queue', desc: 'Content set to auto-publish or auto-unpublish' },
            { title: 'Analytics snapshot', desc: 'Page views, leads, and top paths for today' },
            { title: 'Content health', desc: 'Warnings for missing SEO, broken links, and empty pages' },
            { title: 'Recent audit activity', desc: 'Last few admin mutations across the team' },
            { title: 'Quick links', desc: 'Jump directly into any main module' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.9rem', color: '#1a2d4c' }}>{title}</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b82a6' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Content Editing ── */}
      <section className="admin-card" id="content" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="content-h" title="Content Editing" />
        <div style={{ display: 'grid', gap: 12 }}>

          <Collapsible title="Pages" href="/admin/pages" defaultOpen>
            <p className="admin-subtle">Edit landing pages, the homepage, and CMS-managed sections.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              <FeatureChip label="Autosave every 30s" variant="tip" />
              <FeatureChip label="Ctrl+S / Cmd+S" variant="key" />
              <FeatureChip label="Draft preview" />
              <FeatureChip label="Schedule publish" />
              <FeatureChip label="Revision history" />
              <FeatureChip label="Direct image upload" />
            </div>
            <div className="admin-notice" style={{ fontSize: '0.85rem' }}>
              Drafts save freely at any state. SEO fields (meta title, description, slug) are only required before publishing.
            </div>
            <div className="admin-grid-2" style={{ marginTop: 4 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.85rem' }}>Home page</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '0.82rem', color: '#4b5563', display: 'grid', gap: 3 }}>
                  <li>Add / remove / reorder blocks</li>
                  <li>Enable / disable individual blocks</li>
                  <li>Theme token per block (light, blue-soft, mist)</li>
                </ul>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.85rem' }}>Other pages</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '0.82rem', color: '#4b5563', display: 'grid', gap: 3 }}>
                  <li>Section editing (heading, body, CTA, image)</li>
                  <li>Layout per section: stacked or split</li>
                  <li>Alt text on section images</li>
                </ul>
              </div>
            </div>
          </Collapsible>

          <Collapsible title="Blog Posts" href="/admin/blog">
            <p className="admin-subtle">Write, edit, and publish blog articles.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <FeatureChip label="Autosave" variant="tip" />
              <FeatureChip label="Draft preview" />
              <FeatureChip label="Schedule publish" />
              <FeatureChip label="Revision history" />
              <FeatureChip label="Search & filter" />
              <FeatureChip label="Bulk publish" />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {['Create draft', 'Edit content + SEO fields', 'Preview in draft mode', 'Publish, unpublish, or schedule', 'Restore a previous revision if needed'].map((s, i) => (
                <Step key={i} n={i + 1}>{s}</Step>
              ))}
            </div>
          </Collapsible>


        </div>
      </section>

      {/* ── Media Library ── */}
      <section className="admin-card" id="media" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="media-h" title="Media Library" href="/admin/media" />
        <div className="admin-grid-2">
          {[
            { icon: '📎', title: 'Upload files', desc: 'Upload images and files. Title and alt text are optional — add them any time from the detail panel.' },
            { icon: '🔁', title: 'Replace in place', desc: 'Swap a managed asset without changing its public URL. Existing content links stay intact.' },
            { icon: '🔍', title: 'Duplicate detection', desc: 'Files are fingerprinted with SHA-256 — uploading an identical file reopens the existing asset.' },
            { icon: '🔗', title: 'Usage tracking', desc: 'The detail panel shows "Where this asset is used." Delete is blocked when still referenced.' },
            { icon: '📐', title: 'Asset info', desc: 'Aspect ratio, file size, and storage provider are shown when an asset is selected.' },
            { icon: '⚡', title: 'Direct upload', desc: 'Upload from any image field in the page or post editor — no need to open the library separately.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1, marginTop: 2 }}>{icon}</span>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.875rem', color: '#1a2d4c' }}>{title}</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b82a6' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Settings ── */}
      <section className="admin-card" id="settings" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="settings-h" title="Settings" href="/admin/settings" />
        <p className="admin-subtle" style={{ marginBottom: 14 }}>Settings save per tab. Revision history is available — any previous save can be restored.</p>
        <div className="admin-grid-2">
          {[
            { tab: 'General', desc: 'Site name, URL, contact email, timezone' },
            { tab: 'Writing', desc: 'Default category, autosave interval' },
            { tab: 'Reading', desc: 'Posts per page, homepage, blog page, search engine indexing' },
            { tab: 'Discussion', desc: 'Comment settings' },
            { tab: 'Media', desc: 'Thumbnail sizes, storage quota' },
            { tab: 'Store', desc: 'Currency, shipping, payment methods' },
            { tab: 'Meta Tags', desc: 'Default SEO title template and social image' },
            { tab: 'Sitemaps', desc: 'Sitemap inclusion rules' },
            { tab: 'Redirects', desc: 'URL redirect rules' },
          ].map(({ tab, desc }) => (
            <div key={tab} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a2d4c' }}>{tab}</span>
              <span style={{ color: '#6b82a6', fontSize: '0.82rem', marginLeft: 8 }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Store ── */}
      <section className="admin-card" id="store" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="store-h" title="Store Module" />
        <div className="admin-notice" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
          Store sections only appear when <code>ENABLE_STORE_MODULE=true</code> is set and your role includes store permissions.
        </div>
        <div style={{ display: 'grid', gap: 12 }}>

          <Collapsible title="Products" href="/admin/products">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <FeatureChip label="Draft / Active / Archived" />
              <FeatureChip label="Variants (SKU, price, stock)" />
              <FeatureChip label="Featured flag" />
              <FeatureChip label="Auto stock deduction" variant="tip" />
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              Each product needs at least one variant to be purchasable. Stock deducts automatically on checkout and changes are logged in inventory logs.
            </p>
          </Collapsible>

          <Collapsible title="Orders" href="/admin/orders">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <FeatureChip label="Search by order # or customer" />
              <FeatureChip label="Status filter" />
              <FeatureChip label="Auto status emails" variant="tip" />
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#4b5563' }}>
              Fulfillment flow:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
              {['pending_payment', 'paid', 'processing', 'shipped', 'delivered'].map((s, i, arr) => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 999, background: '#f0f4fa', border: '1px solid #c8d4e8', color: '#1a2d4c', fontWeight: 600 }}>{s}</span>
                  {i < arr.length - 1 && <span style={{ color: '#9ca3af' }}>→</span>}
                </span>
              ))}
            </div>
          </Collapsible>

          <Collapsible title="Coupons" href="/admin/coupons">
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              Create percentage or fixed-amount discount codes. Set optional minimum order, max uses, start date, and expiry date.
            </p>
          </Collapsible>

          <Collapsible title="Customers" href="/admin/customers">
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              Customers are created automatically during checkout. View name, email, phone, order count, and lifetime spend. No manual creation.
            </p>
          </Collapsible>

        </div>
      </section>

      {/* ── Team ── */}
      <section className="admin-card" id="team" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="team-h" title="Team Management" href="/admin/team" />
        <div className="admin-grid-2">
          {[
            { title: 'Create users', desc: 'Add new admin accounts with email, display name, role, and initial password.' },
            { title: 'Update users', desc: 'Change display name, role, or password for any team member.' },
            { title: 'Delete users', desc: 'Remove accounts. Existing sessions for that user are revoked immediately.' },
            { title: 'Safeguards', desc: 'Cannot delete yourself. Cannot remove the last super_admin.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#1a2d4c' }}>{title}</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b82a6' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Audit & Analytics ── */}
      <section className="admin-card" id="audit" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="audit-h" title="Audit & Analytics" />
        <div className="admin-grid-2">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Audit Log</h3>
              <Link href="/admin/audit" style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, background: '#f0f4fa', border: '1px solid #c8d4e8', color: '#1a2d4c', textDecoration: 'none' }}>Open</Link>
            </div>
            <p className="admin-subtle" style={{ marginBottom: 10 }}>Tracks every admin mutation with timestamp and actor.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Content create/update/delete', 'Publish/unpublish', 'Media upload/delete/replace', 'Settings save', 'Revision restore', 'Team changes'].map((item) => (
                <FeatureChip key={item} label={item} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Analytics</h3>
              <Link href="/admin/analytics" style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, background: '#f0f4fa', border: '1px solid #c8d4e8', color: '#1a2d4c', textDecoration: 'none' }}>Open</Link>
            </div>
            <p className="admin-subtle" style={{ marginBottom: 10 }}>Traffic and conversion data with UTM attribution.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Page views', 'Unique visitors', 'CTA clicks', 'Contact leads', 'Top paths', 'Referrers', 'UTM attribution'].map((item) => (
                <FeatureChip key={item} label={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Publishing Checklist ── */}
      <section className="admin-card" id="checklist" style={{ scrollMarginTop: 80 }}>
        <SectionHeader id="checklist-h" title="Publishing Checklist" />
        <p className="admin-subtle" style={{ marginBottom: 14 }}>Run through this before publishing or scheduling any content.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { label: 'SEO title and description filled in', note: 'Required before publish' },
            { label: 'Slug is set and uses lowercase, hyphens only', note: 'Required before publish' },
            { label: 'Social image attached', note: 'Recommended for link previews' },
            { label: 'All images have alt text', note: 'Accessibility' },
            { label: 'Preview mode matches expectations', note: 'Open via "Open preview" in the editor toolbar' },
            { label: 'Scheduled publish/unpublish times are correct', note: 'Only if using scheduling' },
            { label: 'No content health warnings on the dashboard', note: 'Check /admin before publishing' },
          ].map(({ label, note }) => (
            <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, border: '1px solid #d8e2f1', background: '#f8fbff' }}>
              <span style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid #c8d4e8', flexShrink: 0, marginTop: 2 }} />
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a2d4c' }}>{label}</span>
                <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#9ca3af' }}>{note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default function AdminManualPage() {
  return (
    <AdminShell
      title="Admin Manual"
      description="Reference guide for using the CMS admin panel."
    >
      {() => <ManualContent />}
    </AdminShell>
  );
}
