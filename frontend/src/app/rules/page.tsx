'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Truck,
  Wallet,
  Sparkles,
  UserCheck,
  Store,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function RulesAndRegulationsPage() {
  const rulesSections = [
    {
      id: 'general',
      title: 'GENERAL CAMPUS BASKET RULES',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Foundational operating standards and student community eligibility.',
      rules: [
        '1. Verified Campus Membership: Campus Basket operates exclusively for verified residential students, faculty, and authorized staff residing within the campus premises.',
        '2. Single Account Rule: Each student is permitted one active account tied to their institutional credentials or verified mobile number.',
        '3. Fair Use & Campus Courtesy: Abusive communication toward delivery runners, dhobis, or campus merchant partners will result in immediate service suspension.'
      ]
    },
    {
      id: 'order-purchase',
      title: 'ORDER & PURCHASE RULES',
      icon: ShoppingBag,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Guidelines governing cart checkout, kitchen preparation, and order confirmation.',
      rules: [
        '1. Order Confirmation: Product orders are placed and confirmed in real time upon successful payment authorization or COD verification.',
        '2. Food Order Deadlines: Night canteen meal requests are accepted strictly until stated kitchen closing hours (typically 2:00 AM for night canteens).',
        '3. Minimum Basket Value: To preserve zero platform surge pricing, individual stalls or canteens may specify a nominal minimum order threshold.'
      ]
    },
    {
      id: 'payment',
      title: 'PAYMENT RULES',
      icon: CreditCard,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      description: 'Digital transactions, Razorpay gateway security, and Cash on Delivery rules.',
      rules: [
        '1. Accepted Payment Methods: Orders may be paid via Campus Basket Wallet, UPI (Google Pay, PhonePe, Paytm), Net Banking, Cards, or Cash on Delivery (COD).',
        '2. Cash on Delivery (COD) Discipline: Students selecting COD must keep exact change ready upon runner arrival at their hostel room. Repeated refusal to accept COD orders revokes COD eligibility.',
        '3. Gateway Security: All online payments are cryptographically authenticated via Razorpay HMAC-SHA256 server verification.'
      ]
    },
    {
      id: 'cancellation-refund',
      title: 'CANCELLATION & REFUND RULES',
      icon: RotateCcw,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      description: 'Fair cancellation timeframes and automated wallet refund credits.',
      rules: [
        '1. Food Order Cancellations: Orders may be cancelled with a 100% refund only before the kitchen begins food preparation (PREPARING status).',
        '2. Laundry Order Cancellations: Free cancellation is permitted before the runner visits your hostel room to collect and weigh garments.',
        '3. Instant Wallet Refund: Eligible refunds are credited directly to your Campus Basket Wallet immediately upon confirmed cancellation.'
      ]
    },
    {
      id: 'return',
      title: 'RETURN RULES',
      icon: RotateCcw,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'Doorstep returns for stationery, packaged snacks, and damaged deliveries.',
      rules: [
        '1. Return Window: Physical merchandise (packaged goods, stationery, non-perishable items) can be returned within 24 hours of delivery if defective or incorrect.',
        '2. Perishable Exclusions: Cooked food items and cut fruits cannot be returned once handed over, unless verified stale or damaged upon room delivery.',
        '3. Verified Return Pickup: Return refunds are credited after the runner completes verified doorstep collection using the return pickup OTP.'
      ]
    },
    {
      id: 'delivery',
      title: 'DELIVERY RULES',
      icon: Truck,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      description: 'Doorstep hostel room delivery, runner coordination, and hall access.',
      rules: [
        '1. Room Doorstep Service: Student runners deliver packages directly to your hostel room door across all residence halls.',
        '2. Student Availability: When the order status changes to "OUT_FOR_DELIVERY", the student must remain reachable by phone or in their hostel room.',
        '3. Runner Safety: Respect delivery runners who are campus peers operating under scheduled delivery shifts.'
      ]
    },
    {
      id: 'wallet',
      title: 'WALLET RULES',
      icon: Wallet,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Campus Basket student balance, top-up methods, and usage terms.',
      rules: [
        '1. Closed Campus Wallet: Campus Basket Wallet is a dedicated closed-loop wallet intended strictly for campus purchases, instant refunds, and top-ups.',
        '2. Top-Up Policy: Students can top up their wallet anytime via UPI/Razorpay (₹100, ₹200, ₹500, ₹1000, or custom amounts up to ₹50,000).',
        '3. No Direct Bank Withdrawal: In compliance with campus closed-loop commerce rules, wallet balances cannot be cashed out to external bank accounts.'
      ]
    },
    {
      id: 'laundry',
      title: 'LAUNDRY SERVICE RULES',
      icon: Sparkles,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      description: 'Doorstep garment weighing, dual OTP verification, and turn-around times.',
      rules: [
        '1. Dual-OTP Verification: A 6-digit Pickup OTP must be shared when the dhobi collects clothes. A distinct Delivery OTP must be shared only after inspecting returned washed garments.',
        '2. Weighing & Pockets: Students must empty all pockets prior to collection. Billing is calculated based on exact digital scale weighing at your room door.',
        '3. Turnaround Time: Standard wash & fold orders are delivered within 48 to 72 hours of pickup.'
      ]
    },
    {
      id: 'student-resp',
      title: 'STUDENT RESPONSIBILITIES',
      icon: UserCheck,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      description: 'Accurate delivery details, room numbers, and order handovers.',
      rules: [
        '1. Accurate Hall & Room: Ensure your registered Hall name and Room number in Account Settings are accurate to avoid misdirected deliveries.',
        '2. Immediate Verification: Inspect received packages and food items upon arrival. Report any discrepancy to Help & Complaints within 2 hours.',
        '3. OTP Confidentiality: Never share your delivery or laundry OTPs over phone or chat before physical inspection.'
      ]
    },
    {
      id: 'provider-rules',
      title: 'PROVIDER / SERVICE PARTNER RULES',
      icon: Store,
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      description: 'Quality standards, hygiene protocols, and pricing honesty.',
      rules: [
        '1. Image & Catalog Accuracy: Uploaded product images must accurately represent the prepared meal or product sold without misleading sizing.',
        '2. Freshness & Hygiene: Food vendors must adhere strictly to campus health standards, daily fresh ingredients, and clean packaging.',
        '3. Prompt Preparation: Canteens must mark orders "PREPARING" immediately upon kitchen intake to minimize runner pickup delays.'
      ]
    },
    {
      id: 'privacy-account',
      title: 'PRIVACY & ACCOUNT RULES',
      icon: Lock,
      color: 'text-slate-700 bg-slate-100 border-slate-300',
      description: 'Campus student data confidentiality and encrypted storage.',
      rules: [
        '1. Data Privacy: Student roll numbers, room addresses, and mobile numbers are strictly protected and never sold or shared with outside marketing entities.',
        '2. Minimal Runner Disclosure: Delivery runners see only your first name, hostel hall, room number, and order items necessary for physical delivery.',
        '3. Secure Sessions: Always sign out of your account when using shared computers in campus computer centers or laboratories.'
      ]
    },
    {
      id: 'terms-of-service',
      title: 'TERMS OF SERVICE',
      icon: FileText,
      color: 'text-blue-800 bg-blue-50 border-blue-200',
      description: 'Governing platform terms and dispute resolution mechanisms.',
      rules: [
        '1. Platform Governance: Campus Basket is operated by the student services initiative to streamline on-campus commerce at NIT Durgapur.',
        '2. Dispute Resolution: Order or service disputes are impartially reviewed by the Campus Helpdesk cell with formal written resolution updates.',
        '3. Policy Amendments: Rules may be updated periodically to reflect semester schedules, campus security protocols, and student welfare feedback.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* 1. Header & Navigation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
              <span>Back to Account</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span>Effective: Academic Year 2026</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5 text-[#4F9D2F]">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-wider">
                Official Campus Policy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Rules &amp; Regulations
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              Please review the rules, policies and terms that apply to using Campus Basket across food, fresh fruits, express room-pickup laundry, and student essentials.
            </p>

            {/* Quick Links */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#0078AD]">
              <Link href="/terms" className="hover:underline flex items-center gap-1">
                <span>Terms of Service</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="text-gray-300">&bull;</span>
              <Link href="/privacy" className="hover:underline flex items-center gap-1">
                <span>Privacy Policy</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="text-gray-300">&bull;</span>
              <Link href="/refund-policy" className="hover:underline flex items-center gap-1">
                <span>Refund Policy</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Structured Rules Sections (High Contrast White Cards) */}
        <div className="space-y-5">
          {rulesSections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                id={sec.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs hover:border-gray-300 transition space-y-4"
              >
                <div className="flex items-start gap-3.5 pb-3 border-b border-gray-100">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${sec.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                      Section {idx + 1}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                      {sec.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {sec.rules.map((rule, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-gray-100 text-xs sm:text-sm text-gray-800 leading-relaxed font-normal"
                    >
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Footer Section */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-black text-gray-900">
            Have questions or need assistance with campus policies?
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            Reach out directly to the Student Helpdesk Cell anytime for order inquiries, resolution tracking, or service escalations.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard?tab=support"
              className="px-5 py-2.5 bg-[#4F9D2F] hover:bg-[#438a27] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Open Campus Helpdesk
            </Link>
            <Link
              href="/account"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
            >
              Return to Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
