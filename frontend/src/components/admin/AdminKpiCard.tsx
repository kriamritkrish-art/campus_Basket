'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  subtitle?: string;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  onClick?: () => void;
}

export function AdminKpiCard({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  color = 'green',
  onClick
}: AdminKpiCardProps) {
  const iconColorMap = {
    green: 'text-[#347A27] bg-[#4F9D32]/10 border-[#4F9D32]/20',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  };

  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      onClick={onClick}
      className={`group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border transition-colors ${iconColorMap[color] || iconColorMap.green}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl lg:text-3xl font-black text-[#17202A] tracking-tight">
          {value}
        </div>

        {change !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-[#347A27] border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {change}%
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
}
