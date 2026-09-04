import * as React from "react";

const PATHS: Record<string, React.ReactNode> = {
  aries: (
    <>
      <path d="M12 20 C 9 20, 6 17, 5 12 C 4 8, 5 4, 8 4 C 10 4, 11 6, 10 8 C 9 9, 8 9, 7 8" />
      <path d="M12 20 C 15 20, 18 17, 19 12 C 20 8, 19 4, 16 4 C 14 4, 13 6, 14 8 C 15 9, 16 9, 17 8" />
    </>
  ),
  taurus: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M4 5 C 6 9, 9 10, 12 10" />
      <path d="M20 5 C 18 9, 15 10, 12 10" />
    </>
  ),
  gemini: (
    <>
      <path d="M7 4 L 7 20" />
      <path d="M17 4 L 17 20" />
      <path d="M5 5 L 19 5" />
      <path d="M5 19 L 19 19" />
    </>
  ),
  cancer: (
    <>
      <path d="M4 8 C 10 5, 15 7, 16 11" />
      <circle cx="17" cy="10" r="2" />
      <path d="M20 16 C 14 19, 9 17, 8 13" />
      <circle cx="7" cy="14" r="2" />
    </>
  ),
  leo: (
    <>
      <circle cx="6.5" cy="16.5" r="3.6" />
      <path d="M9.5 13.5 C 11 4.5, 19 2.5, 22 7.5 C 24 11.5, 20.5 16.5, 18 15" />
    </>
  ),
  virgo: (
    <>
      <path d="M4 20 L 4 7 C 4 4, 8 4, 8 7 L 8 20" />
      <path d="M8 7 C 8 4, 12 4, 12 7 L 12 20" />
      <path d="M12 7 C 12 4, 16 4, 16 7 L 16 18 C 16 22, 20 21, 20 17" />
      <path d="M20 17 C 20 13, 16 13, 16 17" />
    </>
  ),
  libra: (
    <>
      <path d="M4 19 L 20 19" />
      <path d="M5 15 L 19 15" />
      <path d="M6 15 C 6 10, 9 7, 12 7 C 15 7, 18 10, 18 15" />
    </>
  ),
  scorpio: (
    <>
      <path d="M3 18 L 3 8 C 3 5, 7 5, 7 8 L 7 18" />
      <path d="M7 8 C 7 5, 11 5, 11 8 L 11 18" />
      <path d="M11 8 C 11 5, 15 5, 15 8 L 15 20" />
      <path d="M15 20 L 21 14" />
      <path d="M21 14 L 18 14 M 21 14 L 21 17" />
    </>
  ),
  sagittarius: (
    <>
      <path d="M4 20 L 20 4" />
      <path d="M20 4 L 14 4 M 20 4 L 20 10" />
      <path d="M8 12 L 14 18" />
    </>
  ),
  capricorn: (
    <>
      <path d="M4 5 L 9 18 L 13 8 L 16 18" />
      <circle cx="18" cy="17" r="3" />
    </>
  ),
  aquarius: (
    <>
      <path d="M3 9 L 7 6 L 11 9 L 15 6 L 19 9 L 21 7.5" />
      <path d="M3 15 L 7 12 L 11 15 L 15 12 L 19 15 L 21 13.5" />
    </>
  ),
  pisces: (
    <>
      <path d="M4 4 C 8 9, 8 15, 4 20" />
      <path d="M20 4 C 16 9, 16 15, 20 20" />
      <path d="M6 12 L 18 12" />
    </>
  ),
};

const ORDER = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

export function ZodiacGlyph({
  index,
  size = 14,
  strokeWidth = 1.1,
  className,
  style,
}: {
  index: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const key = ORDER[index];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {PATHS[key]}
    </svg>
  );
}

export default ZodiacGlyph;
