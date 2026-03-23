import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StepResultProps {
  selectedQuestion: string;
  prediction: string;
  eventDate?: string;
  remainingCredits: number | null;
  onReset: () => void;
}

export function StepResult({ selectedQuestion, prediction, eventDate, remainingCredits, onReset }: StepResultProps) {
  const paragraphs = prediction
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const noAspectFound =
    prediction.toLowerCase().includes("nenhum aspecto encontrado") ||
    prediction.toLowerCase().includes("nenhum transito") ||
    (eventDate ?? "").toLowerCase().includes("nenhum transito") ||
    (eventDate ?? "").toLowerCase().includes("sem transito");

  return (
    <div className="space-y-6">
      <div>
        <Badge className="badge-harmonia mb-3">Sua previsão</Badge>
        <h3 className="mt-2 font-display text-lg italic leading-snug text-foreground">{selectedQuestion}</h3>
        <p className="mt-1 font-body text-xs text-iris-secondary">com base no seu mapa natal</p>
        {eventDate ? <p className="mt-1 font-mono-iris text-[11px] uppercase tracking-wider text-iris-muted">Data do evento: {eventDate}</p> : null}
        {remainingCredits !== null ? (
          <p className="mt-1 font-mono-iris text-[11px] uppercase tracking-wider text-iris-muted">Créditos restantes: {remainingCredits}</p>
        ) : null}
      </div>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 24)}`} className="font-body text-sm leading-relaxed text-iris-secondary">
            {paragraph}
          </p>
        ))}

        {noAspectFound ? (
          <p className="rounded-lg border border-iris-accent/20 bg-muted/20 px-3 py-2 font-body text-sm text-iris-secondary">
            Não encontramos gatilhos fortes nesta janela. Tente outra pergunta ou mude o tema para explorar novas possibilidades.
          </p>
        ) : null}
      </div>

      <Button type="button" variant="ghost" onClick={onReset} className="w-full text-sm text-iris-secondary hover:text-foreground">
        Fazer outra pergunta
      </Button>
    </div>
  );
}
