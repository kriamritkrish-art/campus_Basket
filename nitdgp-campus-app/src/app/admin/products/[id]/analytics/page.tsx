import React from 'react';
import ProductAnalyticsClient from './ProductAnalyticsClient';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function ProductAnalyticsPage() {
  return <ProductAnalyticsClient />;
}
