import type { NextConfig } from "next";

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : null,
    "https://js.stripe.com",
    "https://vercel.live",
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://q.stripe.com",
    "https://nominatim.openstreetmap.org",
    "https://timeapi.io",
    "https://vercel.live",
    "wss://vercel.live",
    isDev ? "http://127.0.0.1:5000 ws: wss:" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isDev ? null : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: securityHeaders,
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/auth", destination: "/login", permanent: false },
      { source: "/index", destination: "/", permanent: false },
      { source: "/profile", destination: "/perfil", permanent: false },
      { source: "/planner", destination: "/calendario", permanent: false },
      { source: "/comprar-creditos", destination: "/precos", permanent: false },
      { source: "/planos", destination: "/precos", permanent: false },
      { source: "/agendar-mentoria", destination: "/precos", permanent: false },
      { source: "/agendar-atendimento", destination: "/precos", permanent: false },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return {};
    }

    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:5000/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
