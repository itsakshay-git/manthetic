# Manthetic Backend

Node.js and Express API for the Manthetic ecommerce platform. The backend manages authentication, products, variants, categories, cart, wishlist, orders, reviews, customer operations, analytics, image uploads, AI services, and cancellation workflows.

## Current Features

- JWT authentication with customer and admin authorization.
- Product, category, and variant management with image upload support.
- Cart and wishlist APIs with selected variant, size, quantity, and price handling.
- Order placement, order history, admin status updates, and customer cancellation rules.
- Review creation, moderation data, and admin review insights support.
- Customer admin summaries with order, spend, address, cart, wishlist, review, and intent metrics.
- Customer intent endpoint for cart/wishlist product visibility without exposing private address or phone data.
- LangChain Gemini AI services for storefront style recommendations and admin review summaries.
- PostgreSQL database access through Prisma.
- Syntax and smoke verification scripts.

## Tech Stack

- Node.js
- Express 5
- PostgreSQL
- Prisma 6
- JWT
- bcryptjs
- Joi and Zod
- Multer and Cloudinary
- LangChain JS with Gemini through `@langchain/google`

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL database
- Google AI Studio API key for AI features
- Cloudinary account for image upload features

## Environment Variables

Create `.env` in this project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/manthetic_db"
JWT_SECRET="replace-with-a-secure-secret"
PORT=5000

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

GOOGLE_API_KEY="your-google-ai-studio-key"
AI_MODEL="gemini-2.5-flash"
```

Do not commit real `.env` values.

## Scripts

```bash
npm run dev
npm start
npm run check:syntax
npm run smoke
```

## Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

Recent migrations include:

- Cart item timestamps for abandoned-cart and customer intent age tracking.
- Order item selected size and order cancellation metadata for accurate stock restoration.

## API Base URL

```text
http://localhost:5000/api
```

## Key Routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Products and Catalog

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Cart and Wishlist

```text
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:id
DELETE /api/cart/:id

GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/:id
```

### Orders

```text
GET  /api/order
POST /api/order
GET  /api/order/:id
PUT  /api/order/:id
PUT  /api/order/:id/cancel
```

Customer cancellation is allowed only when:

- The order belongs to the logged-in customer.
- The order status is `PENDING` or `CONFIRMED`.
- The order was created less than 24 hours ago.
- The order items include selected size data required for exact stock restoration.

`CANCELLED` is treated as a terminal status. Admin cancellation restores stock only once when transitioning from a non-cancelled status.

### Customers

```text
GET /api/customer/customers
GET /api/customer/customer/:id/intent
```

The customer list preserves the `users: [...]` response shape and adds operational metrics such as order count, spend, cart count, wishlist count, abandoned cart state, and intent value. The intent endpoint returns safe customer summary data plus cart and wishlist product details. Passwords, full addresses, and phone numbers are not returned.

### AI

```text
POST /api/ai/storefront/style-finder
POST /api/ai/admin/review-insights
```

Storefront style finder accepts a shopper query plus optional filters and returns validated product or variant recommendations from real catalog candidates.

Admin review insights requires admin authentication and returns structured sentiment, praises, complaints, affected products, and suggested actions.

## Project Structure

```text
app.js                 Express app setup and route mounting
server.js              Server entry point
config/                Environment and shared config
controller/            Route controllers
middleware/            Auth, admin protection, uploads
models/                Data access and domain logic
routes/                Express route definitions
services/              Shared service integrations, including AI
prisma/                Prisma schema and migrations
scripts/               Smoke checks and utility scripts
validation/            Request validation schemas
```

## Verification

Before shipping backend changes, run:

```bash
npm run check:syntax
npm run smoke
```

Also verify protected routes manually when touching auth-sensitive behavior.
