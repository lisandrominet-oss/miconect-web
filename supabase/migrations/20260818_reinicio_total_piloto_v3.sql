-- MICONect - REINICIO TOTAL V3
-- Conserva exclusivamente lisandro.minet@miconect.com.
-- Los archivos de Storage se limpian luego desde la interfaz de Storage.

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

  update public.perfiles
  set empresa_id = null,
      rol = 'administrador_plataforma',
      activo = true
  where id = v_admin_id;

  foreach v_table in array array[
    'eventos_publicidad',
    'anuncios',
    'campanas_publicidad',
    'anunciantes',
    'adjuntos_solicitud',
    'adjudicaciones',
    'items_cotizacion',
    'cotizaciones',
    'solicitud_destinatarios',
    'solicitud_rubros',
    'items_solicitud',
    'solicitudes',
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

  delete from public.perfiles
  where id <> v_admin_id;

  delete from public.empresas;

  delete from auth.users
  where id <> v_admin_id;
end;
$$;

commit;
