import { describe, it, expect, vi } from 'vitest';
import type { Rate } from 'shippo';

// Mocks are hoisted before imports — must match the specifiers used in shipping.ts
vi.mock('./server.js', () => ({ stripe: {} }));

vi.mock('shippo', () => ({
  Shippo: vi.fn().mockImplementation(function () {
    return {
      addresses: { create: vi.fn() },
      shipments: { create: vi.fn() },
    };
  }),
  DistanceUnitEnum: { In: 'in' },
  WeightUnitEnum: { Oz: 'oz' },
  Provider: {},
}));

vi.mock('express', () => ({
  default: { Router: vi.fn() },
  Router: vi.fn().mockReturnValue({ post: vi.fn() }),
}));

import {
  normalizeProductDimensions,
  getFilteredRates,
  optimalPackingAlgo,
  selectFinalPackageSize,
  packItemsIntoOneParcel,
} from './shipping.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRate(overrides: Partial<{
  provider: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
  servicelevel: { name: string | null; token: string };
}> = {}): Rate {
  return {
    provider: 'USPS',
    amount: '5.00',
    currency: 'USD',
    estimatedDays: 3,
    servicelevel: { name: 'Priority Mail', token: 'usps_priority' },
    ...overrides,
  } as unknown as Rate;
}

// ─── normalizeProductDimensions ─────────────────────────────────────────────

describe('normalizeProductDimensions', () => {
  it('sorts dimensions so l >= w >= h', () => {
    expect(normalizeProductDimensions({ length: 6, width: 12, height: 4 }))
      .toEqual({ l: 12, w: 6, h: 4 });
  });

  it('handles already-sorted dimensions', () => {
    expect(normalizeProductDimensions({ length: 10, width: 6, height: 4 }))
      .toEqual({ l: 10, w: 6, h: 4 });
  });

  it('handles equal dimensions', () => {
    expect(normalizeProductDimensions({ length: 5, width: 5, height: 5 }))
      .toEqual({ l: 5, w: 5, h: 5 });
  });

  it('handles height being the largest', () => {
    expect(normalizeProductDimensions({ length: 2, width: 3, height: 9 }))
      .toEqual({ l: 9, w: 3, h: 2 });
  });

  it('throws when length is 0', () => {
    expect(() => normalizeProductDimensions({ length: 0, width: 4, height: 3 }))
      .toThrow('Product dimensions are required');
  });

  it('throws when width is 0', () => {
    expect(() => normalizeProductDimensions({ length: 5, width: 0, height: 3 }))
      .toThrow('Product dimensions are required');
  });

  it('throws when height is 0', () => {
    expect(() => normalizeProductDimensions({ length: 5, width: 4, height: 0 }))
      .toThrow('Product dimensions are required');
  });
});

// ─── getFilteredRates ────────────────────────────────────────────────────────

describe('getFilteredRates', () => {
  it('filters out non-allowed carriers', () => {
    const rates = [makeRate({ provider: 'Amazon' }), makeRate({ provider: 'USPS' })];
    const result = getFilteredRates(rates);
    expect(result).toHaveLength(1);
    expect(result[0]?.provider).toBe('USPS');
  });

  it('allows all four permitted carriers', () => {
    const rates = ['USPS', 'UPS', 'FedEx', 'DHL Express'].map(p => makeRate({ provider: p }));
    expect(getFilteredRates(rates)).toHaveLength(4);
  });

  it('filters out rates >= $100', () => {
    const rates = [makeRate({ amount: '99.99' }), makeRate({ amount: '100.00' }), makeRate({ amount: '150.00' })];
    const result = getFilteredRates(rates);
    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe('99.99');
  });

  it('sorts results by price ascending', () => {
    const rates = [
      makeRate({ amount: '15.00' }),
      makeRate({ amount: '5.00' }),
      makeRate({ amount: '10.00' }),
    ];
    const result = getFilteredRates(rates);
    expect(result.map(r => r.amount)).toEqual(['5.00', '10.00', '15.00']);
  });

  it('returns at most 5 results', () => {
    const rates = Array.from({ length: 8 }, (_, i) =>
      makeRate({ amount: `${i + 1}.00` })
    );
    expect(getFilteredRates(rates)).toHaveLength(5);
  });

  it('defaults estimatedDays to 5 when null', () => {
    const rates = [makeRate({ estimatedDays: null })];
    expect(getFilteredRates(rates)[0]?.estimatedDays).toBe(5);
  });

  it('defaults servicelevel name to "Name Not Found" when null', () => {
    const rates = [makeRate({ servicelevel: { name: null, token: 'tok' } })];
    expect(getFilteredRates(rates)[0]?.servicelevel.name).toBe('Name Not Found');
  });

  it('returns empty array when no rates pass filters', () => {
    const rates = [makeRate({ provider: 'Unknown', amount: '200.00' })];
    expect(getFilteredRates(rates)).toEqual([]);
  });
});

// ─── optimalPackingAlgo ──────────────────────────────────────────────────────

describe('optimalPackingAlgo', () => {
  it('returns null for empty array', () => {
    expect(optimalPackingAlgo([])).toBeNull();
  });

  it('returns null when first product has no weight', () => {
    expect(optimalPackingAlgo([{ length: 5, width: 4, height: 3 }])).toBeNull();
  });

  it('returns null when total weight reaches 60 oz', () => {
    const products = [
      { length: 5, width: 4, height: 3, weight: 30 },
      { length: 5, width: 4, height: 3, weight: 30 },
    ];
    expect(optimalPackingAlgo(products)).toBeNull();
  });

  it('returns null when a product has a zero dimension', () => {
    const products = [
      { length: 5, width: 4, height: 3, weight: 5 },
      { length: 0, width: 4, height: 3, weight: 5 },
    ];
    expect(optimalPackingAlgo(products)).toBeNull();
  });

  it('accumulates total weight across all products', () => {
    const products = [
      { length: 5, width: 4, height: 3, weight: 10 },
      { length: 5, width: 4, height: 3, weight: 20 },
    ];
    const result = optimalPackingAlgo(products);
    expect(result?.packageWeight).toBe(30);
  });

  it('returns a result with packageWeight under 60 for valid input', () => {
    const products = [{ length: 5, width: 4, height: 3, weight: 10 }];
    const result = optimalPackingAlgo(products);
    expect(result).not.toBeNull();
    expect(result?.packageWeight).toBe(10);
  });
});

// ─── selectFinalPackageSize ──────────────────────────────────────────────────

describe('selectFinalPackageSize', () => {
  it('selects REGULAR_BUBBLE_MAILER for a small item', () => {
    // norm: {l:5, w:4, h:2} fits max {l:10, w:6, h:4}
    const result = selectFinalPackageSize({ length: 5, width: 4, height: 2 });
    expect(result).toEqual({ l: 10, w: 6, h: 4 });
  });

  it('selects MEDIUM_BOX for a medium flat item', () => {
    // norm: {l:12, w:11, h:3} fits max {l:13, w:11, h:3}
    const result = selectFinalPackageSize({ length: 12, width: 11, height: 3 });
    expect(result).toEqual({ l: 14, w: 12, h: 4 });
  });

  it('selects LARGE_BOX for a taller item', () => {
    // norm: {l:12, w:10, h:6} fits max {l:12, w:12, h:6}
    const result = selectFinalPackageSize({ length: 12, width: 10, height: 6 });
    expect(result).toEqual({ l: 13, w: 12, h: 6 });
  });

  it('selects EXTRA_LARGE_BOX when nothing smaller fits', () => {
    // norm: {l:16, w:10, h:3} — too long for everything except EXTRA_LARGE
    const result = selectFinalPackageSize({ length: 16, width: 10, height: 3 });
    expect(result).toEqual({ l: 20, w: 20, h: 15 });
  });

  it('throws for an oversized item that exceeds all package classes', () => {
    expect(() => selectFinalPackageSize({ length: 25, width: 20, height: 15 }))
      .toThrow('Oversize item');
  });
});

// ─── packItemsIntoOneParcel ──────────────────────────────────────────────────

describe('packItemsIntoOneParcel', () => {
  it('returns null for an empty array', () => {
    expect(packItemsIntoOneParcel([])).toBeNull();
  });

  it('returns null when the product has no weight', () => {
    expect(packItemsIntoOneParcel([{ length: 5, width: 4, height: 3 }])).toBeNull();
  });

  it('adds 10% to the weight for packaging material', () => {
    // single product {5,4,2,weight:10} → packageWeight 10 → stored as (10*1.1)="11"
    const result = packItemsIntoOneParcel([{ length: 5, width: 4, height: 2, weight: 10 }]);
    expect(result?.weight).toBe('11');
  });

  it('uses inches and ounces as units', () => {
    const result = packItemsIntoOneParcel([{ length: 5, width: 4, height: 2, weight: 10 }]);
    expect(result?.distanceUnit).toBe('in');
    expect(result?.massUnit).toBe('oz');
  });

  it('returns string dimensions', () => {
    const result = packItemsIntoOneParcel([{ length: 5, width: 4, height: 2, weight: 10 }]);
    expect(typeof result?.length).toBe('string');
    expect(typeof result?.width).toBe('string');
    expect(typeof result?.height).toBe('string');
  });

  it('returns null when total weight is oversize', () => {
    const heavy = [
      { length: 5, width: 4, height: 3, weight: 35 },
      { length: 5, width: 4, height: 3, weight: 35 },
    ];
    expect(packItemsIntoOneParcel(heavy)).toBeNull();
  });
});
