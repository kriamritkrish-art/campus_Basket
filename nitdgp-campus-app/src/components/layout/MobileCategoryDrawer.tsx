'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  ChevronRight,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  {
    id: 'food',
    name: 'Food & Meals',
    desc: 'Hot biryani, snacks, thalis & beverages',
    href: '/food',
    badge: '10-15 Min Delivery',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Utensils,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    items: ['Kolkata Chicken Biryani', 'Hostel Night Snacks', 'Student Thali & Rotis', 'South Indian Dosa']
  },
  {
    id: 'fruits',
    name: 'Fresh Farm Fruits',
    desc: 'Orchard-fresh apples, bananas & oranges',
    href: '/fruits',
    badge: 'Farm Fresh',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Apple,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    items: ['Kashmiri Red Apples', 'Robusta Ripe Bananas', 'Nagpur Sweet Oranges', 'Fresh Fruit Bowls']
  },
  {
    id: 'laundry',
    name: 'Express Laundry',
    desc: 'Doorstep room pickup with Dual-OTP security',
    href: '/laundry',
    badge: 'Dual OTP Secured',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: Shirt,
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    items: ['Daily Wash & Steam Iron', '12-Hour Urgent Express Wash', 'Heavy Winter Blankets', 'Book Doorstep Pickup']
  },
  {
    id: 'essentials',
    name: 'Stationery & Essentials',
    desc: 'Casio calculators, lab sheets & notes',
    href: '/essentials',
    badge: 'Exam Ready',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: BookOpen,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    items: ['Casio fx-991EX Calculators', 'Classmate Exercise Notebooks', 'Engineering Drafters', 'Gel Pens & Graph Sheets']
  }
];

export function MobileCategoryDrawer({ isOpen, onClose }: MobileCategoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Sheet Content */}
      <div className="relative bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle & Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#689f38] text-white flex items-center justify-center font-black text-xs shadow-sm">
              bb
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 leading-tight">
                Shop by Campus Category
              </h2>
              <p className="text-[11px] text-gray-500">
                Delivering to all NIT Durgapur Halls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-gray-100">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="pt-3 first:pt-0">
                <Link
                  href={cat.href}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-[#f1f8e9] transition-colors border border-gray-200 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs ${cat.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-sm group-hover:text-[#2e7d32] transition-colors">
                          {cat.name}
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                          {cat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#689f38] transition-colors" />
                </Link>

                {/* Sub-item quick chips */}
                <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                  {cat.items.map((subItem) => (
                    <Link
                      key={subItem}
                      href={cat.href}
                      onClick={onClose}
                      className="text-[10.5px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1 hover:border-[#689f38] hover:text-[#2e7d32] transition-colors shadow-2xs"
                    >
                      {subItem}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Average room delivery time: <strong>10–15 mins</strong></span>
        </div>
      </div>
    </div>
  );
}
