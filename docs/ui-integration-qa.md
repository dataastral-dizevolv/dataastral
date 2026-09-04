# UI Integration QA — Lovable → Data Iris

Reusable checklist and multitask QA protocol for each screen ported from `ref/star-aligned-journey-main` into the Next.js app.

## How to use

1. Implement one screen (or shell) per the integration plan.
2. Copy the **Screen sign-off template** below into a new section under [Sign-offs](#sign-offs).
3. Fill prerequisites and run the checklist locally.
4. Launch **3 parallel QA agents** (multitask / Task tool, `run_in_background: true`).
5. Consolidate reports; fix blockers; re-run only failed agents.
6. Mark the template complete only when all three agents are Pass (or Failures accepted with notes).

## Prerequisites (every screen)

- Branch / local URL recorded
- Lovable reference file(s) listed
- Next route recorded
- `npm run build` (or `next build`) attempted after changes
- No runtime imports from `ref/`
- No `__l5e` CDN asset URLs in shipped `src/`

## Checklist (per screen)

### Visual parity

- [ ] Colors / CSS tokens match Lovable light pastel system
- [ ] Typography (itagi / display / script) loads without broken Uni Neue / CDN fonts
- [ ] Images and videos load from local `public/` or `src/assets/` (no 404)
- [ ] Spacing, radius (`1.25rem`), and shadows feel aligned
- [ ] No leftover dark-theme “void” backgrounds on light pages (esp. landing backdrop)

### Animations

- [ ] Entrance / scroll / hover animations run
- [ ] No janky layout thrash on first paint
- [ ] `prefers-reduced-motion: reduce` does not break the page

### Responsive

- [ ] 375px — no horizontal overflow; menu usable
- [ ] 768px — layout coherent
- [ ] 1280px / 1440px — hero and sections balanced

### Functional / regression

- [ ] Links and CTAs hit correct Next routes
- [ ] Auth guards still protect dashboard/admin
- [ ] Guest predict still uses `POST /api/predict-public`
- [ ] Authenticated predict still uses `POST /api/predict`
- [ ] Forms validate; Stripe/credits untouched unless intentionally changed
- [ ] Console free of critical errors

### A11y smoke

- [ ] Keyboard focus visible on primary controls
- [ ] Text contrast readable on pastel backgrounds
- [ ] Key images have alt text

### Build

- [ ] `npm run build` succeeds
- [ ] Lint on touched files clean enough to ship

## Multitask QA agents

After each screen implementation, spawn **three read-only report agents in parallel**:

| Agent | Focus | Output |
|-------|--------|--------|
| **QA-Visual** | Diff vs Lovable source files; tokens; typography; asset 404s; dark leftovers | Pass/Fail + file:line deviations |
| **QA-Funcional** | Navigation, auth guards, CTAs, API contracts, TS/lint on changed files | Pass/Fail + bugs |
| **QA-Responsive-Motion** | Breakpoints, overflow, menus, animations, reduced-motion | Pass/Fail + notes |

### Prompt template (paste into each Task)

```text
You are a read-only QA agent. Do NOT edit code.

Screen: <name>
Next route: <path>
Lovable refs: <paths>
Changed files: <list>

Evaluate ONLY your focus area against docs/ui-integration-qa.md.
Return markdown with:
## Verdict: Pass | Fail
## Findings
- ...
## Blockers (if any)
```

### Rules

- Agents do not fix code on the first pass.
- Main agent consolidates, fixes blockers, re-runs failed agents only.
- Checklist sign-off requires three green reports or documented accepted failures.
- In Cursor Multitask Mode always use `run_in_background: true`.

## Screen sign-off template

```markdown
## Tela: <nome> | Rota: <path> | Ref Lovable: <arquivo>
Date:
Prereqs URL:

- [ ] Tokens/cores alinhados
- [ ] Fontes corretas (sem FOUT grave)
- [ ] Assets locais (sem __l5e)
- [ ] Animações OK + reduced-motion
- [ ] Mobile / tablet / desktop
- [ ] Fluxos/API não quebrados
- [ ] Build OK
- [ ] QA multitask concluído (agent ids / links)

### QA reports
- Visual:
- Funcional:
- Responsive-Motion:

### Accepted failures (if any)
-
```

## Sign-offs

### Tela: Fundação (tokens/fontes/assets) | Rota: n/a | Ref: `ref/.../src/index.css`
- [x] Tokens/cores alinhados
- [x] Fontes em `public/fonts`
- [x] Assets locais + `npm run assets:lovable` (63 ok)
- [x] Script `scripts/download-lovable-assets.mjs`
- Status: complete

### Tela: Landing | Rota: `/` | Ref: `Index.tsx` + Hero/Header/…
- [x] Tokens/cores alinhados
- [x] Fontes corretas (CSS vars next/font)
- [x] Assets locais (sem __l5e)
- [x] Animações + reduced-motion (CSS + Marquee)
- [x] Overflow-x contido no Hero/page
- [x] SiteHeader Escape + scroll lock
- [x] Calculator guest preservada (`#calculadora`)
- [x] Build OK (`npm run build` exit 0)
- [x] QA multitask: [QA-Visual](45588ce9-63f8-4730-b7f6-4b733bcbfae0), [QA-Funcional](bde35694-5795-411c-8e75-ebb21b1133e5), [QA-Responsive-Motion](ec189d74-d269-48a8-bd9a-5ea00570a929) — blockers corrigidos pós-Fail
- Status: complete

Accepted failures (none after follow-up):
- Hero cinematic black band and Testimonials `bg-black` are intentional (parity with Lovable)

### Tela: Auth | Rota: `/login`, `/cadastro` | Ref: `Auth.tsx` (visual only)
- [x] Visual card Lovable + AuthForm Supabase real
- [x] Build OK
- Status: complete

### Tela: Dashboard shell | Rota: `/dashboard` | Ref: Profile/Header shell
- [x] Sidebar light + brand star
- Status: complete

### Tela: Calculadora / Perfil / Calendário
- [x] Shells light; APIs/FullCalendar preservados
- Status: complete

### Tela: Preços / FAQ / Legais
- [x] Rotas `/precos`, `/faq`, `/termos-de-uso`, `/politica-de-privacidade`, `/reembolso`
- Status: complete

### Tela: Admin | Rota: `/admin/*`
- [x] Sidebar light restyle
- Status: complete (deep parity backlog: mapa/painel/aula)
