"use client";

import { cn } from "@/lib/utils";

type ExplicitVariant = "blue" | "white" | "black" | "pastel";
type Surface = "auto" | "dark" | "light";
type Tone = "brand" | "mono";

interface BrandIconProps {
  className?: string;
  alt?: string;
  /** Force a specific asset. When omitted / "auto", resolves from surface + tone. */
  variant?: ExplicitVariant | "auto";
  /** Background it sits on. "auto" reads the document dark class. */
  surface?: Surface;
  /** "brand" → Iris mark on light. "mono" → same mark (no separate mono asset). Dark surfaces use the same mark. */
  tone?: Tone;
}

/** Iris metallic sunburst mark — works on light and dark surfaces. */
const IRIS_MARK = "/brand/iris-mark.png";

const SRC: Record<ExplicitVariant, string> = {
  pastel: IRIS_MARK,
  blue: IRIS_MARK,
  white: IRIS_MARK,
  black: IRIS_MARK,
};

function resolveVariant(
  variant: BrandIconProps["variant"],
  surface: Surface,
  tone: Tone,
): ExplicitVariant {
  if (variant && variant !== "auto") return variant;

  let isDarkMode = false;
  if (typeof document !== "undefined") {
    isDarkMode = document.documentElement.classList.contains("dark");
  }

  const isDarkSurface = surface === "dark" || (surface === "auto" && isDarkMode);
  if (isDarkSurface) return "white";
  return tone === "mono" ? "black" : "blue";
}

export function BrandIcon({
  className = "h-8 w-8",
  alt = "Data Iris",
  variant = "auto",
  surface = "auto",
  tone = "brand",
}: BrandIconProps) {
  const resolved = resolveVariant(variant, surface, tone);

  return (
    // Native img matches Lovable BrandIcon. Next/Image wraps a 128×128 box that
    // reads as a white plate on dark heroes/menus even with unoptimized + transparent CSS.
    <img
      src={SRC[resolved]}
      alt={alt}
      width={128}
      height={128}
      className={cn("select-none bg-transparent object-contain", className)}
      decoding="async"
      draggable={false}
    />
  );
}

export default BrandIcon;
