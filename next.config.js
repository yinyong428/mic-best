/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The src directory IS the project root
  // Turbopack is picking up workspace root due to parent lockfile
  experimental: {
    // turbo: {
    //   root: __dirname,
    // },
  },
}

module.exports = nextConfig
