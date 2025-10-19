// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ||'http://localhost:5001'
  },
}
 
module.exports = nextConfig