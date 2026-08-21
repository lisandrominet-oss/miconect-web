-- Miconect: reinicio total del piloto.
-- Conserva el usuario administrador de plataforma y la configuracion estructural
-- (rubros, ubicaciones de publicidad, funciones, RLS y configuracion de Auth).
-- Elimina datos operativos, archivos de prueba y todas las demas cuentas.

begin;

do $$
declare
  v_admin_id uuid;
  v_admin_role text;
  v_table text;
begin
  select u.id
  into v_admin_id
  from auth.users u
  where lower(u.email) = 'lisandro.minet@miconect.com';

  if v_admin_id is null then
    raise exception 'Reinicio cancelado: no se encontro el administrador a conservar';
  end if;

  select p.rol
  into v_admin_role
  from public.perfiles p
  where p.id = v_admin_id;

  if v_admin_role is distinct from 'administrador_plataforma' then
    raise exception 'Reinicio cancelado: el usuario a conservar no es administrador de plataforma';
  end if;

  -- El administrador queda sin empresa asociada y conserva su acceso.
  update public.perfiles
  set empresa_id = null,
      rol = 'administrador_plataforma',
      activo = true
  where id = v_admin_id;

  -- Primero se eliminan las dependencias de publicidad.
  foreach v_table in array array[
    'eventos_publicidad',
    'anuncios',
    'campanas_publicidad',
    'anunciantes',
    -- Dependencias de solicitudes, cotizaciones y adjudicaciones.
    'adjuntos_solicitud',
    'items_cotizacion',
    'adjudicaciones',
    'cotizaciones',
    'solicitud_destinatarios',
    'solicitud_rubros',
    'items_solicitud',
    'solicitudes',
    -- Dependencias de empresas y usuarios.
    'invitaciones_empresa',
    'documentos_empresa',
    'notificaciones',
    'empresa_rubros',
    'eventos_auditoria',
    'emails_bloqueados'
  ] loop
    if to_regclass('public.' || v_table) is not null then
      execute format('delete from public.%I', v_table);
    end if;
  end loop;

  -- Se eliminan todos los perfiles empresariales, pero no el administrador.
  delete from public.perfiles
  where id <> v_admin_id;

  -- Al no quedar dependencias, se eliminan todas las empresas del piloto.
  delete from public.empresas;

  -- Finalmente se eliminan los accesos de Auth. El administrador se conserva.
  delete from auth.users
  where id <> v_admin_id;
end;
$$;

commit;
