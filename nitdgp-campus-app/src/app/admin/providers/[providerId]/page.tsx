import React from 'react';
import ProviderDetailClient from './ProviderDetailClient';

export function generateStaticParams() {
  return [{ providerId: 'default' }];
}

export default function ProviderDetailsPage() {
  return <ProviderDetailClient />;
}
