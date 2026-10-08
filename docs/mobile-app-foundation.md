# Mobile app foundation

## Project assessment

The project is a Laravel 12 application using PHP 8.2+, React 19, TypeScript,
Inertia, and Vite. Product, category, and unit records are scoped to a business
owner through `created_by`. The current sales flow is a point-of-sale workflow:
sales require a branch, cash register, and customer. Customer records do not
currently have login credentials.

## Initial mobile API

The versioned API currently exposes a read-only storefront catalog:

- `GET /api/v1/store/products` supports `search`, `category_id`, and `page`.
- `GET /api/v1/store/products/{id}` returns one product from the configured
  storefront only.

Both routes are rate-limited. They expose the sale price and availability, but
not purchase cost, SKU, or exact stock quantity. Inactive products and products
whose category or unit is inactive are not shown.

Set `MOBILE_STORE_OWNER_ID` in the server environment to the ID of the user who
owns this single storefront. The catalog returns HTTP 503 until that setting is
valid; it does not fall back to an unscoped product query. The response's
`meta.currency_code` uses that owner's `defaultCurrency` setting, or `USD` when
unset.

The existing POS sales tables should not be used as the mobile order model:
online orders need a separate checkout/order lifecycle. Customer authentication,
guest checkout, order and inventory handling, and payment integration remain
future backend work.

## Mobile client recommendation

Use **Expo with React Native and TypeScript** for the Android and iOS client.
This fits the project's existing React/TypeScript skills and enables a single
mobile codebase. The existing Inertia/React web screens target the browser and
should not be embedded as the customer storefront; the mobile app should call
the versioned API.

## Remaining backend decisions

Before implementing checkout, define the supported delivery regions and fees,
tax calculation, stock reservation policy, order statuses, and payment provider.
The first customer release can allow guest checkout with optional account
creation, as selected for this project, but it needs its own customer identity
and order model rather than reusing staff authentication or POS sessions.
