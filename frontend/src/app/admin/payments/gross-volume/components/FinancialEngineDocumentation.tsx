'use client';

import React from 'react';
import {
  BookOpen,
  GitMerge,
  FileText,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

interface FinancialEngineDocumentationProps {
  docTab: 'FLOWCHARTS' | 'GLOSSARY' | 'PROTOCOLS';
  setDocTab: (tab: 'FLOWCHARTS' | 'GLOSSARY' | 'PROTOCOLS') => void;
  onClose?: () => void;
}

export default function FinancialEngineDocumentation({
  docTab,
  setDocTab,
  onClose
}: FinancialEngineDocumentationProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header & Tab Selector */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F172A] via-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black tracking-tight text-white uppercase">
                FINANCIAL ENGINE DOCUMENTATION &amp; FLOWCHARTS
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Authoritative Reference
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Interactive lifecycle flowcharts, status definitions, auto-reversal protocols, and admin recovery procedures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
            <button
              onClick={() => setDocTab('FLOWCHARTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                docTab === 'FLOWCHARTS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Visual Flowcharts</span>
            </button>
            <button
              onClick={() => setDocTab('GLOSSARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                docTab === 'GLOSSARY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Status Glossary</span>
            </button>
            <button
              onClick={() => setDocTab('PROTOCOLS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                docTab === 'PROTOCOLS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recovery Protocols</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Close Documentation Panel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 bg-slate-50/50 space-y-6">
        {/* TAB 1: VISUAL FLOWCHARTS */}
        {docTab === 'FLOWCHARTS' && (
          <div className="space-y-6">
            {/* Flowchart 1: Standard Payment Lifecycle */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-slate-900">Standard Order Payment &amp; Capture Flow</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Normal Successful Flow</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">STEP 1</span>
                  <h4 className="font-bold text-xs text-slate-900">Cart Checkout</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Order created with universal ID <code className="font-mono text-[10px] text-slate-700 font-bold">CB-ORD-...</code>. Status = <span className="font-bold text-amber-700">PENDING_PAYMENT</span>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">STEP 2</span>
                  <h4 className="font-bold text-xs text-blue-950">Razorpay Gateway</h4>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Razorpay order generated (<code className="font-mono text-[10px]">order_xxx</code>). Student selects UPI, Card, Netbanking, or COD.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">STEP 3</span>
                  <h4 className="font-bold text-xs text-indigo-950">Dual-Channel Verify</h4>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Frontend HMAC signature check <strong className="text-indigo-900">OR</strong> server webhook (<code className="font-mono text-[10px]">payment.captured</code>).
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">STEP 4</span>
                  <h4 className="font-bold text-xs text-emerald-950">Canonical Capture</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Status updated to <span className="font-bold text-emerald-900">CAPTURED</span>. Reconciliation = <span className="font-bold">NOT_REQUIRED</span>.
                  </p>
                </div>

                {/* Step 5 */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">STEP 5</span>
                  <h4 className="font-bold text-xs text-white">Order Confirmed</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Order status becomes <span className="font-bold text-emerald-400">CONFIRMED</span>. Kitchen/Store preparation initiates.
                  </p>
                </div>
              </div>
            </div>

            {/* Flowchart 2: Payment Failure, Auto-Reversal & Reconciliation Protocol */}
            <div className="bg-white p-5 rounded-xl border-2 border-amber-300 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">Payment Failure, Money Debit Discrepancy &amp; Auto-Reversal Protocol</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  CRITICAL RECOVERY ENGINE
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                This protocol answers: <strong className="text-slate-900">If student was debited by bank, but order failed to confirm due to network drops/timeouts, how does the student get their refund?</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Branch A: Failed with No Bank Debit */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>PATHWAY A: Normal Payment Failure (No Bank Debit)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4">
                    <li>
                      Student payment declined, insufficient funds, or missing account details (<span className="font-bold text-amber-800">FAILED_ACCOUNT_DETAILS</span>).
                    </li>
                    <li>
                      Payment record updated with <span className="font-mono text-slate-800 font-bold">status: FAILED</span> and gateway failure code.
                    </li>
                    <li>
                      <strong className="text-slate-900">Zero duplicate orders:</strong> The original order record (<code className="font-mono text-[10px]">CB-ORD-...</code>) is preserved.
                    </li>
                    <li>
                      Student is shown friendly message: <em>"Please check your payment details and try again."</em>
                    </li>
                    <li>
                      Student retries payment; subsequent attempt links to the <strong className="text-slate-900">SAME order ID</strong>.
                    </li>
                  </ul>
                </div>

                {/* Branch B: Money Debited but Order Not Confirmed */}
                <div className="p-4 rounded-xl bg-orange-50/70 border-2 border-orange-300 space-y-3">
                  <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>PATHWAY B: Student Debited, But Website/Webhook Timed Out</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-700">
                    <div className="p-2.5 rounded-lg bg-white border border-orange-200">
                      <span className="font-bold text-orange-900 block mb-0.5">1. Auto-Reversal at Gateway (Most Frequent)</span>
                      If Campus Basket never captured the payment, Razorpay automatically voids authorization. <strong className="text-emerald-800 font-black">100% of money is refunded directly back to the student's original UPI/bank account in 5–7 business days</strong>. Student needs zero bank forms.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-orange-200">
                      <span className="font-bold text-orange-900 block mb-0.5">2. Server Reconciliation (If Actually Captured)</span>
                      Status marked as <span className="font-bold text-orange-800">CUSTOMER_DEBIT_REVIEW</span>. Admin or cron rechecks via Razorpay API:
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                        <li><strong>If Order can be fulfilled:</strong> Auto-reconciled to <span className="font-bold text-emerald-700">CAPTURED + CONFIRMED</span>.</li>
                        <li><strong>If Order cannot be fulfilled:</strong> Admin clicks "Process Refund" → Instant Gateway Refund back to original payment source.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flowchart 3 & 4: Refund Lifecycle & Settlement Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Refund Lifecycle */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">3</span>
                  <h3 className="text-sm font-bold text-slate-900">Refund Lifecycle &amp; Deduction Rules</h3>
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Pre-Acceptance Cancellation</span>
                    Provider has not accepted order. <strong className="text-emerald-700">100% refund of paid amount</strong>. Zero non-refundable deduction.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Post-Acceptance / In-Transit Cancellation</span>
                    Delivery fee is retained by Campus Basket to compensate runner (<span className="font-mono text-rose-700 font-bold">-₹DeliveryFee</span>). Remaining order value eligible for refund.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Return Request Refund</span>
                    Product verified by provider/admin upon physical inspection. Refund distributed to original payment source.
                  </div>
                </div>
              </div>

              {/* Settlement Flow */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">4</span>
                  <h3 className="text-sm font-bold text-slate-900">Provider Settlement &amp; Platform Revenue</h3>
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Eligibility Trigger</span>
                    Order marked <span className="font-bold text-emerald-700">DELIVERED</span>. Settlement status moves from <span className="font-mono text-[10px]">PENDING</span> to <span className="font-mono text-[10px] font-bold text-indigo-700">ELIGIBLE</span>.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Platform Revenue (5% Commission)</span>
                    Campus Basket retains standard 5% commission on items subtotal. Net provider payable = Subtotal - 5% Commission.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Batch Disbursal</span>
                    Admin generates weekly/bi-weekly settlement batch and disburses via Bank UTR / Razorpay Payouts.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STATUS MASTER GLOSSARY */}
        {docTab === 'GLOSSARY' && (
          <div className="space-y-6">
            {/* Payment Statuses Table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                PAYMENT STATUSES (ORDER &amp; TRANSACTION LEDGER)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2.5">STATUS</th>
                      <th className="p-2.5">CANONICAL MEANING</th>
                      <th className="p-2.5">TRIGGER CONDITION</th>
                      <th className="p-2.5">NEXT EXPECTED ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">CAPTURED</span></td>
                      <td className="p-2.5 text-slate-700">Payment captured and finalized by gateway. Preferred standard status.</td>
                      <td className="p-2.5 text-slate-500">Successful payment verification or <code className="font-mono text-[10px]">payment.captured</code> webhook.</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Fulfill &amp; deliver order.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">AUTHORIZED</span></td>
                      <td className="p-2.5 text-slate-700">Bank authorized funds, pending final gateway capture.</td>
                      <td className="p-2.5 text-slate-500">2-step authorization enabled; waiting for server auto-capture.</td>
                      <td className="p-2.5 text-blue-700 font-bold">Await auto-capture or webhook.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">FAILED</span></td>
                      <td className="p-2.5 text-slate-700">Payment attempt unsuccessful at gateway or bank.</td>
                      <td className="p-2.5 text-slate-500">Declined, insufficient balance, timeout, or security filter.</td>
                      <td className="p-2.5 text-slate-700 font-bold">Allow student retry on SAME order.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-black border border-amber-300">FAILED_ACCOUNT_DETAILS</span></td>
                      <td className="p-2.5 text-slate-700">Payment failed because student's bank account or payment details were missing, invalid, unlinked, or rejected.</td>
                      <td className="p-2.5 text-slate-500">Razorpay error confirming invalid VPA, beneficiary bank offline, or account details missing.</td>
                      <td className="p-2.5 text-amber-800 font-bold">Prompt student to verify bank/UPI details and retry on SAME order.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">PENDING</span></td>
                      <td className="p-2.5 text-slate-700">Order placed, awaiting customer payment initiation.</td>
                      <td className="p-2.5 text-slate-500">Order initiated in checkout; Razorpay window active.</td>
                      <td className="p-2.5 text-slate-600 font-bold">Expires if unpaid within timeout.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">REFUNDED</span></td>
                      <td className="p-2.5 text-slate-700">Eligible refund amount has been distributed to customer.</td>
                      <td className="p-2.5 text-slate-500">Admin distributed refund via ledger or automated gateway refund.</td>
                      <td className="p-2.5 text-slate-500">Lifecycle complete. Recorded in ledger.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">RECONCILIATION_REQUIRED</span></td>
                      <td className="p-2.5 text-slate-700">Discrepancy detected between gateway status and platform records.</td>
                      <td className="p-2.5 text-slate-500">Potential debit review, timeout discrepancy, or amount mismatch.</td>
                      <td className="p-2.5 text-orange-800 font-bold">Admin reviews via "Recheck via Razorpay API".</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Failure Reasons Reference */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                PAYMENT FAILURE REASONS TAXONOMY
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                  <span className="text-xs font-black text-amber-900">BANK/ACCOUNT DETAILS REQUIRED</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Student entered an invalid UPI ID, unlinked bank account, or beneficiary bank was inactive. Student action required.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 space-y-1">
                  <span className="text-xs font-black text-yellow-900">INSUFFICIENT FUNDS</span>
                  <p className="text-[11px] text-yellow-800 leading-relaxed">
                    Bank declined transaction due to low balance in student account. Advise student to top up balance.
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
                  <span className="text-xs font-black text-purple-900">PAYMENT TIMEOUT</span>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Gateway or issuing bank took too long to authenticate. <strong className="text-purple-950">Verify before retrying</strong> as money might have debited.
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-1">
                  <span className="text-xs font-black text-rose-900">PAYMENT DECLINED</span>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Issuing bank rejected transaction (card limits, disabled online transactions, or OTP validation failed).
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-slate-800">PAYMENT CANCELLED</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Student closed the Razorpay payment modal before entering credentials or intentionally dismissed checkout.
                  </p>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200 space-y-1">
                  <span className="text-xs font-black text-cyan-900">NETWORK/TECHNICAL ERROR</span>
                  <p className="text-[11px] text-cyan-800 leading-relaxed">
                    Drop in client internet or socket disconnect between browser and bank authentication page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN RECOVERY PROTOCOLS */}
        {docTab === 'PROTOCOLS' && (
          <div className="space-y-6">
            {/* 7-Step SOP */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">7-Step Admin Standard Operating Procedure for Failed / Unconfirmed Payments</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700">
                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <div>
                    <strong className="text-slate-900 block">Do Not Mark As Paid Prematurely</strong>
                    Never mark an order as CAPTURED or CONFIRMED until cryptographic signature or webhook verification confirms receipt.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <div>
                    <strong className="text-slate-900 block">Zero Duplicate Orders</strong>
                    Never create a second Campus Basket order when a student retries. Every payment attempt must link to the existing <code className="font-mono text-[10px] font-bold">CB-ORD-...</code> row.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <div>
                    <strong className="text-slate-900 block">Preserve Razorpay IDs</strong>
                    Store Razorpay Order ID and Razorpay Payment ID on the Payment record even for failed attempts to maintain an audit trail.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  <div>
                    <strong className="text-slate-900 block">Store Exact Gateway Error Code</strong>
                    Never overwrite original Razorpay failure codes. Record error codes (<code className="font-mono text-[10px]">BAD_REQUEST_ERROR</code>, etc.) in the attempt transaction history.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">5</span>
                  <div>
                    <strong className="text-slate-900 block">Enable Student Retry</strong>
                    Allow student to retry with clean payment details. Ensure cart is retained on failure so students do not re-select items.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">6</span>
                  <div>
                    <strong className="text-slate-900 block">Check for Existing Capture Before Retry</strong>
                    If customer reports money was deducted, click <strong className="text-indigo-700">"Recheck via Razorpay API"</strong> in the drawer before asking them to pay again.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-emerald-50 rounded-xl border border-emerald-300 md:col-span-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">7</span>
                  <div>
                    <strong className="text-emerald-950 block">Update Existing Order on Later Confirmation</strong>
                    If Razorpay webhook delivers a delayed capture event, update the <strong className="text-emerald-900">SAME existing order</strong> to <code className="font-mono font-bold">CAPTURED</code>. Never create a separate order row.
                  </div>
                </div>
              </div>
            </div>

            {/* Separation of Concerns Policy */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Info className="w-4 h-4 text-blue-600" />
                <span>CRITICAL RULE: NEVER CONFUSE PAYMENT FAILURE WITH REFUND ACCOUNT DETAILS</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                <strong>Payment Account Failure</strong> refers strictly to an initiation error where required bank or payment details were invalid, unlinked, or rejected during checkout.
              </p>
              <p className="text-blue-800 leading-relaxed">
                <strong>Refund Account Details</strong> refers to beneficiary details required only when an offline/manual disbursal is needed. For all normal Razorpay online payments, refunds are routed <strong className="underline">directly back to the original source payment method</strong> (UPI ID or issuing bank card) via Razorpay's Refund API. Do not demand student bank account details for standard online refunds.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
