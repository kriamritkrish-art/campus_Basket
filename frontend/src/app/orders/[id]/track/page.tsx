import React, { Suspense } from 'react';
import OrderTrackClient from './OrderTrackClient';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function OrderTrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="w-8 h-8 border-3 border-[#4F9D2F] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderTrackClient />
    </Suspense>
  );
}
