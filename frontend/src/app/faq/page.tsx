import React from 'react';

export const metadata = {
  title: 'Campus Services FAQ — NIT Durgapur',
  description: 'Frequently asked questions about ordering meals, booking laundry, delivery fees, and dual-OTP verification.',
};

export default function FaqPage() {
  const faqs = [
    {
      q: 'Who can place orders on this platform?',
      a: 'Only students and residents with a verified @nitdgp.ac.in college email address can place orders. Outside domains (Gmail, Yahoo, Outlook) are strictly blocked.'
    },
    {
      q: 'How does the Dual-OTP Laundry system work?',
      a: 'When you book laundry, you are assigned two distinct OTPs. When the vendor arrives at your hostel door, you provide the Pickup OTP. Once your clothes are washed, ironed, and returned to your room, you provide the Delivery OTP. The pickup code cannot be used to verify delivery.'
    },
    {
      q: 'What are the delivery fees for hostel rooms?',
      a: 'We offer flat ₹15 delivery across all 14 residence halls. All orders above ₹250 qualify for 100% FREE room delivery.'
    },
    {
      q: 'Is Cash on Delivery (COD) supported?',
      a: 'Yes, Cash on Delivery is supported for orders up to ₹1,500 across food, fruits, and stationery. You can also pay seamlessly online via Razorpay (UPI, Google Pay, Cards).'
    },
    {
      q: 'Can I order when I am outside the NIT Durgapur campus?',
      a: 'You can browse products from anywhere, but placing an order requires being within the active NIT Durgapur campus service area as verified by your browser GPS.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Help &amp; Answers</span>
        <h1 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">{faq.q}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
