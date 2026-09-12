'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CampusBanner } from './CampusBanner';
import { Navbar } from './Navbar';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingCartButton } from '../cart/FloatingCartButton';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileCategoryDrawer } from './MobileCategoryDrawer';
import { MobileCartBar } from '../cart/MobileCartBar';
import { VoiceAssistantWidget } from '../ai/VoiceAssistantWidget';

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

  const isDedicatedServiceRoute =
    pathname?.startsWith('/laundry') ||
    pathname === '/checkout';

  if (isDedicatedServiceRoute) {
    // Dedicated standalone service & checkout flows (zero marketplace clutter, no cart ₹139, no floating basket, no marketplace footer)
    return (
      <div className="min-h-screen bg-[#f8f9fa] w-full">
        {children}
        <VoiceAssistantWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      <CampusBanner />
      <Navbar />
      <main className="flex-1 pb-28 md:pb-16 w-full max-w-full overflow-x-hidden min-w-0">{children}</main>
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
      <VoiceAssistantWidget />
    </div>
  );
}
