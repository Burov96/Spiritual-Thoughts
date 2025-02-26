/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { 
  ignoreDuringBuilds: true
   },
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
