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
- **Mobile Responsive & Hardware Back Handling**: Optimized for desktop and mobile, with seamless hardware back-button handling in the Android application.

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
| **Mobile** | Capacitor 8 (Android runtime, native app navigation) |
| **Backend** | Node.js (ES Modules), Express.js, Mongoose ODM, Zod, PDFKit, Helmet, Express Rate Limit, Cookie-Parser, Nodemailer |
| **Database** | MongoDB (Local or MongoDB Atlas) |
| **Authentication** | JWT (JSON Web Tokens), HttpOnly cookies / Bearer headers, Bcrypt password hashing |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) |

---

## 📂 Project Structure

```text
invoicehub/
├── client/                      # React frontend & Capacitor Android project
│   ├── android/                 # Native Android Gradle project (Capacitor)
│   ├── src/
│   │   ├── components/          # Reusable UI cards, modals, tables, badges
│   │   ├── context/             # AuthContext (token persistence, user state)
│   │   ├── layouts/             # PublicLayout, UserLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── auth/            # LandingPage, Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── user/            # Dashboard, BusinessProfile, CustomerList, InvoiceList, InvoiceEditor, InvoiceDetails
│   │   │   └── admin/           # AdminDashboard, AdminUsers, AdminAuditLogs
│   │   ├── routes/              # RouteGuards (ProtectedRoute, AdminRoute, PublicOnlyRoute)
│   │   ├── services/            # Axios API client with interceptors
│   │   └── utils/               # Formatters (currency, dates, badges, PDF download)
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express.js REST API
│   ├── src/
│   │   ├── config/              # MongoDB connection & environment settings
│   │   ├── controllers/         # Auth, User, BusinessProfile, Customer, Invoice, Payment, Dashboard, Admin
│   │   ├── middleware/          # JWT auth, RBAC role guard, Zod request validator, error handler
│   │   ├── models/              # User, Customer, BusinessProfile, Invoice, Payment, AuditLog, PasswordReset
│   │   ├── routes/              # Express API routers prefixed with /api/v1
│   │   ├── services/            # PDF generation, Audit logging, Email service (Nodemailer)
│   │   └── utils/               # Calculation engine, Seed script
│   ├── tests/                   # Automated security & calculation tests
│   └── package.json
├── .env.example                 # Environment template
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- MongoDB instance (local or MongoDB Atlas connection URI)
- npm or pnpm

### 2. Environment Configuration
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Ensure `JWT_SECRET`, `PORT`, and `MONGODB_URI` are configured.

### 3. Install Dependencies
```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 4. Seed Database (Optional)
```bash
cd server && npm run seed
```
Default credentials:
- **Tenant User**: `demo@invoicehub.local` / `Password@123`
- **Administrator**: `admin@invoicehub.local` / `Admin@InvoiceHub2026`

### 5. Start Development
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 📦 Build Android APK with Capacitor

1. **Rebuild web assets**:
   ```bash
   cd client
   npm run build
   ```

2. **Sync assets to Android project**:
   ```bash
   npx cap sync android
   ```

3. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Generate APK**:
   - In Android Studio: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - Once completed, click **"locate"** to find `app-debug.apk`.
   - Side-load the APK directly onto your Android device via USB or file transfer.

---

## ☁️ Deploy to Render (Production)

### 1. Backend Web Service
1. In the Render Dashboard, create a **New Web Service** connected to your InvoiceHub repository.
2. Settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001` (or let Render set its dynamic port)
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/invoicehub?retryWrites=true&w=majority`)
   - `CORS_ORIGIN`: Your frontend URL (e.g. `https://invoicehub.onrender.com` or custom domain)
   - `FRONTEND_URL`: Your frontend URL (used in password reset emails)
   - `JWT_SECRET`: A secure 32+ character random secret
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: Production email service credentials

### 2. Frontend Web Service
1. Create a **Static Site** on Render.
2. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: `https://<your-render-backend-url>/api/v1`

---

## 🧪 Automated Testing

InvoiceHub includes unit tests for the financial calculation engine and automated security integration tests verifying cross-tenant isolation:

```bash
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
- `POST /api/v1/auth/forgot-password` — Password reset request (triggers email)
- `POST /api/v1/auth/reset-password/:token` — Validate token and set new password

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
