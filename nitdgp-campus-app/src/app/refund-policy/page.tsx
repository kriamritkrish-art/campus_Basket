import React from 'react';

export const metadata = {
  title: 'Refund & Cancellation Policy — NIT Durgapur Campus Services',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Refund &amp; Cancellation Policy</h1>
      <p className="text-slate-400">Effective Date: September 2026 &bull; NIT Durgapur Campus Services</p>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">1. Order Cancellations</h3>
        <p>
          Students may cancel product orders free of charge prior to the order entering the <strong>PREPARING</strong> or <strong>OUT_FOR_DELIVERY</strong> stage. Once food preparation or packing has begun, orders cannot be cancelled to minimize hostel waste.
        </p>

        <h3 className="text-base font-bold text-white pt-2">2. Online Payment Refunds</h3>
        <p>
          If an order is cancelled within the permitted window or if an item is confirmed out of stock, refunds for payments made via Razorpay (UPI, debit/credit cards, net banking) are initiated immediately to the original payment source. Funds typically reflect within 2 to 4 business days.
        </p>

        <h3 className="text-base font-bold text-white pt-2">3. Laundry Accountability &amp; Claims</h3>
        <p>
          In the rare event of damaged garments reported during delivery handover (before submitting the Delivery OTP), student claims will be investigated by the Campus Laundry Cell. Verified claims are compensated according to the NIT Durgapur Student Welfare Board guidelines.
        </p>
      </div>
    </div>
  );
}
