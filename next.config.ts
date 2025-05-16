/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',       
        pathname: '/**', 
      },
      {
        protocol: 'http',
        hostname: '**', 
        port: '',      
        pathname: '/**', 
      },
    ],
  },
};

module.exports = nextConfig;
