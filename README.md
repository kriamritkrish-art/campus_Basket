# NIT Durgapur Campus Services Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-teal.svg)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready full-stack campus service marketplace engineered specifically for **National Institute of Technology Durgapur (NIT Durgapur)** students, administrators, and campus service providers.

---

## Key Capabilities

1. **Strict NIT Durgapur Email Authentication**:
   - Only official `@nitdgp.ac.in` email addresses (e.g. `ss.24u10227@nitdgp.ac.in`) can register. Commercial domains (Gmail, Yahoo, Outlook) are strictly rejected.
   - 6-digit cryptographically generated OTP, hashed using SHA-256 with 5-minute expiry, rate-limiting, and timing-safe comparison.
   - Comprehensive student profile with Roll number, Registration number, Mobile number, and Hall of residence (Halls 1 to 14, Mother Teresa Hall, Sister Nivedita Hall).

2. **Campus-Only Geofencing (Ray-Casting Algorithm)**:
   - Built-in point-in-polygon algorithm validating student GPS coordinates against NIT Durgapur service zones.
   - Transparent perimeter warnings preventing orders from outside campus boundaries without blocking browsing.

3. **Google Drive Image Storage Abstraction**:
   - Actual product and laundry condition photos are stored directly in Admin's configured Google Drive.
   - MySQL stores Google Drive File ID, proxy link, filename, MIME type, and metadata.
   - Service account credentials remain strictly on the backend; images are delivered to clients via secure streaming proxy.

4. **Dual-OTP Campus Laundry Workflow**:
   - Two distinct 6-digit OTPs: **Pickup OTP** and **Delivery OTP**.
   - Pickup OTP verifies physical collection at the student's room and **cannot** verify delivery.
   - Delivery OTP verifies return of clean, ironed garments.
   - QR code tagging and laundry condition notes (stains, damages).

5. **Financial & Payment Integrity**:
   - Razorpay integration (UPI, Google Pay, Cards, Net Banking) with cryptographic HMAC-SHA256 signature verification.
   - Replay-protected Razorpay Webhooks with idempotency tracking.
   - Cash on Delivery (COD) with global admin toggle, service-level toggle, and ₹1,500 maximum order limit. Failed online payments are never auto-converted to COD.
   - Digital, printable, and downloadable PDF/HTML receipts with line-item breakdowns.

6. **Dedicated Dashboards & RBAC**:
   - **Student Portal**: Mobile-first PWA with browsing, instant search, coupon validation, live order milestones, laundry OTP tracking, 1-click reorder, and review submission.
   - **Admin Portal**: Live KPIs (Revenue, Orders, Low Stock, Active Runners), interactive Campus Polygon Zone Editor, Google Drive product manager, hall toggles, audit logs, and settings.
   - **Service Provider Console**: Mobile-first runner interface for order status transitions, Pickup OTP verification, and Delivery OTP verification.

---

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti. Deployable to **Vercel**.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Zod, Nodemailer, Google Drive API (`googleapis`), Razorpay SDK. Deployable to **Railway**.
- **Database**: **MySQL** (configured with Prisma schema).
- **Tests**: Vitest test suites covering 18 critical business and security rules.

---

## Getting Started Locally

### Prerequisites
- Node.js 20+ LTS
- MySQL 8.0+

### 1. Clone & Configure Environment Variables
```bash
cp .env.example backend/.env
```
Update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/nit_campus_services"
```

### 2. Install Dependencies & Generate Prisma Client
```bash
# In backend
cd backend
npm install
npx prisma generate

# In frontend
cd ../frontend
npm install
```

### 3. Database Migration & Seed Data
```bash
cd backend
npx prisma db push
npm run prisma:seed
```
*Seeds:*
- Admin account: `admin@nitdgp.ac.in` (Password: `CampusAdmin@2026`)
- Verified student: `ss.24u10227@nitdgp.ac.in` (Password: `Student@2026`)
- Laundry vendor: `laundry.vendor@nitdgp.ac.in` (Password: `Provider@2026`)
- All 16 NIT Durgapur Halls & 3 Campus Service Zones
- Full catalog of meals, fresh fruits, and student essentials

### 4. Running the Development Servers
```bash
# Terminal 1: Backend REST API (Runs on port 5000)
cd backend
npm run dev

# Terminal 2: Next.js Frontend (Runs on port 3000)
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Automated Tests

```bash
cd backend
npm test
```
Executes all test suites:
- `tests/auth.test.ts` (Validates `@nitdgp.ac.in` restriction, OTP SHA-256 hashing)
- `tests/laundry.test.ts` (Asserts Pickup OTP cannot verify delivery, reuse prevention)
- `tests/payment.test.ts` (Validates Razorpay HMAC-SHA256 signature verification)
- `tests/geofence.test.ts` (Asserts Point-in-polygon math inside vs outside campus)
- `tests/rbac.test.ts` (Asserts role-based access control rules)

---

## Deployment

- **Railway (Backend & MySQL)**: Connect your repository. Railway automatically detects `backend/Dockerfile` and `backend/railway.json`. Set environment variables in Railway dashboard.
- **Vercel (Frontend)**: Connect your repository with root directory set to `frontend`. Set `NEXT_PUBLIC_BACKEND_URL` to your Railway domain.

Detailed deployment instructions are documented in [docs/DEPLOYMENT_AND_SETUP_GUIDE.md](file:///c:/Users/SOURAV%20SENAPATI/OneDrive/Desktop/stdent%20essential/docs/DEPLOYMENT_AND_SETUP_GUIDE.md).
