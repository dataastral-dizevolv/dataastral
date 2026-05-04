alter table public.calculator_questions
  add column if not exists category text;

update public.calculator_questions
set category = coalesce(category, 'amor')
where category is null;

alter table public.calculator_questions
  alter column category set default 'amor';

alter table public.calculator_questions
  alter column category set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calculator_questions_category_chk'
      and conrelid = 'public.calculator_questions'::regclass
  ) then
    alter table public.calculator_questions
      add constraint calculator_questions_category_chk
      check (category in ('amor', 'carreira', 'financas', 'saude', 'familia', 'viagens'));
  end if;
end
$$;

create index if not exists calculator_questions_category_order_idx
  on public.calculator_questions (category, "order" asc, id asc)
  where deleted_at is null;
