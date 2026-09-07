'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, ShieldCheck, Heart, Zap } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Hide User Footer on Admin, Provider, and Delivery Portals
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 text-gray-600 text-xs mt-auto w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Institutional Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center font-extrabold text-white text-xs shadow-xs">
                cb
              </div>
              <div>
                <div className="font-extrabold text-[#172033] text-base leading-none">
                  campus<span className="text-[#4F9D2F]">basket</span>
                </div>
                <div className="text-[9.5px] font-semibold text-gray-400 uppercase mt-0.5">
                  A NIT Durgapur Campus Marketplace
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              National Institute of Technology Durgapur&apos;s dedicated student marketplace. Fast campus delivery across all residence halls in 10–15 minutes.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#36751F] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#4F9D2F]" /> Verified NIT Durgapur Campus Platform
            </div>
          </div>

          {/* Col 2: Campus Services */}
          <div>
            <h4 className="text-gray-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              Campus Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/food" className="hover:text-[#689f38] transition-colors">
                  Food &amp; Cafeteria Delivery
                </Link>
              </li>
              <li>
                <Link href="/fruits" className="hover:text-[#689f38] transition-colors">
                  Fresh Farm Fruits
                </Link>
              </li>
              <li>
                <Link href="/laundry" className="hover:text-[#689f38] transition-colors">
                  Dual-OTP Express Laundry
                </Link>
              </li>
              <li>
                <Link href="/essentials" className="hover:text-[#689f38] transition-colors">
                  Calculators, Stationery &amp; Notebooks
                </Link>
              </li>
              <li>
                <Link href="/laundry/book" className="text-[#689f38] font-bold hover:underline transition-colors">
                  Book Doorstep Laundry
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies & Help */}
          <div>
            <h4 className="text-gray-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              Help &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-[#689f38] transition-colors">
                  About Campus Marketplace
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#689f38] transition-colors">
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#689f38] transition-colors">
                  Student Helpdesk &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#689f38] transition-colors">
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#689f38] transition-colors">
                  Privacy Policy &amp; Student Data Protection
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#689f38] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Helpdesk Contact */}
          <div>
            <h4 className="text-gray-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              Campus Helpdesk
            </h4>
            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#689f38] mt-0.5 shrink-0" />
                <span>
                  Student Activity Centre (SAC), NIT Durgapur, Mahatma Gandhi Avenue, Durgapur, WB 713209
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#689f38] shrink-0" />
                <span>+91 343 275 4000 / Ext: 2244</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#689f38] shrink-0" />
                <span>services@nitdgp.ac.in</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
              Delivering to: Hall 1 to 14, Mother Teresa Hall, Sister Nivedita Hall, Gargi Hall.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>&copy; {new Date().getFullYear()} NIT Durgapur Campus Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Designed for the <strong className="text-gray-800">NIT Durgapur Student Community</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
