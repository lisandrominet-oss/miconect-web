-- Miconect: alta atomica de empresas con capacidades de compra y venta.
-- Evita crear primero la empresa con ambas capacidades desactivadas.

begin;

create or replace function public.registrar_empresa_y_perfil_v2(
  p_tipo public.tipo_empresa,
  p_razon_social text,
  p_nombre_comercial text,
  p_cuit text,
  p_localidad text,
  p_domicilio text,
  p_telefono text,
  p_whatsapp text,
  p_email_empresa text,
  p_sitio_web text,
  p_nombre text,
  p_apellido text,
  p_cargo text,
  p_puede_comprar boolean,
  p_puede_vender boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'El usuario debe iniciar sesion';
  end if;

  if exists (
    select 1
    from public.perfiles perfil
    where perfil.id = auth.uid()
  ) then
    raise exception 'El usuario ya tiene un perfil registrado';
  end if;

  if not coalesce(p_puede_comprar, false)
     and not coalesce(p_puede_vender, false) then
    raise exception 'La empresa debe poder comprar, vender o realizar ambas actividades';
  end if;

  if p_cuit !~ '^[0-9]{11}$' then
    raise exception 'El CUIT debe contener exactamente 11 numeros';
  end if;

  if exists (
    select 1
    from public.empresas empresa
    where empresa.cuit = p_cuit
  ) then
    raise exception 'Ya existe una empresa registrada con este CUIT';
  end if;

  insert into public.empresas (
    tipo,
    razon_social,
    nombre_comercial,
    cuit,
    provincia,
    localidad,
    domicilio,
    telefono,
    whatsapp,
    email_empresa,
    sitio_web,
    estado,
    puede_comprar,
    puede_vender
  )
  values (
    p_tipo,
    trim(p_razon_social),
    nullif(trim(p_nombre_comercial), ''),
    p_cuit,
    'San Juan',
    trim(p_localidad),
    nullif(trim(p_domicilio), ''),
    nullif(trim(p_telefono), ''),
    nullif(trim(p_whatsapp), ''),
    lower(trim(p_email_empresa)),
    nullif(trim(p_sitio_web), ''),
    'registro_incompleto',
    coalesce(p_puede_comprar, false),
    coalesce(p_puede_vender, false)
  )
  returning id into v_empresa_id;

  insert into public.perfiles (
    id,
    empresa_id,
    nombre,
    apellido,
    cargo,
    rol,
    activo
  )
  values (
    auth.uid(),
    v_empresa_id,
    trim(p_nombre),
    trim(p_apellido),
    nullif(trim(p_cargo), ''),
    'administrador_empresa',
    true
  );

  insert into public.eventos_auditoria (
    empresa_id,
    usuario_id,
    entidad,
    entidad_id,
    accion,
    detalle
  )
  values (
    v_empresa_id,
    auth.uid(),
    'empresa',
    v_empresa_id,
    'registro_inicial',
    jsonb_build_object(
      'tipo', p_tipo,
      'estado', 'registro_incompleto',
      'puede_comprar', coalesce(p_puede_comprar, false),
      'puede_vender', coalesce(p_puede_vender, false)
    )
  );

  return v_empresa_id;
end;
$$;

revoke all on function public.registrar_empresa_y_perfil_v2(
  public.tipo_empresa,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean
) from public;

grant execute on function public.registrar_empresa_y_perfil_v2(
  public.tipo_empresa,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean
) to authenticated;

commit;
