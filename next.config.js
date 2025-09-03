// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'https://server-test-flufbkg33-icecubesaads-projects.vercel.app/',
  },
}
 
module.exports = nextConfig