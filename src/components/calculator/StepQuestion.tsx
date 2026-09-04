import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StepQuestionProps {
  questions: string[];
  loading: boolean;
  loadError: string | null;
  selectedQuestion: string | null;
  onBack: () => void;
  onSelectQuestion: (question: string) => void;
  onContinue: () => void;
}

export function StepQuestion({
  questions,
  loading,
  loadError,
  selectedQuestion,
  onBack,
  onSelectQuestion,
  onContinue,
}: StepQuestionProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 text-xs text-muted-foreground hover:border-iris-accent/40 hover:bg-card hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Voltar
        </Button>
        <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 2</p>
        <h3 className="font-display text-lg text-foreground">Escolha sua pergunta</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-11 animate-pulse rounded-2xl border border-border bg-muted/40" />
            <div className="h-11 animate-pulse rounded-2xl border border-border bg-muted/40" />
            <div className="h-11 animate-pulse rounded-2xl border border-border bg-muted/40" />
          </div>
        ) : null}

        {!loading && loadError ? <p className="text-xs text-destructive">{loadError}</p> : null}

        {!loading && !loadError && questions.length === 0 ? (
          <p className="text-xs text-iris-muted">Nenhuma pergunta disponível para este tema no momento.</p>
        ) : null}

        {!loading && !loadError && questions.map((question) => {
          const selected = selectedQuestion === question;

          return (
            <Button
              key={question}
              type="button"
              variant="outline"
              onClick={() => onSelectQuestion(question)}
              className={`h-auto w-full justify-start rounded-2xl border bg-card/60 p-4 text-left shadow-sm ${selected ? "border-powder-blue bg-powder-blue/15 text-foreground ring-1 ring-powder-blue/40" : "border-border hover:border-iris-accent/40 hover:bg-card"}`}
            >
              <span className={`text-sm leading-relaxed ${selected ? "text-foreground" : "text-muted-foreground"}`}>{question}</span>
            </Button>
          );
        })}
      </div>

      <Button type="button" disabled={!selectedQuestion || loading || Boolean(loadError)} onClick={onContinue} className="w-full font-body text-xs uppercase tracking-wider">
        Continuar
      </Button>
    </div>
  );
}
