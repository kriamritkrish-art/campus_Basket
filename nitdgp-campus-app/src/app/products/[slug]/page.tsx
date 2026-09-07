import React from 'react';
import ProductDetailClient from './ProductDetailClient';

export function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
