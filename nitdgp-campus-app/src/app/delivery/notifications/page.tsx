'use client';

import React, { useState } from 'react';
import { useDelivery, RunnerNotification } from '@/context/DeliveryContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Award,
  Package,
  CheckCheck,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function DeliveryNotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useDelivery();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const getIconForType = (type: RunnerNotification['type']) => {
    switch (type) {
      case 'bonus':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'order':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-purple-600" />;
    }
  };

  const getBgForType = (type: RunnerNotification['type']) => {
    switch (type) {
      case 'bonus':
        return 'bg-emerald-50';
      case 'order':
        return 'bg-blue-50';
      case 'alert':
        return 'bg-amber-50';
      default:
        return 'bg-purple-50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Runner Notifications & Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Real-time updates regarding order dispatches, bonus unlocks, and campus messages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllNotificationsRead}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'ALL' ? 'bg-[#4F9D2F] text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'UNREAD' ? 'bg-[#4F9D2F] text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-xs">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-5 transition flex items-start justify-between gap-4 cursor-pointer ${
                !notif.read ? 'bg-emerald-50/25 hover:bg-emerald-50/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgForType(notif.type)}`}>
                  {getIconForType(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-900">
                      {notif.title}
                    </h4>
                    {notif.orderId && (
                      <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {notif.orderId}
                      </span>
                    )}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                    {notif.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{notif.time}</span>
                  </div>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(notif.id);
                  }}
                  className="text-xs text-emerald-700 hover:underline font-bold flex-shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Requirement 34: Empty State */
        <div className="card p-12 bg-white text-center border-dashed border-2 border-gray-200 max-w-md mx-auto my-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900">
            You're all caught up.
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
            No new notifications right now. Keep an eye on incoming alerts when new orders arrive.
          </p>
        </div>
      )}
    </div>
  );
}
