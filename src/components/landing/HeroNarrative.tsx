"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CardFanCarousel, { type FanCardItem } from "@/components/ui/card-fan-carousel";

const HERO_FAN_TONES = [
  { bg: "#EAF2FC", fg: "#1C2839", meta: "rgba(28,40,57,0.72)", desc: "rgba(28,40,57,0.9)" },
  { bg: "#C6DDFC", fg: "#1C2839", meta: "rgba(28,40,57,0.78)", desc: "rgba(28,40,57,0.92)" },
  { bg: "#B3C8E3", fg: "#1C2839", meta: "rgba(28,40,57,0.82)", desc: "rgba(28,40,57,0.95)" },
  { bg: "#5E6D88", fg: "#F5F8FD", meta: "rgba(245,248,253,0.78)", desc: "rgba(245,248,253,0.92)" },
  { bg: "#2F363E", fg: "#F5F8FD", meta: "rgba(245,248,253,0.75)", desc: "rgba(245,248,253,0.92)" },
];

const HERO_FAN_ITEMS: FanCardItem[] = [
  { id: "sinastria", index: "01", title: "Sinastria", description: "Combinação de mapas." },
  { id: "precos", index: "02", title: "Preços", description: "Planos, créditos e assinaturas." },
  { id: "faq", index: "03", title: "Dúvidas Frequentes", description: "Tire suas dúvidas sobre o método." },
  { id: "ceu-agora", index: "04", title: "Céu agora", description: "O mapa astral do momento." },
  { id: "planner", index: "05", title: "Planner", description: "Planeje suas ações com as datas." },
  { id: "mentoria", index: "06", title: "Mentoria", description: "Estratégia para previsões." },
  { id: "agendar-consulta", index: "07", title: "Agendar consulta", description: "Atendimento individual com Íris." },
].map((item, i) => ({ ...item, tone: HERO_FAN_TONES[i % HERO_FAN_TONES.length] }));

const HERO_FAN_ACTIONS: Record<string, (navigate: (path: string) => void) => void> = {
  sinastria: (navigate) => navigate("/mapa-astral"),
  precos: (navigate) => navigate("/precos"),
  faq: (navigate) => navigate("/faq"),
  "ceu-agora": () => document.getElementById("sky-header")?.scrollIntoView({ behavior: "smooth", block: "start" }),
  planner: (navigate) => navigate("/calendario"),
  mentoria: () => window.open("https://wa.me/5511982028588", "_blank", "noopener,noreferrer"),
  "agendar-consulta": (navigate) => navigate("/cadastro"),
};



/**
 * HeroNarrative — Editorial intro with expandable "Leia mais" panel.
 */

const FADE = 0.5;

const PHRASES = [
  "Em tempos difíceis, é necessário retornarmos à origem. Ao óbvio que está na natureza, diante de nossos olhos.",
  "Os astros não movem os acontecimentos. Eles apenas marcam o tempo, os altos e baixos de energia.",
  "Desde as primeiras comunidades, percebeu-se acontecimentos na natureza, ao mesmo tempo em que marcava-se o movimento dos astros.",
  "Embora a humanidade, desde sempre, lute para sobreviver ao caos, não é possível negar a existência de uma certa ordem, no movimento dos astros.",
  "Aconteça o que for, o Sol nascerá amanhã novamente.",
  "Há pelo menos 200 mil anos, percebeu-se o ritmo, o ciclo, e as repetições da posição dos astros.",
  "Está nisto, a origem do relógio e do calendário.",
  "A vida só é possível com energia. E a energia depende do Sol. Em sua origem, a astrologia não discorda da ciência, ao contrário. A ciência nasceu junto à astrologia.",
  "Cada astro é o ponteiro de um relógio, que é o sistema solar. E o mapa astral verdadeiro marca estas posições precisas, desde o seu nascimento de tudo.",
  "O benefício da astrologia séria é a entrega do momento certo para tudo debaixo do céu.",
  "Este saber dá o poder de ter autoconfiança em suas decisões.",
  "Há data certa para agir...",
  "se proteger...",
  "ganhar... perder...",
  "ou encerrar!",
  "Isto é o verdadeiro significado de previsão. Ver antes, uma tendência.",
  "Divinação é observar o tempo divino. E jamais, adivinhação.",
  "Destino é o movimento das energias da natureza.",
  "Isto é diferente de adivinhar futuro. O que é impossível, porque os resultados de nossas ações, não pode ser previsto.",
  "É a pessoa ao saber o momento certo, que constrói o seu futuro. Preserva energia, e vive melhor.",
  "Receba as boas vindas no único sistema de astrologia...",
  "que entrega o que você precisa: a data exata para suas decisões.",
  "Data Iris é feito por inteligência humana, responsável e ética.",
  "São 20 anos anotando o que acontece nas datas, em mais de 53 mil escutas de vidas reais!",
];

const WORD_INTERVAL_MS = 75;
const PHRASE_PAUSE_MS = 950;

const lineFont: React.CSSProperties = {
  fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  lineHeight: 1.35,
};

const HERO_TITLE_CLASS =
  "text-[52px] sm:text-[64px] md:text-[80px] lg:text-[96px] text-white text-left leading-[1.05]";

interface PhraseRevealerProps {
  text: string;
  onDone: () => void;
}

const PhraseRevealer: React.FC<PhraseRevealerProps> = ({ text, onDone }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed === 0) {
      const t = setTimeout(() => setRevealed(1), 120);
      return () => clearTimeout(t);
    }
    if (revealed >= words.length) {
      const t = setTimeout(() => onDone(), PHRASE_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((c) => c + 1), WORD_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [revealed, words.length, onDone]);

  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={
            i < revealed
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 6 }
          }
          transition={{
            duration: 0.35,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block mr-[0.28em] will-change-transform"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

interface PhraseSequenceProps {
  onDone: () => void;
}

const PhraseSequence: React.FC<PhraseSequenceProps> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleBack = () => {
    setDirection(-1);
    setIndex(0);
  };

  const handleSkip = () => {
    onDone();
  };

  const nextPhrase = () => {
    if (index < PHRASES.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    } else {
      onDone();
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-start justify-center py-12 sm:py-16 md:py-20">
      {/* Controles acima do texto */}
      <div className="flex items-center justify-start gap-4 sm:gap-5 w-full mb-6 sm:mb-8">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar à primeira frase"
          className="text-[11px] sm:text-xs font-medium tracking-wide text-white/40 hover:text-white/80 transition-colors"
        >
          Retornar
        </button>
        <button
          type="button"
          onClick={handleSkip}
          aria-label="Pular introdução"
          className="text-[11px] sm:text-xs font-medium tracking-wide text-white/40 hover:text-white/80 transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Caixa de frases com revelação progressiva */}
      <div
        className="w-full max-w-3xl text-left text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px]"
        style={{
          fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1.45,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: direction > 0 ? 14 : -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -14 : 14 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhraseRevealer text={PHRASES[index]} onDone={nextPhrase} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ReadingHighlightProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  wordIntervalMs?: number;
}

const ReadingHighlight: React.FC<ReadingHighlightProps> = ({
  text,
  className,
  style,
  wordIntervalMs = 120,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || started) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const t = window.setTimeout(() => setActiveIndex(0), 200);
    return () => clearTimeout(t);
  }, [started]);

  useEffect(() => {
    if (!started || activeIndex < 0 || activeIndex >= words.length - 1) return;
    const t = window.setTimeout(
      () => setActiveIndex((i) => i + 1),
      wordIntervalMs
    );
    return () => clearTimeout(t);
  }, [started, activeIndex, words.length, wordIntervalMs]);

  useEffect(() => {
    if (!started || activeIndex !== words.length - 1) return;
    const t = window.setTimeout(() => setActiveIndex(words.length), 800);
    return () => clearTimeout(t);
  }, [started, activeIndex, words.length]);

  return (
    <span
      ref={containerRef}
      className={cn("max-w-full break-words whitespace-normal", className)}
      style={style}
    >
      {words.map((word, i) => (
        <span
          key={`word-${i}`}
          className="inline transition-colors duration-300 ease-out"
          style={{
            color:
              i === activeIndex
                ? "rgb(255, 255, 255)"
                : "rgba(255, 255, 255, 0.6)",
          }}
        >
          {word}
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
};

const containerFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: FADE, ease: "easeOut" as const },
};

interface AnimatedStatItemProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

const AnimatedStatItem: React.FC<AnimatedStatItemProps> = ({
  value,
  suffix = "",
  prefix = "",
  label,
  duration = 1800,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let rafId: number;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOutQuart(progress);
      setDisplayValue(eased * value);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, value, duration]);

  const formatted =
    value >= 1000
      ? Math.round(displayValue).toLocaleString("pt-BR")
      : Number.isInteger(value)
      ? Math.round(displayValue).toString()
      : displayValue.toFixed(1);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span
        className="text-[28px] sm:text-[36px] md:text-[44px] font-black tracking-[-0.03em] text-white"
        style={{ fontFamily: "var(--font-ubuntu-fallback), var(--font-jakarta-fallback), Inter, system-ui, sans-serif" }}
      >
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span
        className="text-[11px] sm:text-[12px] md:text-[13px] font-medium tracking-wide text-white/60 mt-1"
        style={{ fontFamily: "var(--font-ubuntu-fallback), var(--font-jakarta-fallback), Inter, system-ui, sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
};

const AnimatedStatsCounter: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full mt-2 sm:mt-3 md:mt-4"
    >
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
        <AnimatedStatItem value={53} suffix=" mil" label="escutas de vidas reais" />
        <AnimatedStatItem value={30} suffix="+" label="anos de pesquisa" />
        <AnimatedStatItem value={2} suffix="M" prefix="+" label="em resultados" />
      </div>
    </motion.div>
  );
};

const HeroNarrative: React.FC = () => {
  const router = useRouter();

  const [step, setStep] = useState<1 | 3>(3);

  return (
    <div
      aria-live="polite"
      className="relative mx-auto w-full max-w-[80rem] px-5 sm:px-8 md:px-10 flex flex-col justify-start pt-2 sm:pt-4 md:pt-6 pb-8 sm:pb-10 md:pb-12"
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="t1"
            {...containerFade}
            className="text-left w-full"
          >
            <PhraseSequence onDone={() => setStep(3)} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="t3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: FADE, ease: "easeOut" }}
            className="text-left max-w-3xl mx-auto w-full mt-6 sm:mt-8 md:mt-10"
          >
            <div
              className="relative w-full flex flex-col items-start text-left gap-5 sm:gap-6 md:gap-8"
              style={{
                fontFamily:
                  "var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
              }}
            >
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.25,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={cn(
                HERO_TITLE_CLASS,
                "mb-1 sm:mb-1.5"
              )}
              style={{
                fontFamily: "var(--font-ubuntu-fallback), var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Clareza e Alívio na Previsão com Datas
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="text-left text-[11px] sm:text-[13px] md:text-[15px] tracking-[0.08em] mt-1 mb-1.5 sm:mb-2"
              style={{
                fontFamily: "var(--font-ubuntu-fallback), var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
                fontWeight: 700,
                color: "hsl(var(--blue-chambray))",
              }}
            >
            <>
              A astrologia que não se perdeu da ciência
              <br />
              acontece na prática, em sua vida!
            </>

            </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
                className="max-w-2xl text-[13px] sm:text-[15px] md:text-[16px] whitespace-pre-line"
                style={{
                  lineHeight: 1.5,
                  fontWeight: 400,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Data Iris é o app feito com sensibilidade humana. Em respeito à matemática da natureza, entrega a data exata da previsão personalizada pelo mapa astral. Saiba o momento certo para suas decisões e realização de seus objetivos!
              </motion.p>


              <motion.button
                type="button"
                onClick={() => document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" })}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                className="group inline-flex items-center gap-2 rounded-3xl bg-[hsl(var(--blue-chambray))] px-6 py-3 text-[13px] sm:text-[15px] font-bold text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_12px_-2px_hsl(var(--blue-chambray)/0.45)] transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_20px_-4px_hsl(var(--blue-chambray)/0.55)]"
                style={{ fontFamily: "var(--font-ubuntu-fallback), var(--font-jakarta-fallback), Inter, system-ui, sans-serif" }}
              >
                Data Iris
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />
              </motion.button>

              <motion.h2
                className="text-left text-white font-ubuntu font-extrabold text-[26px] sm:text-[36px] md:text-[44px] lg:text-[54px] leading-[1.32] tracking-[-0.03em] mt-16 sm:mt-20 md:mt-24 mb-4 sm:mb-5 md:mb-6 max-w-[1100px]"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
              >
                O método exclusivo <span className="text-azure-glow">Data Iris</span> é baseado na escuta de <span className="text-azure-glow">vidas reais</span>. A primeira astrologia com dados de nosso tempo! Conheça mais!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="relative w-full mt-2 sm:mt-3 md:mt-4"
              >
                {/* Mini carrossel em leque — mesma linguagem da seção Assinatura */}
                <div className="w-full h-[18rem] sm:h-[22rem] md:h-[25rem] overflow-hidden">
                  <div
                    className="origin-top"
                    style={{
                      transform: "scale(0.62) translateY(-2.5rem)",
                      width: "161%",
                      marginLeft: "-30.5%",
                    }}
                  >
                    <CardFanCarousel
                      items={HERO_FAN_ITEMS}
                      curve="down"
                      onSelect={(item) => {
                        const action = HERO_FAN_ACTIONS[item.id];
                        if (action) action((path) => router.push(path));
                      }}
                    />
                  </div>
                </div>

                <AnimatedStatsCounter />

              </motion.div>


            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroNarrative;
