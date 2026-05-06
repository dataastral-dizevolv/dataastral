"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

const STAR_COORDS: Array<[number, number]> = [
  [18, 26], [44, 38], [71, 24], [95, 40], [123, 29], [148, 45], [176, 22], [202, 36], [227, 28], [256, 42],
  [281, 20], [309, 34], [336, 26], [361, 40], [389, 23], [415, 37], [442, 31], [468, 44], [497, 24], [522, 39],
  [548, 21], [576, 35], [602, 29], [628, 41], [655, 23], [682, 38], [709, 27], [735, 43], [761, 25], [787, 37],
  [814, 30], [842, 46], [868, 22], [894, 34], [921, 28], [946, 40], [973, 24], [998, 36], [52, 70], [81, 86],
  [108, 76], [132, 91], [161, 72], [187, 88], [214, 79], [242, 94], [268, 73], [295, 89], [321, 78], [348, 92],
  [375, 74], [401, 87], [428, 77], [455, 93], [482, 75], [508, 90], [536, 80], [561, 95], [588, 74], [615, 88],
  [642, 136], [670, 152], [696, 140], [722, 157], [749, 143], [776, 160], [803, 138], [829, 154], [856, 145], [883, 159],
  [910, 141], [936, 156], [963, 147], [990, 161], [36, 186], [64, 201], [90, 190], [117, 206], [144, 192], [171, 208],
  [198, 194], [224, 210], [251, 191], [278, 207], [304, 196], [331, 212], [358, 193], [386, 209], [412, 198], [438, 214],
  [466, 242], [493, 257], [520, 246], [547, 261], [574, 248], [602, 264], [629, 245], [656, 260], [683, 249], [710, 263],
  [738, 247], [764, 262], [791, 250], [818, 265], [845, 246], [872, 259], [900, 251], [927, 266], [954, 248], [981, 264],
];

function renderStars(start: number, count: number, minRadius: number, maxRadius: number, minOpacity: number, maxOpacity: number) {
  return STAR_COORDS.slice(start, start + count).map(([x, y], index) => {
    const ratio = count <= 1 ? 0 : index / (count - 1);
    const radius = minRadius + (maxRadius - minRadius) * ratio;
    const opacity = minOpacity + (maxOpacity - minOpacity) * (((index * 7) % count) / Math.max(count - 1, 1));

    return <circle key={`star-${start + index}`} cx={x} cy={y} r={radius} fill={`hsl(0 0% 90% / ${opacity.toFixed(3)})`} />;
  });
}

export default function StarField() {
  const prefersReducedMotion = useReducedMotion();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const onScroll = () => {
      setScrollY(window.scrollY || 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [prefersReducedMotion]);

  const distantStars = useMemo(() => renderStars(0, 60, 0.4, 0.8, 0.25, 0.4), []);
  const mediumStars = useMemo(() => renderStars(60, 35, 0.8, 1.4, 0.35, 0.55), []);
  const nearStars = useMemo(() => renderStars(95, 15, 1.4, 2.2, 0.5, 0.7), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <g
          style={{
            transform: `translateY(${(scrollY * 0.03).toFixed(2)}px)`,
            willChange: "transform",
          }}
        >
          {distantStars}
        </g>
        <g
          style={{
            transform: `translateY(${(scrollY * 0.06).toFixed(2)}px)`,
            willChange: "transform",
          }}
        >
          {mediumStars}
        </g>
        <g
          style={{
            transform: `translateY(${(scrollY * 0.1).toFixed(2)}px)`,
            willChange: "transform",
          }}
        >
          {nearStars}
        </g>
      </svg>
    </div>
  );
}
