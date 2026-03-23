import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-14">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(48 30% 93% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(48 30% 93% / 0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, hsl(var(--iris-secondary) / 0.2), transparent 45%), radial-gradient(circle at 80% 0%, hsl(var(--iris-accent-glow)), transparent 45%)",
        }}
      />

      <Link href="/" className="absolute top-6 left-6 font-display text-lg italic tracking-tight text-iris-accent md:text-xl">
        DATA ASTRAL
      </Link>

      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
