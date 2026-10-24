-- Esquema inicial do Trechos (design §2).
-- Cada linha pertence a um usuário (user_id) e só ele a enxerga (RLS).
-- Trechos não são tabela: são derivados dos blocos do resumo. Só o estado FSRS
-- de cada trecho é salvo, pela chave (resumo_id, bloco_id do bloco inicial).

-- ── Hierarquia ──────────────────────────────────────────────────────────────

create table public.materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table public.assuntos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table public.resumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assunto_id uuid not null references public.assuntos (id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  ordem integer not null default 0,
  -- Lista de blocos (type, segs, items, rows, qs...), como no modelo do app.
  blocos jsonb not null default '[]'::jsonb check (jsonb_typeof(blocos) = 'array'),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ── Revisão ─────────────────────────────────────────────────────────────────

create table public.estados_trecho (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resumo_id uuid not null references public.resumos (id) on delete cascade,
  bloco_id text not null,
  stability double precision not null default 0 check (stability >= 0),
  difficulty double precision not null default 0 check (difficulty >= 0),
  due timestamptz not null,
  last_review timestamptz,
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  primary key (resumo_id, bloco_id)
);

create table public.registros_revisao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resumo_id uuid not null references public.resumos (id) on delete cascade,
  bloco_id text not null,
  data timestamptz not null default now(),
  modo text not null check (modo in ('lacunas', 'perguntas', 'titulo', 'densas')),
  total integer not null check (total >= 0),
  acertos integer not null check (acertos between 0 and total),
  pct integer not null check (pct between 0 and 100),
  nota text not null check (nota in ('Again', 'Hard', 'Good', 'Easy')),
  -- Resultado por item: { "<id do item>": true | false }.
  marcas jsonb not null default '{}'::jsonb check (jsonb_typeof(marcas) = 'object')
);

-- ── Configurações (R14), uma linha por usuário ──────────────────────────────

create table public.configuracoes (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  retencao numeric(3, 2) not null default 0.90 check (retencao in (0.80, 0.85, 0.90, 0.95)),
  limite_tipo text not null default 'palavras' check (limite_tipo in ('palavras', 'lacunas')),
  limite_palavras integer not null default 150 check (limite_palavras > 0),
  limite_lacunas integer not null default 10 check (limite_lacunas > 0),
  faixa_easy integer not null default 100 check (faixa_easy between 0 and 100),
  faixa_good integer not null default 90 check (faixa_good between 0 and 100),
  faixa_hard integer not null default 60 check (faixa_hard between 0 and 100),
  densidade text not null default 'média' check (densidade in ('baixa', 'média', 'alta')),
  limite_edicao integer not null default 30 check (limite_edicao between 0 and 100),
  limite_diario integer not null default 20 check (limite_diario > 0),
  check (faixa_easy >= faixa_good and faixa_good >= faixa_hard)
);

-- ── Índices ─────────────────────────────────────────────────────────────────

create index materias_user_idx on public.materias (user_id, ordem);
create index assuntos_materia_idx on public.assuntos (materia_id, ordem);
create index assuntos_user_idx on public.assuntos (user_id);
create index resumos_assunto_idx on public.resumos (assunto_id, ordem);
create index resumos_user_idx on public.resumos (user_id);
create index estados_trecho_user_due_idx on public.estados_trecho (user_id, due);
create index registros_revisao_user_data_idx on public.registros_revisao (user_id, data desc);
create index registros_revisao_trecho_idx on public.registros_revisao (resumo_id, bloco_id);

-- ── atualizado_em dos resumos ───────────────────────────────────────────────

create function public.tocar_atualizado_em() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger resumos_atualizado_em
  before update on public.resumos
  for each row execute function public.tocar_atualizado_em();

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Dono vê e altera só as próprias linhas. Ao gravar, o "pai" também precisa
-- ser dele (a chave estrangeira sozinha não verifica o dono).

alter table public.materias enable row level security;
alter table public.assuntos enable row level security;
alter table public.resumos enable row level security;
alter table public.estados_trecho enable row level security;
alter table public.registros_revisao enable row level security;
alter table public.configuracoes enable row level security;

create policy "dono" on public.materias for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "dono" on public.assuntos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.materias m where m.id = materia_id and m.user_id = (select auth.uid()))
  );

create policy "dono" on public.resumos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.assuntos a where a.id = assunto_id and a.user_id = (select auth.uid()))
  );

create policy "dono" on public.estados_trecho for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.resumos r where r.id = resumo_id and r.user_id = (select auth.uid()))
  );

create policy "dono" on public.registros_revisao for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.resumos r where r.id = resumo_id and r.user_id = (select auth.uid()))
  );

create policy "dono" on public.configuracoes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
