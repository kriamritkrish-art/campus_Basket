import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy — Campus Basket',
  description: 'Instant student wallet refund rules, double-entry financial ledger and cancellation guidelines.'
};

export default function RefundPolicyPage() {
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
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Student Consumer Protection
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Campus Basket Central Commerce Policy &bull; Double-Entry Student Wallet Crediting.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-800 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>1. Service-Adaptive Order Cancellations</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Students may cancel product orders according to service-specific rules:
            </p>
            <div className="pl-4 space-y-1.5 pt-1 text-gray-700">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 font-bold">Food Orders:</strong> Cancellations are permitted with a 100% refund prior to kitchen meal preparation (<span className="font-mono text-emerald-800 font-bold">PREPARING</span>).
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 font-bold">Laundry Orders:</strong> Cancellations are permitted prior to runner pickup and weighing (<span className="font-mono text-emerald-800 font-bold">CLOTHES_COLLECTED</span>).
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 font-bold">Produce &amp; Stationery:</strong> Cancellations are permitted prior to runner dispatch (<span className="font-mono text-emerald-800 font-bold">OUT_FOR_DELIVERY</span>).
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>2. Instant Campus Basket Wallet Credits</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              When an eligible order is cancelled or confirmed out of stock, refunds are immediately credited to the student's Campus Basket Wallet without delay. The updated balance is ready to use for subsequent orders immediately.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>3. Doorstep Return Verification</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              For physical goods returns, refund credits are triggered automatically once the delivery runner completes physical doorstep collection using the secure return pickup OTP.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
              <span>4. Double-Entry Audit Ledger Guarantee</span>
            </h3>
            <p className="pl-4 text-gray-600 leading-relaxed">
              Every refund transaction generates an immutable audit record in the campus financial ledger, matching debit and credit entries with complete transaction timestamps.
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
