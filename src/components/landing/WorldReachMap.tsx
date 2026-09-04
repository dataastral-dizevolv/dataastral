"use client";

import { motion } from "framer-motion";

// Cidades atendidas (lng, lat)
const CITIES: { name: string; lng: number; lat: number }[] = [
  // América do Norte
  { name: "Vancouver", lng: -123.12, lat: 49.28 },
  { name: "Seattle", lng: -122.33, lat: 47.61 },
  { name: "Portland", lng: -122.68, lat: 45.52 },
  { name: "Toronto", lng: -79.38, lat: 43.65 },
  { name: "Chicago", lng: -87.63, lat: 41.88 },
  { name: "Nova York", lng: -74.0, lat: 40.71 },
  { name: "Washington DC", lng: -77.04, lat: 38.91 },
  { name: "São Francisco", lng: -122.42, lat: 37.77 },
  { name: "Santa Fe", lng: -105.94, lat: 35.69 },
  { name: "Aspen", lng: -106.82, lat: 39.19 },
  { name: "Miami", lng: -80.19, lat: 25.76 },
  { name: "Hawaii", lng: -157.86, lat: 21.31 },
  // América Central / Caribe
  { name: "Costa Rica", lng: -84.09, lat: 9.93 },
  { name: "Bahamas", lng: -77.34, lat: 25.05 },
  // América do Sul
  { name: "Bogotá, Colômbia", lng: -74.08, lat: 4.71 },
  { name: "Cartagena, Colômbia", lng: -75.55, lat: 10.42 },
  { name: "Bolívia", lng: -68.15, lat: -16.5 },
  { name: "Manaus", lng: -60.02, lat: -3.12 },
  { name: "Belém", lng: -48.5, lat: -1.46 },
  { name: "Rio Branco", lng: -67.81, lat: -9.97 },
  { name: "Recife", lng: -34.88, lat: -8.05 },
  { name: "Natal", lng: -35.21, lat: -5.79 },
  { name: "Maceió", lng: -35.74, lat: -9.65 },
  { name: "Salvador", lng: -38.51, lat: -12.97 },
  { name: "Feira de Santana", lng: -38.97, lat: -12.27 },
  { name: "Arraial da Ajuda", lng: -39.07, lat: -16.49 },
  { name: "Cuiabá", lng: -56.1, lat: -15.6 },
  { name: "Brasília", lng: -47.93, lat: -15.78 },
  { name: "Uberlândia", lng: -48.28, lat: -18.92 },
  { name: "Belo Horizonte", lng: -43.94, lat: -19.92 },
  { name: "Vitória", lng: -40.34, lat: -20.32 },
  { name: "Ribeirão Preto", lng: -47.81, lat: -21.18 },
  { name: "Araras", lng: -47.38, lat: -22.36 },
  { name: "São Paulo", lng: -46.63, lat: -23.55 },
  { name: "Rio de Janeiro", lng: -43.17, lat: -22.91 },
  { name: "Curitiba", lng: -49.27, lat: -25.43 },
  { name: "Florianópolis", lng: -48.55, lat: -27.6 },
  { name: "Bento Gonçalves", lng: -51.52, lat: -29.17 },
  { name: "Porto Alegre", lng: -51.23, lat: -30.03 },
  { name: "Buenos Aires", lng: -58.38, lat: -34.61 },
  { name: "Punta del Este", lng: -54.95, lat: -34.96 },
  // Europa
  { name: "Ilha da Madeira", lng: -16.92, lat: 32.76 },
  { name: "Lisboa", lng: -9.14, lat: 38.72 },
  { name: "Coimbra", lng: -8.42, lat: 40.21 },
  { name: "Madrid", lng: -3.7, lat: 40.42 },
  { name: "Barcelona", lng: 2.17, lat: 41.39 },
  { name: "Málaga", lng: -4.42, lat: 36.72 },
  { name: "Paris", lng: 2.35, lat: 48.86 },
  { name: "Bruxelas", lng: 4.35, lat: 50.85 },
  { name: "Londres", lng: -0.13, lat: 51.51 },
  { name: "Genebra", lng: 6.14, lat: 46.2 },
  { name: "Berlim", lng: 13.4, lat: 52.52 },
  { name: "Dinamarca", lng: 12.57, lat: 55.68 },
  { name: "Reykjavík", lng: -21.83, lat: 64.13 },
  { name: "Finlândia", lng: 24.94, lat: 60.17 },
  // África
  { name: "Egito", lng: 31.24, lat: 30.04 },
  { name: "Cidade do Cabo, África do Sul", lng: 18.42, lat: -33.92 },
  // Ásia / Oceania
  { name: "Dubai", lng: 55.27, lat: 25.2 },
  { name: "Índia", lng: 77.21, lat: 28.61 },
  { name: "Tóquio, Japão", lng: 139.69, lat: 35.69 },
  { name: "Sydney", lng: 151.21, lat: -33.87 },
  { name: "Melbourne", lng: 144.96, lat: -37.81 },
  { name: "Auckland, Nova Zelândia", lng: 174.78, lat: -36.85 },
  { name: "Wellington, Nova Zelândia", lng: 174.78, lat: -41.29 },
];

// Equirectangular: viewBox 360x180
const project = (lng: number, lat: number) => ({
  x: lng + 180,
  y: 90 - lat,
});



const WorldReachMap = () => {
    return (
    <section className="bg-background py-16 md:py-24 lg:py-48" style={{ fontFamily: "var(--font-ubuntu-fallback), Inter, system-ui, sans-serif" }}>
      <div className="px-4 sm:px-6 lg:px-20 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 lg:mb-24 mt-8"
        >
          <p className="text-[11px] md:text-[12px] uppercase tracking-[0.15em] mb-4 md:mb-6 text-foreground/70">
            Alcance
          </p>
          <h2 className="section-title-energias text-foreground">Atendimentos realizados</h2>
        </motion.div>
      </div>

      <div className="px-3 sm:px-6 lg:px-20 max-w-[1400px] mx-auto">
        <div className="bg-rich-black rounded-[1.25rem] sm:rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-foreground/10">
          <div
            className="relative w-full"
            style={{ aspectRatio: "360 / 180" }}
          >
            <img
              src="/world-map.svg"
              alt="Mapa-múndi com cidades atendidas"
              className="absolute inset-0 w-full h-full select-none pointer-events-none"
            />

            <motion.svg
              viewBox="0 0 360 180"
              className="absolute inset-0 w-full h-full overflow-visible z-10"
              aria-hidden
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <defs>
                <filter id="city-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Cidades reais atendidas — marcadores sobre o mapa */}
              {CITIES.map((c) => {
                const { x, y } = project(c.lng, c.lat);
                return (
                  <g key={c.name} filter="url(#city-glow)">
                    <circle
                      cx={x}
                      cy={y}
                      r={2.2}
                      fill="hsl(var(--white))"
                      fillOpacity={0.35}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={1.1}
                      fill="hsl(var(--white))"
                      fillOpacity={1}
                    />
                  </g>
                );
              })}
            </motion.svg>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-20 max-w-[1400px] mx-auto">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-foreground/60 mt-4 md:mt-6 lg:mt-8">
          {CITIES.length}+ cidades em 4 continentes
        </p>
      </div>

    </section>
  );
};

export default WorldReachMap;
