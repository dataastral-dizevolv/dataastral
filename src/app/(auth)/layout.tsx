import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-14">
      <div className="mb-8 flex w-full max-w-md flex-col items-center">
        <Link href="/" className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/brand/brand-star-pastel.png"
            alt="Data Astral"
            width={128}
            height={128}
            className="h-28 w-28 object-contain sm:h-36 sm:w-36"
            priority
          />
          <p className="font-ubuntu text-[10px] font-light uppercase tracking-[0.22em] text-iris-accent">
            DATA ASTRAL
          </p>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
