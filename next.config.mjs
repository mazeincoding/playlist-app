import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lqmghkcavdepgbnoinrf.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/covers/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const config = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default config;
