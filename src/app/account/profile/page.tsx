'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    fetch('/api/account/me')
      .then(r => {
        if (r.status === 401) { router.replace('/account/login'); return null; }
        return r.json() as Promise<{ customer: CustomerProfile }>;
      })
      .then(data => {
        if (!data) return;
        const c = data.customer;
        setProfile(c);
        setName(c.name);
        setPhone(c.phone);
        setAddress(c.address);
        setCity(c.city);
        setProvince(c.province);
        setPostalCode(c.postalCode);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, city, province, postalCode }),
      });
      if (res.ok) {
        const data = await res.json() as { customer: CustomerProfile };
        setProfile(data.customer);
        setSuccess(true);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Failed to save');
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-[60vh] px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-sm text-gray-500 hover:text-primary transition-colors">
            ← My account
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Profile & address</h1>
        <p className="text-sm text-gray-500 mb-8">{profile.email}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Profile saved.</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="name">Full name</label>
            <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="+62 812 3456 7890" />
          </div>

          <div className="pt-2">
            <p className="text-sm font-semibold mb-4">Default shipping address</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="address">Street address</label>
                <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="Jl. Malioboro No. 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="city">City</label>
                  <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                    placeholder="Yogyakarta" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="province">Province</label>
                  <input id="province" type="text" value={province} onChange={e => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                    placeholder="DI Yogyakarta" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="postalCode">Postal code</label>
                <input id="postalCode" type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="55111" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
