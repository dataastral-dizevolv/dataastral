"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, X, Calendar, HelpCircle } from "lucide-react";
import { ExpandableInfoCard } from "@/components/landing/ExpandableInfoCard";
import { Marquee } from "@/components/ui/marquee";
import SkyHeader from "@/components/landing/SkyHeader";
import HeroNarrative from "@/components/landing/HeroNarrative";
import SpiralAnimation from "@/components/landing/SpiralAnimation";


import IrisAuraBloom from "@/components/landing/IrisAuraBloom";
import HeroIntroVideo from "@/components/landing/HeroIntroVideo";




const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const ALL_QUESTIONS = [
  "Vou encontrar um amor?",
  "Viajarei esse ano para outro país?",
  "Quando receberei recursos em dinheiro?",
  "Devo mudar de carreira?",
  "Estou sendo traída?",
  "Quando terei o próximo encontro?",
  "Vou perder o trabalho quando?",
  "Vou receber uma promoção?",
  "Quando devo mudar de casa?",
  "Há risco de divórcio?",
  "Devo me separar?",
  "Vou me sentir melhor?",
  "Este relacionamento combina?",
  "Em qual país tenho mais sucesso?",
  "Devo estudar pro concurso?",
  "Quando venderei meu apartamento?",
  "Quando vou receber o pagamento?",
  "Devo fazer essa compra?",
];

// Preto puro para todos os badges
const BADGE_TONE = "bg-transparent";
const BADGE_BORDER_WIDTH = 1.5; // px — espessura da moldura onde o shader aparece

function QuestionBadge({ text, baseOpacity = 1 }: { text: string; baseOpacity?: number }) {
  const [bright, setBright] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const schedule = () => {
      // Tempo até acender: 6–22s aleatório (raro, para 1–2 ascesas simultâneas no conjunto)
      const waitMs = 6000 + Math.random() * 16000;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setBright(true);
        // Tempo aceso: 3–6s (lento)
        const stayMs = 3000 + Math.random() * 3000;
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          setBright(false);
          schedule();
        }, stayMs);
      }, waitMs);
    };

    // Delay inicial aleatório para dessincronizar
    timeoutId = window.setTimeout(schedule, Math.random() * 8000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <span
      className="relative inline-flex items-center whitespace-nowrap rounded-lg text-[17px] sm:text-[26px] md:text-[36px] lg:text-[47px] px-6 py-6 sm:px-7 sm:py-7 border"
      style={{
        fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
        fontWeight: 800,
        letterSpacing: "0.01em",
        lineHeight: 1.1,
        color: bright ? "hsl(0 0% 100%)" : "hsl(0 0% 28%)",
        backgroundColor: "transparent",
        borderColor: bright ? "hsl(0 0% 100% / 0.25)" : "hsl(0 0% 100% / 0.06)",
        transition: "color 2.4s ease, border-color 2.4s ease, opacity 2.4s ease",
        opacity: baseOpacity,
      }}
    >
      {text}
    </span>
  );
}



function QuestionsMarquee() {
  const row1 = ALL_QUESTIONS.filter((_, i) => i % 4 === 0);
  const row2 = ALL_QUESTIONS.filter((_, i) => i % 4 === 1);
  const row3 = ALL_QUESTIONS.filter((_, i) => i % 4 === 2);
  const row4 = ALL_QUESTIONS.filter((_, i) => i % 4 === 3);
  const rowClass = "[--gap:1.25rem] sm:[--gap:1.75rem] gap-[1.25rem] sm:gap-[1.75rem]";
  // Repeat enough copies so the infinite loop never runs out of content on any viewport.
  const repeat = 4;

  // Leve variação de opacidade entre os cards, alternando em pares para criar ritmo visual.
  const opacityFor = (row: number, index: number) => {
    const pair = (row + index) % 3;
    if (pair === 0) return 0.85;
    if (pair === 1) return 1;
    return 0.72;
  };

  return (
    <div className="relative">
      {/* Fade preto suave nas laterais para as pílulas sumirem nas bordas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-24 md:w-32"
        style={{ background: "linear-gradient(to right, hsl(0 0% 0%), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-24 md:w-32"
        style={{ background: "linear-gradient(to left, hsl(0 0% 0%), transparent)" }}
      />

      <div className="flex flex-col gap-[1.25rem] sm:gap-[1.75rem]">
        <Marquee repeat={repeat} className={`${rowClass} [--duration:100s]`}>
          {row1.map((q, i) => (
            <QuestionBadge key={`r1-${i}`} text={q} baseOpacity={opacityFor(0, i)} />
          ))}
        </Marquee>
        <Marquee repeat={repeat} className={`${rowClass} [--duration:140s]`}>
          {row2.map((q, i) => (
            <QuestionBadge key={`r2-${i}`} text={q} baseOpacity={opacityFor(1, i)} />
          ))}
        </Marquee>
        <Marquee repeat={repeat} className={`${rowClass} [--duration:80s]`}>
          {row3.map((q, i) => (
            <QuestionBadge key={`r3-${i}`} text={q} baseOpacity={opacityFor(2, i)} />
          ))}
        </Marquee>
        <Marquee repeat={repeat} className={`${rowClass} [--duration:170s]`}>
          {row4.map((q, i) => (
            <QuestionBadge key={`r4-${i}`} text={q} baseOpacity={opacityFor(3, i)} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}




const WA_NUMBER = "5511982028588";

type Step = "intro" | "form" | "ready";
type InviteMode = "have" | "wait";

function TypePhrase({
  text,
  start,
  typeDuration,
  hold,
  className,
  style,
}: {
  text: string;
  start: number;
  typeDuration: number;
  hold: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const startMs = start * 1000;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setVisible(true), startMs));
    const fadeAt = startMs + typeDuration * 1000 + hold * 1000;
    timers.push(window.setTimeout(() => setFading(true), fadeAt));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [text, start, typeDuration, hold]);

  return (
    <h2
      className={className}
      style={{
        opacity: visible && !fading ? 1 : 0,
        transform: !visible ? "translateY(8px)" : fading ? "translateY(-8px)" : "translateY(0)",
        transition: "opacity 1.4s ease, transform 1.4s ease",
        ...style,
      }}
    >
      {text}
    </h2>
  );
}

function FadeParagraphs({
  paragraphs,
  startDelay,
  staggerMs,
  fadeMs,
  className,
  onDone,
}: {
  paragraphs: string[];
  startDelay: number;
  staggerMs: number;
  fadeMs: number;
  className?: string;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState<boolean[]>(() => paragraphs.map(() => false));

  useEffect(() => {
    const timers: number[] = [];
    paragraphs.forEach((_, pi) => {
      const at = startDelay * 1000 + pi * staggerMs;
      timers.push(
        window.setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[pi] = true;
            return next;
          });
        }, at)
      );
    });
    const doneAt = startDelay * 1000 + paragraphs.length * staggerMs + fadeMs;
    timers.push(window.setTimeout(() => onDone?.(), doneAt));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [paragraphs, startDelay, staggerMs, fadeMs, onDone]);

  return (
    <div className={className}>
      {paragraphs.map((p, pi) => (
        <p
          key={pi}
          className={pi > 0 ? "mt-5" : undefined}
          style={{
            opacity: visible[pi] ? 1 : 0,
            transform: visible[pi] ? "translateY(0)" : "translateY(8px)",
            transition: `opacity ${fadeMs}ms ease-out, transform ${fadeMs}ms ease-out`,
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

const INTRO_OFFSET = 7.4;
export const HERO_INTRO_STORAGE_KEY = "iris_hero_intro_seen";



type RotatingItem = {
  text: string;
  variant?: "normal" | "tagline";
  holdMs?: number;
};

// Perguntas — exibidas sequencialmente no centro do Hero, com fade in/out.
const SCATTERED_QUESTIONS: { text: string }[] = [
  { text: "vou receber um aumento financeiro?" },
  { text: "vai dar certo esse negócio?" },
  { text: "vou me sentir melhor?" },
  { text: "vou receber uma promoção?" },
  { text: "conseguirei um novo trabalho?" },
  { text: "vou ter um encontro de amor?" },
  { text: "há risco de término no relacionamento?" },
];

type TaglineLogo = "quando" | "quando-ia";
const TAGLINES: (RotatingItem & { logo?: TaglineLogo })[] = [
  { text: "O VERDADEIRO PROPÓSITO DA ASTROLOGIA", variant: "tagline", holdMs: 4200 },
  { text: "É SABER", variant: "tagline", holdMs: 2400 },
  { text: "QUANDO", variant: "tagline", holdMs: 3200, logo: "quando" },
  { text: "ALGO PODE ACONTECER", variant: "tagline", holdMs: 4200 },
  { text: "QUANDO.IA", variant: "tagline", holdMs: 3600, logo: "quando-ia" },
  { text: "É O SISTEMA CRIADO POR IRIS", variant: "tagline", holdMs: 4000 },
  { text: "QUE SINCRONIZA O SEU MAPA", variant: "tagline", holdMs: 3600 },
  { text: "COM AS DATAS EXATAS DOS ASTROS", variant: "tagline", holdMs: 5200 },
];

const SPARKLE_POSITIONS = [
  { top: "10%", left: "-4%", size: 20, delay: 0.3 },
  { top: "-10%", left: "32%", size: 28, delay: 0.6 },
  { top: "20%", left: "78%", size: 16, delay: 0.85 },
  { top: "60%", left: "92%", size: 24, delay: 1.1 },
  { top: "75%", left: "10%", size: 18, delay: 1.35 },
  { top: "-6%", left: "62%", size: 14, delay: 1.6 },
  { top: "40%", left: "-8%", size: 22, delay: 0.45 },
  { top: "-14%", left: "8%", size: 16, delay: 0.75 },
  { top: "50%", left: "48%", size: 14, delay: 0.95 },
  { top: "90%", left: "55%", size: 20, delay: 1.2 },
  { top: "30%", left: "22%", size: 18, delay: 1.45 },
  { top: "82%", left: "82%", size: 26, delay: 1.7 },
];

function Sparkles() {
  return (
    <>
      {SPARKLE_POSITIONS.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute block pointer-events-none"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], rotate: [0, 90, 180, 270] }}
          transition={{ duration: 2.6, delay: s.delay * 0.6, times: [0, 0.25, 0.7, 1], ease: "easeOut", repeat: Infinity, repeatDelay: 0.4 }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" fill="hsl(0 0% 100%)" />
          </svg>
        </motion.span>
      ))}
    </>
  );
}

type SequenceItem =
  | { kind: "tagline"; text: string; holdMs?: number; logo?: TaglineLogo }
  | { kind: "cta" };

function RotatingQuestions({ startDelay, onLastClick, isMobile }: { startDelay: number; onLastClick?: () => void; isMobile?: boolean }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [lastClicked, setLastClicked] = useState(false);

  const sequence: SequenceItem[] = [
    ...TAGLINES.map((t) => ({
      kind: "tagline" as const,
      text: t.text,
      holdMs: t.holdMs,
      logo: t.logo,
    })),
    { kind: "cta" as const },
  ];

  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), startDelay * 1000);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    const current = sequence[index];
    if (!current) return;
    if (current.kind === "cta") return;
    const hold = current.holdMs ?? 3200;
    const t = window.setTimeout(() => setIndex((i) => Math.min(i + 1, sequence.length - 1)), hold);
    return () => clearTimeout(t);
  }, [started, index]);

  const handleLastClick = () => {
    if (lastClicked) return;
    setLastClicked(true);
    window.setTimeout(() => onLastClick?.(), 800);
  };

  const current = sequence[Math.min(index, sequence.length - 1)];

  const taglineClass =
    "uppercase text-[28px] sm:text-[44px] md:text-[60px] lg:text-[78px] leading-[1.1] antialiased subpixel-antialiased px-6 break-words text-center max-w-[92vw] mx-auto";
  const taglineStyle = {
    fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontStyle: "normal" as const,
    letterSpacing: "0.01em",
    color: "#ffffff",
  } as const;

  const crossfade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  };

  return (
    <div
      aria-live="polite"
      className="relative mx-auto mt-20 sm:mt-28 md:mt-40 -mb-2 sm:-mb-3 md:-mb-4 flex h-72 sm:h-96 md:h-[26rem] w-full max-w-[80rem] items-center justify-center"
      style={{
        opacity: started ? 1 : 0,
        transition: "opacity 1.6s ease",
      }}
    >
      <AnimatePresence mode="wait">
        {current.kind === "cta" && !lastClicked ? (
          <motion.div
            key="cta-block"
            role="button"
            tabIndex={0}
            onClick={handleLastClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleLastClick(); } }}
            {...crossfade}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-80 z-10 gap-20"
          >
            <div className="relative flex flex-col items-center">
              <span className={taglineClass} style={taglineStyle}>QUERO A DATA PARA AS MINHAS PREVISÕES!</span>
              <span className="mt-3 font-sans not-italic text-[10px] sm:text-[12px] font-light tracking-[0.15em] uppercase text-foreground/50">
                clique para entrar
              </span>
            </div>
            <div className="relative inline-flex items-center justify-center px-6 py-2 w-full max-w-[40rem] h-[28px] sm:h-[36px] md:h-[44px]">
              <span
                className="uppercase text-[11px] sm:text-[14px] tracking-[0.05em] text-white"
                style={{ fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif", fontWeight: 800, letterSpacing: "0.05em" }}
              >
                VOCÊ GANHOU 3 PERGUNTAS GRÁTIS!
              </span>
            </div>
          </motion.div>
        ) : current.kind === "tagline" ? (
          <motion.div
            key={`item-${index}`}
            {...crossfade}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="relative inline-flex items-center justify-center">
              <span className={taglineClass} style={taglineStyle}>{current.text}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}


const Hero = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [nome, setNome] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<InviteMode>("have");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteWhats, setInviteWhats] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [postVideoRevealed, setPostVideoRevealed] = useState(false);
  const [skipIntro] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(HERO_INTRO_STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [introVisible, setIntroVisible] = useState(!skipIntro);
  const [showInfo, setShowInfo] = useState(false);
  const [showCtas, setShowCtas] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQuestionIndex((i) => i + 1), 3200);
    return () => clearInterval(id);
  }, []);

  const openInvite = (mode: InviteMode) => {
    setInviteMode(mode);
    setInviteOpen(true);
  };

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());
    const whatsOk = inviteWhats.replace(/\D/g, "").length >= 10;
    if (!emailOk || !whatsOk) return;
    if (inviteMode === "have" && inviteCode.trim().length < 3) return;
    try {
      localStorage.setItem("iris_invite", JSON.stringify({
        mode: inviteMode,
        code: inviteCode.trim() || null,
        whats: inviteWhats.trim(),
        email: inviteEmail.trim(),
        at: new Date().toISOString(),
      }));
    } catch {}
    if (inviteMode === "have") {
      router.push("/perfil");
    } else {
      setInviteOpen(false);
    }
  };

  useEffect(() => {
    if (skipIntro) return;
    const t = setTimeout(() => setIntroVisible(false), INTRO_OFFSET * 1000);
    // Marca como visto após a sequência completa (CTAs aparecem em ~21.5 + INTRO_OFFSET)
    const seenAt = (21.5 + INTRO_OFFSET + 1) * 1000;
    const t2 = setTimeout(() => {
      try { localStorage.setItem(HERO_INTRO_STORAGE_KEY, "1"); } catch {}
    }, seenAt);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [skipIntro]);

  const formValid = nome.trim().length > 1 && pergunta.trim().length > 3 && /^\d{2}\s?\d{2}\s?\d{4}$/.test(nascimento.replace(/\s/g, "").replace(/(\d{2})(\d{2})(\d{4})/, "$1 $2 $3"));

  const openWhatsApp = () => {
    const msg = `Oi, sou ${nome}.%0AMinha pergunta: ${pergunta}.%0AData de nascimento: ${nascimento}.%0AQuero saber a data certa para agir.`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
  };

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Invisível no topo; ativa conforme o usuário rola para baixo (saída da imagem)
  const spiralOpacity = useTransform(scrollYProgress, [0.15, 0.55, 1], [0, 0.7, 1]);
  const spiralScale = useTransform(scrollYProgress, [0.15, 1], [0.85, 1.15]);
  // Dispara a animação espiral apenas uma vez quando o scroll atinge o gatilho
  const [spiralPlay, setSpiralPlay] = useState(false);
  const [showHeavyHeroLayers, setShowHeavyHeroLayers] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHeavyHeroLayers(!prefersReducedMotion()), 500);
    return () => clearTimeout(t);
  }, []);

  // Reveal title/copy while the chart entrance plays (don't wait for full video)
  useEffect(() => {
    const t = window.setTimeout(() => setPostVideoRevealed(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showHeavyHeroLayers) return;
    const unsub = scrollYProgress.on("change", (v) => {
      if (v >= 0.15) {
        setSpiralPlay(true);
        unsub();
      }
    });
    return () => unsub();
  }, [scrollYProgress, showHeavyHeroLayers]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-x-hidden bg-background text-foreground"
      style={{
        // Dark theme override scoped to hero (breaks brand rule by user request)
        ["--background" as any]: "0 0% 0%",
        ["--foreground" as any]: "0 0% 100%",
        ["--muted" as any]: "0 0% 8%",
        ["--muted-foreground" as any]: "0 0% 70%",
        ["--border" as any]: "0 0% 100% / 0.15",
      }}
    >

      {/* Camada 1: fundo preto + campo de estrelas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden" style={{ background: "hsl(0 0% 0%)" }}>
        <StarField />
      </div>


      {/* Camada 1.5: irradiação azul (AuraBloom) — atrás do conteúdo, na altura do visor mobile */}
      <IrisAuraBloom />

      {/* Camada 1.6: abertura em vídeo (mandala) — centro entre as frases do título */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] overflow-visible top-[3vh] sm:top-[5vh] md:top-[7vh] lg:top-[9vh] right-[-45%] sm:right-[-22%] md:right-[-10%] lg:right-[-2%] w-[140vw] sm:w-[100vw] md:w-[80vw] lg:w-[62vw] max-w-[1200px] aspect-video"
      >
        <HeroIntroVideo className="scale-[1.5]" onSettled={() => setPostVideoRevealed(true)} />
      </div>






      {/* Plano das órbitas — espiral de estrelas, no mesmo plano dos anéis ao redor da esfera */}
      {showHeavyHeroLayers && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden will-change-transform"
          style={{ opacity: spiralOpacity, scale: spiralScale }}
        >
          <SpiralAnimation play={spiralPlay} />
        </motion.div>
      )}












      <div className="relative z-10 max-w-[1380px] mx-auto px-5 sm:px-6 md:px-10 lg:px-14 pt-20 sm:pt-24 md:pt-28 flex flex-col">

        {/* Hero intro — sequência de frases em coluna única */}
        <div className="relative w-full">
          <motion.div
            className="relative z-10 w-full"
            initial={{ opacity: 0, x: -48 }}
            animate={postVideoRevealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -48 }}
            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}

          >
            <div className="text-left">
              <HeroNarrative />
            </div>
          </motion.div>
        </div>



        {/* Rest of hero content — full width */}
        <div className="relative z-10 w-full">
          {/* CTAs — aparecem no final da rotação, no lugar das frases */}
          <AnimatePresence>
            {showCtas && (
              <motion.div
                key="ctas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="-mt-40 sm:-mt-48 md:-mt-56 -mb-12 sm:-mb-16 md:-mb-20 w-full px-2 sm:px-4"
              >
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => router.push("/cadastro")}
                    className="inline-flex flex-col items-center justify-center gap-2 rounded-3xl border border-black/[0.08] bg-background text-foreground aspect-square w-full p-6 transition-all duration-200 hover:opacity-80"
                  >
                    <Calendar className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                    <span className="text-sm sm:text-base font-medium tracking-[-0.01em] text-center leading-tight px-2">
                      Começar
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex flex-col items-center justify-center gap-2 rounded-3xl border border-black/[0.08] bg-background text-foreground aspect-square w-full p-6 transition-all duration-200 hover:opacity-80"
                  >
                    <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                    <span className="text-sm sm:text-base font-medium tracking-[-0.01em] text-center leading-tight px-2">
                      Entrar
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="block mx-auto mt-16 sm:mt-20 md:mt-24 text-foreground/80 hover:text-foreground transition-colors text-sm sm:text-base font-medium tracking-[0.02em] underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground"
                >
                  Fazer previsão gratuita
                </button>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Título acima do carrossel de perguntas */}
          <motion.h2
            className="text-left text-white font-ubuntu font-extrabold text-[26px] sm:text-[36px] md:text-[44px] lg:text-[54px] leading-[1.32] tracking-[-0.03em] px-5 sm:px-8 md:px-10 mt-24 sm:mt-32 md:mt-40 mb-4 sm:mb-5 md:mb-6 max-w-[1100px]"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Astrologia é imensamente mais do que 12 signos. É a revelação do seu <span className="text-[hsl(var(--azure-sky))]">universo de oportunidades!</span>
          </motion.h2>

          <motion.p
            className="text-left text-white/80 font-ubuntu font-medium text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] tracking-[-0.01em] px-5 sm:px-8 md:px-10 mb-16 sm:mb-20 md:mb-28 max-w-[1100px]"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Melhor do que conhecer o signo do sol + lua + asc + 12 casas... é conseguir usar os dados a seu favor e produzir resultados em sua vida!
            <br /><br />
            Para quem diz que astrologia é pseudociência, vale a leitura da obra de um dos maiores cientistas de nossa era: o estudo feito por Kepler... [De fundamentis astrologiae certioribus. As bases mais confiáveis da astrologia, em 1601].
            <br /><br />
            Com base na crítica científica, Data Iris aplica as posições astronômicas da Nasa, a parte que funciona: os aspectos!
            <br /><br />
            Feito com inteligência humana, o método baseia-se apenas no que não fere a ciência e nem a ética da psicologia.
          </motion.p>

          {/* Perguntas em marquee — reveladas suavemente após o vídeo do hero */}

          <motion.div
            className="-mt-16 sm:-mt-20 md:-mt-24 mb-4 sm:mb-6 md:mb-8 -mx-5 sm:-mx-6 md:-mx-10 lg:-mx-14"
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: postVideoRevealed ? 1 : 0,
              y: postVideoRevealed ? 0 : 24,
            }}
            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
          >


            <div className="mt-40 sm:mt-56 md:mt-80">
              <QuestionsMarquee />
            </div>
            <div className="px-8 sm:px-14 md:px-24 mt-32 sm:mt-40 md:mt-52 max-w-[1100px] mx-auto">
              <p className="text-left font-jakarta text-[14px] sm:text-[16px] md:text-[18px] leading-[1.95] text-white whitespace-pre-line">
                {`Previsão no Data Iris não é sortear com a vida alheia. Também não é sobre apostas, nem invenções de videntes. Prever é ver antes, no sentido de saber as datas dos altos e baixos de energias da natureza.

Há datas em que acaba a disposição. E por isso, acontecem perdas, tendências a acidentes, e azares. E há datas em nosso mapa de vida, em que acontecem os maiores ganhos e resultados. É sobre isso, um método de tomada de decisões, a partir do que é possível, em seu mapa astral.`}
              </p>
            </div>
            <motion.div
              className="px-7 sm:px-14 md:px-20 mt-12 sm:mt-16 md:mt-20 max-w-[1100px]"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 1.1, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <ExpandableInfoCard />
            </motion.div>

          </motion.div>

          <div className="relative -mx-5 sm:-mx-6 md:-mx-10 lg:-mx-14 mt-24 sm:mt-36 md:mt-48 pb-[30vh] sm:pb-[40vh] md:pb-[50vh] flex-grow flex flex-col">
            {/* Camada de céu estrelado atrás dos cards de aspectos */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            >
              {/* Estrelas sutis */}
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `
                    radial-gradient(1.2px 1.2px at 12% 18%, rgba(255,255,255,0.95), transparent),
                    radial-gradient(1.4px 1.4px at 28% 11%, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1px 1px at 42% 24%, rgba(255,255,255,0.65), transparent),
                    radial-gradient(1.6px 1.6px at 56% 9%, rgba(255,255,255,0.9), transparent),
                    radial-gradient(1.1px 1.1px at 68% 21%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1.3px 1.3px at 82% 14%, rgba(255,255,255,0.85), transparent),
                    radial-gradient(1.5px 1.5px at 94% 28%, rgba(255,255,255,0.75), transparent),
                    radial-gradient(1px 1px at 7% 36%, rgba(255,255,255,0.55), transparent),
                    radial-gradient(1.2px 1.2px at 19% 31%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1.4px 1.4px at 35% 42%, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1px 1px at 49% 34%, rgba(255,255,255,0.5), transparent),
                    radial-gradient(1.3px 1.3px at 63% 39%, rgba(255,255,255,0.75), transparent),
                    radial-gradient(1.1px 1.1px at 77% 45%, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1.6px 1.6px at 88% 36%, rgba(255,255,255,0.85), transparent),
                    radial-gradient(1.2px 1.2px at 97% 48%, rgba(255,255,255,0.65), transparent),
                    radial-gradient(1px 1px at 4% 55%, rgba(255,255,255,0.45), transparent),
                    radial-gradient(1.4px 1.4px at 22% 52%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1.2px 1.2px at 38% 61%, rgba(255,255,255,0.55), transparent),
                    radial-gradient(1.5px 1.5px at 52% 56%, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1.1px 1.1px at 71% 64%, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1.3px 1.3px at 86% 58%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1px 1px at 14% 71%, rgba(255,255,255,0.5), transparent),
                    radial-gradient(1.6px 1.6px at 29% 78%, rgba(255,255,255,0.75), transparent),
                    radial-gradient(1.2px 1.2px at 44% 69%, rgba(255,255,255,0.55), transparent),
                    radial-gradient(1.4px 1.4px at 58% 82%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1.1px 1.1px at 74% 74%, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1.5px 1.5px at 91% 85%, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1.3px 1.3px at 6% 88%, rgba(255,255,255,0.65), transparent),
                    radial-gradient(1px 1px at 20% 93%, rgba(255,255,255,0.45), transparent),
                    radial-gradient(1.4px 1.4px at 36% 89%, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1.2px 1.2px at 50% 96%, rgba(255,255,255,0.55), transparent),
                    radial-gradient(1.5px 1.5px at 67% 92%, rgba(255,255,255,0.75), transparent),
                    radial-gradient(1.1px 1.1px at 83% 97%, rgba(255,255,255,0.6), transparent)
                  `,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </motion.div>
            <div className="relative z-10 flex flex-col flex-grow">
              <SkyHeader />
            </div>


          </div>


          {/* Modal de convite — código + whatsapp + email */}
          <AnimatePresence>
            {inviteOpen && (
              <motion.div
                key="invite-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={() => setInviteOpen(false)}
              >
                <motion.form
                  onSubmit={submitInvite}
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-md border border-border bg-background text-foreground p-7 sm:p-9"
                >
                  <button
                    type="button"
                    aria-label="Fechar"
                    onClick={() => setInviteOpen(false)}
                    className="absolute top-3 right-3 p-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:opacity-80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                    {inviteMode === "have" ? "Insira seu convite" : "Aguardar convite"}
                  </p>
                  <h3 className="text-[26px] sm:text-[30px] leading-[1.1] mb-6" style={{ fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif", fontWeight: 800, letterSpacing: "0.01em" }}>
                    {inviteMode === "have" ? "Acesse com seu código" : "Entre na lista de espera"}
                  </h3>
                  <div className="space-y-5">
                    {inviteMode === "have" && (
                      <Field
                        label="Código do convite"
                        value={inviteCode}
                        onChange={setInviteCode}
                        placeholder="Ex: IRIS-2025-XXXX"
                        mono
                      />
                    )}
                    <Field
                      label="WhatsApp"
                      value={inviteWhats}
                      onChange={setInviteWhats}
                      placeholder="(11) 98000-0000"
                      mono
                    />
                    <Field
                      label="E-mail"
                      value={inviteEmail}
                      onChange={setInviteEmail}
                      placeholder="voce@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-7 w-full h-12 inline-flex items-center justify-center gap-2 border border-foreground bg-foreground text-background text-[14px] font-semibold tracking-[-0.01em] transition-all duration-200 hover:opacity-90"
                  >
                    {inviteMode === "have" ? "Acessar meu perfil" : "Entrar na lista"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="mt-4 text-[11px] text-muted-foreground leading-[1.5]">
                    {inviteMode === "have"
                      ? "Ao confirmar, você acessa a tela de editar perfil."
                      : "Avisamos por WhatsApp e e-mail assim que seu convite estiver disponível."}
                  </p>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Texto explicativo — só aparece ao clicar em Como funciona */}
          <AnimatePresence initial={false}>
            {showInfo && (
              <motion.div
                key="info-text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-8 max-w-xl mx-auto px-8 sm:px-12 space-y-5 text-[14px] sm:text-[15px] md:text-[17px] leading-[1.6] text-foreground text-left">
                  <p>Data Iris é construído com o exclusivo Método Data Iris, baseado em +53k depoimentos de vidas reais.</p>
                  <p>Ninguém fez um estudo como esse!</p>
                  <p>Data Iris entrega a previsão das datas reais dos astros em seu mapa. Baseada nos 20% de astrologia que funciona. Sem ferir a ciência, nem a ética. Sem julgar, nem inventar.</p>
                  <p>O significado real de previsão é planejar algo possível de acontecer, na realidade!</p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 3, ease: "easeOut" }}
                    className="pt-4 text-center text-[24px] sm:text-[30px] md:text-[36px] leading-[1.15]"
                    style={{ fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif", fontWeight: 800, letterSpacing: "0.01em" }}
                  >
                    Faça sua consulta. As 3 primeiras perguntas são grátis!
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>


      {/* Imagem de gradiente no final do bloco preto — céu estrelado com transição azul */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[100vh] sm:h-[120vh] lg:h-[160vh]"
        style={{
          backgroundImage: "linear-gradient(to top, hsl(210 60% 35% / 0.55), hsl(220 40% 12% / 0.2), transparent), radial-gradient(ellipse at 50% 100%, hsl(210 70% 55% / 0.35), transparent 60%)",
          backgroundSize: "cover",
          backgroundPosition: "center 90%",
          backgroundRepeat: "no-repeat",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 100%)",
        }}
      />


    </section>


  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  mono?: boolean;
}) => (
  <label className="block">
    <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
      {label}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-10 border-b border-border bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground transition-colors ${
        mono ? "font-mono tracking-[0.05em]" : ""
      }`}
    />
  </label>
);

const Row = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
      {k}
    </span>
    <span className={`text-right text-foreground truncate ${mono ? "font-mono" : ""}`}>{v}</span>
  </div>
);

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const COUNT = 160;
    const stars = Array.from({ length: COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * Math.max(w, h);
      return {
        angle,
        radius,
        // angular speed (rad/s) — counter-clockwise (negative = anti-horário) — mais devagar (÷2.5)
        omega: -(0.01 + Math.random() * 0.014),
        r: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.24 + Math.random() * 0.56,
      };
    });

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.angle += s.omega * 0.016;
        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;
        const twinkle = 0.65 + 0.3 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 100%, ${twinkle})`;
        ctx.fill();
        if (s.r > 1.4) {
          ctx.beginPath();
          ctx.arc(x, y, s.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(0, 0%, 100%, ${twinkle * 0.18})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// Constelações zodiacais — pontos de estrelas + linhas finas conectando-as.
// Coordenadas em viewBox 24x24 (mesma escala dos antigos glifos).
type Constellation = { stars: [number, number][]; lines: [number, number][] };
const ZODIAC_CONSTELLATIONS: Constellation[] = [
  // Aries
  { stars: [[20, 5], [14, 9], [10, 12], [8, 17]], lines: [[0, 1], [1, 2], [2, 3]] },
  // Taurus — Hyades V + Aldebaran
  { stars: [[4, 6], [9, 11], [14, 14], [19, 9], [22, 6], [12, 18]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]] },
  // Gemini — Castor & Pollux
  { stars: [[7, 4], [9, 10], [11, 16], [13, 20], [17, 4], [16, 10], [15, 16]], lines: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 3]] },
  // Cancer — Y
  { stars: [[6, 5], [12, 11], [18, 6], [13, 17], [10, 21]], lines: [[0, 1], [2, 1], [1, 3], [3, 4]] },
  // Leo — foice + triângulo
  { stars: [[4, 8], [7, 6], [10, 8], [11, 12], [15, 14], [20, 16], [18, 11]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  // Virgo
  { stars: [[5, 5], [9, 8], [13, 6], [11, 12], [16, 13], [14, 18], [8, 20]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6]] },
  // Libra
  { stars: [[5, 9], [12, 5], [19, 9], [10, 17], [15, 17]], lines: [[0, 1], [1, 2], [0, 3], [2, 4], [3, 4]] },
  // Scorpio — gancho
  { stars: [[4, 6], [7, 8], [11, 9], [15, 11], [18, 14], [19, 18], [16, 20], [13, 17]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]] },
  // Sagittarius — bule
  { stars: [[5, 16], [9, 10], [14, 9], [19, 12], [17, 17], [11, 18], [21, 7]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6]] },
  // Capricorn — triângulo achatado
  { stars: [[4, 8], [10, 14], [16, 16], [21, 10], [12, 19]], lines: [[0, 1], [1, 2], [2, 3], [0, 4], [3, 4]] },
  // Aquarius — onda d'água
  { stars: [[4, 8], [8, 11], [12, 8], [16, 11], [20, 8], [13, 17], [16, 20]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6]] },
  // Pisces — V com nó
  { stars: [[5, 5], [9, 9], [13, 12], [17, 15], [20, 19], [16, 8], [12, 7]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 6], [6, 5]] },
];

const PLANET_GLYPHS: { paths: string[]; circles?: { cx: number; cy: number; r: number; fill?: boolean }[] }[] = [
  // Sun
  { paths: [], circles: [{ cx: 12, cy: 12, r: 8 }, { cx: 12, cy: 12, r: 1.5, fill: true }] },
  // Moon
  { paths: ["M 9 4 a 8 8 0 1 0 0 16 a 6 6 0 1 1 0 -12"], circles: [] },
  // Mercury
  { paths: ["M 7 3 Q 12 -1 17 3 M 12 16 L 12 22 M 9 19 L 15 19"], circles: [{ cx: 12, cy: 10, r: 4 }] },
  // Venus
  { paths: ["M 12 15 L 12 22 M 9 19 L 15 19"], circles: [{ cx: 12, cy: 9, r: 5 }] },
  // Mars
  { paths: ["M 14 10 L 21 3 M 16 3 L 21 3 L 21 8"], circles: [{ cx: 10, cy: 14, r: 5 }] },
  // Jupiter
  { paths: ["M 4 8 C 4 3, 11 3, 11 8 L 11 20 M 6 14 L 18 14"], circles: [] },
  // Saturn
  { paths: ["M 8 3 L 8 17 M 4 6 L 12 6 M 8 17 C 17 17, 17 8, 13 8"], circles: [] },
  // Uranus
  { paths: ["M 5 3 L 5 12 M 19 3 L 19 12 M 5 7 L 19 7 M 12 12 L 12 17"], circles: [{ cx: 12, cy: 20, r: 2 }] },
  // Neptune
  { paths: ["M 12 5 L 12 21 M 5 5 L 5 11 a 7 7 0 0 0 14 0 L 19 5 M 8 21 L 16 21"], circles: [] },
  // Pluto
  { paths: ["M 6 3 L 6 21 M 6 3 L 14 3 a 4 4 0 0 1 0 8 L 6 11"], circles: [{ cx: 10, cy: 16, r: 2 }] },
];

const SymbolOrbit = ({ kind }: { kind: "zodiac" | "planets" }) => {
  const cx = 100;
  const cy = 110;
  const rx = 96;
  const ry = 38;
  const glyphSize = 18;
  const count = kind === "zodiac" ? 12 : 10;
  const tilt = -7.2;
  const sphereR = 78;
  const maskId = `orbitMask-${kind}`;

  const scale = glyphSize / 24;
  const offset = (gx: number, gy: number) => `translate(${gx - scale * 12} ${gy - scale * 12}) scale(${scale})`;

  const renderGlyph = (i: number, x: number, y: number) => {
    if (kind === "zodiac") {
      const c = ZODIAC_CONSTELLATIONS[i];
      return (
        <g
          key={i}
          transform={offset(x, y)}
          fill="hsl(var(--foreground))"
          stroke="hsl(var(--foreground))"
          strokeWidth={0.35 / scale}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {c.lines.map(([a, b], k) => (
            <line
              key={`l${k}`}
              x1={c.stars[a][0]}
              y1={c.stars[a][1]}
              x2={c.stars[b][0]}
              y2={c.stars[b][1]}
              opacity={0.55}
            />
          ))}
          {c.stars.map(([sx, sy], k) => (
            <circle key={`s${k}`} cx={sx} cy={sy} r={0.9 / scale} />
          ))}
        </g>
      );
    }
    const g = PLANET_GLYPHS[i];
    const gid = `planetChrome-${i}`;
    return (
      <g
        key={i}
        transform={offset(x, y)}
        fill="none"
        strokeWidth={1.6 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          {i === 7 ? (
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd1ec" />
              <stop offset="20%" stopColor="#ff7ac6" />
              <stop offset="40%" stopColor="#b388ff" />
              <stop offset="60%" stopColor="#7afcff" />
              <stop offset="80%" stopColor="#7cf0a0" />
              <stop offset="100%" stopColor="#fff6a8" />
            </linearGradient>
          ) : i === 4 ? (
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="20%" stopColor="#c81a1a" />
              <stop offset="45%" stopColor="#5a0606" />
              <stop offset="55%" stopColor="#1a0000" />
              <stop offset="72%" stopColor="#8a0a0a" />
              <stop offset="90%" stopColor="#ff2a2a" />
              <stop offset="100%" stopColor="#ffb3b3" />
            </linearGradient>
          ) : (
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#ffd6e7" />
              <stop offset="35%" stopColor="#e8e8ec" />
              <stop offset="50%" stopColor="#9aa0a8" />
              <stop offset="65%" stopColor="#cfd4da" />
              <stop offset="82%" stopColor="#c8f0ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          )}
        </defs>
        <g stroke={`url(#${gid})`}>
          {g.paths.map((d, j) => <path key={j} d={d} />)}
          {g.circles?.map((c, j) => (
            <circle key={`c${j}`} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill ? `url(#${gid})` : "none"} />
          ))}
        </g>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 200 240" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        {/* Mask oculta a metade superior (atrás) da esfera, permitindo que planetas passem por trás */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="240">
          <rect x="0" y="0" width="200" height="240" fill="white" />
          <path
            d={`M ${cx - sphereR} ${cy} A ${sphereR} ${sphereR} 0 0 1 ${cx + sphereR} ${cy} Z`}
            fill="black"
          />
        </mask>
      </defs>
      {/* Trapezoid base */}
      <path d="M 60 215 L 140 215 L 128 195 L 72 195 Z" fill="hsl(var(--background) / 0.8)" stroke="hsl(var(--foreground))" strokeWidth="0.8" strokeLinejoin="round" />
      <line x1="72" y1="195" x2="128" y2="195" stroke="hsl(var(--foreground))" strokeWidth="0.6" />
      {/* Sphere — mesmo tamanho do desenho original */}
      <circle cx={cx} cy={cy} r={sphereR} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="0.8" />
      {/* Órbita inclinada — planetas atrás (metade superior) ocultados pela máscara da esfera */}
      <g transform={`rotate(${tilt} ${cx} ${cy})`} mask={`url(#${maskId})`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" strokeDasharray="1.5 2.5" opacity="0.55" />
        <g>
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * rx;
            const y = cy + Math.sin(angle) * ry;
            return renderGlyph(i, x, y);
          })}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`-360 ${cx} ${cy}`}
            dur="55s"
            repeatCount="indefinite"
          />
        </g>
      </g>
    </svg>
  );
};

export default Hero;
