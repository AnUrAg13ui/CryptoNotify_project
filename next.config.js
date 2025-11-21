/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',     // for Google
      'avatars.githubusercontent.com', // for GitHub
      'platform-lookaside.fbsbx.com', // for Facebook
      "coin-images.coingecko.com"
    ],
  },
};

module.exports = nextConfig;