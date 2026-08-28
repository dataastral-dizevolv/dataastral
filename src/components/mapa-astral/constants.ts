export const ELEMENT_COLORS: Record<string, string> = {
  fire: "hsl(36 38% 78%)",
  earth: "hsl(150 32% 70%)",
  air: "hsl(205 70% 78%)",
  water: "hsl(225 60% 45%)",
};

export const MODALITY_COLORS: Record<string, string> = {
  cardinal: "hsl(225 55% 50%)",
  fixed: "hsl(205 50% 60%)",
  mutable: "hsl(150 32% 60%)",
};

export const ANGLE_INFO: Record<string, { title: string; text: string }> = {
  ASC: {
    title: "Ascendente",
    text: "O Ascendente é o signo que estava nascendo no horizonte leste no momento do seu primeiro respiro. Ele revela a sua máscara social — como as pessoas te percebem, a sua aparência e a postura que você assume ao enfrentar o mundo.",
  },
  MC: {
    title: "Meio do Céu",
    text: "O Meio do Céu (MC) indica o ponto mais alto do céu no momento do nascimento. Está ligado à carreira, ao status social, às ambições de vida e ao legado que você deseja construir.",
  },
  DSC: {
    title: "Descendente",
    text: "O Descendente é o ponto oposto ao Ascendente. Ele representa os relacionamentos, parcerias e tudo o que você projeta no outro — o que busca e o que precisa aprender através da convivência.",
  },
  FC: {
    title: "Fundo do Céu",
    text: "O Fundo do Céu (FC ou Imum Coeli) fala das suas raízes, família, origem e do seu espaço mais íntimo. É a base emocional que sustenta quem você é.",
  },
};

export const ELEMENT_INFO: Record<string, { title: string; text: string; signs: string }> = {
  Fogo: {
    title: "Fogo",
    text: "O elemento Fogo traz energia, entusiasmo, criatividade e impulso. Pessoas com forte presença do fogo costumam ser corajosas, inspiradoras e movidas pela paixão.",
    signs: "Áries, Leão, Sagitário",
  },
  Terra: {
    title: "Terra",
    text: "O elemento Terra traz praticidade, estabilidade, paciência e conexão com o material. Costuma aparecer em pessoas realistas, confiáveis e que constroem com consistência.",
    signs: "Touro, Virgem, Capricórnio",
  },
  Ar: {
    title: "Ar",
    text: "O elemento Ar representa o intelecto, a comunicação, a sociabilidade e a curiosidade. Quem tem o ar forte tende a ser racional, comunicativo e aberto a novas ideias.",
    signs: "Gêmeos, Libra, Aquário",
  },
  Água: {
    title: "Água",
    text: "O elemento Água fala de emoção, intuição, sensibilidade e profundidade. Pessoas com água marcante são empáticas, intuitivas e conectadas com o mundo interior.",
    signs: "Câncer, Escorpião, Peixes",
  },
};

export const MODALITY_INFO: Record<string, { title: string; text: string; signs: string }> = {
  Cardinal: {
    title: "Cardinal",
    text: "A modalidade Cardinal é a força do início. Signos cardinais têm facilidade para começar, liderar e tomar a frente. São impulsionadores de mudança e ação.",
    signs: "Áries, Câncer, Libra, Capricórnio",
  },
  Fixo: {
    title: "Fixo",
    text: "A modalidade Fixo traz estabilidade, persistência e determinação. Signos fixos têm o dom de manter, aprofundar e sustentar aquilo que começaram.",
    signs: "Touro, Leão, Escorpião, Aquário",
  },
  Mutável: {
    title: "Mutável",
    text: "A modalidade Mutável é a força da adaptação. Signos mutáveis são flexíveis, comunicativos e sabem ajustar-se às circunstâncias com versatilidade.",
    signs: "Gêmeos, Virgem, Sagitário, Peixes",
  },
};

/**
 * Aceita dia/mês/ano (PT-BR) e AAAA-MM-DD (ISO).
 */
export function parseFlexibleDate(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  const dmy = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);

  let y: number;
  let m: number;
  let d: number;
  if (iso) {
    y = +iso[1];
    m = +iso[2];
    d = +iso[3];
  } else if (dmy) {
    d = +dmy[1];
    m = +dmy[2];
    y = +dmy[3];
    if (m > 12 && d <= 12) {
      const t = m;
      m = d;
      d = t;
    }
  } else {
    return null;
  }

  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  const test = new Date(Date.UTC(y, m - 1, d));
  if (test.getUTCMonth() !== m - 1 || test.getUTCDate() !== d) return null;

  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
