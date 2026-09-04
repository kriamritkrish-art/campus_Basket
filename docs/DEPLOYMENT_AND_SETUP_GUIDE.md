# NIT Durgapur Campus Services Platform — Master Technical Documentation

Comprehensive operations, architecture, and deployment guide for the NIT Durgapur full-stack campus service marketplace.

---

## 1. System Overview & Technology Stack

| Layer | Technology | Deployment Platform |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS | **Vercel** |
| **Backend REST API** | Node.js, Express, TypeScript, Zod, Nodemailer, Razorpay SDK | **Railway** |
| **Database** | **MySQL** (configured with Prisma ORM) | Railway MySQL / Self-hosted |
| **Image Storage** | **Google Drive API v3** abstraction (Service Account OAuth2) | Google Cloud Console |
| **Payments** | **Razorpay Gateway** (UPI, Cards, Net Banking) & Verified COD | Razorpay Dashboard |
| **Geofencing** | Point-in-Polygon Ray Casting & HTML5 Geolocation API | NIT Durgapur Perimeter |

---

## 2. Directory Structure

```text
nit-durgapur-services/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # 36 complete MySQL models
│   │   ├── seed.ts                    # Seeds NIT Durgapur Halls, Zones, Vendors, Products
│   │   └── migrations/
│   ├── src/
│   │   ├── config/                    # Environment & Database config
│   │   ├── controllers/               # Auth, Products, Cart, Orders, Laundry, Admin, Provider
│   │   ├── middleware/                # authGuard, rbacGuard, geofenceGuard, rateLimiter
│   │   ├── routes/                    # Express modular REST endpoints
│   │   ├── services/                  # Google Drive Storage, Razorpay, Nodemailer, Laundry OTP
│   │   ├── utils/                     # Geofence math, Cryptographic 6-digit OTP, Invoices
│   │   ├── validators/                # Zod schemas with strict @nitdgp.ac.in regex
│   │   └── server.ts                  # Express server & Railway entry point
│   ├── Dockerfile                     # Production multi-stage container
│   ├── railway.json                   # Railway configuration
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── icons/                     # PWA Icons
│   │   ├── manifest.json              # Progressive Web App manifest
│   │   ├── robots.txt                 # SEO index rules (blocks private admin/provider pages)
│   │   └── sitemap.xml                # Canonical search index
│   ├── src/
│   │   ├── app/                       # App Router (Food, Fruits, Laundry, Essentials, Dashboard, Admin, Provider)
│   │   ├── components/                # Layout, ProductCards, CampusZoneMap, LaundryDrawer, CartDrawer
│   │   ├── context/                   # AuthContext, CartContext, GeolocationContext
│   │   ├── lib/                       # API client with token & GPS header injection
│   │   └── types/                     # Shared TypeScript interfaces
│   ├── next.config.js                 # Image domains & API rewrites
│   ├── tailwind.config.ts             # Custom institutional campus color palette
│   └── package.json
├── tests/                             # Automated test suites (Auth, Laundry Dual-OTP, Payment, Geofence, RBAC)
└── docs/                              # Technical guides and manuals
```

---

## 3. Environment Variables Reference

Create `.env` in both `backend/` and root:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/nit_campus_services"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Security
JWT_SECRET="your_long_random_jwt_secret_2026"
SESSION_SECRET="your_session_secret_key"
JWT_EXPIRES_IN="7d"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_campus_services_nitdgp"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Google Drive Storage Service
GOOGLE_DRIVE_CLIENT_EMAIL="nit-drive-service@nit-durgapur-services.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="1_campus_services_root_folder_id"

# Email / SMTP
SMTP_HOST="smtp.resend.com"
SMTP_PORT=587
SMTP_USER="resend"
SMTP_PASSWORD="re_your_api_key"
EMAIL_FROM="NIT Durgapur Campus Services <services@nitdgp.ac.in>"

# Campus Coordinates
CAMPUS_LAT=23.5484
CAMPUS_LNG=87.2931
CAMPUS_MAX_RADIUS_KM=2.5
```

---

## 4. Setting up Google Drive Image Storage

Product images are never stored as MySQL binary bloat. They are uploaded to the Admin's Google Drive folder:
1. Visit the **Google Cloud Console** and create a project (e.g. `NIT-Campus-Services`).
2. Enable the **Google Drive API**.
3. Create a **Service Account** with the `Editor` role.
4. Generate a new **JSON Key** for this service account.
5. In your personal/admin Google Drive, create a root folder called `NIT Campus Services`.
6. Share this root folder with the Service Account email address (`...iam.gserviceaccount.com`) with `Editor` permissions.
7. Copy the folder ID from the URL and set `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_DRIVE_CLIENT_EMAIL`, and `GOOGLE_DRIVE_PRIVATE_KEY` in `.env`.
8. *Fallback note*: In development mode, if Google credentials are not set, the storage service automatically runs in a local sandbox mode saving images under `backend/storage_uploads/` without throwing errors.

---

## 5. Setting up Razorpay & Webhook Verification

1. Log into the **Razorpay Dashboard** (Test Mode).
2. Copy `Key ID` and `Key Secret` into `.env`.
3. Under **Settings > Webhooks**, add your backend URL: `https://<your-railway-url>/api/payments/webhook`.
4. Subscribe to the events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
5. Set your `RAZORPAY_WEBHOOK_SECRET` in `.env`. Webhooks are protected with HMAC-SHA256 signature verification and replay-attack idempotency.

---

## 6. Dual-OTP Laundry Security Protocol

1. When a student books laundry, the backend generates two separate 6-digit random codes:
   - **Pickup OTP**: Stored hashed in MySQL. Student shares this with the runner upon room collection.
   - **Delivery OTP**: Stored hashed in MySQL. Student shares this with the runner upon room return.
2. The state machine enforces that a **Pickup OTP cannot verify Delivery**, and a **Delivery OTP cannot verify Pickup**.
3. Both OTPs are limited to a maximum of 3 incorrect attempts and expire automatically.

---

## 7. Campus Polygon Geofencing

- Center coordinates: `23.5484° N, 87.2931° E` (Mahatma Gandhi Avenue, Durgapur).
- Point-in-polygon Ray Casting algorithm validates student GPS against active service zones (Zone A: Academic, Zone B: Halls 1-8, Zone C: Halls 11-14).
- Students outside campus perimeter can browse menus, but order checkout is rejected until they enter campus grounds.

---

## 8. Deployment Guides

### Backend Deployment to Railway
1. Push this repository to GitHub.
2. Create a **New Project** in Railway and connect your GitHub repository.
3. Add a **MySQL Database** service in Railway.
4. Set the environment variable `DATABASE_URL` in the Backend service to reference the Railway MySQL connection string (`${{MySQL.DATABASE_URL}}`).
5. Set other environment variables (`JWT_SECRET`, `RAZORPAY_KEY_ID`, etc.).
6. Railway automatically detects `backend/Dockerfile` and `backend/railway.json`. Health check endpoint `/health` is automatically monitored.
7. Run migrations and seed:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

### Frontend Deployment to Vercel
1. Import your GitHub repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Configure the environment variable:
   `NEXT_PUBLIC_BACKEND_URL="https://<your-railway-backend-domain>"`
4. Deploy! Next.js automatically sets up SSR, dynamic route rendering, PWA assets, and image optimization.

---

## 9. Running Tests

```bash
cd backend
npm test
```
Runs 18 automated unit and integration tests across 5 test suites (Auth, Laundry Dual-OTP, Payment Signature Verification, Geofencing Ray-Casting, and RBAC Guard).
