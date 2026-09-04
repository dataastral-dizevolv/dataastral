"use client";

const AnimatedGradientBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, hsl(210 40% 97%) 0%, hsl(210 35% 95%) 45%, hsl(215 30% 93%) 100%)",
      }}
    />
  );
};

export default AnimatedGradientBackground;
