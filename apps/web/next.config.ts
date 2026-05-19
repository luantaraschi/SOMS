import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @soms/shared exporta .ts direto via main: src/index.ts.
  // Next 15 não compila .ts em node_modules por padrão — transpile explicitamente.
  transpilePackages: ['@soms/shared', '@soms/design-system'],

  webpack: (config) => {
    // verbatimModuleSyntax exige .js nas imports do source TS de @soms/shared.
    // Webpack default não mapeia .js → .ts em runtime resolution. Adiciona
    // extensionAlias pra resolver corretamente.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
