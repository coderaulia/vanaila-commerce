import { env } from '@/services/env';

import type { ShippingDestination, ShippingQuote } from './types';

type RajaOngkirMeta = {
  message?: string;
  code?: number;
  status?: string;
};

type DomesticDestinationRow = {
  id?: number | string;
  label?: string;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  postal_code?: string;
  zip_code?: string;
};

type DomesticDestinationResponse = {
  meta?: RajaOngkirMeta;
  data?: DomesticDestinationRow[];
};

type DomesticCostRow = {
  name?: string;
  code?: string;
  service?: string;
  description?: string;
  cost?: number;
  etd?: string;
};

type DomesticCostResponse = {
  meta?: RajaOngkirMeta;
  data?: DomesticCostRow[];
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function toQuoteId(provider: ShippingQuote['provider'], destinationId: string, courierCode: string, serviceCode: string, weightGrams: number): string {
  return `${provider}:${destinationId}:${courierCode}:${serviceCode}:${weightGrams}`;
}

function parseDestination(row: DomesticDestinationRow): ShippingDestination | null {
  const id = normalizeText(row.id);
  const label = normalizeText(row.label);
  if (!id || !label) return null;

  return {
    id,
    label,
    province: normalizeText(row.province),
    city: normalizeText(row.city),
    district: normalizeText(row.district),
    subdistrict: normalizeText(row.subdistrict),
    postalCode: normalizeText(row.postal_code || row.zip_code)
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function estimateOrderWeightGrams(input: Array<{ quantity: number; variant?: { weight: number | string | null } }>): number {
  const total = input.reduce((sum, item) => {
    const parsedWeight = Number(item.variant?.weight ?? 0);
    const unitWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : env.shippingDefaultWeightGrams;
    return sum + unitWeight * item.quantity;
  }, 0);

  return Math.max(1, Math.round(total));
}

export async function searchShippingDestinations(query: string): Promise<ShippingDestination[]> {
  const apiKey = env.rajaOngkirApiKey;
  if (!apiKey) return [];

  const url = new URL('/destination/domestic-destination', env.rajaOngkirBaseUrl);
  if (query.trim()) url.searchParams.set('search', query.trim());

  const response = await fetch(url, {
    headers: {
      key: apiKey
    }
  });

  if (!response.ok) return [];
  const payload = await readJson<DomesticDestinationResponse>(response);
  return (payload?.data ?? [])
    .map(parseDestination)
    .filter((item): item is ShippingDestination => Boolean(item));
}

export async function quoteShippingCosts(input: {
  originId: string;
  destinationId: string;
  weightGrams: number;
  couriers?: string[];
}): Promise<ShippingQuote[]> {
  const apiKey = env.rajaOngkirApiKey;
  if (!apiKey) return [];

  const couriers = (input.couriers?.length ? input.couriers : env.shippingCouriers).filter(Boolean);
  if (!input.originId || !input.destinationId || !couriers.length) return [];

  const results: ShippingQuote[] = [];

  for (const courierCode of couriers) {
    const body = new URLSearchParams();
    body.set('origin', input.originId);
    body.set('destination', input.destinationId);
    body.set('weight', String(Math.max(1, Math.round(input.weightGrams))));
    body.set('courier', courierCode);

    const response = await fetch(new URL('/calculate/domestic-cost', env.rajaOngkirBaseUrl), {
      method: 'POST',
      headers: {
        key: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) continue;
    const payload = await readJson<DomesticCostResponse>(response);
    for (const row of payload?.data ?? []) {
      const serviceCode = normalizeText(row.service);
      const serviceName = normalizeText(row.service);
      const courierName = normalizeText(row.name) || courierCode.toUpperCase();
      const cost = Number(row.cost ?? 0);
      if (!serviceCode || !Number.isFinite(cost) || cost < 0) continue;

      results.push({
        id: toQuoteId('rajaongkir', input.destinationId, courierCode, serviceCode, input.weightGrams),
        provider: 'rajaongkir',
        courierCode,
        courierName,
        serviceCode,
        serviceName,
        description: normalizeText(row.description),
        etd: normalizeText(row.etd),
        cost: Math.round(cost),
        weightGrams: input.weightGrams
      });
    }
  }

  return results.sort((a, b) => a.cost - b.cost || a.courierCode.localeCompare(b.courierCode));
}

export function resolveFreeShippingThreshold(): number | null {
  return env.shippingFreeThreshold;
}
