/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ujjidtmgsydwurkkdeje.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        bufferutil: false,
        'utf-8-validate': false,
        ws: false
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' 
                https://app.sandbox.midtrans.com 
                https://*.cloudfront.net 
                https://api.sandbox.midtrans.com 
                https://pay.google.com 
                https://js-agent.newrelic.com 
                https://bam.nr-data.net
                https://d2f3dnusg0rbp7.cloudfront.net;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self';
              frame-src 'self' https://app.sandbox.midtrans.com;
              connect-src 'self' 
                https://api.sandbox.midtrans.com 
                https://ujjidtmgsydwurkkdeje.supabase.co 
                https://*.supabase.co
                https://*.cloudfront.net
                wss://ujjidtmgsydwurkkdeje.supabase.co;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig 