/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
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
};

module.exports = nextConfig;
