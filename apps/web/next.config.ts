import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@heroui/react', '@heroui/theme'],
};

export default nextConfig;
