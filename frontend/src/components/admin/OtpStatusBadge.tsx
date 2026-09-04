'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface OtpStatusBadgeProps {
  type: 'PICKUP' | 'DELIVERY';
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
}

export function OtpStatusBadge({ type, status }: OtpStatusBadgeProps) {
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase font-bold text-slate-500">
        {type}:
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isVerified
            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
            : isPending
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}
      >
        {isVerified ? (
          <ShieldCheck className="w-3 h-3 text-[#347A27]" />
        ) : isPending ? (
          <Clock className="w-3 h-3 text-amber-700" />
        ) : (
          <ShieldAlert className="w-3 h-3 text-red-700" />
        )}
        <span>{status}</span>
      </span>
    </div>
  );
}
