/** @type {import('next').NextConfig} */
const ffmpeg = ["./node_modules/ffmpeg-static/ffmpeg"];
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Le binaire ffmpeg (montage des réels Instagram) doit être embarqué dans ces fonctions.
    serverComponentsExternalPackages: ["ffmpeg-static"],
    outputFileTracingIncludes: { "/api/cron/instagram": ffmpeg, "/api/admin/instagram": ffmpeg },
  },
};
export default nextConfig;
