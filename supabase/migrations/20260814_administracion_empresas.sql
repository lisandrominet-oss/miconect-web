-- Miconect: administracion segura de empresas y accesos.
-- La eliminacion fisica queda limitada a registros sin actividad comercial.

begin;

alter table public.empresas
  add column if not exists estado_operativo text not null default 'activa';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_estado_operativo_valido'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_estado_operativo_valido
      check (estado_operativo in ('activa', 'pausada', 'bloqueada', 'archivada'));
  end if;
end;
$$;

create index if not exists idx_empresas_estado_operativo
  on public.empresas (estado_operativo);

create table if not exists public.emails_bloqueados (
  id bigint generated always as identity primary key,
  email text not null,
  motivo text not null,
  activo boolean not null default true,
  bloqueado_por uuid references auth.users(id) on delete set null,
  bloqueado_en timestamptz not null default now(),
  desbloqueado_por uuid references auth.users(id) on delete set null,
  desbloqueado_en timestamptz,
  constraint emails_bloqueados_email_no_vacio check (btrim(email) <> ''),
  constraint emails_bloqueados_motivo_no_vacio check (btrim(motivo) <> '')
);

create unique index if not exists emails_bloqueados_activos_email_idx
  on public.emails_bloqueados (lower(btrim(email)))
  where activo;

alter table public.emails_bloqueados enable row level security;
revoke all on public.emails_bloqueados from anon, authenticated;

create or replace function public.email_disponible_registro(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.emails_bloqueados eb
    where eb.activo
      and lower(btrim(eb.email)) = lower(btrim(p_email))
  );
$$;

revoke all on function public.email_disponible_registro(text) from public;
grant execute on function public.email_disponible_registro(text) to anon, authenticated;

create or replace function public.validar_capacidad_solicitud()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.empresas e
    where e.id = new.empresa_compradora_id
      and e.puede_comprar
      and e.estado_operativo = 'activa'
  ) then
    raise exception 'La empresa no esta habilitada para publicar solicitudes';
  end if;
  return new;
end;
$$;

create or replace function public.validar_capacidad_cotizacion()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_empresa_compradora_id uuid;
begin
  if not exists (
    select 1
    from public.empresas e
    where e.id = new.empresa_proveedora_id
      and e.puede_vender
      and e.estado_operativo = 'activa'
  ) then
    raise exception 'La empresa no esta habilitada para presentar cotizaciones';
  end if;

  select s.empresa_compradora_id
  into v_empresa_compradora_id
  from public.solicitudes s
  where s.id = new.solicitud_id;

  if v_empresa_compradora_id = new.empresa_proveedora_id then
    raise exception 'Una empresa no puede cotizar su propia solicitud';
  end if;

  return new;
end;
$$;

create or replace function public.proveedor_recibe_solicitud(p_solicitud_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(exists (
    select 1
    from public.solicitudes s
    join public.solicitud_rubros sr on sr.solicitud_id = s.id
    join public.empresa_rubros er on er.rubro_id = sr.rubro_id
    join public.empresas e on e.id = er.empresa_id
    where s.id = p_solicitud_id
      and er.empresa_id = public.mi_empresa_id()
      and er.empresa_id <> s.empresa_compradora_id
      and e.puede_vender
      and e.estado_operativo = 'activa'
  ), false);
$$;

revoke all on function public.proveedor_recibe_solicitud(uuid) from public;
grant execute on function public.proveedor_recibe_solicitud(uuid) to authenticated;

create or replace function public.purgar_empresa_incompleta(p_empresa_id uuid)
returns table (usuario_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tiene_actividad boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Operacion reservada al servidor';
  end if;

  select
    exists (
      select 1 from public.solicitudes s
      where s.empresa_compradora_id = p_empresa_id
    )
    or exists (
      select 1 from public.cotizaciones c
      where c.empresa_proveedora_id = p_empresa_id
    )
    or exists (
      select 1 from public.adjudicaciones a
      where a.empresa_proveedora_id = p_empresa_id
    )
  into v_tiene_actividad;

  if v_tiene_actividad then
    raise exception 'La empresa tiene actividad comercial y no puede eliminarse; pausala, bloqueala o archivala';
  end if;

  return query
    select p.id
    from public.perfiles p
    where p.empresa_id = p_empresa_id;

  delete from public.empresa_rubros where empresa_id = p_empresa_id;
  delete from public.invitaciones_empresa where empresa_id = p_empresa_id;
  delete from public.documentos_empresa where empresa_id = p_empresa_id;
  delete from public.notificaciones where empresa_destinataria_id = p_empresa_id;
  delete from public.eventos_auditoria where empresa_id = p_empresa_id;
  delete from public.perfiles where empresa_id = p_empresa_id;
  delete from public.empresas where id = p_empresa_id;

  if not found then
    raise exception 'No se encontro la empresa';
  end if;
end;
$$;

revoke all on function public.purgar_empresa_incompleta(uuid) from public, anon, authenticated;
grant execute on function public.purgar_empresa_incompleta(uuid) to service_role;

commit;
