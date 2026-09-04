'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=provider&redirect=/provider/dashboard');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Opening Service Provider Console...</p>
      </div>
    </div>
  );
}
