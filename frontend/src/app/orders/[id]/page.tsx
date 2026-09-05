'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderPageRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/orders/${params.id}/track`);
    }
  }, [params, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8 bg-[#f8fafc]">
      <div className="w-10 h-10 border-4 border-[#689f38] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
