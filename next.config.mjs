import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', '@aws-sdk/client-s3']
  },
  async headers() {
    return [
      {
        // Public media uploads
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }]
      },
      {
        source: '/portfolio/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }]
      },
      {
        source: '/templates/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }]
      },
      {
        // Admin API — never cache
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }]
      },
      {
        // Public API — short cache, SWR
        source: '/api/store/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }]
      },
      {
        // Public pages — ISR handles freshness server-side; CDN can serve stale briefly
        source: '/((?!api|admin|_next).*)',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' }]
      }
    ];
  }
};

export default withBundleAnalyzer(nextConfig);
