# RentNest 🏠

> **Find & List Rental Properties with Ease**

RentNest is a backend REST API for a rental property marketplace. Landlords list properties and manage rental requests, tenants browse listings, request rentals, pay via **Stripe** and leave reviews, while admins oversee the whole platform.

## 🔗 Links

| Item | Link |
|------|------|
| Live API | _coming soon (Vercel)_ |
| API Docs (Swagger) | `/api/docs` on the live API (interactive, try requests in the browser) |
| Postman Collection | Import [`RentNest.postman_collection.json`](./RentNest.postman_collection.json) |

## 🔑 Admin Credentials

```
Email    : admin@rentnest.com
Password : admin123
```

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js + Express 5 | REST API framework |
| TypeScript | Type safety |
| PostgreSQL (Neon) + Prisma 6 | Database + ORM |
| Zod | Server-side input validation |
| JWT + bcryptjs | Authentication & password hashing |
| Stripe Checkout | Payment processing |
| Vercel | Deployment |

## ✨ Features

### Public
- Browse all rental properties with **search, filters** (location, price range, category, bedrooms, amenities, availability), **sorting and pagination**
- View property details with landlord contact, reviews and average rating
- View all property categories

### Tenant
- Register/login, view own profile
- Submit rental requests (with duplicate prevention and future move-in date validation)
- Pay for **approved** requests via Stripe Checkout (test card `4242 4242 4242 4242`)
- View payment history and payment details
- Leave a review (1–5 stars) **after a completed rental** — one review per property

### Landlord
- Create, update and (soft) delete own property listings — ownership enforced
- Set availability status (AVAILABLE / RENTED / UNAVAILABLE)
- View incoming rental requests with tenant contact info
- Approve / reject pending requests, complete active tenancies

### Admin
- View all users with role/status filters, **ban/unban** users (takes effect immediately, even on live tokens)
- Platform-wide oversight of all properties (including soft-deleted) and all rental requests with payment info
- Manage categories

## 📊 Rental Lifecycle

```
PENDING ──(landlord approves)──▶ APPROVED ──(Stripe payment)──▶ ACTIVE ──(landlord completes)──▶ COMPLETED ──▶ review ⭐
   └──(landlord rejects)──▶ REJECTED
```

Payment success atomically updates three records in one transaction: **Payment → COMPLETED**, **Rental → ACTIVE**, **Property → RENTED**.

## 🗄️ Database Schema (6 tables)

| Table | Highlights |
|-------|-----------|
| `users` | role (TENANT/LANDLORD/ADMIN), status (ACTIVE/BANNED), unique email |
| `categories` | unique name, delete-protected while properties use it |
| `properties` | belongs to landlord + category, amenities/images arrays, soft delete |
| `rental_requests` | tenant ↔ property, status state machine, unique live request per tenant/property |
| `payments` | 1:1 with rental request, Stripe session id as transactionId, PENDING/COMPLETED/FAILED |
| `reviews` | 1–5 rating, unique per (tenant, property), requires completed rental |

## 🚀 Getting Started

```bash
# 1. Clone & install
git clone https://github.com/Nurunnabi87/rent-nest.git
cd rent-nest
npm install

# 2. Environment - copy the template and fill in your values
cp .env.example .env
#    DATABASE_URL  -> Neon pooled connection string
#    DIRECT_URL    -> Neon direct connection string (for migrations)
#    JWT_SECRET    -> any long random string
#    STRIPE_SECRET_KEY -> Stripe test secret key (sk_test_...)

# 3. Create tables + seed admin & categories
npx prisma migrate dev
npm run seed

# 4. Run
npm run dev        # development (hot reload) on http://localhost:5000
npm run build && npm start   # production
```

## 📖 API Endpoints (27)

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register as TENANT or LANDLORD |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Logged in | Current user profile |

### Properties (Public)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/properties` | Public | Browse with filters, sort, pagination |
| GET | `/api/properties/:id` | Public | Details + reviews + avg rating |
| GET | `/api/categories` | Public | All categories |

### Landlord
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/landlord/properties` | Landlord | Own listings |
| POST | `/api/landlord/properties` | Landlord | Create listing |
| PUT | `/api/landlord/properties/:id` | Owner | Update listing / availability |
| DELETE | `/api/landlord/properties/:id` | Owner | Soft-delete listing |
| GET | `/api/landlord/requests` | Landlord | Incoming requests (`?status=`) |
| PATCH | `/api/landlord/requests/:id` | Owner | Approve / reject / complete |

### Rentals (Tenant)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/rentals` | Tenant | Submit rental request |
| GET | `/api/rentals` | Tenant | Own request history |
| GET | `/api/rentals/:id` | Involved parties | Request details |

### Payments (Stripe)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/create` | Tenant | Checkout session for APPROVED request |
| GET | `/api/payments/success` | Stripe redirect | Verifies & activates rental |
| GET | `/api/payments/cancel` | Stripe redirect | Cancel notice |
| POST | `/api/payments/webhook` | Stripe server | Signature-verified fulfillment |
| GET | `/api/payments` | Tenant | Payment history |
| GET | `/api/payments/:id` | Involved parties | Payment details |

### Reviews
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reviews` | Tenant | Review after COMPLETED rental |
| GET | `/api/reviews` | Tenant | Own reviews |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users` | Admin | All users (`?role=&status=`) |
| PATCH | `/api/admin/users/:id` | Admin | Ban / unban |
| GET | `/api/admin/properties` | Admin | All listings incl. soft-deleted |
| GET | `/api/admin/rentals` | Admin | All requests with payment info |

### Misc
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | API welcome |
| GET | `/api/health` | Public | Health check |

## 📦 Response Format

Success:
```json
{ "success": true, "message": "...", "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }, "data": [] }
```

Error (consistent across the whole API):
```json
{ "success": false, "message": "Validation error", "errorDetails": [{ "field": "body.email", "message": "A valid email address is required" }] }
```

## 💳 Testing Payments

1. Login as tenant, submit a rental request, login as landlord and **approve** it
2. `POST /api/payments/create` with the rental request id → returns `checkoutUrl`
3. Open `checkoutUrl` in a browser, pay with card **4242 4242 4242 4242** (any future expiry, any CVC)
4. Stripe redirects to `/api/payments/success` → payment COMPLETED, rental ACTIVE, property RENTED

## 📂 Project Structure

```
src/
├── app.ts                  # Express app, middlewares, route mounting
├── server.ts               # Entry point
├── config/                 # Environment configuration
├── errors/                 # AppError class
├── middlewares/            # auth (JWT + roles), validateRequest (Zod),
│                           # globalErrorHandler, notFound
├── routes/                 # Central route registry
├── shared/                 # prisma, stripe, jwt, sendResponse helpers
└── modules/                # Feature modules (routes/validation/controller/service)
    ├── auth/  category/  property/  rental/  payment/  review/  admin/
prisma/
├── schema.prisma           # Database schema (6 models)
├── migrations/             # SQL migration history
└── seed.ts                 # Admin user + default categories
```
