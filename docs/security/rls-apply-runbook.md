# RLS Apply Runbook (Produção sem staging confirmado)

## Objetivo
Aplicar com segurança a migration de endurecimento de RLS:

- `supabase/migrations/20260506153000_harden_sensitive_rls.sql`

Sem alterar código da aplicação e com capacidade de validação/rollback controlado.

## Riscos principais
- Bloqueio indevido de acesso em rotas de usuário/admin por policy incorreta.
- Quebra de fluxos de leitura/escrita após mudança de role/policy.
- Aplicação no projeto errado (project_ref/URL incorretos).
- Rollback incompleto sem baseline real das policies.

## Pré-requisitos obrigatórios
- Confirmação explícita de `project_ref` e URL do Supabase de produção.
- Janela de mudança fora de pico.
- Backup/snapshot recente e validado (com responsável e horário).
- Baseline real de policies exportado antes do apply.
- Operador com acesso ao Supabase SQL Editor/CLI.
- Scripts disponíveis:
  - `docs/security/rls-precheck.sql`
  - `docs/security/rls-postcheck.sql`
  - `docs/security/rls-rollback-template.sql` (preenchido com baseline real).

## Passo a passo de aplicação
1. Rodar `rls-precheck.sql` no SQL Editor (somente leitura).
2. Confirmar checklist de pré-checks:
   - `public.is_admin(uuid)` existe.
   - tabelas alvo existem.
   - estado atual de RLS/policies exportado e salvo.
3. Preparar rollback real:
   - preencher `rls-rollback-template.sql` com policies atuais exportadas.
4. Aplicar migration alvo:
   - `20260506153000_harden_sensitive_rls.sql`.
5. Rodar `rls-postcheck.sql` imediatamente após apply.
6. Executar smoke tests funcionais (abaixo).
7. Monitorar erros por 30-60 min.

## Smoke tests pós-apply
- Visitante gera leitura na landing (`/api/predict-public`).
- Usuário comum faz login.
- Usuário comum acessa dashboard.
- Usuário comum usa calculadora autenticada.
- Usuário comum vê histórico/previsões e transações.
- Usuário comum não acessa admin.
- Admin acessa dashboard admin.
- Admin acessa usuários.
- Admin acessa logs.
- Admin acessa perguntas.
- Admin acessa preços.
- APIs privadas retornam `401/403` para anônimo.

## Monitoramento
- Monitorar logs de API para aumento de `401/403/500`.
- Monitorar logs Supabase (API/Postgres/Auth) para erros de policy.
- Confirmar ausência de regressão em `/api/predict` e `/api/predict-public`.

## Critérios de rollback
Acionar rollback se ocorrer qualquer um:
- falha de acesso em fluxo crítico de usuário autenticado;
- admin sem acesso às telas/rotas essenciais;
- falha generalizada `403/500` após apply;
- comportamento inesperado em tabelas sensíveis.

## Rollback
- Executar script de rollback preenchido com baseline real.
- Revalidar com `rls-postcheck.sql` + smoke tests críticos.
- Se rollback de policy falhar, seguir plano de restauração por snapshot.

## Responsáveis e checklist
- Responsável técnico app:
- Responsável banco/Supabase:
- Janela aprovada por:
- Backup confirmado por:
- Rollback script validado por:
- Horário início:
- Horário fim:

Checklist rápido:
- [ ] Project_ref e URL validados
- [ ] Backup/snapshot confirmado
- [ ] Baseline de policies exportado
- [ ] Rollback preenchido e revisado
- [ ] Migration aplicada
- [ ] Postcheck executado
- [ ] Smoke tests aprovados
- [ ] Monitoramento sem anomalias

## Observação crítica
Não aplicar a migration sem backup/snapshot e sem baseline real de policies para rollback.
