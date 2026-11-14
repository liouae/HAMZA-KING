# Issue #17 — Meta Purchase reconciliation runbook (HK MAROC)

> **Status: not verified / NOT fixed yet.** This document is a controlled remediation guide, not proof of an operational checkout integration. Do not close issue #17 until all acceptance checks pass.

## Observed code (14 Nov 2026)

- `app/lib/config.ts` defaults `TRACKING.metaPixel` to `1093669673516061`. Oxygen `PUBLIC_META_PIXEL_ID` overrides it in `app/root.tsx`, so **verify the live Oxygen environment** before deciding which pixel loads.
- `app/components/Tracking.tsx` loads the configured Meta browser pixel after consent.
- `app/lib/tracking.ts` sends `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, and WhatsApp `Contact`/`Lead`, but **does not send Purchase**. This is correct for the Hydrogen storefront: the completed checkout happens on Shopify.
- First/last-touch attribution is captured in `app/lib/attribution.ts`; UTM/fbclid metadata is not itself evidence of an attributed Meta Purchase or a collected COD payment.

## Owner-only settings checks (no new pixels)

1. **Confirm the intended, existing dataset.** Meta has historically shown legacy `2930184057339708` and Shopify-selected `1093669673516061`. In Shopify Admin → Facebook & Instagram → Settings → Data sharing and Settings → Customer events, identify the **one** checkout-owning official Meta app pixel/dataset. Do not add a third pixel.
2. **Fix ad account access.** In the Meta business portfolio that owns `1093669673516061` (historically `hamzaking1195`), open Business Settings → Data sources → Datasets / Pixels → `1093669673516061` → Connected assets. Check/request access for ad account `1056355704052601` and required permissions, without transferring asset ownership. Prior create-ad failure: `1815045` (no access); confirm current state in the UI, not from the historical error alone.
3. **Check account/portfolio identity.** Confirm the Shopify sales channel and ad account use the intended Meta business assets. If official Facebook & Instagram by Meta app is absent, follow Shopify's supported installation and data-sharing setup rather than inventing a manual checkout snippet.
4. **Avoid duplicate Purchase integrations.** Review Shopify Customer events → App pixels + Custom pixels. Prefer official Meta app pixel/CAPI as the sole authority for Shopify checkout `checkout_completed`. Do not add `fbq('track','Purchase')` to `begin_checkout` or the storefront.
5. **Consent.** Test with the appropriate user tracking consent. The storefront's consent handler and Shopify customer privacy settings may differ by market; preserve privacy behavior.

## End-to-end acceptance test

Using Meta Events Manager **Test Events** for the intended dataset, and Shopify's completed checkout:

- [ ] Before checkout completion, **no Purchase** event fires on add-to-cart or InitiateCheckout.
- [ ] Complete one *clearly identified test* Shopify checkout (or use Shopify's permitted test method), label the test order and exclude it from sales/KPI reports. Do not incur a real purchase unnecessarily.
- [ ] Purchase appears on the intended Meta dataset with **currency MAD**, the correct total value and a suitable order/transaction reference when available.
- [ ] If both browser and CAPI events appear, their matching `event_id` causes Meta to **deduplicate**, leaving **one** Purchase for a completed checkout, not two.
- [ ] Shopify order identity matches the observed Purchase where the systems expose a reliable identifier; review source/medium/UTM separately from payment state.
- [ ] Repeat for an abandoned checkout and verify no Purchase.
- [ ] After fix, watch *new* reporting days; prior Meta campaign reports may not backfill.

## Attribution and COD guardrails

- `PAID` in Shopify is recorded payment, not necessarily net profit; `PENDING` COD and `FULFILLED` are **not** cash collected.
- `VOIDED`/cancelled and test orders (including historical `#1003`) must be excluded from realized sales.
- WhatsApp click/Lead = interaction, not confirmed WhatsApp sale. Avoid double counting an order completed later in Shopify.
- Meta Purchase attribution is modeled/reporting attribution; confirm order and payment status independently.

## Minimum evidence to close #17

Record the test date/time (Africa/Casablanca), Shopify test order ID, selected dataset, ad account permission check, Purchase event details (MAD value, event_id or other dedup evidence), and Shopify Custom/App Pixel ownership. State what was verified manually and what API scopes remain unavailable (historically `read_pixels` denied). **Do not close #17 before gathering this evidence.**

References:
- https://github.com/liouae/HAMZA-KING/issues/17
- https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel/
- https://help.shopify.com/en/manual/promoting-marketing/pixels
- https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed
