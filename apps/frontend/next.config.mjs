import path from 'node:path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    // テスト/E2E用途: 重いJupyter UI依存をスタブに差し替え
    config.resolve.alias['@datalayer/jupyter-ui'] = path.resolve(__dirname, './src/test/__mocks__/jupyter-ui.ts');
    return config;
  },
};

export default nextConfig;
