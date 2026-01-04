/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Security headers applied via middleware
  // Skip ESLint during builds - run separately via `npm run lint`
  // This avoids the circular structure JSON error with flat config
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
