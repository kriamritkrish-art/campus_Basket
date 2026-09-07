import React from 'react';

export const metadata = {
  title: 'Terms of Service — Campus Basket Services',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Platform Terms of Service</h1>
      <p className="text-slate-400">Rules of Operation for Campus Basket Residents &bull; Unified Commerce Standard</p>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">1. Verified Account Ownership</h3>
        <p>
          Registration requires an authorized student or campus institutional email account. Users are accountable for all orders placed under their authenticated profile.
        </p>

        <h3 className="text-base font-bold text-white pt-2">2. Cash on Delivery (COD) Compliance</h3>
        <p>
          Students selecting Cash on Delivery agree to provide exact or reasonable cash change to the delivery runner at their room door. Repeated refusal to accept confirmed COD orders results in administrative deactivation of COD privileges.
        </p>

        <h3 className="text-base font-bold text-white pt-2">3. Laundry Verification Dual-OTP Protocol</h3>
        <p>
          Students must maintain possession of their distinct Pickup and Delivery OTPs and release them only upon physical verification of the provider. Handing over OTP without inspection waives damage claims.
        </p>
      </div>
    </div>
  );
}
