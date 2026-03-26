/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/splittr",
        destination: "https://expense-splitter-omega.vercel.app/splittr",
      },
      {
        source: "/splittr/:path*",
        destination: "https://expense-splitter-omega.vercel.app/splittr/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
