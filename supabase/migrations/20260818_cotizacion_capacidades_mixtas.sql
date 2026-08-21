-- Miconect: permitir cotizar a toda empresa verificada con capacidad de venta.
-- Conserva intacta la logica transaccional de presentar_cotizacion y elimina
-- la dependencia del campo historico empresas.tipo.

begin;

do $migration$
declare
  v_function_oid oid;
  v_function_count integer;
  v_definition text;
begin
  select count(*)
    into v_function_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'presentar_cotizacion';

  if v_function_count <> 1 then
    raise exception
      'Se esperaba una unica funcion public.presentar_cotizacion y se encontraron %',
      v_function_count;
  end if;

  select p.oid
    into v_function_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'presentar_cotizacion';

  select pg_get_functiondef(v_function_oid)
    into v_definition;

  if position('and tipo = ''proveedora''' in v_definition) > 0 then
    v_definition := replace(
      v_definition,
      'and tipo = ''proveedora''',
      'and puede_vender
      and coalesce(estado_operativo, ''activa'') = ''activa'''
    );

    v_definition := replace(
      v_definition,
      'Solo un proveedor verificado puede cotizar',
      'Solo una empresa verificada y habilitada para vender puede cotizar'
    );

    execute v_definition;
  elsif position('and puede_vender' in v_definition) = 0 then
    raise exception
      'No se encontro la validacion historica esperada en public.presentar_cotizacion';
  end if;
end;
$migration$;

commit;
