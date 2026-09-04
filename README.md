# Data Iris (`dataastral`)

Produto: **Data Iris**. Pacote npm / repositório Git: **dataastral**.

Plataforma SaaS de previsões com datas a partir de mapa natal e efemérides. Idioma da interface: português (pt-BR). Modelo: créditos avulsos (não é assinatura).

Documento de entrega e aceite (cliente / jurídico), com catálogo de APIs e evidências das cláusulas: [`docs/entrega-aceite.html`](docs/entrega-aceite.html).

---

## Stack

| Camada | Tecnologia (versões em `package.json` / `requirements.txt`) |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 |
| Auth / banco | Supabase (Auth, Postgres, RLS, edge functions) |
| Pagamentos | Stripe (Checkout hosted/embedded + webhook) |
| Motor astrológico | Edge `iris-predict` e/ou Flask em `api/engine.py` (Swiss Ephemeris) |
| Hospedagem | Vercel |

Não usar `pages/` router, `axios` nem `react-router-dom`.

---

## Mapa do repositório

### Fonte do produto

| Caminho | Papel |
| --- | --- |
| `src/app/` | Rotas Next: páginas públicas, `(auth)`, `(dashboard)`, `(admin)`, `api/`, callback OAuth |
| `src/components/` | UI por domínio (landing, iris-chat, payments, refund, admin, planner, …) |
| `src/lib/` | Supabase, Stripe, créditos, planner, WhatsApp, astrologia, PDF, auth |
| `src/types/` | Contratos TypeScript da API da aplicação |
| `src/hooks/` | Hooks de cliente |
| `middleware.ts` | Gates de **páginas** (`/calculadora`, `/admin`, etc.). **Não** bloqueia `/api/*` |
| `supabase/migrations/` | SQL versionado |
| `supabase/functions/` | `iris-predict`, `iris-ephemerides` |
| `e2e/` | Playwright |
| `docs/` | Aceite HTML, QA de UI, runbook RLS |
| `public/` | Marca e estáticos |
| `vercel.json` | Rewrites do motor Python (`/api/engine`, `/api/ephemerides`, `/api/sky-now`) |

### Legado / não é entrega

| Item | Nota |
| --- | --- |
| `api/engine.py`, `requirements.txt` | Motor Flask local/legado; efemérides Next ainda podem chamá-lo |
| `ref/` | Export Lovable; gitignored; não é fonte do produto |
| `AGENT.md` | Gitignored e desatualizado; **não** usar como manual |
| `AGENTS.md` / `CLAUDE.md` | Notas de agente do Next; não substituem este README |
| `public_openapi_schema.json` | Gitignored; schema PostgREST, **não** a API Next |
| `package-lock.json` **e** `pnpm-lock.yaml` | Os dois existem. Scripts oficiais são `npm run …` neste `package.json` |

Rotas de UI principais: `/`, `/precos`, `/faq`, `/termos-de-uso`, `/politica-de-privacidade`, `/reembolso`, `/login`, `/cadastro`, `/calculadora`, `/calendario`, `/financeiro`, `/perfil`, `/admin/dashboard`. Catálogo HTTP: secção 5 de `docs/entrega-aceite.html`.

---

## Desenvolvimento local

Requisitos: Node 20+ (alinhado a `@types/node`), npm.

```bash
cp .env.example .env.local   # preencher; nunca commitar segredos
npm install
npm run dev
```

App em [http://localhost:3000](http://localhost:3000).

Motor Python (opcional, efemérides / fallback): Python 3, `pip install -r requirements.txt`, subir Flask na porta **5000**. Em desenvolvimento, `next.config.ts` faz fallback de `/api/:path*` não atendido pelo Next para `http://127.0.0.1:5000`.

### Scripts (`package.json`)

| Script | Efeito |
| --- | --- |
| `npm run dev` | Next em desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Serve o build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (`playwright.config.ts`) |
| `npm run test:e2e:ui` | UI do Playwright |
| `npm run assets:lovable` | Download de assets de referência (não é runtime) |

E2E: copiar `.env.e2e.example` → `.env.e2e.local`. Autenticado usa `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` e grava `e2e/.auth/` (gitignored). Base URL default: `http://localhost:3000`.

---

## Variáveis de ambiente

Somente **nomes**. Valores reais ficam em `.env.local` / painel Vercel (gitignored).

### Listadas em `.env.example`

| Nome | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (o código também aceita `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente servidor |
| `ENGINE_INTERNAL_TOKEN` | Header `x-internal-engine-token` para o motor / edge |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js |
| `STRIPE_SECRET_KEY` | Checkout e webhook |
| `STRIPE_WEBHOOK_SECRET` | Assinatura do webhook |
| `NEXT_PUBLIC_APP_URL` | return/success do Stripe; fallback à origin. Código também lê `APP_URL` |

Depois das chaves Stripe: preencher `stripe_price_id` de cada pacote em Admin → Preços. Sem isso, a compra responde `STRIPE_PRICE_MISSING`.

### Usadas no código e ainda não listadas em `.env.example`

`PYTHON_ENGINE_URL`, `VERCEL_ENV`, `VERCEL_URL`, `NEXT_PUBLIC_SITE_URL`, `OPENROUTER_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `ELEVENLABS_API_KEY` (ou `ELEVEN_LABS_API_KEY`), `ELEVENLABS_VOICE_ID`, `STRIPE_PRODUCT_ID` / `STRIPE_PRODUCT_ID_<PACOTE>`, `SUPABASE_URL` (Python). Plataforma: `NODE_ENV`, `CI`.

E2E (`.env.e2e.example`): `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `PLAYWRIGHT_BASE_URL`.

---

## Deploy e HTTPS

Hospedagem atual: **Vercel**, hostname padrão

**https://dataastral.vercel.app/**

A Vercel termina TLS nesse hostname. Cookies de produção usam flag `Secure` no código (`predict-public`, callback de auth, indicações).

Domínio próprio da cliente: **ainda não apontado** (a cliente não enviou o domínio para DNS). A string `datairis.com.br` no PDF é marca, não prova de DNS.

Webhook Stripe: apontar para `https://<hostname>/api/webhooks/stripe` no hostname que estiver em uso.

Efemérides: se `PYTHON_ENGINE_URL` estiver vazio e `VERCEL_URL` existir, o Next monta `http://` + `VERCEL_URL` (fetch **interno**, não é o HTTPS do browser). Em produção, preferir definir `PYTHON_ENGINE_URL` explicitamente.

Metadados locais `.vercel/` estão no `.gitignore`.

---

## Banco (Supabase)

Migrations em `supabase/migrations/`. Aplicar no projeto certo (SQL Editor ou CLI), fora de pico, com backup.

Endurecimento de RLS: [`docs/security/rls-apply-runbook.md`](docs/security/rls-apply-runbook.md) (`rls-precheck.sql`, `rls-postcheck.sql`, `rls-rollback-template.sql`).

Reembolsos (CDC art. 49 na copy e no comentário SQL): tabela `refund_requests`, UI `/reembolso`, API `GET`/`POST /api/refunds`. Pedidos ficam `pending`; a janela de 7 dias está na política visível, não é validada no POST.

---

## Manutenção rápida

- **Páginas logadas** quebram sem sessão: `middleware.ts`. APIs exigem auth **dentro** de cada `route.ts`.
- **Admin:** RPC `is_admin`; UI em `/admin/dashboard`, `/admin/usuarios`, `/admin/logs` (também existem `/admin/precos` e `/admin/perguntas`).
- **WhatsApp:** `POST /api/whatsapp/send` está em modo mock (`provider: zapi_mock`). Códigos de verificação usam Twilio se as três variáveis Twilio existirem.
- **TTS:** `POST /api/tts` (ElevenLabs). `POST /api/export/audio` está desligado (404).
- **Temas** carreira, saude, familia, viagens: a API de previsão responde 422 `THEME_IN_CALIBRATION`.
- Não commitar `.env.local`, `.env.e2e.local`, `e2e/.auth/`, `.vercel/`.

Entrega de acessos (GitHub, Vercel, Supabase, Stripe, DNS) e cessão de PI é **ato operacional**, não este repositório — ver cláusula xxiii em `docs/entrega-aceite.html`.
