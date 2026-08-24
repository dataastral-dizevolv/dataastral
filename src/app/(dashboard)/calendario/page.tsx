import { CalendarioEfemerides } from "@/components/dashboard/CalendarioEfemerides";

export default function CalendarioPage() {
  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8 max-w-6xl">
        <p className="mb-2 font-ubuntu text-[10px] tracking-[0.22em] text-muted-foreground uppercase">Planner</p>
        <h1 className="font-ubuntu text-4xl leading-[1.05] font-black tracking-tight text-foreground sm:text-5xl">
          Energias do Momento
        </h1>
      </div>
      <div className="max-w-6xl">
        <CalendarioEfemerides />
      </div>
    </main>
  );
}
