import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'https://probable-orbit-x7pjjw5449jh95x-3000.app.github.dev/'
      ],
    },
  },
};

export default nextConfig;
