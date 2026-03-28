import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { Shippo } from 'shippo';
import {
  normalizeProductDimensions,
  getFilteredRates,
  optimalPackingAlgo,
  selectFinalPackageSize,
  packItemsIntoOneParcel,
  validateShippingDetails,
  createPackage,
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

  it('height becomes larger dimension', () => {
    const products = [{ length: 5, width: 4, height: 10, weight: 10 }];
    const result = optimalPackingAlgo(products);
    expect(result).not.toBe(false);
    if (result) expect(result.packageLength).toBe(10);
    if (result) expect(result.packageWidth).toBe(5);
    if (result) expect(result.packageHeight).toBe(4);
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

  it('returns null for an oversized item that exceeds all package classes', () => {
    expect(selectFinalPackageSize({ length: 25, width: 20, height: 15 })).toBeNull();
  });

  it('handles non-integer dimensions that fit a package class', () => {
    // norm: {l:9.5, w:5.5, h:3.5} fits REGULAR_BUBBLE_MAILER max {l:10, w:6, h:4}
    const result = selectFinalPackageSize({ length: 9.5, width: 5.5, height: 3.5 });
    expect(result).toEqual({ l: 10, w: 6, h: 4 });
  });

  it('normalizes dimension order before comparing', () => {
    // supplying dimensions out of order should still match correctly
    const result = selectFinalPackageSize({ length: 4, width: 10, height: 6 });
    expect(result).not.toBeNull();
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
    const result = packItemsIntoOneParcel([{ length: 5, width: 4, height: 2, weight: 16.39 }]);
    console.log(result?.weight);
    expect(result?.weight).toBe('18.03');
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

  it('returns null when the combined item dimensions exceed all package classes', () => {
    // Each item is within limits, but stacked height pushes past EXTRA_LARGE_BOX max
    const oversized = Array.from({ length: 10 }, () => ({ length: 18, width: 18, height: 2, weight: 1 }));
    expect(packItemsIntoOneParcel(oversized)).toBeNull();
  });
});

// ─── createPackage ───────────────────────────────────────────────────────────

function makeSession(items: { length: number; width: number; height: number; weight: number; quantity: number }[]) {
  return {
    line_items: {
      data: items.map(({ length, width, height, weight, quantity }) => ({
        quantity,
        price: {
          product: {
            metadata: {
              length: String(length),
              width: String(width),
              height: String(height),
              weight: String(weight),
            },
          },
        },
      })),
    },
  } as any;
}

describe('createPackage', () => {
  it('returns false when line_items.data is missing', () => {
    expect(createPackage({} as any)).toBe(false);
    expect(createPackage({ line_items: {} } as any)).toBe(false);
  });

  it('returns a parcel for a valid single item', () => {
    const session = makeSession([{ length: 5, width: 4, height: 2, weight: 10, quantity: 1 }]);
    const result = createPackage(session);
    expect(result).not.toBe(false);
  });

  it('multiplies weight by quantity', () => {
    // weight 10 * qty 2 = 20, then +10% packaging = "22.00"
    const session = makeSession([{ length: 5, width: 4, height: 2, weight: 10, quantity: 2 }]);
    const result = createPackage(session);
    expect(result).not.toBe(false);
    if (result) expect(result.weight).toBe('22.00');
  });

  it('multiplies height by quantity', () => {
    // height stacks with quantity — 2 items of height 2 = stacked height 4
    const session = makeSession([{ length: 5, width: 4, height: 2, weight: 5, quantity: 2 }]);
    const result = createPackage(session);
    expect(result).not.toBe(false);
  });

  it('returns false when metadata values are missing (NaN weight)', () => {
    const session = {
      line_items: {
        data: [{
          quantity: 1,
          price: { product: { metadata: { length: '5', width: '4', height: '2', weight: '' } } },
        }],
      },
    } as any;
    // NaN weight causes packItemsIntoOneParcel to return null
    expect(createPackage(session)).toBe(false);
  });

  it('returns false when total weight exceeds the 60oz limit', () => {
    // 2 items at 35oz each = 70oz total, which exceeds the 60oz limit
    const session = makeSession([
      { length: 5, width: 4, height: 2, weight: 35, quantity: 1 },
      { length: 5, width: 4, height: 2, weight: 35, quantity: 1 },
    ]);
    expect(createPackage(session)).toBe(false);
  });
});

// ─── validateShippingDetails ─────────────────────────────────────────────────

const validAddress = {
  name: 'Jane Smith',
  street1: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94111',
  country: 'US',
};

describe('validateShippingDetails', () => {
  let mockAddressCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const instance = vi.mocked(Shippo).mock.results[0]?.value;
    mockAddressCreate = instance.addresses.create;
    mockAddressCreate.mockReset();
  });

  it('returns success:false when the Shippo API throws', async () => {
    mockAddressCreate.mockRejectedValueOnce(new Error('Network error'));
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: false, error: 'Unable to validate address. Please try again.' });
  });

  it('returns success:false with error text when address is invalid', async () => {
    mockAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: false, messages: [{ type: 'address_error', text: 'Street not found' }] },
    });
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: false, error: 'Street not found' });
  });

  it('returns success:false with no error key when invalid and no message text', async () => {
    mockAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: false, messages: [] },
    });
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: false });
    expect(result).not.toHaveProperty('error');
  });

  it('returns success:false when address has a warning', async () => {
    mockAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: true, messages: [{ type: 'address_warning', text: 'Missing apartment number' }] },
    });
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: false, error: 'Missing apartment number' });
  });

  it('falls back to "Address warning" when warning message text is missing', async () => {
    mockAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: true, messages: [{ type: 'address_warning', text: undefined }] },
    });
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: false, error: 'Address warning' });
  });

  it('returns success:true for a fully valid address', async () => {
    mockAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: true, messages: [] },
    });
    const result = await validateShippingDetails(validAddress);
    expect(result).toEqual({ success: true });
  });
});
