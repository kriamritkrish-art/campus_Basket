import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Campus Basket',
  description: 'Student data protection and institutional confidentiality standards at NIT Durgapur.'
};

export default function PrivacyPage() {
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
            <Lock className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Student Privacy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Data Privacy &amp; Protection
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Institutional Privacy Standards &bull; Confidential Student Identity Governance at NIT Durgapur.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-800 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>1. Strict Protection of Student Identity Data</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              In accordance with institutional digital governance policies, student private information—including mobile number, roll number, registration number, and room number—is never exposed publicly or shared with unauthorized third parties.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>2. Service Provider Data Access Restriction</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Service vendors and delivery runners receive only the minimal dispatch information necessary to fulfill delivery to the student's room (student name, hostel hall, room number, and order items). Vendors cannot browse the student database or access confidential administrative records.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>3. Geolocation &amp; Campus Perimeter Data</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Browser geolocation coordinates are collected exclusively to verify that the student is located within the verified campus perimeter at the time of checkout. We do not track student movement or retain real-time GPS paths.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>4. Wallet &amp; Payment Ledger Records</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              All Campus Basket Wallet credits, top-ups, and checkout debits are immutably logged in double-entry financial audit ledgers accessible only by the student and authorized platform financial auditors.
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
