import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — Campus Basket',
  description: 'Operating terms and conditions for Campus Basket residential students at NIT Durgapur.'
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
            <span>Back to Account</span>
          </Link>
          <Link
            href="/rules"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#4F9D2F] hover:underline"
          >
            <span>View All Rules &amp; Regulations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#4F9D2F]">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Legal Agreement
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Rules of Operation for Campus Basket Residents &bull; Unified Student Commerce Standard at NIT Durgapur.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-800 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>1. Verified Account Ownership</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Registration requires an authorized student or campus institutional email account. Users are accountable for all orders placed under their authenticated profile. Sharing login credentials with non-campus individuals is strictly prohibited.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>2. Cash on Delivery (COD) Compliance</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Students selecting Cash on Delivery agree to provide exact or reasonable cash change to the delivery runner at their room door. Repeated refusal to accept confirmed COD orders results in administrative deactivation of COD privileges.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>3. Laundry Verification Dual-OTP Protocol</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Students must maintain possession of their distinct Pickup and Delivery OTPs and release them only upon physical verification of the provider. Handing over OTP without inspection waives damage claims.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>4. Merchant &amp; Delivery Runner Safety</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Campus Basket delivery runners are residential students working on campus. Disrespectful behavior or abuse toward runners or canteen staff will lead to permanent platform blacklisting.
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center pt-2">
          <Link
            href="/rules"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F9D2F] hover:bg-[#438a27] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <span>Explore Complete Rules &amp; Regulations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
