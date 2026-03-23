import type { ThemeId, ThemeOption } from "@/types/calculator";

export const LOADING_TEXTS = [
  "Calculando posição solar...",
  "Mapeando aspectos planetários...",
  "Analisando seu momento atual...",
  "Gerando sua previsão...",
];

export const THEMES: ThemeOption[] = [
  { id: "amor", name: "Amor e Relacionamentos" },
  { id: "carreira", name: "Carreira e Propósito" },
  { id: "financas", name: "Finanças e Prosperidade" },
  { id: "saude", name: "Saúde e Bem-estar" },
  { id: "familia", name: "Família e Lar" },
  { id: "viagens", name: "Viagens e Novos Ciclos" },
];

export const QUESTIONS: Record<ThemeId, string[]> = {
  amor: [
    "Este é o momento certo para me comprometer?",
    "Há obstáculos energéticos no meu relacionamento atual?",
    "Quando terá início um novo ciclo amoroso na minha vida?",
  ],
  carreira: [
    "Devo aceitar essa oportunidade de mudança profissional?",
    "Qual período é mais favorável para lançar meu projeto?",
    "Há tensões nos meus relacionamentos profissionais agora?",
  ],
  financas: [
    "Este é um bom momento para investir?",
    "Quando esperar uma virada financeira positiva?",
    "Há bloqueios energéticos em torno da minha prosperidade?",
  ],
  saude: [
    "Qual período exige mais atenção com minha saúde?",
    "Há influências planetárias afetando meu bem-estar emocional?",
    "Quando começa um ciclo de renovação energética para mim?",
  ],
  familia: [
    "Há mudanças importantes chegando no meu lar?",
    "Qual a melhor fase para decisões sobre moradia?",
    "Há conflitos familiares ligados ao momento astrológico atual?",
  ],
  viagens: [
    "Este é um bom momento para uma grande mudança?",
    "Quando começa um novo ciclo de expansão na minha vida?",
    "Há aspectos favoráveis para viagens transformadoras?",
  ],
};
