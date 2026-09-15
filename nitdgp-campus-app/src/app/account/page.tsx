'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Order } from '../../types';
import { AccountProfileView } from '../../components/profile/AccountProfileView';

function AccountPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
      return;
    }

    if (isAuthenticated) {
      // Load user orders for Fayda meter
      apiRequest('/api/orders')
        .then((res) => {
          if (res.success && Array.isArray(res.orders)) {
            setOrders(res.orders);
          } else if (Array.isArray(res.data)) {
            setOrders(res.data);
          }
        })
        .catch(() => {});

      // Load wallet balance
      apiRequest('/api/wallet')
        .then((res) => {
          if (res.success && res.wallet) {
            setWalletBalance(res.wallet.balance);
          } else if (res.balance !== undefined) {
            setWalletBalance(res.balance);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8 bg-[#fbfbfb]">
        <div className="w-10 h-10 border-4 border-[#0078AD] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] py-0 sm:py-6 px-0 sm:px-4">
      <div className="max-w-lg mx-auto bg-white sm:rounded-3xl sm:border sm:border-gray-200/80 sm:shadow-sm overflow-hidden">
        <AccountProfileView
          orders={orders}
          walletBalance={walletBalance}
          onBack={() => router.push('/')}
          onNavigateTab={(tab) => router.push(`/dashboard?tab=${tab}`)}
        />
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-8 bg-[#fbfbfb]">
          <div className="w-10 h-10 border-4 border-[#0078AD] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
