import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-14">
      <div className="mb-8 flex w-full max-w-md flex-col items-center">
        <Link href="/" className="flex flex-col items-center gap-3 transition-opacity hover:opacity-80">
          <img
            src="/brand/iris-logo-light.png"
            alt="Data Iris"
            width={280}
            height={160}
            className="h-24 w-auto bg-transparent object-contain mix-blend-multiply sm:h-28"
            decoding="async"
            draggable={false}
          />
          <p className="font-ubuntu text-[10px] font-light uppercase tracking-[0.22em] text-iris-accent">
            DATA IRIS
          </p>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
