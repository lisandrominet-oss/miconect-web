-- Miconect: una empresa puede comprar, vender o realizar ambas actividades.
-- Migracion aditiva y reversible: conserva empresas.tipo durante el piloto.

begin;

alter table public.empresas
  add column if not exists puede_comprar boolean,
  add column if not exists puede_vender boolean;

update public.empresas
set
  puede_comprar = coalesce(puede_comprar, tipo = 'compradora'),
  puede_vender = coalesce(puede_vender, tipo = 'proveedora')
where puede_comprar is null or puede_vender is null;

alter table public.empresas
  alter column puede_comprar set default false,
  alter column puede_comprar set not null,
  alter column puede_vender set default false,
  alter column puede_vender set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_al_menos_una_capacidad'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_al_menos_una_capacidad
      check (puede_comprar or puede_vender);
  end if;
end;
$$;

create or replace function public.mi_empresa_puede_comprar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select e.puede_comprar
    from public.empresas e
    where e.id = public.mi_empresa_id()
  ), false);
$$;

create or replace function public.mi_empresa_puede_vender()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select e.puede_vender
    from public.empresas e
    where e.id = public.mi_empresa_id()
  ), false);
$$;

revoke all on function public.mi_empresa_puede_comprar() from public;
revoke all on function public.mi_empresa_puede_vender() from public;
grant execute on function public.mi_empresa_puede_comprar() to authenticated;
grant execute on function public.mi_empresa_puede_vender() to authenticated;

create or replace function public.actualizar_capacidades_mi_empresa(
  p_puede_comprar boolean,
  p_puede_vender boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.mi_empresa_id();
begin
  if v_empresa_id is null then
    raise exception 'La cuenta no esta vinculada a una empresa';
  end if;

  if not coalesce(p_puede_comprar, false)
     and not coalesce(p_puede_vender, false) then
    raise exception 'La empresa debe poder comprar, vender o realizar ambas actividades';
  end if;

  update public.empresas
  set
    puede_comprar = coalesce(p_puede_comprar, false),
    puede_vender = coalesce(p_puede_vender, false),
    actualizada_en = now()
  where id = v_empresa_id;

  insert into public.eventos_auditoria (
    empresa_id, usuario_id, entidad, entidad_id, accion, detalle
  ) values (
    v_empresa_id,
    auth.uid(),
    'empresa',
    v_empresa_id,
    'capacidades_actualizadas',
    jsonb_build_object(
      'puede_comprar', coalesce(p_puede_comprar, false),
      'puede_vender', coalesce(p_puede_vender, false)
    )
  );
end;
$$;

revoke all on function public.actualizar_capacidades_mi_empresa(boolean, boolean) from public;
grant execute on function public.actualizar_capacidades_mi_empresa(boolean, boolean) to authenticated;

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
  ) then
    raise exception 'La empresa no tiene habilitada la capacidad de compra';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validar_capacidad_solicitud on public.solicitudes;
create trigger trg_validar_capacidad_solicitud
before insert or update of empresa_compradora_id
on public.solicitudes
for each row execute function public.validar_capacidad_solicitud();

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
  ) then
    raise exception 'La empresa no tiene habilitada la capacidad de venta';
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

drop trigger if exists trg_validar_capacidad_cotizacion on public.cotizaciones;
create trigger trg_validar_capacidad_cotizacion
before insert or update of solicitud_id, empresa_proveedora_id
on public.cotizaciones
for each row execute function public.validar_capacidad_cotizacion();

-- Una empresa mixta puede recibir pedidos de sus rubros, excepto los propios.
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
  ), false);
$$;

revoke all on function public.proveedor_recibe_solicitud(uuid) from public;
grant execute on function public.proveedor_recibe_solicitud(uuid) to authenticated;

-- Evita generar avisos de venta para la misma empresa que publico el pedido.
create or replace function public.omitir_notificacion_solicitud_propia()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tipo = 'nueva_solicitud'
     and new.entidad_id is not null
     and exists (
       select 1
       from public.solicitudes s
       where s.id = new.entidad_id
         and s.empresa_compradora_id = new.empresa_destinataria_id
     ) then
    return null;
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.notificaciones') is not null then
    drop trigger if exists trg_omitir_notificacion_solicitud_propia
      on public.notificaciones;
    create trigger trg_omitir_notificacion_solicitud_propia
    before insert on public.notificaciones
    for each row execute function public.omitir_notificacion_solicitud_propia();
  end if;
end;
$$;

create index if not exists idx_empresas_capacidad_compra
  on public.empresas (puede_comprar) where puede_comprar;
create index if not exists idx_empresas_capacidad_venta
  on public.empresas (puede_vender) where puede_vender;

commit;
