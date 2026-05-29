/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Event images come from arbitrary scraped sources, so allow remote images.
    // Tighten this allowlist once you know your real source domains.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
