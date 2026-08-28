const SIGNOS = [
  { nome: "Áries", simbolo: "♈︎", elemento: "Fogo" },
  { nome: "Touro", simbolo: "♉︎", elemento: "Terra" },
  { nome: "Gêmeos", simbolo: "♊︎", elemento: "Ar" },
  { nome: "Câncer", simbolo: "♋︎", elemento: "Água" },
  { nome: "Leão", simbolo: "♌︎", elemento: "Fogo" },
  { nome: "Virgem", simbolo: "♍︎", elemento: "Terra" },
  { nome: "Libra", simbolo: "♎︎", elemento: "Ar" },
  { nome: "Escorpião", simbolo: "♏︎", elemento: "Água" },
  { nome: "Sagitário", simbolo: "♐︎", elemento: "Fogo" },
  { nome: "Capricórnio", simbolo: "♑︎", elemento: "Terra" },
  { nome: "Aquário", simbolo: "♒︎", elemento: "Ar" },
  { nome: "Peixes", simbolo: "♓︎", elemento: "Água" },
] as const;

const PLANETAS = [
  { nome: "Sol", simbolo: "☉", tipo: "Luminar" },
  { nome: "Lua", simbolo: "☽", tipo: "Luminar" },
  { nome: "Mercúrio", simbolo: "☿", tipo: "Pessoal" },
  { nome: "Vênus", simbolo: "♀", tipo: "Pessoal" },
  { nome: "Marte", simbolo: "♂", tipo: "Pessoal" },
  { nome: "Júpiter", simbolo: "♃", tipo: "Social" },
  { nome: "Saturno", simbolo: "♄", tipo: "Social" },
  { nome: "Urano", simbolo: "♅", tipo: "Transpessoal" },
  { nome: "Netuno", simbolo: "♆", tipo: "Transpessoal" },
  { nome: "Plutão", simbolo: "♇", tipo: "Transpessoal" },
] as const;

export function PainelAstrologico() {
  return (
    <div className="w-full max-w-4xl space-y-8 border border-border bg-muted/20 p-6">
      <section>
        <h2 className="mb-4 font-jakarta text-xl font-semibold tracking-tight text-foreground">
          Signos do Zodíaco
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {SIGNOS.map((item) => (
            <div
              key={item.nome}
              className="group flex cursor-default items-center gap-3 border border-border bg-background p-3 transition-colors hover:border-foreground/30"
            >
              <span className="select-none text-2xl font-light text-muted-foreground transition-colors group-hover:text-foreground">
                {item.simbolo}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.elemento}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-jakarta text-xl font-semibold tracking-tight text-foreground">
          Planetas e Luminares
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {PLANETAS.map((item) => (
            <div
              key={item.nome}
              className="group flex cursor-default flex-col items-center justify-center border border-border bg-background p-4 text-center transition-colors hover:border-foreground/30"
            >
              <span className="mb-2 select-none text-3xl font-light text-muted-foreground transition-colors group-hover:text-foreground">
                {item.simbolo}
              </span>
              <p className="text-sm font-medium text-foreground">{item.nome}</p>
              <p className="text-xs text-muted-foreground">{item.tipo}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
