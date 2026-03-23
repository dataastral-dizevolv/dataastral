import { QUESTIONS } from "@/lib/calculator-data";
import { Button } from "@/components/ui/button";
import type { ThemeId } from "@/types/calculator";

interface StepQuestionProps {
  selectedTheme: ThemeId;
  selectedQuestion: string | null;
  onBack: () => void;
  onSelectQuestion: (question: string) => void;
  onContinue: () => void;
}

export function StepQuestion({
  selectedTheme,
  selectedQuestion,
  onBack,
  onSelectQuestion,
  onContinue,
}: StepQuestionProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="ghost" onClick={onBack} className="mb-3 h-auto p-0 text-xs text-iris-secondary hover:text-foreground">
          Voltar aos temas
        </Button>
        <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 2</p>
        <h3 className="font-display text-lg text-foreground">Escolha sua pergunta</h3>
      </div>

      <div className="space-y-3">
        {QUESTIONS[selectedTheme].map((question) => {
          const selected = selectedQuestion === question;

          return (
            <Button
              key={question}
              type="button"
              variant="outline"
              onClick={() => onSelectQuestion(question)}
              className={`h-auto w-full justify-start rounded-xl p-4 text-left ${selected ? "border-iris-accent bg-muted shadow-iris-glow" : "border-iris hover:border-iris-accent/50 hover:bg-muted/30"}`}
            >
              <span className={`text-sm leading-relaxed ${selected ? "text-foreground" : "text-iris-secondary"}`}>{question}</span>
            </Button>
          );
        })}
      </div>

      <Button type="button" disabled={!selectedQuestion} onClick={onContinue} className="w-full font-body text-xs uppercase tracking-wider">
        Continuar
      </Button>
    </div>
  );
}
