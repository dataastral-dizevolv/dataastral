import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
