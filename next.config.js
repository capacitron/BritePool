/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*.replit.dev', '*.worf.replit.dev', '*.repl.co'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'all' }],
      },
    ]
  },
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
  // Transpile lucide-react to fix webpack module interop in Next.js 15
  transpilePackages: ['lucide-react', 'zod', 'react-markdown'],
  // Security headers applied via middleware
  // Skip ESLint during builds - run separately via `npm run lint`
  // This avoids the circular structure JSON error with flat config
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
