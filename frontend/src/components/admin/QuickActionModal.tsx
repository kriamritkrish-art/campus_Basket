'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  PlusCircle,
  FolderPlus,
  UserPlus,
  Shirt,
  FileSpreadsheet,
  Tag,
  Megaphone
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProductModal: () => void;
}

export function QuickActionModal({ isOpen, onClose, onOpenProductModal }: QuickActionModalProps) {
  if (!isOpen) return null;

  const actions = [
    {
      label: 'Add New Product',
      desc: 'Create food, fruit, or essential product with 4:3 Google Drive image',
      icon: PlusCircle,
      color: 'text-[#347A27] bg-[#4F9D32]/10 border-[#4F9D32]/30',
      action: () => {
        onClose();
        onOpenProductModal();
      }
    },
    {
      label: 'Add Category',
      desc: 'Register a new service or campus department category',
      icon: FolderPlus,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      href: '/admin/categories'
    },
    {
      label: 'Add Service Provider',
      desc: 'Onboard a canteen vendor, laundry operator, or delivery cell',
      icon: UserPlus,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      href: '/admin/providers'
    },
    {
      label: 'Laundry Services',
      desc: 'Manage garment rates, steam iron fees, and dual-OTP protocols',
      icon: Shirt,
      color: 'text-[#347A27] bg-[#4F9D32]/10 border-[#4F9D32]/30',
      href: '/admin/services/laundry'
    },
    {
      label: 'Generate Official Report',
      desc: 'Download publication-grade administrative PDF and financial CSV',
      icon: FileSpreadsheet,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      href: '/admin/reports'
    },
    {
      label: 'Create Promo Coupon',
      desc: 'Issue percentage or flat discount codes for student meals',
      icon: Tag,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      href: '/admin/marketing'
    },
    {
      label: 'Publish Announcement',
      desc: 'Broadcast hostel notices, hours updates, and service alerts',
      icon: Megaphone,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      href: '/admin/marketing'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#17202A] flex items-center gap-2">
              <span>Admin Quick Actions</span>
              <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2 py-0.5 rounded-full border border-[#4F9D32]/30">
                Command
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select an operation to launch instantly</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            if (act.action) {
              return (
                <button
                  key={idx}
                  onClick={act.action}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-[#4F9D32] text-left transition-all group"
                >
                  <div className={`p-2.5 rounded-xl border ${act.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17202A] group-hover:text-[#347A27] transition-colors">
                      {act.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {act.desc}
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={act.href!}
                onClick={onClose}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-[#4F9D32] text-left transition-all group"
              >
                <div className={`p-2.5 rounded-xl border ${act.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#17202A] group-hover:text-[#347A27] transition-colors">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {act.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
