-- Miconect: transmitir las notificaciones nuevas a las sesiones abiertas.
-- Es idempotente: puede ejecutarse nuevamente sin duplicar la tabla.

begin;

do $$
begin
  if to_regclass('public.notificaciones') is null then
    raise exception 'No existe la tabla public.notificaciones';
  end if;

  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    raise exception 'No existe la publicacion supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime
      add table public.notificaciones;
  end if;
end;
$$;

alter table public.notificaciones replica identity full;

commit;
