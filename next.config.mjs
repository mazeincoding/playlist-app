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
};

export default nextConfig;
