-- Miconect security hardening: closes the verified C1-C5, A1-A4/A6-A7 and
-- M1-M4 database findings. The first section snapshots every policy/function
-- replaced by this migration so the companion rollback is recoverable.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.security_hardening_policy_backup (
  schemaname name not null,
  tablename name not null,
  policyname name not null,
  permissive text not null,
  roles name[] not null,
  cmd text not null,
  qual text,
  with_check text,
  primary key (schemaname, tablename, policyname)
);

create table if not exists private.security_hardening_function_backup (
  identity text primary key,
  definition text not null,
  acl aclitem[]
);

create table if not exists private.security_hardening_trigger_backup (
  identity text primary key,
  definition text not null
);

insert into private.security_hardening_policy_backup
  (schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (
    schemaname = 'public'
    and tablename in (
      'adjuntos_solicitud', 'items_cotizacion', 'items_solicitud',
      'solicitud_rubros'
    )
    and cmd in ('SELECT', 'ALL')
  )
  or (
    schemaname = 'storage'
    and tablename = 'objects'
    and (
      coalesce(qual, '') ilike '%adjuntos-solicitudes%'
      or coalesce(with_check, '') ilike '%adjuntos-solicitudes%'
      or coalesce(qual, '') ilike '%pdf-cotizaciones%'
      or coalesce(with_check, '') ilike '%pdf-cotizaciones%'
      or (
        cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
        and (
          coalesce(qual, '') ilike '%documentos-empresas%'
          or coalesce(with_check, '') ilike '%documentos-empresas%'
          or coalesce(qual, '') ilike '%publicidad%'
          or coalesce(with_check, '') ilike '%publicidad%'
        )
      )
    )
  )
on conflict (schemaname, tablename, policyname) do nothing;

insert into private.security_hardening_function_backup (identity, definition, acl)
select
  format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)),
  pg_get_functiondef(p.oid),
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'actualizar_capacidades_mi_empresa', 'validar_capacidad_solicitud',
    'cuit_disponible_registro', 'registrar_evento_publicidad',
    'soy_admin_plataforma'
  )
on conflict (identity) do nothing;

insert into private.security_hardening_trigger_backup (identity, definition)
select
  format('%I.%I.%I', n.nspname, c.relname, t.tgname),
  pg_get_triggerdef(t.oid, true)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname in ('perfiles', 'empresas', 'solicitudes')
  and t.tgname in (
    'trg_proteger_identidad_perfil', 'trg_proteger_estado_empresa',
    'trg_validar_capacidad_solicitud'
  )
on conflict (identity) do nothing;

do $preconditions$
declare
  required_relation text;
begin
  foreach required_relation in array array[
    'public.perfiles', 'public.empresas', 'public.solicitudes',
    'public.cotizaciones', 'public.items_cotizacion',
    'public.items_solicitud', 'public.solicitud_rubros',
    'public.adjuntos_solicitud', 'public.documentos_empresa',
    'public.adjudicaciones', 'public.eventos_auditoria',
    'public.anuncios', 'storage.objects'
  ] loop
    if to_regclass(required_relation) is null then
      raise exception 'Security hardening aborted: missing relation %', required_relation;
    end if;
  end loop;

  if to_regprocedure('public.soy_admin_plataforma()') is null
     or to_regprocedure('public.mi_empresa_id()') is null
     or to_regprocedure('public.puede_ver_archivos_solicitud(uuid)') is null then
    raise exception 'Security hardening aborted: required authorization helpers are missing';
  end if;
end;
$preconditions$;

-- A5: every policy and RPC that relies on the platform-admin helper now also
-- requires an MFA-verified (AAL2) JWT. The service role remains independent.
create or replace function public.soy_admin_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
    and exists (
      select 1
      from public.perfiles p
      where p.id = auth.uid()
        and p.rol = 'administrador_plataforma'
    );
$$;

revoke all on function public.soy_admin_plataforma() from public, anon;
grant execute on function public.soy_admin_plataforma() to authenticated;

-- C1: even if a permissive UPDATE policy or table grant is reintroduced, a
-- non-platform-admin cannot mutate the identity/tenant boundary of a profile.
create or replace function public.proteger_identidad_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('service_role', 'postgres')
     and not coalesce(public.soy_admin_plataforma(), false)
     and (new.id, new.empresa_id, new.rol)
         is distinct from (old.id, old.empresa_id, old.rol) then
    raise exception 'No se permite cambiar el rol ni la empresa del perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.proteger_identidad_perfil() from public, anon, authenticated;

drop trigger if exists trg_proteger_identidad_perfil on public.perfiles;
create trigger trg_proteger_identidad_perfil
before update on public.perfiles
for each row execute function public.proteger_identidad_perfil();

-- C2: company members may only submit/resubmit their own company for review.
-- Verification, operational status and commercial capabilities stay admin-only.
create or replace function public.proteger_estado_empresa()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_admin boolean := coalesce(public.soy_admin_plataforma(), false);
  is_owner boolean := old.id = public.mi_empresa_id();
  valid_resubmission boolean;
begin
  if current_user in ('service_role', 'postgres') or is_admin then
    return new;
  end if;

  if (new.id, new.estado_operativo, new.puede_comprar, new.puede_vender, new.verificada_en)
     is distinct from
     (old.id, old.estado_operativo, old.puede_comprar, old.puede_vender, old.verificada_en) then
    raise exception 'Los controles de verificacion y capacidad son exclusivos del administrador'
      using errcode = '42501';
  end if;

  valid_resubmission := is_owner
    and old.estado::text in ('registro_incompleto', 'observada', 'rechazada')
    and new.estado::text = 'pendiente'
    and new.motivo_observacion is null;

  if (new.estado, new.motivo_observacion)
     is distinct from (old.estado, old.motivo_observacion)
     and not valid_resubmission then
    raise exception 'La empresa solo puede enviarse a revision; no puede autoverificarse'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.proteger_estado_empresa() from public, anon, authenticated;

drop trigger if exists trg_proteger_estado_empresa on public.empresas;
create trigger trg_proteger_estado_empresa
before update on public.empresas
for each row execute function public.proteger_estado_empresa();

-- A1: the legacy self-service capability RPC is no longer a client endpoint.
do $revoke_capabilities$
begin
  if to_regprocedure('public.actualizar_capacidades_mi_empresa(boolean,boolean)') is not null then
    revoke all on function public.actualizar_capacidades_mi_empresa(boolean, boolean)
      from public, anon, authenticated;
    grant execute on function public.actualizar_capacidades_mi_empresa(boolean, boolean)
      to service_role;
  end if;
end;
$revoke_capabilities$;

-- A2: enforce the current capability model at the table boundary, regardless
-- of legacy checks inside publicar_solicitud().
create or replace function public.validar_capacidad_solicitud()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado::text = 'publicada' and not exists (
    select 1
    from public.empresas e
    where e.id = new.empresa_compradora_id
      and e.puede_comprar
      and e.estado::text = 'verificada'
      and coalesce(e.estado_operativo::text, 'activa') = 'activa'
  ) then
    raise exception 'Solo una empresa verificada y habilitada para comprar puede publicar solicitudes'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validar_capacidad_solicitud on public.solicitudes;
create trigger trg_validar_capacidad_solicitud
before insert or update of empresa_compradora_id, estado
on public.solicitudes
for each row execute function public.validar_capacidad_solicitud();

-- A3: validate VAT for every insert/update path, including future RPCs.
do $vat_constraint$
begin
  if exists (
    select 1 from public.items_cotizacion
    where alicuota_iva is null or alicuota_iva < 0 or alicuota_iva > 100
  ) then
    raise exception 'Security hardening aborted: invalid existing VAT values require review';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.items_cotizacion'::regclass
      and conname = 'items_cotizacion_alicuota_iva_rango'
  ) then
    alter table public.items_cotizacion
      add constraint items_cotizacion_alicuota_iva_rango
      check (alicuota_iva between 0 and 100);
  end if;
end;
$vat_constraint$;

-- Shared authorization helpers. They are SECURITY DEFINER only to evaluate
-- tenant relationships without recursive RLS; every path starts from auth.uid().
create or replace function public.puede_ver_solicitud_segura(p_solicitud_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and coalesce((
    select
      coalesce(public.soy_admin_plataforma(), false)
      or s.empresa_compradora_id = public.mi_empresa_id()
      or exists (
        select 1 from public.cotizaciones c
        where c.solicitud_id = s.id
          and c.empresa_proveedora_id = public.mi_empresa_id()
      )
      or (
        s.estado::text = 'publicada'
        and s.fecha_limite > now()
        and public.proveedor_recibe_solicitud(s.id)
      )
    from public.solicitudes s
    where s.id = p_solicitud_id
  ), false);
$$;

create or replace function public.puede_ver_cotizacion_segura(p_cotizacion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and coalesce((
    select
      coalesce(public.soy_admin_plataforma(), false)
      or c.empresa_proveedora_id = public.mi_empresa_id()
      or (
        s.empresa_compradora_id = public.mi_empresa_id()
        and (
          not coalesce(s.apertura_al_vencimiento, false)
          or s.fecha_limite <= now()
          or s.estado::text <> 'publicada'
        )
      )
    from public.cotizaciones c
    join public.solicitudes s on s.id = c.solicitud_id
    where c.id = p_cotizacion_id
  ), false);
$$;

create or replace function public.puede_cargar_adjunto_solicitud(p_solicitud_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and coalesce((
    select coalesce(public.soy_admin_plataforma(), false) or (
      s.empresa_compradora_id = public.mi_empresa_id()
      and s.estado::text = 'publicada'
      and s.fecha_limite > now()
    )
    from public.solicitudes s where s.id = p_solicitud_id
  ), false);
$$;

create or replace function public.puede_cargar_pdf_cotizacion(p_cotizacion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and coalesce((
    select coalesce(public.soy_admin_plataforma(), false) or (
      c.empresa_proveedora_id = public.mi_empresa_id()
      and s.estado::text = 'publicada'
      and s.fecha_limite > now()
      and not exists (
        select 1 from public.adjudicaciones a where a.cotizacion_id = c.id
      )
    )
    from public.cotizaciones c
    join public.solicitudes s on s.id = c.solicitud_id
    where c.id = p_cotizacion_id
  ), false);
$$;

create or replace function public.storage_parent_uuid(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;

revoke all on function public.puede_ver_solicitud_segura(uuid) from public;
revoke all on function public.puede_ver_cotizacion_segura(uuid) from public;
revoke all on function public.puede_cargar_adjunto_solicitud(uuid) from public;
revoke all on function public.puede_cargar_pdf_cotizacion(uuid) from public;
revoke all on function public.storage_parent_uuid(text) from public;
grant execute on function public.puede_ver_solicitud_segura(uuid) to authenticated;
grant execute on function public.puede_ver_cotizacion_segura(uuid) to authenticated;
grant execute on function public.puede_cargar_adjunto_solicitud(uuid) to authenticated;
grant execute on function public.puede_cargar_pdf_cotizacion(uuid) to authenticated;
grant execute on function public.storage_parent_uuid(text) to authenticated;

-- C3-C5: remove every permissive SELECT policy for the affected child tables,
-- then install one complete predicate per table so no weak OR branch survives.
do $drop_child_select_policies$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'adjuntos_solicitud', 'items_cotizacion',
        'items_solicitud', 'solicitud_rubros'
      )
      and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy %I on %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$drop_child_select_policies$;

create policy adjuntos_solicitud_select_segura
on public.adjuntos_solicitud for select to authenticated
using (public.puede_ver_archivos_solicitud(solicitud_id));

create policy items_cotizacion_select_segura
on public.items_cotizacion for select to authenticated
using (public.puede_ver_cotizacion_segura(cotizacion_id));

create policy items_solicitud_select_segura
on public.items_solicitud for select to authenticated
using (public.puede_ver_solicitud_segura(solicitud_id));

create policy solicitud_rubros_select_segura
on public.solicitud_rubros for select to authenticated
using (public.puede_ver_solicitud_segura(solicitud_id));

-- C3-C4/M1-M2/A9: Storage policies are permissive (OR). Keep only secure read
-- policies for private files. All writes go through subir-archivo-seguro, which
-- inspects bytes and uses service_role after an authenticated authorization check.
do $drop_private_storage_policies$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%adjuntos-solicitudes%'
        or coalesce(with_check, '') ilike '%adjuntos-solicitudes%'
        or coalesce(qual, '') ilike '%pdf-cotizaciones%'
        or coalesce(with_check, '') ilike '%pdf-cotizaciones%'
        or (
          cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          and (
            coalesce(qual, '') ilike '%documentos-empresas%'
            or coalesce(with_check, '') ilike '%documentos-empresas%'
            or coalesce(qual, '') ilike '%publicidad%'
            or coalesce(with_check, '') ilike '%publicidad%'
          )
        )
      )
  loop
    execute format('drop policy %I on storage.objects', policy_row.policyname);
  end loop;
end;
$drop_private_storage_policies$;

create policy adjuntos_solicitudes_select_segura
on storage.objects for select to authenticated
using (
  bucket_id = 'adjuntos-solicitudes'
  and public.puede_ver_archivos_solicitud(public.storage_parent_uuid(name))
);

create policy pdf_cotizaciones_select_segura
on storage.objects for select to authenticated
using (
  bucket_id = 'pdf-cotizaciones'
  and public.puede_ver_cotizacion_segura(public.storage_parent_uuid(name))
);

-- Deletion is retained for admin cleanup; creation/replacement still has no
-- authenticated policy and therefore cannot bypass binary inspection.
create policy publicidad_delete_admin_segura
on storage.objects for delete to authenticated
using (
  bucket_id = 'publicidad'
  and coalesce(public.soy_admin_plataforma(), false)
);

revoke insert on public.adjuntos_solicitud from authenticated;
revoke insert on public.documentos_empresa from authenticated;

-- A4: implemented server-side, with ownership, row lock, state/deadline and
-- adjudication checks. The UI can no longer call a missing or permissive RPC.
create or replace function public.reabrir_solicitud(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.solicitudes%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Sesion requerida' using errcode = '42501';
  end if;

  select * into request_row
  from public.solicitudes
  where id = p_solicitud_id
  for update;

  if not found then
    raise exception 'Solicitud inexistente';
  end if;
  if not coalesce(public.soy_admin_plataforma(), false)
     and request_row.empresa_compradora_id <> public.mi_empresa_id() then
    raise exception 'No se permite reabrir esta solicitud' using errcode = '42501';
  end if;
  if request_row.estado::text <> 'cerrada' then
    raise exception 'Solo se puede reabrir una solicitud cerrada';
  end if;
  if request_row.fecha_limite <= now() then
    raise exception 'La fecha limite ya vencio';
  end if;
  if exists (
    select 1 from public.adjudicaciones a where a.solicitud_id = p_solicitud_id
  ) then
    raise exception 'La solicitud ya tiene adjudicaciones';
  end if;

  update public.solicitudes set estado = 'publicada' where id = p_solicitud_id;
  insert into public.eventos_auditoria
    (empresa_id, usuario_id, entidad, entidad_id, accion, detalle)
  values
    (request_row.empresa_compradora_id, (select auth.uid()), 'solicitud',
     p_solicitud_id, 'solicitud_reabierta', '{}'::jsonb);
end;
$$;

revoke all on function public.reabrir_solicitud(uuid) from public, anon;
grant execute on function public.reabrir_solicitud(uuid) to authenticated;

-- A6-A7/M4: remove unnecessary public RPC surface. Advertising events are
-- accepted only through the rate-limited Edge Function using service_role.
do $lock_rpc_surface$
declare function_row record;
begin
  if to_regprocedure('public.cuit_disponible_registro(text)') is not null then
    revoke all on function public.cuit_disponible_registro(text) from anon;
    grant execute on function public.cuit_disponible_registro(text) to authenticated;
  end if;

  if to_regprocedure('public.email_disponible_registro(text)') is not null then
    revoke all on function public.email_disponible_registro(text) from anon;
    grant execute on function public.email_disponible_registro(text) to authenticated;
  end if;

  for function_row in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname = 'registrar_evento_publicidad' or p.proname like 'supervision\_%\_admin' escape '\')
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated',
      function_row.proname, function_row.args);
    if function_row.proname = 'registrar_evento_publicidad' then
      execute format('grant execute on function public.%I(%s) to service_role',
        function_row.proname, function_row.args);
    elsif function_row.proname like 'supervision\_%\_admin' escape '\' then
      execute format('grant execute on function public.%I(%s) to authenticated',
        function_row.proname, function_row.args);
    end if;
  end loop;
end;
$lock_rpc_surface$;

create table if not exists private.edge_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, subject_hash)
);

create or replace function public.consumir_limite_edge(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if current_user not in ('service_role', 'postgres') then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;
  if p_scope is null or p_subject_hash is null
     or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Parametros de limite invalidos';
  end if;

  insert into private.edge_rate_limits
    (scope, subject_hash, window_started_at, request_count)
  values (p_scope, p_subject_hash, now(), 1)
  on conflict (scope, subject_hash) do update
  set
    window_started_at = case
      when private.edge_rate_limits.window_started_at
           + make_interval(secs => p_window_seconds) <= now()
      then now() else private.edge_rate_limits.window_started_at end,
    request_count = case
      when private.edge_rate_limits.window_started_at
           + make_interval(secs => p_window_seconds) <= now()
      then 1 else private.edge_rate_limits.request_count + 1 end
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consumir_limite_edge(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consumir_limite_edge(text, text, integer, integer)
  to service_role;

-- A11: prevent dangerous schemes even if a future client forgets validation.
do $advertisement_url_constraint$
begin
  if to_regclass('public.anuncios') is not null then
    if exists (
      select 1 from public.anuncios
      where enlace_destino is not null
        and enlace_destino !~* '^https://[^[:space:]]+$'
    ) then
      raise exception 'Security hardening aborted: unsafe advertisement URLs require review';
    end if;
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.anuncios'::regclass
        and conname = 'anuncios_enlace_destino_https'
    ) then
      alter table public.anuncios
        add constraint anuncios_enlace_destino_https
        check (enlace_destino is null or enlace_destino ~* '^https://[^[:space:]]+$');
    end if;
  end if;
end;
$advertisement_url_constraint$;

notify pgrst, 'reload schema';
commit;
