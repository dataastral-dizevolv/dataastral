import { CalendarioEfemerides } from "@/components/dashboard/CalendarioEfemerides";

export default function CalendarioPage() {
  return (
    <main className="min-h-full bg-background px-4 pt-6 pb-20 font-ubuntu sm:px-6 md:px-8 md:pt-8 md:pb-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 md:mb-14">
          <p className="mb-5 font-ubuntu text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Planner</p>
          <h1 className="mb-2 font-ubuntu text-4xl leading-[1.05] font-black tracking-[-0.035em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Energias do Momento
          </h1>
        </div>
        <CalendarioEfemerides />
      </div>
    </main>
  );
}
