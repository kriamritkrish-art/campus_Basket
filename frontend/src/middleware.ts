import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://drive.google.com https://lh3.googleusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.razorpay.com https://campus-basket-gray.vercel.app https://nit-campus-services.onrender.com https://nitdgp-campus-backend.railway.app http://localhost:5000 wss:",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
};
