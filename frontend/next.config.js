/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://checkout.razorpay.com")'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'unsafe-none'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'images.unsplash.com',
      'drive.google.com',
      'lh3.googleusercontent.com'
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    let rawUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000'
    ).trim();
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('/')) {
      rawUrl = `https://${rawUrl}`;
    }
    const cleanUrl = rawUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
