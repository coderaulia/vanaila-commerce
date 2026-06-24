'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { siteProfile } from '@/config/site-profile';
import { modules } from '@/config/modules';
import { logoutAdmin, logoutAllDevices } from '@/features/cms/adminClientAuth';
import type { AdminSessionUser } from '@/features/cms/adminTypes';
import { formatAdminRoleLabel } from '@/features/cms/adminPermissions';
import type { AdminPermission } from '@/features/cms/types';

const storeLinks: Array<{ href: string; label: string; permission?: AdminPermission }> = [
  { href: '/admin/products', label: 'Products', permission: 'store:edit' },
  { href: '/admin/product-categories', label: 'Product Categories', permission: 'store:edit' },
  { href: '/admin/orders', label: 'Orders', permission: 'store:manage_orders' },
  { href: '/admin/customers', label: 'Customers', permission: 'store:manage_customers' },
  { href: '/admin/coupons', label: 'Coupons', permission: 'store:edit' },
  { href: '/admin/reviews', label: 'Reviews', permission: 'store:edit' }
];

function initialsForUser(user: AdminSessionUser) {
  const source = user.displayName.trim() || user.email.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AD';
}

type AdminNavProps = {
  user: AdminSessionUser;
};

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const permissionSet = new Set(user.permissions);

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href.split('?')[0]));
  const canAccess = (permission?: AdminPermission) => !permission || permissionSet.has(permission);

  const handleLogout = async () => {
    await logoutAdmin();
    router.replace('/admin/login');
    router.refresh();
  };

  const handleLogoutAll = async () => {
    if (!confirm('Sign out from all devices? You will be redirected to the login page.')) return;
    await logoutAllDevices();
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-scroll">
        <Link href="/admin" className="admin-logo">
          <span className="v2-brand-mark">{siteProfile.brand.mark}</span>
          <span>{siteProfile.brand.wordmark}</span>
        </Link>

        <p className="admin-side-title">Content</p>
        <ul className="admin-nav-list">
          <li>
            <Link href="/admin" className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}>
              Dashboard
            </Link>
          </li>
          {canAccess('content:edit') ? (
            <>
              <li>
                <Link
                  href="/admin/blog"
                  className={`admin-nav-link ${isActive('/admin/blog') ? 'active' : ''}`}
                >
                  Posts
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/pages"
                  className={`admin-nav-link ${isActive('/admin/pages') ? 'active' : ''}`}
                >
                  Pages
                </Link>
              </li>
            </>
          ) : null}
        </ul>

        {modules.ENABLE_STORE_MODULE && storeLinks.some((item) => canAccess(item.permission)) ? (
          <>
            <p className="admin-side-title">Store</p>
            <ul className="admin-nav-list">
              {storeLinks.filter((item) => canAccess(item.permission)).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={`admin-nav-link ${isActive(item.href) ? 'active' : ''}`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className="admin-side-title">Media</p>
        <ul className="admin-nav-list">
          {canAccess('media:edit') ? (
            <li>
              <Link href="/admin/media" className={`admin-nav-link ${isActive('/admin/media') ? 'active' : ''}`}>
                Media Library
              </Link>
            </li>
          ) : null}
        </ul>

        <p className="admin-side-title">Site</p>
        <ul className="admin-nav-list">
          {canAccess('settings:edit') ? (
            <li>
              <Link href="/admin/settings" className={`admin-nav-link ${isActive('/admin/settings') ? 'active' : ''}`}>
                Settings
              </Link>
            </li>
          ) : null}
          {canAccess('taxonomy:edit') ? (
            <li>
              <Link href="/admin/categories" className={`admin-nav-link ${isActive('/admin/categories') ? 'active' : ''}`}>
                Categories
              </Link>
            </li>
          ) : null}
          {canAccess('settings:edit') ? (
            <li>
              <Link href="/admin/redirects" className={`admin-nav-link ${isActive('/admin/redirects') ? 'active' : ''}`}>
                Redirects
              </Link>
            </li>
          ) : null}
        </ul>

        <p className="admin-side-title">Analytics &amp; Logs</p>
        <ul className="admin-nav-list">
          {canAccess('analytics:view') ? (
            <li>
              <Link href="/admin/analytics" className={`admin-nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}>
                Analytics
              </Link>
            </li>
          ) : null}
          {canAccess('audit:view') ? (
            <li>
              <Link href="/admin/audit" className={`admin-nav-link ${isActive('/admin/audit') ? 'active' : ''}`}>
                Audit Log
              </Link>
            </li>
          ) : null}
        </ul>

        <p className="admin-side-title">Account</p>
        <ul className="admin-nav-list">
          <li>
            <Link href="/admin/security" className={`admin-nav-link ${isActive('/admin/security') ? 'active' : ''}`}>
              Security
            </Link>
          </li>
        </ul>

        {canAccess('team:manage') ? (
          <>
            <p className="admin-side-title">Team</p>
            <ul className="admin-nav-list">
              <li>
                <Link href="/admin/team" className={`admin-nav-link ${isActive('/admin/team') ? 'active' : ''}`}>
                  Team
                </Link>
              </li>
              <li>
                <Link href="/admin/sessions" className={`admin-nav-link ${isActive('/admin/sessions') ? 'active' : ''}`}>
                  Sessions
                </Link>
              </li>
            </ul>
          </>
        ) : null}
      </div>

      <div className="admin-sidebar-footer">
        <div className="admin-user-card">
          <span className="admin-user-avatar">{initialsForUser(user)}</span>
          <div>
            <strong>{user.displayName}</strong>
            <p className="muted">{user.email}</p>
            <span className="admin-chip admin-chip-muted">{formatAdminRoleLabel(user.role)}</span>
          </div>
        </div>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          Logout
        </button>
        <button type="button" className="admin-logout admin-logout-all" onClick={handleLogoutAll}>
          Sign out all devices
        </button>
      </div>
    </aside>
  );
}
