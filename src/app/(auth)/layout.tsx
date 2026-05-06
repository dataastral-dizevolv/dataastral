import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-14">
      <Link href="/" className="absolute top-6 left-6 font-display text-lg italic tracking-tight text-iris-accent md:text-xl">
        DATA ASTRAL
      </Link>

      <div className="w-full max-w-md mx-auto">{children}</div>
    </main>
  );
}
