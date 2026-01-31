// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Redirect legacy /pay/ links to /payment/
      {
        source: "/pay/:id",
        destination: "/payment/:id",
        permanent: true,
      },
      // Redirect with query params
      {
        source: "/pay/:id/:rest*",
        destination: "/payment/:id/:rest*",
        permanent: true,
      },
    ];
  },
  // Tambahkan jika belum ada
  images: {
    domains: [],
  },
  // Untuk disable strict mode jika perlu
  reactStrictMode: false,
};

export default nextConfig;
