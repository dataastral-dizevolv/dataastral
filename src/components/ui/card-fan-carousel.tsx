"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface FanCardItem {
  id: string;
  index: string;
  title: string;
  description: string;
  href?: string;
  tone: { bg: string; fg: string; meta: string; desc: string };
}

interface CardFanCarouselProps {
  items: FanCardItem[];
  onSelect?: (item: FanCardItem) => void;
  curve?: "default" | "wide" | "down";
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
];

const FAN_POSITIONS_WIDE = [
  { rot: -18, scale: 0.7756, x: -42, y: -4.5, zIndex: 1 },
  { rot: -12, scale: 0.8498, x: -30, y: -2.2, zIndex: 2 },
  { rot: -6, scale: 0.9346, x: -15, y: -0.6, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 6, scale: 0.9346, x: 15, y: -0.6, zIndex: 3 },
  { rot: 12, scale: 0.8498, x: 30, y: -2.2, zIndex: 2 },
  { rot: 18, scale: 0.7756, x: 42, y: -4.5, zIndex: 1 },
];

const FAN_POSITIONS_DOWN = [
  { rot: -18, scale: 0.7756, x: -42, y: 4.5, zIndex: 1 },
  { rot: -12, scale: 0.8498, x: -30, y: 2.2, zIndex: 2 },
  { rot: -6, scale: 0.9346, x: -15, y: 0.6, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 6, scale: 0.9346, x: 15, y: 0.6, zIndex: 3 },
  { rot: 12, scale: 0.8498, x: 30, y: 2.2, zIndex: 2 },
  { rot: 18, scale: 0.7756, x: 42, y: 4.5, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.26;
  if (width < 640) return 0.38;
  if (width < 768) return 0.5;
  if (width < 1024) return 0.75;
  return 1.0;
}

function getHeightMultiplier(width: number) {
  let idealPx: number;
  if (width < 480) idealPx = 27.5 * 16;
  else if (width < 640) idealPx = 32.5 * 16;
  else if (width < 768) idealPx = 35 * 16;
  else if (width < 1024) idealPx = 42.5 * 16;
  else idealPx = 47.5 * 16;

  const available = window.innerHeight * 0.7;
  if (available >= idealPx) return 1;
  return available / idealPx;
}

function getSlotConfig(totalCards: number, slot: number, curve: "default" | "wide" | "down" = "default") {
  const positions =
    curve === "wide" ? FAN_POSITIONS_WIDE : curve === "down" ? FAN_POSITIONS_DOWN : FAN_POSITIONS;
  if (totalCards >= MAX_VISIBLE) return positions[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  const base = positions[HALF];
  const maxRot = Math.abs(positions[0].rot);
  const maxX = Math.abs(positions[0].x);
  const maxY = positions[0].y;
  return {
    rot: distance * maxRot,
    scale: 1.0 - (1.0 - base.scale) * absDistance * absDistance,
    x: distance * maxX,
    y: absDistance * absDistance * maxY,
    zIndex: 10 - Math.abs(slot - center),
  };
}

const ARROW_CLASSES =
  "relative flex items-center justify-center h-8 w-8 rounded-full border-[1.5px] border-foreground/10 bg-foreground/5 backdrop-blur-[16px] text-foreground/50 cursor-pointer shrink-0 z-30 outline-none hover:border-foreground/25 hover:text-foreground/80 active:opacity-70 transition-colors duration-300";

export default function CardFanCarousel({ items, onSelect, curve = "default" }: CardFanCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  const totalCards = items.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inView, setInView] = useState(false);

  // Reveal on scroll — dispara a entrada em leque apenas uma vez
  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  const getVisibleMap = useCallback(
    (center: number) => {
      const map = new Map<number, number>();
      if (!needsPagination) {
        items.forEach((_, i) => map.set(i, i));
        return map;
      }
      for (let slot = 0; slot < MAX_VISIBLE; slot++) {
        map.set((((center + slot - HALF) % totalCards) + totalCards) % totalCards, slot);
      }
      return map;
    },
    [totalCards, needsPagination, items]
  );

  const cycle = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || !needsPagination || selectedIndex !== null) return;
      isAnimating.current = true;
      directionRef.current = direction;
      setCenterIndex((prev) =>
        direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
      );
    },
    [totalCards, needsPagination, selectedIndex]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(
      container.querySelectorAll<HTMLElement>(".fan-card")
    );
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot: number) => getSlotConfig(slotCount, slot, curve);
    const hasSelection = selectedIndex !== null;

    if (isFirstMount && !inView) {
      gsap.set(cardElements, { opacity: 0, scale: 0.72, x: 0, y: 0, rotation: 0 });
      return;
    }

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = cardElements.length;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);
      const isSelected = hasSelection && selectedIndex === cardIndex;

      if (isSelected) {
        gsap.to(card, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1.22,
          opacity: 1,
          zIndex: 50,
          duration: 0.55,
          ease: "power2.out",
          onComplete: onCardDone,
        });
      } else if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const dimmed = hasSelection ? 0.28 : 1;
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: dimmed,
          zIndex,
        };

        if (isFirstMount) {
          // 1) cada carta aparece em fade, em sequência, numa curva mais aberta
          // 2) depois todas se unem no leque atual
          const spreadX = x * multiplier * 1.7;
          const spreadY = y * hMult - 1.6 * hMult;
          const stepIn = 0.13;
          const revealDelay = slot * stepIn;
          const totalReveal = (slotCount - 1) * stepIn + 0.45;

          gsap.set(card, {
            x: `${spreadX}rem`,
            y: `${spreadY}rem`,
            rotation: rot * 1.5,
            scale: scale * 0.9,
            opacity: 0,
            zIndex,
          });
          gsap.to(card, {
            opacity: dimmed,
            scale: scale * 0.96,
            duration: 0.45,
            ease: "power2.out",
            delay: revealDelay,
          });
          gsap.to(card, {
            ...target,
            duration: 0.9,
            ease: "power3.inOut",
            delay: totalReveal + 0.12,
            onComplete: onCardDone,
          });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          gsap.set(card, {
            x: `${enterX}rem`,
            y: `${y * hMult}rem`,
            rotation: direction === "right" ? 30 : -30,
            scale: 0.5,
            opacity: 0,
          });
          gsap.to(card, { ...target, duration: 0.6, ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -40 : 40;
        gsap.to(card, {
          x: `${exitX}rem`,
          opacity: 0,
          scale: 0.5,
          rotation: direction === "right" ? -30 : 30,
          duration: 0.4,
          ease: "power2.in",
          zIndex: 0,
        });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      if (selectedIndex !== null) return;
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 2.5 * hM;
            targetScale *= 1.08;
          } else {
            const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength =
              8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));

            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 3 / (distance + 1);
            }

            if (slot === visibleEntries.length - 1 && hoveredSlot < centerSlot) targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot) targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`,
          y: `${targetY}rem`,
          rotation: targetRot,
          scale: targetScale,
          duration: 0.5,
          delay,
          ease: "elastic.out(1,.75)",
          overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    };

    const finePointer =
      typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const enterHandlers = finePointer
      ? visibleEntries.map(({ el, slot }) => {
          const handler = () => {
            if (isAnimating.current || selectedIndex !== null) return;
            if (leaveTimer) {
              clearTimeout(leaveTimer);
              leaveTimer = null;
            }
            if (activeSlot !== slot) {
              activeSlot = slot;
              updateHoverLayout(slot);
            }
          };
          el.addEventListener("mouseenter", handler);
          return { el, handler };
        })
      : [];

    const onMouseLeave = () => {
      if (isAnimating.current || selectedIndex !== null) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        updateHoverLayout(null);
      }, 50);
    };
    if (finePointer) container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      if (!isAnimating.current && selectedIndex === null) updateHoverLayout(activeSlot);
    };
    window.addEventListener("resize", onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "ArrowRight") {
        const next = (selectedIndex + 1) % totalCards;
        setSelectedIndex(next);
        setCenterIndex(next);
      } else if (e.key === "ArrowLeft") {
        const prev = (selectedIndex - 1 + totalCards) % totalCards;
        setSelectedIndex(prev);
        setCenterIndex(prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, getVisibleMap, needsPagination, selectedIndex, curve, inView]);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragMoved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (selectedIndex !== null) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragMoved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (selectedIndex !== null) return;
    const start = dragStart.current;
    if (!start || dragMoved.current) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    dragMoved.current = true;
    dragStart.current = null;
    cycle(dx < 0 ? "right" : "left");
  };

  const onPointerEnd = () => {
    dragStart.current = null;
    setTimeout(() => {
      dragMoved.current = false;
    }, 0);
  };

  const handleCardClick = (index: number) => {
    if (dragMoved.current) return;
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
      setCenterIndex(index);
    }
  };

  const handleArrowClick = (e: React.MouseEvent, item: FanCardItem) => {
    e.stopPropagation();
    e.preventDefault();
    if (onSelect) onSelect(item);
  };

  if (!totalCards) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={`relative w-full h-[23rem] sm:h-[29.5rem] md:h-[34.5rem] lg:h-[38rem] flex items-center justify-center touch-pan-y select-none ${
          selectedIndex !== null ? "overflow-x-clip overflow-y-visible" : "overflow-hidden"
        }`}
      >
        {selectedIndex !== null && (
          <div
            className="absolute inset-0 z-20 bg-background/30 backdrop-blur-[2px] cursor-pointer"
            aria-label="Fechar card"
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              if (!dragMoved.current) setSelectedIndex(null);
            }}
          />
        )}

        {items.map((item, index) => (
          <article
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(index);
              }
            }}
            aria-label={selectedIndex === index ? `Fechar ${item.title}` : `Abrir ${item.title}`}
            aria-pressed={selectedIndex === index}
            className="fan-card absolute w-[10.5rem] h-[21rem] sm:w-[14rem] sm:h-[27.5rem] md:w-[17rem] md:h-[32.5rem] lg:w-[19rem] lg:h-[36rem] rounded-3xl border border-foreground/[0.08] overflow-hidden text-left will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            style={{
              backgroundColor: item.tone.bg,
              color: item.tone.fg,
              boxShadow: "0 24px 50px -24px rgba(0,0,0,0.45)",
              opacity: 0,
              cursor: selectedIndex === index ? "default" : "pointer",
            }}
          >
            <div className="h-full w-full flex flex-col justify-between p-4 sm:p-6">
              <span
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: item.tone.meta }}
              >
                {item.index} — Data Astral
              </span>

              <div className="flex flex-col gap-3">
                <h3
                  className="font-ubuntu font-extrabold text-[16px] sm:text-[22px] md:text-[28px] leading-[0.95] tracking-[-0.03em] break-words"
                  style={{ color: item.tone.fg }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[11px] sm:text-[13px] leading-[1.4] line-clamp-4"
                  style={{ color: item.tone.desc }}
                >
                  {item.description}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                {selectedIndex === index && (
                  <button
                    type="button"
                    onClick={(e) => handleArrowClick(e, item)}
                    className="relative z-30 flex items-center justify-center h-11 w-11 rounded-full hover:scale-110 active:scale-95 transition-transform duration-200 shadow-lg"
                    style={{
                      backgroundColor: item.tone.fg,
                      color: item.tone.bg,
                    }}
                    aria-label={`Ir para ${item.title}`}
                  >
                    <ArrowRight className="h-5 w-5" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {needsPagination && selectedIndex === null && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" className={ARROW_CLASSES} onClick={() => cycle("left")} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            {items.map((item, i) => (
              <span
                key={item.id}
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: i === centerIndex ? 22 : 8,
                  backgroundColor:
                    i === centerIndex ? "hsl(var(--blue-ink))" : "hsl(var(--foreground) / 0.2)",
                }}
              />
            ))}
          </div>
          <button type="button" className={ARROW_CLASSES} onClick={() => cycle("right")} aria-label="Próximo">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
