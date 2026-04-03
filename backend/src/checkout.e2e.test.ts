import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import type { Application } from 'express';

// ─── Hoist mock refs so they're available inside vi.mock factories ────────────

const {
  mockDbQuery,
  mockPoolConnect,
  mockPoolClientQuery,
  mockPoolClientRelease,
} = vi.hoisted(() => ({
  mockDbQuery: vi.fn(),
  mockPoolConnect: vi.fn(),
  mockPoolClientQuery: vi.fn(),
  mockPoolClientRelease: vi.fn(),
}));

const { mockStripeSessions, mockStripeWebhooks } = vi.hoisted(() => {
  const mockStripeSessions = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  };
  const mockStripeWebhooks = { constructEvent: vi.fn() };
  return { mockStripeSessions, mockStripeWebhooks };
});

const { mockShippoAddressCreate, mockShippoShipmentsCreate } = vi.hoisted(() => ({
  mockShippoAddressCreate: vi.fn(),
  mockShippoShipmentsCreate: vi.fn(),
}));

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('./server.js', () => ({
  stripe: {
    checkout: { sessions: mockStripeSessions },
    webhooks: mockStripeWebhooks,
  },
}));

vi.mock('./db/index.js', () => ({
  query: mockDbQuery,
  client: { query: vi.fn(), release: vi.fn() },
  default: { connect: mockPoolConnect },
}));

vi.mock('shippo', () => ({
  Shippo: vi.fn().mockImplementation(function () {
    return {
      addresses: { create: mockShippoAddressCreate },
      shipments: { create: mockShippoShipmentsCreate },
    };
  }),
  DistanceUnitEnum: { In: 'in' },
  WeightUnitEnum: { Oz: 'oz' },
  Provider: {},
}));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import checkoutsession from './checkoutsession.js';
import handleshipping from './shipping.js';
import checkoutreturn from './checkoutreturn.js';
import webhook from './webhook.js';

// ─── Test app ─────────────────────────────────────────────────────────────────

function buildApp(): Application {
  const app = express();
  app.use(
    express.json({
      verify: (req: Request, _res: Response, buf: Buffer) => {
        if (req.originalUrl?.startsWith('/webhook')) {
          (req as any).rawBody = buf;
        }
      },
    })
  );
  app.use('/create-checkout-session', checkoutsession);
  app.use('/calculate-shipping-options', handleshipping);
  app.use('/session_status', checkoutreturn);
  app.use('/webhook', webhook);
  return app;
}

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const CART_ITEMS = [{ id: 1, name: 'Widget', price: 19.99, quantity: 2, image: 'img.jpg' }];

const DB_PRODUCT_ROW = {
  id: 1,
  name: 'Widget',
  price: 19.99,
  quantity: 10,
  weight: 8,
  length: 6,
  height: 4,
  width: 4,
  url: 'https://example.com/img.jpg',
};

const STRIPE_SESSION = {
  id: 'cs_test_session123',
  client_secret: 'cs_secret_abc',
  status: 'open',
  metadata: { uuid: 'cart-uuid-123', packageLength: '6', packageWidth: '4', packageHeight: '4', packageWeight: '8' },
  customer_details: { email: 'customer@example.com' },
  shipping_cost: { amount_total: 800 },
  amount_total: 4798,
  payment_status: 'paid',
  line_items: {
    data: [{
      description: 'Widget',
      quantity: 2,
      price: {
        product: {
          metadata: { weight: '8', length: '6', height: '4', width: '4', productId: '1' },
        },
      },
    }],
  },
};

const SHIPPO_VALID_ADDRESS = {
  validationResults: { isValid: true, messages: [] },
};

const SHIPPO_RATES = {
  rates: [
    { provider: 'USPS', servicelevel: { name: 'Priority Mail', token: 'usps_priority' }, amount: '7.50', currency: 'usd', estimatedDays: 3 },
    { provider: 'UPS', servicelevel: { name: 'Ground', token: 'ups_ground' }, amount: '9.00', currency: 'usd', estimatedDays: 5 },
  ],
};

// ─── POST /create-checkout-session ───────────────────────────────────────────

describe('POST /create-checkout-session', () => {
  let app: Application;

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolConnect.mockResolvedValue({ query: mockPoolClientQuery, release: mockPoolClientRelease });
  });

  it('happy path — validates cart, reserves stock, returns clientSecret and uuid', async () => {
    // validateUserCart: SELECT products
    mockDbQuery.mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] });
    // reserveStock: BEGIN, UPDATE products, INSERT cart_reservations, COMMIT
    mockDbQuery.mockResolvedValueOnce({});                                   // BEGIN
    mockDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });  // UPDATE
    mockDbQuery.mockResolvedValueOnce({});                                   // INSERT reservations
    mockDbQuery.mockResolvedValueOnce({});                                   // COMMIT
    // Stripe session creation
    mockStripeSessions.create.mockResolvedValueOnce(STRIPE_SESSION);

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: null });

    expect(res.status).toBe(200);
    expect(res.body.checkoutResult.clientSecret).toBe('cs_secret_abc');
    expect(res.body.checkoutResult.sessionId).toBe('cs_test_session123');
    expect(typeof res.body.uuid).toBe('string');
    expect(res.body.uuid).toHaveLength(36); // crypto.randomUUID() format
  });

  it('terminates an existing reservation before creating a new one', async () => {
    // terminateReserveUpdateStock: BEGIN, UPDATE, DELETE, COMMIT
    mockDbQuery.mockResolvedValueOnce({});  // BEGIN
    mockDbQuery.mockResolvedValueOnce({});  // UPDATE products
    mockDbQuery.mockResolvedValueOnce({});  // DELETE cart_reservations
    mockDbQuery.mockResolvedValueOnce({});  // COMMIT
    // validateUserCart
    mockDbQuery.mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] });
    // reserveStock
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({});
    mockStripeSessions.create.mockResolvedValueOnce(STRIPE_SESSION);

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: 'old-cart-uuid' });

    expect(res.status).toBe(200);
    expect(res.body.checkoutResult.clientSecret).toBeDefined();
  });

  it('returns 500 when item is not found in the database', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] }); // no products match

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: null });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('ITEM NOT FOUND');
  });

  it('returns 500 when requested quantity exceeds available stock', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [{ ...DB_PRODUCT_ROW, quantity: 1 }] }); // only 1 in stock

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: [{ ...CART_ITEMS[0], quantity: 2 }], uuid: null });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Only 1 Widget available/);
  });

  it('returns 500 with "out of stock" message when product quantity is 0', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [{ ...DB_PRODUCT_ROW, quantity: 0 }] });

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: null });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Widget is out of stock/);
  });

  it('returns 500 when stock reservation fails (race condition)', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] });  // validateUserCart
    mockDbQuery.mockResolvedValueOnce({});                           // BEGIN
    mockDbQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });   // UPDATE — rowCount < items.length triggers rollback
    mockDbQuery.mockResolvedValueOnce({});                           // ROLLBACK

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: null });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 when Stripe session creation fails', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] });
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({});
    mockStripeSessions.create.mockRejectedValueOnce(new Error('Stripe error'));

    const res = await request(app)
      .post('/create-checkout-session')
      .send({ items: CART_ITEMS, uuid: null });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('STRIP CALL ERROR');
  });
});

// ─── POST /calculate-shipping-options ────────────────────────────────────────

describe('POST /calculate-shipping-options', () => {
  let app: Application;

  const SHIPPING_BODY = {
    checkout_session_id: 'cs_test_session123',
    shipping_details: {
      name: 'Jane Smith',
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94111',
        country: 'US',
      },
    },
  };

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => { vi.clearAllMocks(); });

  it('happy path — validates address, fetches rates, updates Stripe session', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockShippoAddressCreate.mockResolvedValueOnce(SHIPPO_VALID_ADDRESS);
    mockShippoShipmentsCreate.mockResolvedValueOnce(SHIPPO_RATES);
    mockStripeSessions.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/calculate-shipping-options')
      .send(SHIPPING_BODY);

    expect(res.body.type).toBe('object');
    expect(res.body.value.succeeded).toBe(true);
    expect(mockStripeSessions.update).toHaveBeenCalledWith(
      'cs_test_session123',
      expect.objectContaining({
        shipping_options: expect.arrayContaining([
          expect.objectContaining({
            shipping_rate_data: expect.objectContaining({
              display_name: expect.stringContaining('USPS'),
              type: 'fixed_amount',
            }),
          }),
        ]),
        metadata: expect.objectContaining({
          packageLength: expect.any(String),
          packageWeight: expect.any(String),
        }),
      })
    );
  });

  it('returns error when Shippo rejects the address as invalid', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockShippoAddressCreate.mockResolvedValueOnce({
      validationResults: { isValid: false, messages: [{ type: 'address_error', text: 'Street not found' }] },
    });

    const res = await request(app)
      .post('/calculate-shipping-options')
      .send(SHIPPING_BODY);

    expect(res.body.type).toBe('error');
    expect(res.body.message).toBe('Street not found');
    expect(mockStripeSessions.update).not.toHaveBeenCalled();
  });

  it('returns error when address has a warning (missing apartment number)', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockShippoAddressCreate.mockResolvedValueOnce({
      validationResults: {
        isValid: true,
        messages: [{ type: 'address_warning', text: 'Missing apartment number' }],
      },
    });

    const res = await request(app)
      .post('/calculate-shipping-options')
      .send(SHIPPING_BODY);

    expect(res.body.type).toBe('error');
    expect(res.body.message).toBe('Missing apartment number');
    expect(mockStripeSessions.update).not.toHaveBeenCalled();
  });

  it('returns error when no shipping rates are available', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockShippoAddressCreate.mockResolvedValueOnce(SHIPPO_VALID_ADDRESS);
    mockShippoShipmentsCreate.mockResolvedValueOnce({ rates: [] }); // no rates

    const res = await request(app)
      .post('/calculate-shipping-options')
      .send(SHIPPING_BODY);

    expect(res.body.type).toBe('error');
    expect(res.body.message).toBe("We can't find shipping options. Please try again.");
    expect(mockStripeSessions.update).not.toHaveBeenCalled();
  });

  it('returns a distinct error when Stripe session update fails', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockShippoAddressCreate.mockResolvedValueOnce(SHIPPO_VALID_ADDRESS);
    mockShippoShipmentsCreate.mockResolvedValueOnce(SHIPPO_RATES);
    mockStripeSessions.update.mockRejectedValueOnce(new Error('Stripe update failed'));

    const res = await request(app)
      .post('/calculate-shipping-options')
      .send(SHIPPING_BODY);

    expect(res.body.type).toBe('error');
    expect(res.body.message).toBe('Could not update your session. Please refresh and try again.');
  });
});

// ─── POST /webhook ────────────────────────────────────────────────────────────

describe('POST /webhook', () => {
  let app: Application;

  const WEBHOOK_EVENT = {
    id: 'evt_test_001',
    type: 'checkout.session.completed',
    data: { object: STRIPE_SESSION },
  };

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    app = buildApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolConnect.mockResolvedValue({ query: mockPoolClientQuery, release: mockPoolClientRelease });
  });

  it('happy path — verifies signature, persists order and items to DB', async () => {
    mockStripeWebhooks.constructEvent.mockReturnValueOnce(WEBHOOK_EVENT);
    mockDbQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });         // event_id check — not duplicate
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);    // retrieve with line_items
    // writeOrderToDB pool client: BEGIN, INSERT orders (returns id), INSERT ordered_items, COMMIT
    mockPoolClientQuery.mockResolvedValueOnce({});                         // BEGIN
    mockPoolClientQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] });    // INSERT orders
    mockPoolClientQuery.mockResolvedValueOnce({});                         // INSERT ordered_items
    mockPoolClientQuery.mockResolvedValueOnce({});                         // COMMIT

    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'valid-sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('event received');
    expect(mockPoolClientQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockPoolClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO orders'),
      expect.arrayContaining(['open', 'evt_test_001', 'cs_test_session123'])
    );
    expect(mockPoolClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ordered_items'),
      expect.arrayContaining([42, 1, 'Widget', 2])
    );
    expect(mockPoolClientQuery).toHaveBeenCalledWith('COMMIT');
    expect(mockPoolClientRelease).toHaveBeenCalled();
  });

  it('skips duplicate events (idempotency check)', async () => {
    mockStripeWebhooks.constructEvent.mockReturnValueOnce(WEBHOOK_EVENT);
    mockDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ event_id: 'evt_test_001' }] }); // already exists

    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'valid-sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(mockStripeSessions.retrieve).not.toHaveBeenCalled();
    expect(mockPoolClientQuery).not.toHaveBeenCalled();
  });

  it('returns 500 when Stripe signature is missing', async () => {
    const res = await request(app)
      .post('/webhook')
      .send('{}');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Webhook processing failed');
  });

  it('returns 500 when Stripe signature verification fails', async () => {
    mockStripeWebhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Signature verification failed');
    });

    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'invalid-sig')
      .send('{}');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Webhook processing failed');
  });

  it('rolls back the DB transaction if order insertion fails', async () => {
    mockStripeWebhooks.constructEvent.mockReturnValueOnce(WEBHOOK_EVENT);
    mockDbQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    mockStripeSessions.retrieve.mockResolvedValueOnce(STRIPE_SESSION);
    mockPoolClientQuery.mockResolvedValueOnce({});                            // BEGIN
    mockPoolClientQuery.mockRejectedValueOnce(new Error('DB write failed')); // INSERT orders fails
    mockPoolClientQuery.mockResolvedValueOnce({});                            // ROLLBACK

    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'valid-sig')
      .send('{}');

    // Webhook still returns 200 (Stripe requires 2xx to not retry)
    expect(res.status).toBe(200);
    expect(mockPoolClientRelease).toHaveBeenCalled();
  });
});

// ─── GET /session_status ──────────────────────────────────────────────────────

describe('GET /session_status', () => {
  let app: Application;

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => { vi.clearAllMocks(); });

  it('returns session status and deletes cart reservation when session is complete', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce({
      ...STRIPE_SESSION,
      status: 'complete',
      payment_status: 'paid',
    });
    mockDbQuery.mockResolvedValueOnce({});  // DELETE cart_reservations

    const res = await request(app)
      .get('/session_status')
      .query({ session_id: 'cs_test_session123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('complete');
    expect(res.body.payment_status).toBe('paid');
    expect(res.body.customer_email).toBe('customer@example.com');
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM cart_reservations'),
      ['cart-uuid-123']
    );
  });

  it('returns status without touching the DB when session is not complete', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce({
      ...STRIPE_SESSION,
      status: 'open',
      payment_status: 'unpaid',
    });

    const res = await request(app)
      .get('/session_status')
      .query({ session_id: 'cs_test_session123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('open');
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  it('falls back to "No Email Entered" when customer_details is missing', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce({
      ...STRIPE_SESSION,
      status: 'open',
      customer_details: null,
    });

    const res = await request(app)
      .get('/session_status')
      .query({ session_id: 'cs_test_session123' });

    expect(res.body.customer_email).toBe('No Email Entered');
  });

  it('returns 400 when Stripe throws on retrieval', async () => {
    mockStripeSessions.retrieve.mockRejectedValueOnce(new Error('Not found'));

    const res = await request(app)
      .get('/session_status')
      .query({ session_id: 'cs_bad_id' });

    expect(res.status).toBe(400);
  });
});

// ─── POST /session_status/check ──────────────────────────────────────────────

describe('POST /session_status/check', () => {
  let app: Application;

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => { vi.clearAllMocks(); });

  it('returns "expired" and releases stock when session has expired', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce({ status: 'expired' });
    // terminateReserveUpdateStock: BEGIN, UPDATE, DELETE, COMMIT
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({});
    mockDbQuery.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/session_status/check')
      .send({ seshId: 'cs_test_session123', uuid: 'cart-uuid-123' });

    expect(res.body.status).toBe('expired');
    expect(mockDbQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE products'),
      ['cart-uuid-123']
    );
  });

  it('returns "not-expired" without touching stock for an active session', async () => {
    mockStripeSessions.retrieve.mockResolvedValueOnce({ status: 'open' });

    const res = await request(app)
      .post('/session_status/check')
      .send({ seshId: 'cs_test_session123', uuid: 'cart-uuid-123' });

    expect(res.body.status).toBe('not-expired');
    expect(mockDbQuery).not.toHaveBeenCalled();
  });
});

// ─── POST /session_status/deleteCartReservation ───────────────────────────────

describe('POST /session_status/deleteCartReservation', () => {
  let app: Application;

  beforeAll(() => { app = buildApp(); });

  beforeEach(() => { vi.clearAllMocks(); });

  it('deletes reservation and restores stock for a valid uuid', async () => {
    mockDbQuery.mockResolvedValueOnce({});  // BEGIN
    mockDbQuery.mockResolvedValueOnce({});  // UPDATE products
    mockDbQuery.mockResolvedValueOnce({});  // DELETE cart_reservations
    mockDbQuery.mockResolvedValueOnce({});  // COMMIT

    const res = await request(app)
      .post('/session_status/deleteCartReservation')
      .send({ uuid: 'cart-uuid-123' });

    expect(res.body.success).toBe(true);
    expect(mockDbQuery).toHaveBeenCalledWith('BEGIN');
  });

  it('returns failed status when uuid is missing', async () => {
    const res = await request(app)
      .post('/session_status/deleteCartReservation')
      .send({});

    expect(res.body.status).toBe('failed');
    expect(mockDbQuery).not.toHaveBeenCalled();
  });
});
