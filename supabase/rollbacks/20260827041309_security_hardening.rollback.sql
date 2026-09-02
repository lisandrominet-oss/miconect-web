-- Emergency rollback for 20260827041309_security_hardening.sql.
-- WARNING: this restores the previous policies and therefore reopens the
-- vulnerabilities described in the security report. Use only to recover from
-- an operational regression, then re-apply a corrected hardening migration.

begin;

drop trigger if exists trg_proteger_identidad_perfil on public.perfiles;
drop trigger if exists trg_proteger_estado_empresa on public.empresas;
drop trigger if exists trg_validar_capacidad_solicitud on public.solicitudes;

do $restore_functions$
declare backup_row record;
begin
  for backup_row in
    select definition
    from private.security_hardening_function_backup
    order by identity
  loop
    execute backup_row.definition;
  end loop;
end;
$restore_functions$;

do $restore_triggers$
declare backup_row record;
begin
  for backup_row in
    select definition
    from private.security_hardening_trigger_backup
    order by identity
  loop
    execute backup_row.definition;
  end loop;
end;
$restore_triggers$;

do $drop_replacement_policies$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where (schemaname = 'public' and policyname in (
      'adjuntos_solicitud_select_segura', 'items_cotizacion_select_segura',
      'items_solicitud_select_segura', 'solicitud_rubros_select_segura'
    )) or (schemaname = 'storage' and policyname in (
      'adjuntos_solicitudes_select_segura', 'adjuntos_solicitudes_insert_segura',
      'adjuntos_solicitudes_update_segura', 'adjuntos_solicitudes_delete_segura',
      'pdf_cotizaciones_select_segura', 'pdf_cotizaciones_insert_segura',
      'pdf_cotizaciones_update_segura', 'pdf_cotizaciones_delete_segura'
      , 'publicidad_delete_admin_segura'
    ))
  loop
    execute format('drop policy %I on %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$drop_replacement_policies$;

do $restore_policies$
declare
  backup_row record;
  statement text;
  role_list text;
begin
  for backup_row in
    select * from private.security_hardening_policy_backup
    order by schemaname, tablename, policyname
  loop
    select string_agg(quote_ident(role_name::text), ', ')
    into role_list
    from unnest(backup_row.roles) as role_name;

    statement := format(
      'create policy %I on %I.%I as %s for %s to %s',
      backup_row.policyname,
      backup_row.schemaname,
      backup_row.tablename,
      lower(backup_row.permissive),
      lower(backup_row.cmd),
      role_list
    );
    if backup_row.qual is not null then
      statement := statement || format(' using (%s)', backup_row.qual);
    end if;
    if backup_row.with_check is not null then
      statement := statement || format(' with check (%s)', backup_row.with_check);
    end if;
    execute statement;
  end loop;
end;
$restore_policies$;

alter table public.items_cotizacion
  drop constraint if exists items_cotizacion_alicuota_iva_rango;

do $drop_ad_constraint$
begin
  if to_regclass('public.anuncios') is not null then
    alter table public.anuncios
      drop constraint if exists anuncios_enlace_destino_https;
  end if;
end;
$drop_ad_constraint$;

drop function if exists public.reabrir_solicitud(uuid);
drop function if exists public.proteger_identidad_perfil();
drop function if exists public.proteger_estado_empresa();
drop function if exists public.puede_ver_solicitud_segura(uuid);
drop function if exists public.puede_ver_cotizacion_segura(uuid);
drop function if exists public.puede_cargar_adjunto_solicitud(uuid);
drop function if exists public.puede_cargar_pdf_cotizacion(uuid);
drop function if exists public.storage_parent_uuid(text);
drop function if exists public.consumir_limite_edge(text, text, integer, integer);
drop table if exists private.edge_rate_limits;

-- Restore the explicit RPC grants that existed before the hardening.
do $restore_grants$
declare function_row record;
begin
  if to_regprocedure('public.actualizar_capacidades_mi_empresa(boolean,boolean)') is not null then
    grant execute on function public.actualizar_capacidades_mi_empresa(boolean, boolean)
      to authenticated;
  end if;
  if to_regprocedure('public.cuit_disponible_registro(text)') is not null then
    grant execute on function public.cuit_disponible_registro(text) to anon, authenticated;
  end if;
  if to_regprocedure('public.email_disponible_registro(text)') is not null then
    grant execute on function public.email_disponible_registro(text) to anon, authenticated;
  end if;
  for function_row in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname = 'registrar_evento_publicidad' or p.proname like 'supervision\_%\_admin' escape '\')
  loop
    execute format('grant execute on function public.%I(%s) to anon, authenticated',
      function_row.proname, function_row.args);
  end loop;
end;
$restore_grants$;

grant insert on public.adjuntos_solicitud to authenticated;
grant insert on public.documentos_empresa to authenticated;

notify pgrst, 'reload schema';
commit;
