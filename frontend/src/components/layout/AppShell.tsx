'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CampusBanner } from './CampusBanner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingCartButton } from '../cart/FloatingCartButton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Pure Enterprise Admin Portal Shell: no student banner, no user navbar, no student footer, no consumer cart widgets
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <>
      <CampusBanner />
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
      <CartDrawer />
      <FloatingCartButton />
    </>
  );
}
