'use client';

import React from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import {
  Target,
  Award,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DeliveryIncentivesPage() {
  const { todayStats } = useDelivery();

  const completed = todayStats.completedToday;
  const target = todayStats.dailyTarget;
  const percentage = Math.min(100, Math.round((completed / target) * 100));
  const remaining = Math.max(0, target - completed);

  const incentivesList = [
    {
      title: 'Peak Hour Bonus',
      subtitle: 'Hostel Night Rush (9:00 PM – 11:30 PM)',
      progress: '3 / 4 peak deliveries',
      percent: 75,
      bonus: '₹60',
      status: 'Active Now',
      icon: Flame,
      iconColor: 'text-amber-600 bg-amber-50',
      description: 'Complete 4 deliveries during late-night exam hunger hours to earn ₹60 instant bonus.',
    },
    {
      title: 'Weekend Surge Bonus',
      subtitle: 'Saturday & Sunday Campus Active Shift',
      progress: '18 / 25 deliveries',
      percent: 72,
      bonus: '₹250',
      status: 'Ends Sunday',
      icon: Zap,
      iconColor: 'text-purple-600 bg-purple-50',
      description: 'Deliver across campus on weekends to unlock high-demand cash payout.',
    },
    {
      title: 'High Demand Zone Bonus',
      subtitle: 'Hall 11, Hall 14 & MTH Cluster',
      progress: 'Completed (5 / 5)',
      percent: 100,
      bonus: '₹120',
      status: 'Claimed',
      icon: Award,
      iconColor: 'text-emerald-600 bg-emerald-50',
      description: 'Special cluster delivery incentive for remote hostels across the campus perimeter.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Runner Incentives & Milestones
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Complete daily and weekly delivery targets to unlock extra cash bonuses.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400 font-semibold">Earned Bonuses Today</div>
          <div className="text-xl font-black text-emerald-700">₹120 Unlocked</div>
        </div>
      </div>

      {/* Primary Card: Daily Target (Section 17) */}
      <div className="card p-6 sm:p-7 bg-white border-2 border-emerald-200/80 shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF6E5] text-[#36751F] flex items-center justify-center font-black">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#36751F] bg-[#EAF6E5] px-2.5 py-0.5 rounded">
                  PRIMARY DAILY TARGET
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900 mt-0.5">
                Complete {target} Deliveries Today
              </h3>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 font-semibold">Cash Bonus</div>
            <div className="text-2xl font-black text-emerald-700">₹100</div>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-700">
              Current Progress: <span className="text-[#36751F] font-black">{completed} / {target} Deliveries</span>
            </span>
            <span className="text-[#36751F] font-mono text-sm">{percentage}%</span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${percentage}%` }}
              className="h-full bg-gradient-to-r from-[#4F9D2F] to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            {remaining > 0 ? (
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                ⚡ Complete {remaining} more deliveries to claim your ₹100 bonus!
              </span>
            ) : (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target achieved! ₹100 bonus will settle in midnight payout.
              </span>
            )}

            <span className="text-gray-400">Resets daily at 11:59 PM</span>
          </div>
        </div>

        {remaining > 0 && (
          <div className="pt-2">
            <Link
              href="/delivery/deliveries"
              className="btn-primary text-xs px-5 inline-flex"
            >
              <span>Accept Next Delivery to Advance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Additional Incentives Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {incentivesList.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="card p-5 bg-white flex flex-col justify-between hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconColor}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'Claimed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="pt-3">
                  <h4 className="text-sm font-black text-gray-900">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{item.subtitle}</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">{item.progress}</span>
                  <span className="text-emerald-700 font-black">{item.bonus}</span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percent}%` }}
                    className="h-full bg-[#4F9D2F] rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
