'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CampusBanner } from './CampusBanner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingCartButton } from '../cart/FloatingCartButton';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileCategoryDrawer } from './MobileCategoryDrawer';
import { MobileCartBar } from '../cart/MobileCartBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  const isPortalRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery');

  if (isPortalRoute) {
    // Pure Enterprise Portal Shell: no student banner, no consumer navbar, no student footer, no consumer cart widgets
    return <div className="min-h-screen w-full">{children}</div>;
  }

  const isCheckoutRoute = pathname === '/checkout';
  if (isCheckoutRoute) {
    // Dedicated distraction-free checkout experience (Amazon/Flipkart style)
    return <div className="min-h-screen bg-[#F7F8FA]">{children}</div>;
  }

  return (
    <>
      <CampusBanner />
      <Navbar />
      <main className="flex-1 pb-28 md:pb-16 w-full max-w-full overflow-x-hidden min-w-0">{children}</main>
      <Footer />
      <CartDrawer />
      {/* Desktop floating cart in bottom right */}
      <div className="hidden md:block">
        <FloatingCartButton />
      </div>
      {/* Mobile-only quick-commerce bottom cart pill & bottom nav bar */}
      <MobileCartBar />
      <MobileBottomNav onOpenCategories={() => setIsCategoryDrawerOpen(true)} />
      <MobileCategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
      />
    </>
  );
}
