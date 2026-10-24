-- Isolamento entre usuários (RLS). Rodar com: npx supabase test db
begin;
select plan(13);

-- Dois usuários: Ana e Beto.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@teste.local'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@teste.local');

-- Ana cria seus dados.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

insert into public.materias (id, nome) values ('10000000-0000-0000-0000-000000000001', 'Direito Administrativo');
insert into public.assuntos (id, materia_id, nome)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Atos');
insert into public.resumos (id, assunto_id, titulo, blocos)
  values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Atos administrativos', '[]');
insert into public.estados_trecho (resumo_id, bloco_id, due)
  values ('30000000-0000-0000-0000-000000000001', 'b1', now());
insert into public.registros_revisao (resumo_id, bloco_id, modo, total, acertos, pct, nota)
  values ('30000000-0000-0000-0000-000000000001', 'b1', 'lacunas', 5, 4, 80, 'Hard');
insert into public.configuracoes default values;

select is((select user_id from public.materias), '00000000-0000-0000-0000-00000000000a'::uuid,
  'user_id é preenchido com o usuário logado');
select is((select limite_diario from public.configuracoes), 20, 'configurações nascem com os padrões');

-- Beto não vê nada da Ana.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

select is_empty('select * from public.materias', 'Beto não vê matérias da Ana');
select is_empty('select * from public.assuntos', 'Beto não vê assuntos da Ana');
select is_empty('select * from public.resumos', 'Beto não vê resumos da Ana');
select is_empty('select * from public.estados_trecho', 'Beto não vê estados da Ana');
select is_empty('select * from public.registros_revisao', 'Beto não vê revisões da Ana');
select is_empty('select * from public.configuracoes', 'Beto não vê configurações da Ana');

-- Beto não altera nem apaga dados da Ana (as linhas simplesmente não existem para ele).
update public.materias set nome = 'invadido';
delete from public.resumos;

-- Beto não pendura dados seus nos registros da Ana.
select throws_ok(
  $$insert into public.assuntos (materia_id, nome) values ('10000000-0000-0000-0000-000000000001', 'intruso')$$,
  '42501', null, 'Beto não cria assunto dentro da matéria da Ana');
select throws_ok(
  $$insert into public.estados_trecho (resumo_id, bloco_id, due) values ('30000000-0000-0000-0000-000000000001', 'x', now())$$,
  '42501', null, 'Beto não cria estado em resumo da Ana');
select throws_ok(
  $$insert into public.materias (user_id, nome) values ('00000000-0000-0000-0000-00000000000a', 'falsa')$$,
  '42501', null, 'Beto não cria matéria em nome da Ana');

-- Os dados da Ana continuam intactos.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select is((select nome from public.materias), 'Direito Administrativo', 'update do Beto não afetou a Ana');
select is((select count(*)::int from public.resumos), 1, 'delete do Beto não afetou a Ana');

select * from finish();
rollback;
