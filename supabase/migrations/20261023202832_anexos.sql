-- Anexos dos resumos (imagens e arquivos), no Supabase Storage.
-- Caminho de cada arquivo: <user_id>/<resumo_id>/<nome>. Cada usuário só
-- acessa a própria pasta.

insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 20 * 1024 * 1024)
on conflict (id) do nothing;

create policy "anexos: dono lê" on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "anexos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "anexos: dono altera" on storage.objects for update to authenticated
  using (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "anexos: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);
