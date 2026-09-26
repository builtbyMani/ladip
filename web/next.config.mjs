const rawBackend = (process.env.BACKEND_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
const BACKEND_URL = rawBackend.replace(/\/api(\/v1)?$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/docs",
        destination: `${BACKEND_URL}/docs`,
      },
      {
        source: "/openapi.json",
        destination: `${BACKEND_URL}/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
