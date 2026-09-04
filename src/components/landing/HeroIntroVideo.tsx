"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface HeroIntroVideoProps {
  /** Chamado quando o vídeo entra na fase de textura de fundo (título pode aparecer). */
  onSettled?: () => void;
  className?: string;
}

const FADE_IN = 2.4; // s
const RESIDUAL_OPACITY = 0.16;
const SAFETY_MS = 4500;
/** Início do segmento em que a mandala já está no tamanho final. */
const START_AT = 7.7; // s
/** Antecedência (s) para começar o fade até a textura residual. */
const SETTLE_BEFORE_END = 1.6;
/** Velocidade de reprodução: < 1 deixa a mandala mais lenta e presente por mais tempo. */
const PLAYBACK_RATE = 0.65;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Camada de abertura do hero: mandala em vídeo, sempre no mesmo tamanho.
 * Inicia direto no segmento final (sem o salto de escala do corte interno),
 * anima apenas a opacidade e congela no último quadro como textura residual.
 */
export const HeroIntroVideo: React.FC<HeroIntroVideoProps> = ({
  onSettled,
  className = "",
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const settledRef = React.useRef(false);
  const [reduced] = React.useState(prefersReducedMotion);
  const [opacity, setOpacity] = React.useState(reduced ? RESIDUAL_OPACITY : 0);

  const settle = React.useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setOpacity(RESIDUAL_OPACITY);
    onSettled?.();
  }, [onSettled]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Posiciona no segmento em que a mandala já está no tamanho final
    const seekToSegment = () => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      if (video.currentTime < START_AT) {
        try {
          video.currentTime = Math.min(START_AT, Math.max(0, dur - 0.05));
        } catch {
          /* ignore */
        }
      }
    };

    if (reduced) {
      const applyStatic = () => {
        seekToSegment();
        video.playbackRate = PLAYBACK_RATE;
        video.pause();
      };
      video.addEventListener("loadedmetadata", applyStatic);
      if (video.readyState >= 1) applyStatic();
      settle();
      return () => video.removeEventListener("loadedmetadata", applyStatic);
    }

    let started = false;
    let finished = false;

    const handleMeta = () => {
      seekToSegment();
      video.playbackRate = PLAYBACK_RATE;
    };

    const handleReady = () => {
      if (started || finished) return;
      started = true;
      seekToSegment();
      video.playbackRate = PLAYBACK_RATE;
      if (!settledRef.current) setOpacity(1);
      video.play().catch(() => {
        /* autoplay bloqueado — o safety timer revela o título */
      });
    };

    const freeze = () => {
      finished = true;
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        try {
          // parar um pouco antes do fim evita o rewind automático do browser
          video.currentTime = Math.max(0, dur - 0.08);
        } catch {
          /* ignore */
        }
      }
      video.pause();
      settle();
    };

    const handleTimeUpdate = () => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      if (!finished && video.currentTime >= dur - 0.12) {
        freeze();
        return;
      }
      if (video.currentTime >= dur - SETTLE_BEFORE_END) settle();
    };

    const handleEnded = () => {
      if (finished) return;
      freeze();
    };

    video.addEventListener("loadedmetadata", handleMeta);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", settle);

    if (video.readyState >= 2) handleReady();

    // Rede lenta / autoplay bloqueado: garante que o título apareça
    const safety = window.setTimeout(() => {
      if (video.paused || video.readyState < 2) settle();
    }, SAFETY_MS);

    return () => {
      window.clearTimeout(safety);
      video.removeEventListener("loadedmetadata", handleMeta);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", settle);
    };
  }, [reduced, settle]);

  const mask =
    "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 42%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 76%)";

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      animate={{ opacity }}
      transition={{
        duration: settledRef.current ? 3.2 : FADE_IN,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        mixBlendMode: "screen",
      }}
    >
      <video
        ref={videoRef}
        src="/videos/hero-intro.mp4"
        muted
        playsInline
        autoPlay
        preload="auto"
        loop={false}
        className="absolute inset-0 w-full h-full object-contain"
      />
    </motion.div>
  );
};

export default HeroIntroVideo;
