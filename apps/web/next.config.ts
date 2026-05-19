import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @soms/shared exporta .ts direto via main: src/index.ts.
  // Next 15 não compila .ts em node_modules por padrão — transpile explicitamente.
  transpilePackages: ['@soms/shared', '@soms/design-system'],
};

export default nextConfig;
