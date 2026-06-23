-- ======================================================================
--  DIETÉTICA VIDA GENUINA — SQL (base compartida pcxlhgdpxfuybzfsquem)
--  App APARTE del ecosistema. Prefijo de licencia: VIDA-...
--  Correlo en el SQL Editor de Supabase. Idempotente (se puede repetir).
--
--  Reutiliza la infraestructura ya construida:
--    tl_miembros (membresía), reclamar_tienda (vincular dueño),
--    validar_licencia, y el namespace de Auth @tiendalibre.app.
--
--  Lo propio de esta app:
--    1) tabla de datos      public.vida_backups (1 fila por local)
--    2) lectura pública     public.vida_publica(p_codigo)
--    3) alta de pedido      public.vida_agregar_pedido(p_codigo, p_pedido)
--    4) colaboradores       public.vida_verificar_colab(...) + public.vida_unir_colab(...)
--
--  Modelo de datos (datos jsonb):
--    { "config": {...}, "products": [...], "orders": [...],
--      "diets": [...], "categories": [...], "collaborators": [...] }
-- ======================================================================

-- 1) TABLA DE DATOS (1 fila por local) ---------------------------------
create table if not exists public.vida_backups (
  tenant_id  text primary key,
  datos      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) RLS: solo los miembros del local (dueño/colaborador) leen y escriben
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
    where schemaname='public' and tablename='vida_backups' loop
    execute format('drop policy if exists %I on public.vida_backups', pol.policyname);
  end loop;
  alter table public.vida_backups enable row level security;
  create policy vida_backups_miembros on public.vida_backups
    for all
    using      ( tenant_id in (select tenant_id from public.tl_miembros where user_id = auth.uid()) )
    with check ( tenant_id in (select tenant_id from public.tl_miembros where user_id = auth.uid()) );
end $$;

grant select, insert, update on public.vida_backups to authenticated;

-- 3) LECTURA PÚBLICA (vidriera del cliente, sin datos sensibles) -------
create or replace function public.vida_publica(p_codigo text)
returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'config',     coalesce(datos->'config','{}'::jsonb)
                    - 'adminPasswordHash' - 'licenseKey' - 'adminUsername',
    'products',   coalesce(datos->'products',   '[]'::jsonb),
    'diets',      coalesce(datos->'diets',      '[]'::jsonb),
    'categories', coalesce(datos->'categories', '[]'::jsonb)
  )
  from public.vida_backups
  where tenant_id = p_codigo
  limit 1;
$$;
grant execute on function public.vida_publica(text) to anon, authenticated;

-- 4) ALTA DE PEDIDO (desde la vidriera del cliente, anónimo) -----------
--    El pedido ya viene con su código de retiro (RET-XXXX) generado por la app.
create or replace function public.vida_agregar_pedido(p_codigo text, p_pedido jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare cur jsonb; arr jsonb;
begin
  if not exists (select 1 from public.licencias where codigo = p_codigo) then
    return;  -- código inexistente: no hacemos nada
  end if;
  select datos into cur from public.vida_backups where tenant_id = p_codigo limit 1;
  if cur is null then cur := '{}'::jsonb; end if;
  arr := coalesce(cur->'orders', '[]'::jsonb);
  arr := arr || jsonb_build_array(p_pedido);
  cur := jsonb_set(cur, '{orders}', arr, true);
  insert into public.vida_backups (tenant_id, datos, updated_at)
  values (p_codigo, cur, now())
  on conflict (tenant_id) do update set datos = excluded.datos, updated_at = now();
end $$;
grant execute on function public.vida_agregar_pedido(text, jsonb) to anon, authenticated;

-- 5) COLABORADORES -----------------------------------------------------
-- Verifica usuario+contraseña del colaborador (Admin B) contra
-- datos->'collaborators' (cada item: {username, passwordHash, ...}).
-- Anónimo, para el primer login del colaborador.
create or replace function public.vida_verificar_colab(p_codigo text, p_usuario text, p_pass text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare d jsonb; it jsonb; ok boolean := false;
begin
  select datos into d from public.vida_backups where tenant_id = p_codigo limit 1;
  if d is null then return false; end if;
  for it in select * from jsonb_array_elements(coalesce(d->'collaborators','[]'::jsonb)) loop
    if lower(it->>'username') = lower(p_usuario) and (it->>'passwordHash') = p_pass then ok := true; end if;
  end loop;
  return ok;
end $$;
grant execute on function public.vida_verificar_colab(text, text, text) to anon, authenticated;

-- Une al colaborador como miembro del local (autenticado).
create or replace function public.vida_unir_colab(p_codigo text, p_usuario text)
returns void
language plpgsql security definer set search_path = public as $$
declare d jsonb; it jsonb; permitido boolean := false;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select datos into d from public.vida_backups where tenant_id = p_codigo limit 1;
  if d is null then raise exception 'Local inexistente'; end if;
  for it in select * from jsonb_array_elements(coalesce(d->'collaborators','[]'::jsonb)) loop
    if lower(it->>'username') = lower(p_usuario) then permitido := true; end if;
  end loop;
  if not permitido then raise exception 'No estás en el equipo de este local'; end if;
  insert into public.tl_miembros(user_id, tenant_id, rol, usuario)
    values (auth.uid(), p_codigo, 'colab', p_usuario)
  on conflict (user_id) do update
    set tenant_id = excluded.tenant_id, rol = 'colab', usuario = excluded.usuario;
end $$;
grant execute on function public.vida_unir_colab(text, text) to authenticated;

-- ======================================================================
-- VERIFICACIÓN (en el navegador, reemplazá <ANON_KEY>):
--   La tabla NO debe leerse como anónimo (debe dar [] ):
--   https://pcxlhgdpxfuybzfsquem.supabase.co/rest/v1/vida_backups?select=*&limit=3&apikey=<ANON_KEY>
-- ======================================================================
