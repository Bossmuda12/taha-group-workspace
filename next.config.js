/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: { serverActions: { bodySizeLimit: '10mb' } },
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: false },
};
module.exports = nextConfig;
