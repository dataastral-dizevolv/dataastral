# AGENT.md — Data Astral

Leia este arquivo inteiro antes de escrever qualquer código.

---

## 1. O QUE É ESTE PROJETO

**Data Astral** é uma plataforma SaaS de astrologia profissional baseada em cálculos reais de efemérides (Swiss Ephemeris). O produto não é misticismo — é geometria celeste aplicada a decisões. O usuário faz perguntas objetivas sobre temas da vida (amor, carreira, finanças, saúde, família, viagens) e recebe previsões personalizadas baseadas no seu mapa natal.

**Modelo de negócio:** compra de créditos avulsos ou em pacotes. Sem assinatura recorrente. 1 pergunta = 1 crédito. Pacotes: 1 crédito (R$9,90), 5 créditos (R$39), 10 créditos (R$69).

**Idioma:** Português brasileiro exclusivamente. Sem internacionalização.

---

## 2. STACK TÉCNICA

```
Frontend:   Next.js 14 (App Router) + React + TypeScript
Estilo:     Tailwind CSS + shadcn/ui
Backend:    Supabase (auth, banco, storage, edge functions)
Pagamento:  Stripe (checkout, webhooks, gestão de créditos)
Voz:        ElevenLabs API (narração de previsões)
PDF:        Geração server-side via route handler
WhatsApp:   Z API ou Evolution API
```

**Nunca usar:**
- `react-router-dom` — roteamento é por arquivos no App Router
- `axios` — usar `fetch` nativo ou cliente Supabase
- `moment.js` — usar `date-fns`
- Qualquer ORM externo — usar cliente Supabase diretamente
- `pages/` router — apenas App Router

---

## 3. ESTRUTURA DO PROJETO

```
src/
  app/
    (auth)/
      login/page.tsx
      cadastro/page.tsx
    (dashboard)/
      layout.tsx              ← layout autenticado com sidebar
      page.tsx                ← redirect para /calculadora
      calculadora/page.tsx
      perfil/page.tsx
      financeiro/page.tsx
      calendario/page.tsx
    (admin)/
      layout.tsx
      dashboard/page.tsx
      usuarios/page.tsx
      previsoes/page.tsx
      financeiro/page.tsx
    api/
      stripe/
        checkout/route.ts
        webhook/route.ts
      elevenlabs/route.ts
      previsao/route.ts
      pdf/route.ts
    layout.tsx
    page.tsx                  ← landing page pública
    globals.css

  components/
    landing/
      Hero.tsx
      Calculator.tsx          ← calculadora freemium 4 passos
      HowItWorks.tsx
      PricingCTA.tsx
      Footer.tsx
      ZodiacWheel.tsx         ← SVG da roda zodiacal
    dashboard/
      Sidebar.tsx
      CalendarioEfemerides.tsx
      PrevisaoCard.tsx
      CreditosWidget.tsx
    admin/
      AdminSidebar.tsx
    ui/                       ← gerado pelo shadcn, nunca editar

  lib/
    supabase/
      client.ts               ← createBrowserClient
      server.ts               ← createServerClient com cookies
    stripe.ts
    elevenlabs.ts
    astrology.ts              ← cálculos de efemérides
    themes.ts                 ← temas e perguntas pré-definidas
    pdf.ts
    whatsapp.ts

  types/
    index.ts
    supabase.ts               ← tipos gerados pelo Supabase CLI

  hooks/
    useCreditos.ts
    usePrevisoes.ts
    useUser.ts

  middleware.ts               ← proteção de rotas
```

---

## 4. DESIGN SYSTEM

### 4.1 Cores

Tema padrão escuro. Variáveis em formato HSL (exigência do shadcn).

```css
/* src/app/globals.css */
@layer base {
  :root {
    --background:           10 10 15;
    --background-secondary: 17 17 24;
    --background-tertiary:  26 26 36;
    --foreground:           240 239 232;
    --muted-foreground:     140 139 132;

    /* Acento dourado — identidade visual principal */
    --accent:               43 52% 54%;
    --accent-foreground:    10 10 15;

    /* Aspectos astrológicos */
    --tensao:               0 54% 43%;
    --harmonia:             145 39% 43%;
    --portal:               291 38% 44%;

    /* shadcn overrides */
    --card:                 17 17 24;
    --card-foreground:      240 239 232;
    --primary:              43 52% 54%;
    --primary-foreground:   10 10 15;
    --secondary:            26 26 36;
    --secondary-foreground: 140 139 132;
    --border:               240 239 232 / 0.08;
    --ring:                 43 52% 54%;
    --radius:               0.75rem;
  }
}
```

### 4.2 Tipografia

```typescript
// src/app/layout.tsx
import { Libre_Baskerville, DM_Sans, DM_Mono } from 'next/font/google'

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
})
```

**Regras:**
- Headings: `font-[family-name:var(--font-display)]`
- Body: `font-sans` (DM Sans)
- Dados técnicos (graus, créditos, datas, coordenadas): `font-mono`
- Símbolos Unicode de planetas e signos: ☉☽☿♀♂♃♄♅♆♇ e ♈♉♊♋♌♍♎♏♐♑♒♓
- Labels pequenos: `uppercase tracking-widest text-xs`
- Headings grandes: `tracking-tight` (`letter-spacing: -0.02em`)

### 4.3 shadcn — components instalados

Usar sempre estes antes de criar qualquer component custom:
```
Button Card Input Label Select Badge Progress Tabs
Dialog Sheet Separator Avatar DropdownMenu Tooltip
```

Para instalar um que falte: `npx shadcn@latest add [nome]`

### 4.4 Animações (CSS apenas)

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes rotateSlow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

---

## 5. MÓDULOS DO PRODUTO

### 5.1 Landing Page — `/`

Seções em ordem:
1. **Hero** — headline serif, CTA âncora para `#calculadora`, roda zodiacal SVG à direita
2. **Calculadora Freemium** (`id="calculadora"`) — ver fluxo abaixo
3. **Como Funciona** — 4 steps horizontais
4. **Prova Social** — depoimentos + mockup de PDF
5. **CTA Final** — retorna para `#calculadora`
6. **Footer**

**Calculadora Freemium — 4 passos dentro de um card (max-w-2xl, centralizado):**

```
Passo 1 — Tema
  Grid 2 colunas (mobile) / 3 colunas (desktop)
  Cards: Amor · Carreira · Finanças · Saúde · Família · Viagens
  Selecionado: borda accent + fundo levemente destacado

Passo 2 — Pergunta
  3-4 perguntas pré-definidas para o tema escolhido
  Radio cards estilizados com borda

Passo 3 — Dados de nascimento
  Data (obrigatório) · Hora (recomendado) · Estado/País
  Botão: "✦ GERAR MINHA PREVISÃO"

Passo 4 — Resultado
  Loading: símbolo ☽ girando + barra de progresso dourada
  Textos alternados a cada 800ms no loading
  Resultado: 4-5 parágrafos mockados convincentes
  Blur progressivo a partir do 3º parágrafo
  CTA: "COMPRAR ESTA PREVISÃO — R$9,90"
  Pacotes: "5 perguntas R$39 · 10 perguntas R$69"
  Link "← Fazer outra pergunta" reinicia o fluxo
```

**Stepper no topo do card:**
```
① Tema  ——  ② Pergunta  ——  ③ Dados  ——  ④ Previsão
```

---

### 5.2 Autenticação — `/login` e `/cadastro`

- Provider: Supabase Auth (email/senha + Google OAuth)
- Após login → redirect para `/calculadora`
- Rotas `/(dashboard)/*` → exigem sessão ativa
- Rotas `/(admin)/*` → exigem `role = 'admin'`

```typescript
// src/middleware.ts — verificar sessão e role em todas as rotas protegidas
```

---

### 5.3 Dashboard — Calculadora Completa — `/calculadora`

Mesma UX da landing, com diferenças para usuário autenticado:
- Resultado completo sem blur
- Desconta 1 crédito ao gerar
- Saldo zero → abre modal de compra antes de gerar
- Botão "Ouvir previsão" → chama `/api/elevenlabs`
- Botão "Baixar PDF" → chama `/api/pdf`
- Botão "Compartilhar no WhatsApp" → chama lib whatsapp
- Histórico de perguntas anteriores abaixo da calculadora

---

### 5.4 Dashboard — Calendário de Efemérides — `/calendario`

Módulo de maior valor percebido do produto.

**Funcionalidades:**
- Calendário mensal com eventos astrológicos marcados por cor de tipo
- Ao clicar num dia: painel lateral com previsão do dia
- Previsão do dia baseada no mapa natal do usuário cruzado com os trânsitos

**Por previsão do dia:**
- Texto da previsão
- Botão "Ouvir" → ElevenLabs narra (voz natural em português)
- Botão "Exportar PDF" → PDF elegante da previsão
- Botão "Compartilhar no WhatsApp" → envia PDF + texto

**Cores dos eventos no calendário:**
```
tensao  → #C0392B (vermelho)
harmonia → #27AE60 (verde)
portal  → #8E44AD (roxo)
neutro  → muted
```

---

### 5.5 Dashboard — Módulo Financeiro — `/financeiro`

**Saldo em destaque:**
```
Card: "Você tem X créditos"
Botão: [Comprar mais créditos →]
```

**Pacotes (Stripe Checkout):**
```
1 pergunta   — R$9,90    [Comprar]
5 perguntas  — R$39,00   [Comprar]  ← badge "Mais popular"
10 perguntas — R$69,00   [Comprar]
```

**Histórico:** tabela com data, descrição, créditos, valor, status. Filtro por período.

**Fluxo de compra:**
```
Clique em Comprar
→ POST /api/stripe/checkout
→ Stripe Checkout (user_id no client_reference_id)
→ Pagamento aprovado
→ Stripe webhook → POST /api/stripe/webhook
→ Adiciona créditos em `creditos` + registra em `transacoes`
→ Redirect /financeiro?success=true com toast
```

---

### 5.6 Dashboard — Perfil — `/perfil`

- Nome, email, foto (upload Supabase Storage)
- **Dados astrológicos:** data, hora e local de nascimento → salva em `mapas_natais`
- WhatsApp para receber previsões
- Preferências de notificação
- Alterar senha

---

### 5.7 Admin — `/admin/*`

Acesso apenas `role = 'admin'`.

```
/admin/dashboard  — métricas: usuários, perguntas hoje, receita mês
/admin/usuarios   — tabela + ações: adicionar créditos, banir, promover
/admin/previsoes  — CRUD de efemérides e previsões diárias do calendário
/admin/financeiro — receita total, transações, reembolsos
```

---

## 6. INTEGRAÇÕES EXTERNAS

### Stripe

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PACOTES = {
  um:    { creditos: 1,  priceId: process.env.STRIPE_PRICE_1!  },
  cinco: { creditos: 5,  priceId: process.env.STRIPE_PRICE_5!  },
  dez:   { creditos: 10, priceId: process.env.STRIPE_PRICE_10! },
} as const
```

O webhook valida a assinatura com `stripe.webhooks.constructEvent` antes de qualquer ação.

### ElevenLabs

```typescript
// src/lib/elevenlabs.ts
// Recebe texto em pt-BR, retorna URL do áudio salvo no Supabase Storage
export async function narrarPrevisao(texto: string, previsaoId: string): Promise<string>
```

Salvar áudio em `Storage > audios/{previsaoId}.mp3` e retornar URL pública.

### PDF

Gerado em `/api/pdf/route.ts` server-side.
Template: logo Data Astral + nome do usuário + pergunta + previsão + data + disclaimer.
Salvar em `Storage > pdfs/{previsaoId}.pdf`.

### WhatsApp

```typescript
// src/lib/whatsapp.ts
export async function enviarPrevisao(
  whatsapp: string,
  texto: string,
  pdfUrl: string
): Promise<void>
```

---

## 8. VARIÁVEIS DE AMBIENTE

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # apenas server-side

# Stripe
STRIPE_SECRET_KEY=                # apenas server-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_1=
STRIPE_PRICE_5=
STRIPE_PRICE_10=

# ElevenLabs
ELEVENLABS_API_KEY=               # apenas server-side
ELEVENLABS_VOICE_ID=

# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_INSTANCE=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Variáveis sem prefixo `NEXT_PUBLIC_` nunca chegam ao browser.

---

## 9. CONVENÇÕES DE CÓDIGO

### TypeScript

```typescript
// src/types/index.ts — todos os tipos de domínio aqui

export type Tema = 'amor' | 'carreira' | 'financas' | 'saude' | 'familia' | 'viagens'
export type TipoAspecto = 'tensao' | 'harmonia' | 'portal' | 'neutro'
export type Role = 'user' | 'admin'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: Role
}

export interface Previsao {
  id: string
  tema: Tema
  pergunta: string
  resposta: string
  audioUrl?: string
  pdfUrl?: string
  creditosUsados: number
  criadaEm: Date
}

export interface MapaNatal {
  id: string
  userId: string
  dataNascimento: string
  horaNascimento?: string
  localNascimento: string
  latitude: number
  longitude: number
  dadosMapa?: Record<string, unknown>
}
```

Sem `any`. Para tipo desconhecido usar `unknown` e tratar explicitamente.

### Components

- `'use client'` apenas onde há `useState`, `useEffect`, eventos ou hooks
- Componentes puramente visuais sem estado ficam como Server Components
- Um component por arquivo, nome em PascalCase
- Props com interface local quando mais de 2 campos

```tsx
// Padrão
interface PrevisaoCardProps {
  previsao: Previsao
  onOuvir?: () => void
  className?: string
}

export function PrevisaoCard({ previsao, onOuvir, className }: PrevisaoCardProps) {
  return (...)
}
```

### Fluxos críticos

**Geração de previsão:**
```
Usuário completa 4 passos
→ Verificação otimista de créditos (client)
→ POST /api/previsao { tema, pergunta, mapaNatalId }
→ Server verifica créditos (source of truth no Supabase)
→ Sem créditos → 402 → abre modal de compra
→ Com créditos → gera previsão → desconta crédito atomicamente → retorna
→ Client exibe resultado completo
```

**Compra de créditos:**
```
Clique no pacote
→ POST /api/stripe/checkout
→ Redirect Stripe Checkout
→ Pagamento aprovado
→ Webhook /api/stripe/webhook
→ Valida assinatura → adiciona créditos → registra transação
→ Redirect /financeiro?success=true
```

---

## 10. O QUE NÃO FAZER

- Criar planos de assinatura recorrente — modelo é créditos avulsos
- Adicionar i18n — apenas pt-BR
- Escrever testes — não é prioridade
- Usar `pages/` router
- Hardcodar chaves de API
- Editar arquivos em `src/components/ui/`
- Usar `localStorage` para dados sensíveis
- Expor `SUPABASE_SERVICE_ROLE_KEY` ou `STRIPE_SECRET_KEY` no cliente

---

## 11. GLOSSÁRIO DO PRODUTO

| Termo correto | Evitar |
|---|---|
| mapa natal | "mapa astral" (menos preciso) |
| previsão | "leitura", "tiragem" |
| créditos | "tokens", "pontos" |
| pergunta | "consulta", "tiragem" |
| tema | "categoria", "área" |
| efemérides | "posições astrais" |
| aspecto | "influência" |
| — | "horóscopo" |
| — | "plano", "assinatura" |
| — | "relatório natal" (confuso para leigos) |