# Backend Implementation Notes

## AI Services

The AI layer uses LangChain JS and Gemini through `@langchain/google`.

- `POST /api/ai/storefront/style-finder` is public-facing but only receives limited catalog candidate data.
- `POST /api/ai/admin/review-insights` is protected with `protect` and `isAdmin`.
- Zod structured output is used so the API can return predictable JSON.
- Product and variant IDs from AI responses are validated against the candidate list before being returned.

## Customer Intent

Customer intent is built from existing data:

- `User`
- `Order`
- `Address`
- `CartItem`
- `WishlistItem`
- `Review`

The admin list endpoint remains backward compatible by returning `users: [...]`, while adding operational metrics. The detail intent endpoint returns product-level cart and wishlist rows for admin use only.

Abandoned cart definition:

- Customer has cart items.
- Oldest cart item is at least 3 days old.
- The matching cart variant has not already been purchased by that customer.

## Order Cancellation

The cancellation rule is hybrid:

- Within 24 hours.
- Only before shipping.
- Only statuses `PENDING` and `CONFIRMED`.

On successful cancellation:

- `Order.status` becomes `CANCELLED`.
- `payment_status` becomes `FAILED`.
- `cancelledAt` and `cancelledBy` are stored.
- Stock is restored to the exact selected variant size using `OrderItem.selectedSize`.

Existing old orders without selected size cannot be customer-cancelled because exact stock restoration would be unsafe.

## Privacy Rules

The admin customer and AI features must not expose or send:

- Passwords.
- Full street addresses.
- Full phone numbers.
- Private customer data unrelated to the feature.
