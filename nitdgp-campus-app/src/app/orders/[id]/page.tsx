import React from 'react';
import OrderRedirectClient from './OrderRedirectClient';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function OrderPageRedirect() {
  return <OrderRedirectClient />;
}
