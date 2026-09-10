# Cabeçalhos, validação de entrada e rate limit

O que mudou no app para fechar três buracos de segurança: respostas sem cabeçalhos, validação desigual nas APIs e rate limit só em memória.

## Contexto

Antes deste trabalho:

- `next.config.ts` só tinha redirects/rewrites. Sem `headers()`.
- Produção (`curl -I https://dataastral.vercel.app/`) devolveva só o HSTS da Vercel. Sem `Content-Security-Policy`, `X-Frame-Options` nem `X-Content-Type-Options`.
- Não havia Zod/Yup/Joi no código da aplicação. Cada rota validava à mão, e `/api/predict` era bem mais frouxa que `/api/predict-public`.
- Rate limit existia só em duas rotas (`predict-public` e `whatsapp/send-code`), num `Map` por processo. Em serverless o teto virava `limite × N instâncias`.

## 1. Cabeçalhos de segurança

Arquivo: [`next.config.ts`](../../next.config.ts).

O Next passa a enviar, em `/` e em `/:path*`:

| Cabeçalho | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | política abaixo |

A CSP permite o que o app já usa no browser: Stripe (script, frame e API), Supabase (HTTPS e websocket), Nominatim, timeapi.io e, em preview, Vercel Live. Em desenvolvimento também libera `unsafe-eval`, o engine local em `127.0.0.1:5000` e websockets do HMR. Em produção entra `upgrade-insecure-requests`.

HSTS continua vindo da plataforma Vercel. Não foi duplicado no repo.

### Resultado esperado

Depois do deploy:

```bash
curl -sI https://dataastral.vercel.app/ \
  | grep -iE 'content-security-policy|x-frame-options|x-content-type-options'
```

Os três cabeçalhos devem aparecer. A home, `/precos`, `/login` e a calculadora devem abrir sem erro de CSP no console (`Refused to...`). Checkout embutido do Stripe e busca de cidade (Nominatim) devem continuar funcionando.

Se a CSP bloquear algum script ou `connect` novo, o sintoma é tela quebrada ou request vermelho no DevTools — ajuste a lista em `buildContentSecurityPolicy()`.

## 2. Validação de entrada

Dependência nova: `zod`. Camada compartilhada em `src/lib/validation/`.

| Arquivo | Papel |
|---|---|
| [`fields.ts`](../../src/lib/validation/fields.ts) | data `YYYY-MM-DD`, hora `HH:mm`, UUID, tetos de tamanho, `normalizeDynamicAnswers` |
| [`predict.ts`](../../src/lib/validation/predict.ts) | body de `/api/predict-public` e `/api/predict` |
| [`credits.ts`](../../src/lib/validation/credits.ts) | checkout e mutações admin |
| [`parse-body.ts`](../../src/lib/validation/parse-body.ts) | `safeParse` + código de erro estável (`INVALID_THEME`, `INVALID_BIRTH_DATE`, …) |

Rotas que passaram a usar o schema:

- `POST /api/predict-public` — tema enum, pergunta ≤ 300, data/hora reais, timezone ≤ 80, local ≤ 200, `dynamicAnswers` com teto.
- `POST /api/predict` — o mesmo rigor da pública, mais campos opcionais (`targetBirth*`, `conflictDate`) validados.
- `POST /api/credits/buy` — `packageId` no formato `starter`/`popular`/… e `uiMode` só `embedded` \| `hosted`.
- `POST /api/admin/users/credits` — `userId` UUID e `amount` finito, `> 0` e `≤ 1000`.
- `POST /api/admin/users/deactivate` — `userId` UUID.

### Resultado esperado

Body inválido responde **400** com `code` estável, sem chegar no motor, no Stripe ou no banco.

Exemplos:

```bash
curl -s -X POST http://localhost:3000/api/predict-public \
  -H 'content-type: application/json' \
  -d '{"theme":"amor","question":"x","birthDate":"12/05/1994"}'
# {"error":"Data de nascimento inválida.","code":"INVALID_BIRTH_DATE","requestId":"..."}
```

Pergunta com mais de 300 caracteres → `INVALID_QUESTION`.  
`packageId` com espaço → `INVALID_PACKAGE`.  
`userId` que não é UUID → `INVALID_USER_ID`.

Tema em calibração (`carreira`, `saude`, `familia`, `viagens`) continua **422** `THEME_IN_CALIBRATION`, depois da validação de schema.

Testes unitários: `src/lib/validation/fields.test.ts`.

```bash
node --experimental-strip-types --test src/lib/validation/fields.test.ts
```

## 3. Rate limiting

O contador deixa de viver só no processo. A fonte da verdade é Postgres.

- Migration: [`supabase/migrations/20260910_create_api_rate_limits.sql`](../../supabase/migrations/20260910_create_api_rate_limits.sql)
- Helper: [`src/lib/rate-limit.ts`](../../src/lib/rate-limit.ts)
- Fallback: [`src/lib/rate-limit-memory.ts`](../../src/lib/rate-limit-memory.ts) — usado se a RPC ainda não existir ou se faltar service role

A função `public.consume_rate_limit(p_key, p_max, p_window_seconds)` incrementa um único row por chave. Só `service_role` executa. Anon/authenticated não leem a tabela.

| Rota | Chave | Limite |
|---|---|---|
| `POST /api/predict-public` | IP | 12 / 10 min |
| `POST /api/predict` | user id | 12 / 10 min |
| `POST /api/whatsapp/send-code` | user id | 5 / 10 min |
| `POST /api/credits/buy` | user id | 8 / 10 min |
| `POST /api/admin/users/credits` | admin id | 20 / 10 min |
| `POST /api/admin/users/deactivate` | admin id | 20 / 10 min |

Acima do teto: **429** com `RATE_LIMIT_EXCEEDED` (WhatsApp send-code mantém `RATE_LIMITED` para não quebrar o cliente).

`verify-code` continua com o teto de 5 tentativas na tabela `whatsapp_verifications` — isso é anti-brute-force do código, não rate limit de API.

Cotas de crédito (`consume_profile_credit`, `consume_guest_question`) não mudaram. Elas limitam saldo, não frequência.

### Resultado esperado

Com a migration aplicada no Supabase de produção, o teto é **global**, não por instância. A 13ª previsão pública do mesmo IP em 10 minutos deve ser 429 em qualquer lambda.

Sem a migration, o app não quebra: cai no `Map` local e o limite volta a ser por processo (o comportamento antigo).

Para ativar o limite compartilhado:

1. Aplicar `20260910_create_api_rate_limits.sql` no projeto Supabase.
2. Conferir que `SUPABASE_SERVICE_ROLE_KEY` está no ambiente da Vercel.
3. Disparar a mesma rota acima do teto a partir de IPs/usuários distintos de instância — o 429 deve aparecer mesmo após scale-out.

Teste do fallback em memória: `src/lib/rate-limit.test.ts`.

## O que não entra neste pacote

- Remover `access-control-allow-origin: *` da home na Vercel (não estava no repo; se ainda aparecer em produção, vem da plataforma).
- Rate limit em todas as outras rotas (`/api/tts`, `/api/profile`, webhooks, etc.).
- Schema Zod nas rotas que não recebem body crítico (listagens, webhook Stripe).
- Painel da Vercel: os cabeçalhos agora vêm do `next.config.ts`. Não é necessário cadastrá-los de novo no dashboard.

## Como conferir localmente

```bash
# cabeçalhos
curl -sI http://localhost:3000/ | grep -iE 'content-security-policy|x-frame-options|x-content-type-options'

# validação
curl -s -X POST http://localhost:3000/api/predict-public \
  -H 'content-type: application/json' \
  -d '{"theme":"xyz"}'
# code INVALID_THEME

# UI / CSP
npx playwright test e2e/smoke.public.spec.ts
```

Esperado no smoke: landing, menu, `/precos`, `/faq`, termos, privacidade e reembolso renderizam sem quebra de CSP.
