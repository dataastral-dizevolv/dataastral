import { CalendarioEfemerides } from "@/components/dashboard/CalendarioEfemerides";

export default function CalendarioPage() {
  return (
    <main className="bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <CalendarioEfemerides />
      </div>
    </main>
  );
}
