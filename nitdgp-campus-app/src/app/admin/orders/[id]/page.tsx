import React from 'react';
import AdminOrderDetailClient from './AdminOrderDetailClient';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function AdminOrderDetailPage() {
  return <AdminOrderDetailClient />;
}
