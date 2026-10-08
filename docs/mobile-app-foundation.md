# Mobile app foundation

## Project assessment

The project is a Laravel 12 application using PHP 8.2+, React 19, TypeScript,
Inertia, and Vite. Product, category, and unit records are scoped to a business
owner through `created_by`. The current sales flow is a point-of-sale workflow:
sales require a branch, cash register, and customer. Customer records do not
currently have login credentials.

## Store branches, catalog, and order requests

The versioned API provides these public, rate-limited storefront endpoints:

- `GET /api/v1/store/branches` lists active branches owned by this store.
- `GET /api/v1/store/products?branch_id={id}` lists the store's active products
  with global stock greater than zero. It supports `search`, `category_id`, and
  `page`.
- `GET /api/v1/store/products/{id}?branch_id={id}` returns one available
  product from the configured store.
- `POST /api/v1/store/orders` submits a guest order request assigned to the
  selected active branch. Send `branch_id`, `customer_name`, `customer_phone`,
  optional `customer_email`/`notes`, and `items` containing `product_id` and
  `quantity`.

The app can keep a cart locally; on submission, the server rechecks that every
product belongs to this store, is active, has stock, and that the requested
quantity is available. Prices are read from the database and copied into the
order; client-supplied prices are not accepted. The API exposes sale price and
availability, but not purchase cost, SKU, or exact stock quantity. Inactive
products and products whose category or unit is inactive are not shown.

Inventory remains global per product, as requested. A selected branch routes
the order but does not filter product stock by branch. New mobile requests are
saved with `pending` status in separate `mobile_store_orders` tables; stock is
not decremented at request time. The branch confirmation flow must recheck and
decrement global stock when it accepts a request. The legacy POS sale and cart
flows are unchanged.

Set `MOBILE_STORE_OWNER_ID` in the server environment to the ID of the user who
owns this single storefront. The catalog returns HTTP 503 until that setting is
valid; it does not fall back to an unscoped product query. The response's
`meta.currency_code` uses that owner's `defaultCurrency` setting, or `USD` when
unset.

The mobile order request is separate from POS sales. Customer accounts, online
payments, branch-side order confirmation/fulfillment, and order status tracking
remain future backend work.

## Mobile client recommendation

Use **Expo with React Native and TypeScript** for the Android and iOS client.
This fits the project's existing React/TypeScript skills and enables a single
mobile codebase. The existing Inertia/React web screens target the browser and
should not be embedded as the customer storefront; the mobile app should call
the versioned API.

## Remaining backend decisions

Before completing customer checkout and fulfillment, define supported delivery
regions and fees, tax calculation, payment provider, and the branch-side request
confirmation/status workflow. The first customer release can allow guest
checkout with optional account creation, as selected for this project, but it
needs its own customer identity rather than reusing staff authentication or POS
sessions.
