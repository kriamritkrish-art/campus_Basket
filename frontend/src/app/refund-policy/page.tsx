import React from 'react';

export const metadata = {
  title: 'Refund & Cancellation Policy — Campus Basket Services',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Refund &amp; Cancellation Policy</h1>
      <p className="text-slate-400">Campus Basket Central Platform Commerce Policy</p>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">1. Service-Adaptive Order Cancellations</h3>
        <p>
          Students may cancel product orders according to service-specific rules:
          <br />• <strong>Food Orders:</strong> Cancellations permitted prior to kitchen preparation (<strong>PREPARING</strong>).
          <br />• <strong>Laundry Orders:</strong> Cancellations permitted prior to runner pickup and weighing (<strong>CLOTHES_COLLECTED</strong>).
          <br />• <strong>Produce &amp; Stationery:</strong> Cancellations permitted prior to runner dispatch (<strong>OUT_FOR_DELIVERY</strong>).
        </p>

        <h3 className="text-base font-bold text-white pt-2">2. Online Payment Refunds &amp; Double-Entry Ledger</h3>
        <p>
          If an order is cancelled within the permitted window or if an item is confirmed out of stock, refunds are processed transparently via the institutional finance gateway to the student's confidential refund account or original payment source. Every refund is immutably recorded in the platform financial ledger.
        </p>

        <h3 className="text-base font-bold text-white pt-2">3. Laundry Accountability &amp; Claims</h3>
        <p>
          In the rare event of damaged garments reported during delivery handover (before submitting the Delivery OTP), student claims are investigated by the Campus Laundry Cell. Verified claims are compensated directly under standard student welfare guidelines.
        </p>
      </div>
    </div>
  );
}
