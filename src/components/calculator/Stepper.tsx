import { Check } from "lucide-react";

import type { CalcState, CalcStep } from "@/types/calculator";

interface StepperProps {
  currentStep: CalcStep;
  state: CalcState;
}

export function Stepper({ currentStep, state }: StepperProps) {
  const steps = [
    { num: 1, label: "Tema" },
    { num: 2, label: "Pergunta" },
    { num: 3, label: "Dados" },
    { num: 4, label: "Previsão" },
  ];

  const isComplete = (stepNum: number) => (state === "result" ? stepNum < 4 : state === "loading" ? stepNum <= 3 : stepNum < currentStep);
  const isActive = (stepNum: number) => (state === "flow" ? stepNum === currentStep : stepNum === 4);

  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.num} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono-iris transition-all ${
                isComplete(step.num)
                  ? "bg-muted text-muted-foreground"
                  : isActive(step.num)
                    ? "bg-primary text-primary-foreground"
                    : "border border-iris text-iris-muted"
              }`}
            >
              {isComplete(step.num) ? <Check size={13} /> : step.num}
            </div>
            <span className={`hidden text-[10px] uppercase tracking-wider sm:block ${isActive(step.num) ? "text-iris-accent" : "text-iris-muted"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div className={`mx-2 mt-[-18px] h-px flex-1 sm:mt-0 ${isComplete(step.num + 1) || isActive(step.num + 1) ? "bg-primary/40" : "bg-iris-muted/20"}`} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
