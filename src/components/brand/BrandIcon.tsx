"use client";

import Image from "next/image";
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
  /** "brand" → blue on light. "mono" → black on light. Dark surfaces use white. */
  tone?: Tone;
}

const SRC: Record<ExplicitVariant, string> = {
  pastel: "/brand/brand-star-pastel.png",
  blue: "/brand/brand-icon.png",
  white: "/brand/brand-star-pastel.png",
  black: "/brand/app-logo.png",
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
  alt = "Data Astral",
  variant = "auto",
  surface = "auto",
  tone = "brand",
}: BrandIconProps) {
  const resolved = resolveVariant(variant, surface, tone);

  return (
    <Image
      src={SRC[resolved]}
      alt={alt}
      width={128}
      height={128}
      className={cn("select-none object-contain", className)}
      priority
      draggable={false}
    />
  );
}

export default BrandIcon;
