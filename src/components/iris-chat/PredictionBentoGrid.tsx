"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Calendar as CalendarIcon,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

/**
 * Bento de resposta — card principal com cards internos 1:1.
 * Dados ilustrativos (seed PRNG) quando não há API de chart real.
 * Identidade visual alinhada às bolhas do chat.
 */

const PLANETS = [
  { sym: "☉", name: "Sol" },
  { sym: "☽", name: "Lua" },
  { sym: "☿", name: "Mer" },
  { sym: "♀", name: "Vên" },
  { sym: "♂", name: "Mar" },
  { sym: "♃", name: "Júp" },
  { sym: "♄", name: "Sat" },
  { sym: "♅", name: "Ura" },
  { sym: "♆", name: "Net" },
  { sym: "♇", name: "Plu" },
];

const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

type PanelKey = "bar" | "line" | "planner" | "activity";

interface MiniCardItem {
  key: PanelKey;
  icon: ReactNode;
  label: string;
  eyebrow: string;
}

const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 10000) / 10000;
  };
};

interface ActivityDataPoint {
  day: string;
  value: number;
}

interface Props {
  seed: string;
  upcomingDates: { date: string; label: string; polarity: "pos" | "neg" }[];
  activityData?: ActivityDataPoint[];
  activityTotal?: string;
  activityTrend?: string;
}

const POS_BAR = "linear-gradient(180deg, hsl(210 55% 78%) 0%, hsl(215 38% 62%) 100%)";
const NEG_BAR = "linear-gradient(180deg, hsl(18 50% 78%) 0%, hsl(22 45% 60%) 100%)";

export function PredictionBentoGrid({
  seed,
  upcomingDates,
  activityData = [
    { day: "D", value: 6 },
    { day: "S", value: 9 },
    { day: "T", value: 11 },
    { day: "Q", value: 4 },
    { day: "Q", value: 8 },
    { day: "S", value: 13 },
    { day: "S", value: 3 },
  ],
  activityTotal = "42h",
  activityTrend = "+12% vs. semana anterior",
}: Props) {
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const rand = useMemo(() => seeded(seed || "iris"), [seed]);

  const planetData = useMemo(
    () =>
      PLANETS.map((p) => {
        const v = rand() * 2 - 1;
        return { ...p, value: parseFloat(v.toFixed(2)) };
      }),
    [rand],
  );

  const linearPoints = useMemo(() => {
    const n = 30;
    let v = 0;
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      v = v * 0.55 + (rand() * 2 - 1) * 0.45;
      pts.push(Math.max(-1, Math.min(1, v)));
    }
    return pts;
  }, [rand]);

  const moonSign = SIGNS[Math.floor(rand() * 12)];

  const miniCards: MiniCardItem[] = [
    {
      key: "bar",
      icon: <BarChart3 className="size-7" strokeWidth={1.5} />,
      label: "Planetas",
      eyebrow: "Aspectos",
    },
    {
      key: "line",
      icon: <LineChart className="size-7" strokeWidth={1.5} />,
      label: "Fases",
      eyebrow: "30 dias",
    },
    {
      key: "planner",
      icon: <CalendarIcon className="size-7" strokeWidth={1.5} />,
      label: "Janelas",
      eyebrow: "Planner",
    },
    {
      key: "activity",
      icon: <Activity className="size-7" strokeWidth={1.5} />,
      label: "Semana",
      eyebrow: "Intensidade",
    },
  ];

  return (
    <BentoCard className="p-6 sm:p-8">
      <AnimatePresence mode="wait">
        {activePanel === null ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6">
              <p className="text-[9px] font-semibold tracking-[0.22em] text-iris uppercase">Sua previsão</p>
              <h3 className="mt-1 font-jakarta text-[16px] leading-[1.45] font-extrabold tracking-[0.01em] sm:text-[18px]">
                Detalhes do céu
              </h3>
              <p className="mt-1.5 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                Visão ilustrativa
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {miniCards.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePanel(item.key)}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-foreground/15 bg-background/60 p-3 text-foreground shadow-[4px_6px_16px_-6px_hsl(0_0%_0%/0.12)] transition-all duration-300 hover:bg-bubble hover:shadow-[6px_10px_24px_-8px_hsl(0_0%_0%/0.18)]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="text-iris transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                  <span className="text-[9px] leading-[1.4] tracking-[0.18em] text-muted-foreground uppercase">
                    {item.eyebrow}
                  </span>
                  <span className="font-jakarta text-[13px] leading-[1.3] font-extrabold tracking-[0.01em] sm:text-[14px]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="mb-5 flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Voltar
            </button>

            {activePanel === "bar" ? (
              <BentoCard className="!rounded-2xl md:col-span-2">
                <BentoHeader
                  eyebrow="Aspectos · planetas × signos"
                  title="Intensidade planetária"
                  right={
                    <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                      Lua em {moonSign}
                    </span>
                  }
                />
                <div className="px-5 pt-2 pb-5">
                  <div className="flex h-[140px] items-end gap-2">
                    {planetData.map((p, i) => {
                      const positive = p.value >= 0;
                      const heightPct = Math.abs(p.value) * 80 + 8;
                      return (
                        <div key={p.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                          <div className="relative flex h-full w-full items-end justify-center">
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                duration: 0.6,
                                delay: i * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{
                                height: `${heightPct}%`,
                                background: positive ? POS_BAR : NEG_BAR,
                                transformOrigin: "bottom",
                              }}
                              className="w-full max-w-[14px] rounded-t-[3px]"
                            />
                          </div>
                          <span className="text-[14px] leading-none text-foreground/80">{p.sym}</span>
                          <span className="text-[8px] tracking-[0.1em] text-muted-foreground uppercase">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="size-3" /> favorável
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="size-3" /> desafiador
                    </span>
                  </div>
                </div>
              </BentoCard>
            ) : null}

            {activePanel === "line" ? (
              <BentoCard className="!rounded-2xl">
                <BentoHeader eyebrow="30 dias" title="Fases positivas e negativas" />
                <div className="px-5 pb-5">
                  <LinearWave points={linearPoints} />
                  <div className="mt-2 flex items-center justify-between text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
                    <span>hoje</span>
                    <span>+30d</span>
                  </div>
                </div>
              </BentoCard>
            ) : null}

            {activePanel === "planner" ? (
              <BentoCard className="!rounded-2xl">
                <BentoHeader eyebrow="Planner" title="Próximas janelas" />
                <ul className="divide-y divide-border/60">
                  {upcomingDates.map((d) => (
                    <li key={`${d.date}-${d.label}`} className="flex items-center gap-4 px-5 py-4">
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-jakarta text-sm leading-[1.5] font-extrabold tracking-[0.01em]">
                          {d.label}
                        </p>
                        <p className="mt-1 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{d.date}</p>
                      </div>
                      <span
                        className={
                          "rounded-full px-2 py-1 text-[10px] tracking-[0.18em] uppercase " +
                          (d.polarity === "pos"
                            ? "bg-[hsl(210_55%_88%)] text-foreground"
                            : "bg-[hsl(22_45%_88%)] text-foreground")
                        }
                      >
                        {d.polarity === "pos" ? "favorável" : "atenção"}
                      </span>
                    </li>
                  ))}
                </ul>
              </BentoCard>
            ) : null}

            {activePanel === "activity" ? (
              <BentoCard className="!rounded-2xl">
                <BentoHeader
                  eyebrow="Intensidade da semana"
                  title={activityTotal}
                  right={
                    <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                      {activityTrend}
                    </span>
                  }
                />
                <div className="px-5 pb-5">
                  <ActivityBars data={activityData} />
                </div>
              </BentoCard>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </BentoCard>
  );
}

function BentoCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={
        "overflow-hidden rounded-3xl border border-foreground/15 bg-bubble text-foreground " +
        "shadow-[6px_8px_24px_-8px_hsl(0_0%_0%/0.18),2px_3px_8px_-3px_hsl(0_0%_0%/0.12)] " +
        className
      }
    >
      {children}
    </motion.div>
  );
}

function BentoHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <p className="text-[9px] leading-[1.5] font-semibold tracking-[0.22em] text-iris uppercase">{eyebrow}</p>
        <h3 className="mt-1 font-jakarta text-[15px] leading-[1.4] font-extrabold tracking-[0.01em] sm:text-[16px]">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

function LinearWave({ points }: { points: number[] }) {
  const W = 280;
  const H = 90;
  const stepX = W / (points.length - 1);
  const midY = H / 2;

  const toPath = () =>
    points
      .map((v, i) => {
        const x = i * stepX;
        const y = midY - v * (midY - 6);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const areaPath = `${toPath()} L ${W} ${midY} L 0 ${midY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[100px] w-full">
      <defs>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(210 55% 80%)" stopOpacity="0.45" />
          <stop offset="50%" stopColor="hsl(210 55% 80%)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="hsl(18 50% 75%)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <line
        x1="0"
        y1={midY}
        x2={W}
        y2={midY}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 3"
        className="text-foreground/25"
      />
      <motion.path
        d={areaPath}
        fill="url(#wave-grad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d={toPath()}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-foreground/80"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
    </svg>
  );
}

function ActivityBars({ data }: { data: ActivityDataPoint[] }) {
  const maxValue = data.reduce((m, i) => (i.value > m ? i.value : m), 0);
  return (
    <div className="flex h-[120px] items-end gap-2">
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={`${item.day}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className="relative flex h-full w-full items-end justify-center">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: `${pct}%`,
                  transformOrigin: "bottom",
                  background: POS_BAR,
                }}
                className="w-full max-w-[16px] rounded-t-[3px]"
              />
            </div>
            <span className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
}
