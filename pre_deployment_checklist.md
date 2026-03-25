# Pre-Deployment Checklist

## Environment Variables
- [ ] Replace all `_TEST_` / `sk_test_` / `pk_test_` keys with live Stripe keys (`TEST_STRIPE_API` → live secret key, `VITE_STRIPE_KEY` → live publishable key)
- [ ] Replace `SHIPPO_TEST_API` with live Shippo key
- [ ] Set `CLIENT_URL` to your production frontend URL (not localhost)
- [ ] Set all `DB_*` variables to point to production database
- [ ] Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `1` / `1` to real credentials
- [ ] Change `JWTSECRET` from `"test"` to a long, random secret
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` is the live webhook secret from Stripe dashboard
- [ ] Confirm `AWS_*` credentials have appropriate production permissions
- [ ] Set `VITE_SERVER_URL` in frontend `.env` to your production backend URL (currently commented out)

## Stripe
- [ ] Register your production webhook endpoint in the Stripe dashboard
- [ ] Confirm the events you're listening for match what the webhook handler expects
- [ ] Do an end-to-end test purchase with a real card (small amount)

## Database
- [ ] Production database created and `db_init` script run
- [ ] Verify cart reservation cleanup job runs correctly in production environment

## Shipping / Shippo
- [ ] Confirm sender address env vars (`SENDER_ADDRESS`, `SENDER_CITY`, etc.) are correct for the real ship-from location
- [ ] Test address validation and rate fetching with live Shippo key

## Security
- [ ] Confirm CORS `CLIENT_URL` is locked to your production domain only
- [ ] Rate limiting is appropriate for expected traffic
- [ ] Admin route is not publicly guessable / exposed

## Frontend Build
- [ ] `npm run build` completes without errors
- [ ] `VITE_SERVER_URL` points to production backend (not localhost)
- [ ] `VITE_STRIPE_KEY` is the live publishable key

## Backend Build
- [ ] `npm run build` (TypeScript) completes without errors
- [ ] Server starts cleanly with `npm run start` using production env vars

## AWS S3
- [ ] S3 bucket has correct permissions for image uploads/reads
- [ ] Bucket name in env matches the production bucket

## General
- [ ] All `console.log` debug statements removed or gated (e.g. the `"FINAL BOX"` log in shipping.ts)
- [ ] Run your test suite one final time (`npm run test`) and confirm all passing
- [ ] Confirm the 32-minute cart reservation expiration is appropriate for expected checkout flow
