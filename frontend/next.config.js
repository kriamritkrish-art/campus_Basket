/** @type {import('next').NextConfig} */
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
