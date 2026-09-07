# Campus Basket - NIT Durgapur (Independent Application)

An isolated, independently runnable application replicating the **Campus Basket** platform for NIT Durgapur students, admins, providers, and delivery partners.

---

## Safety & Isolation Guarantee
- All code, assets, configurations, and build files are located exclusively inside `/nitdgp-campus-app/`.
- The parent website, backend, database migrations, and existing repository files remain **100% untouched**.
- Communicates with the same backend (`http://localhost:5000` or production Railway URL) so that catalog changes, user registrations, and placed orders stay synchronized across both the website and this application.

---

## Key Features Replicated
1. **Student Marketplace**:
   - Hero banner, live campus order tracking, category navigation.
   - Categories: Food & Meals, Fresh Produce, Express Laundry, Daily Essentials & Stationery.
   - Dynamic product grid with Google Drive images, discount badges, and instant cart updates.
   - Residence Hall & Room delivery selector (Halls 1 to 14) with geofence validation.
2. **Strict 7-Step Authentication**:
   - Step 1: Official `@nitdgp.ac.in` College Email validation.
   - Step 2: 6-digit College Email OTP verification.
   - Step 3: Personal Email (Gmail) validation.
   - Step 4: 6-digit Personal Email OTP verification.
   - Step 5: Academic & Residence profile details.
   - Step 6: Secure password creation with real-time strength meter.
   - Step 7: Registration completion with celebratory confetti.
   - Multi-role login tabs (Student, Provider, Delivery Partner, Admin) with demo presets and optional Google Sign-In.
3. **Checkout & Payments**:
   - Razorpay integration (UPI, Cards, Netbanking) with server-side signature verification.
   - Cash on Delivery (COD) mode for eligible campus orders.
   - Real-time order progress timeline (`/orders/[id]/track`).
4. **Express Laundry System**:
   - Garment rate counter, pickup & return date/time slot selection.
   - Dual-OTP flow (Pickup OTP + Return OTP dispatched to verified personal email).
5. **Dashboards**:
   - **Student Dashboard**: Order tracking, history, profile, receipts, notifications.
   - **Admin Command Center**: Enterprise Power BI-style visualizations, KPI cards, charts, product & inventory management, PDF reports.
   - **Service Provider Portal**: Category-assigned order preparation and dispatch.
   - **Delivery Partner Portal**: Room delivery routing and student OTP verification.

---

## Running the Web Application Locally

To run the app locally on a dedicated port (`3001`):

```bash
cd nitdgp-campus-app
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Building the Android APK

The project is fully configured with Capacitor and includes an automated 1-click build script.

Whenever you want to generate your `.apk`:

### Option A: 1-Click Script (Windows)
Double-click or run:
```cmd
build-apk.bat
```
This automatically builds the Next.js bundle, synchronizes Capacitor assets, compiles with Gradle using Java 17, and saves `CampusBasket.apk`.

### Option B: Manual Commands
```bash
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```
The output APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`
