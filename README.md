# InvoiceHub — Multi-User Bill Management System

InvoiceHub is a full-stack, responsive, and secure billing and invoice management platform built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express.js**, and **MongoDB**. 

Multiple registered tenants can independently manage their businesses, customers, invoices, and payment records with guaranteed data isolation. An administrator portal provides system metrics, user governance, and security audit logs.

---

## 🌟 Key Features

### 👤 Regular User Experience
- **Tenant Isolation**: Strict MongoDB owner scoping (`ownerId`) on all customer, invoice, and payment queries. User A cannot access or tamper with User B's records.
- **Business Profile Management**: Configure company details, tax identifiers, billing defaults, and custom payment terms. Automatic snapshotting preserves historical invoices even if profile settings change.
- **Customer Directory**: Add, search, edit, and archive customers with contact details and billing addresses.
- **Authoritative Calculation Engine**: Pure server-side calculations for subtotal, percentage/fixed discounts, taxes, and additional charges. Client-side attempts to forge totals are automatically recalculated.
- **Lifecycle Status Management**: Full invoice status transitions (`draft`, `unpaid`, `partially_paid`, `paid`, `overdue`, `void`).
- **Vector PDF Generation & Printing**: Clean server-side A4 invoice PDFs powered by PDFKit, plus a dedicated print stylesheet.
- **Payment Tracking**: Record full or partial payments across Cash, Bank Transfer, UPI, Cards, and Cheques with automatic overpayment rejection.
- **Analytics Dashboard**: Interactive KPI summary cards and Recharts monthly billing and invoice status distributions.

### 🛡️ Administrator Governance
- **System Overview**: Aggregate statistics for total registered users, issued invoices, and overall billing volume (excluding voided records).
- **User Account Governance**: Search registered tenants, inspect activity, and update account statuses (`active`, `inactive`, `suspended`).
- **Admin Self-Protection**: Prevents deactivating or suspending the only active administrator.
- **Security Audit Logs**: Immutable audit trail tracking user registrations, status updates, invoice issuances, void events, and payment recordings.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 3, React Router DOM 7, Axios, Lucide React, Recharts, React Hot Toast |
| **Backend** | Node.js (ES Modules), Express.js, Mongoose ODM, Zod, PDFKit, Helmet, Express Rate Limit, Cookie-Parser |
| **Database** | MongoDB (Local or Atlas) |
| **Authentication** | JWT (JSON Web Tokens), HttpOnly cookies / Bearer headers, Bcrypt password hashing |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) |

---

## 📂 Project Structure

```text
invoicehub/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI cards, buttons, modals, badges
│   │   │   ├── common/          # Button, Modal, Card, StatusBadge, EmptyState
│   │   │   ├── customers/       # CustomerModal
│   │   │   └── invoices/        # PaymentModal
│   │   ├── context/             # AuthContext (token persistence, user state)
│   │   ├── layouts/             # PublicLayout, UserLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── auth/            # LandingPage, Login, Register, ForgotPassword
│   │   │   ├── user/            # Dashboard, BusinessProfile, CustomerList, InvoiceList, InvoiceEditor, InvoiceDetails
│   │   │   └── admin/           # AdminDashboard, AdminUsers, AdminAuditLogs
│   │   ├── routes/              # RouteGuards (ProtectedRoute, AdminRoute, PublicOnlyRoute)
│   │   ├── services/            # Axios API client with interceptors
│   │   └── utils/               # Formatters (currency, dates, badges)
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express.js REST API
│   ├── src/
│   │   ├── config/              # MongoDB connection & environment settings
│   │   ├── controllers/         # Auth, User, BusinessProfile, Customer, Invoice, Payment, Dashboard, Admin
│   │   ├── middleware/          # JWT auth, RBAC role guard, Zod request validator, error handler
│   │   ├── models/              # User, Customer, BusinessProfile, Invoice, Payment, AuditLog
│   │   ├── routes/              # Express API routers prefixed with /api/v1
│   │   ├── services/            # PDF generation service, Audit logging service
│   │   ├── utils/               # Calculation engine, Seed script, Live verification
│   │   ├── validators/          # Zod request validation schemas
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entrypoint
│   ├── tests/                   # Calculation unit tests & Critical Security isolation tests
│   └── package.json
├── package.json                 # Root script runner
├── .env.example                 # Environment variables template
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v26)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas connection string.

### 2. Environment Configuration
Copy `.env.example` to `server/.env` and `client/.env`:

```bash
# Server Configuration (server/.env)
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/invoicehub
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/invoicehub_test
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Initial Admin Credentials (used during seed)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@invoicehub.local
ADMIN_PASSWORD=Admin@InvoiceHub2026

# Client Configuration (client/.env)
VITE_API_URL=http://localhost:5001/api/v1
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Seed the Database
Initialize the administrator account and demo business records:
```bash
npm run seed
# or: cd server && npm run seed
```

Default seeded credentials:
- **Regular User**: `demo@invoicehub.local` / `Password@123`
- **Administrator**: `admin@invoicehub.local` / `Admin@InvoiceHub2026`

### 5. Start the Application
Run both servers:

```bash
# From workspace root:
npm run server   # Starts Express API at http://localhost:5001
npm run client   # Starts Vite React App at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

InvoiceHub includes unit tests for the financial calculation engine and automated security integration tests verifying cross-tenant isolation:

```bash
# Run calculation engine unit tests and security isolation tests
cd server && npm test
```

### Critical Security Scenarios Verified (21/21 Passing):
1. User A cannot retrieve User B's invoice.
2. User A cannot edit or delete User B's invoice.
3. User A cannot download User B's invoice PDF.
4. User A cannot record a payment against User B's invoice.
5. User A cannot retrieve User B's customer information.
6. A regular user cannot access admin endpoints (`403 Forbidden`).
7. A regular user cannot escalate their role to `admin` through profile updates.
8. A suspended user cannot perform protected operations.
9. Client cannot forge invoice totals (recalculated authoritatively by server).
10. Overpayments exceeding the outstanding balance are rejected.
11. Unauthorized requests without credentials cannot access dashboard metrics (`401 Unauthorized`).
12. Administrator access to platform governance metrics is verified.

---

## 📡 REST API Reference

Base Prefix: `/api/v1`

### Authentication
- `POST /api/v1/auth/register` — Create a new regular user account
- `POST /api/v1/auth/login` — Sign in and receive JWT token / session cookie
- `POST /api/v1/auth/logout` — Invalidate session cookie
- `GET /api/v1/auth/me` — Retrieve currently authenticated user profile
- `POST /api/v1/auth/forgot-password` — Password reset request endpoint

### Business Profile & Customers
- `GET /api/v1/business-profile` — Get authenticated user's business profile
- `POST /api/v1/business-profile` — Upsert user's business profile
- `GET /api/v1/customers` — List tenant's customers (search & pagination)
- `POST /api/v1/customers` — Create a customer
- `GET /api/v1/customers/:id` — View customer details
- `PUT /api/v1/customers/:id` — Update customer details
- `DELETE /api/v1/customers/:id` — Delete customer (or archive if invoices exist)

### Invoices & Payments
- `GET /api/v1/invoices` — List tenant's invoices (search, status filter, date filter, pagination)
- `POST /api/v1/invoices` — Create a draft or issue an invoice
- `GET /api/v1/invoices/:id` — View invoice details with payment history
- `PUT /api/v1/invoices/:id` — Edit an unissued draft invoice
- `DELETE /api/v1/invoices/:id` — Delete an unissued draft invoice
- `POST /api/v1/invoices/:id/issue` — Issue a draft invoice
- `POST /api/v1/invoices/:id/void` — Invalidate an issued invoice
- `GET /api/v1/invoices/:id/pdf` — Stream and download generated PDF document
- `GET /api/v1/invoices/:id/payments` — Get payments recorded on this invoice
- `POST /api/v1/invoices/:id/payments` — Record a payment against an issued invoice

### User Analytics
- `GET /api/v1/dashboard/summary` — Aggregate summary counts, invoiced, collected, receivables, overdue
- `GET /api/v1/dashboard/monthly-stats` — Monthly invoiced vs collected trend
- `GET /api/v1/dashboard/invoice-status` — Status distribution breakdown

### Administrator Console (Requires `admin` role)
- `GET /api/v1/admin/dashboard` — Platform overview metrics & recent audit events
- `GET /api/v1/admin/users` — Tenant user directory with invoice counts
- `GET /api/v1/admin/users/:id` — User details and aggregate billing stats
- `PATCH /api/v1/admin/users/:id/status` — Activate, deactivate, or suspend user accounts
- `GET /api/v1/admin/audit-logs` — Query tamper-evident security audit logs

---

## 🔒 Security Architecture Highlights
- **No Password Hashes in Responses**: Password hashes are stored with `select: false` in Mongoose and never returned to the frontend.
- **Strict Data Isolation**: Queries never fetch records by `_id` alone; all queries mandate `{ _id: id, ownerId: req.user._id }`.
- **Decimal-Safe Financial Arithmetic**: All money values are calculated and rounded to 2 decimal places using server-authoritative formulas.
- **Audit Trails**: Critical operations (registration, account suspensions, invoice issuance, invoice voiding, payment recording) are logged with timestamp, actor email, target ID, and reason.

---

## 📄 License
ISC License. Built for InvoiceHub Multi-User Bill Management.
