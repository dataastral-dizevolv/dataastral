import { Check } from "lucide-react";

import type { CalcState, CalcStep } from "@/types/calculator";

interface StepperProps {
  currentStep: CalcStep;
  state: CalcState;
  onStepClick?: (step: CalcStep) => void;
}

export function Stepper({ currentStep, state, onStepClick }: StepperProps) {
  const steps = [
    { num: 1, label: "Tema" },
    { num: 2, label: "Pergunta" },
    { num: 3, label: "Dados" },
    { num: 4, label: "Previsão" },
  ];

  const isComplete = (stepNum: number) => (state === "result" ? stepNum < 4 : state === "loading" ? stepNum <= 3 : stepNum < currentStep);
  const isActive = (stepNum: number) => (state === "flow" ? stepNum === currentStep : stepNum === 4);
  const isClickable = (stepNum: number) => state === "flow" && stepNum < currentStep;

  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.num} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!onStepClick || !isClickable(step.num)) return;
                onStepClick(step.num as CalcStep);
              }}
              disabled={!isClickable(step.num)}
              aria-label={`Ir para passo ${step.num}: ${step.label}`}
              title={isClickable(step.num) ? `Voltar para ${step.label}` : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono-iris transition-all ${
                isComplete(step.num)
                  ? "bg-powder-blue/30 text-foreground"
                  : isActive(step.num)
                    ? "bg-iris-accent text-white shadow-sm"
                    : "border border-border bg-card text-muted-foreground"
              } ${isClickable(step.num) ? "cursor-pointer hover:border-iris-accent/50 hover:text-foreground" : "cursor-default disabled:opacity-100"}`}
            >
              {isComplete(step.num) ? <Check size={13} /> : step.num}
            </button>
            <span className={`hidden text-[10px] uppercase tracking-wider sm:block ${isActive(step.num) ? "text-iris-accent" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div className={`mx-2 mt-[-18px] h-px flex-1 sm:mt-0 ${isComplete(step.num + 1) || isActive(step.num + 1) ? "bg-powder-blue/60" : "bg-border"}`} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
