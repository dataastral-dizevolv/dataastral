import { Button } from "@/components/ui/button";

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
        <Button type="button" variant="ghost" onClick={onBack} className="mb-3 h-auto p-0 text-xs text-iris-secondary hover:text-foreground">
          Voltar aos temas
        </Button>
        <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 2</p>
        <h3 className="font-display text-lg text-foreground">Escolha sua pergunta</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-11 animate-pulse rounded-xl border border-iris/50 bg-muted/30" />
            <div className="h-11 animate-pulse rounded-xl border border-iris/50 bg-muted/30" />
            <div className="h-11 animate-pulse rounded-xl border border-iris/50 bg-muted/30" />
          </div>
        ) : null}

        {!loading && loadError ? <p className="text-xs text-amber-300">{loadError}</p> : null}

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
              className={`h-auto w-full justify-start rounded-xl p-4 text-left ${selected ? "border-iris-accent bg-muted shadow-iris-glow" : "border-iris hover:border-iris-accent/50 hover:bg-muted/30"}`}
            >
              <span className={`text-sm leading-relaxed ${selected ? "text-foreground" : "text-iris-secondary"}`}>{question}</span>
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
