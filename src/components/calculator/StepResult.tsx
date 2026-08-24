import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StepResultProps {
  selectedQuestion: string;
  prediction: string;
  eventDate?: string;
  engineCode?: string;
  remainingCredits: number | null;
  onReset: () => void;
}

const NO_ASPECT_CODES = new Set(["NO_RELEVANT_ASPECT_FOUND", "THEME_IN_CALIBRATION"]);

export function StepResult({ selectedQuestion, prediction, eventDate, engineCode, remainingCredits, onReset }: StepResultProps) {
  const paragraphs = prediction
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const noAspectFound =
    (engineCode ? NO_ASPECT_CODES.has(engineCode) : false) ||
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
          <p aria-live="polite" className="mt-1 font-mono-iris text-[11px] uppercase tracking-wider text-iris-muted">Créditos restantes: {remainingCredits}</p>
        ) : null}
      </div>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 24)}`} className="font-body text-sm leading-relaxed text-iris-secondary">
            {paragraph}
          </p>
        ))}

        {noAspectFound ? (
          <p className="rounded-2xl border border-border bg-card/70 px-3 py-2 font-body text-sm text-muted-foreground shadow-sm">
            {engineCode === "THEME_IN_CALIBRATION"
              ? "Este tema ainda está em calibração no Motor Iris. Nenhum crédito foi cobrado."
              : "Não encontramos aspectos relevantes no período de busca para esta pergunta. Tente reformular ou escolha outro tema."}
          </p>
        ) : null}
      </div>

      <Button type="button" variant="ghost" onClick={onReset} className="w-full text-sm text-iris-secondary hover:text-foreground">
        Fazer outra pergunta
      </Button>
    </div>
  );
}
