import React from 'react';

export const metadata = {
  title: 'Privacy Policy — Campus Basket Services',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Data Privacy &amp; Protection</h1>
      <p className="text-slate-400">Campus Basket Marketplace Security Standards</p>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">1. Strict Protection of Student Identity Data</h3>
        <p>
          In accordance with institutional digital governance policies, student private information—including mobile number, roll number, registration number, and room number—is never exposed publicly or shared with unauthorized third parties.
        </p>

        <h3 className="text-base font-bold text-white pt-2">2. Service Provider Data Access Restriction</h3>
        <p>
          Service vendors and delivery runners receive only the minimal dispatch information necessary to fulfill delivery to the student's room (student name, hostel name, room number, and order items). Vendors cannot browse the student database or access confidential administrative records.
        </p>

        <h3 className="text-base font-bold text-white pt-2">3. Geolocation Data</h3>
        <p>
          Browser geolocation coordinates are collected exclusively to verify that the student is located within the verified campus perimeter at the time of checkout. We do not track student movement or retain real-time GPS paths.
        </p>
      </div>
    </div>
  );
}
