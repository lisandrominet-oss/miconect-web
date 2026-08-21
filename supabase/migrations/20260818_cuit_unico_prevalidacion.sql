-- Miconect: el CUIT identifica de forma unica a una empresa.
-- Incluye prevalidacion publica sin exponer datos de la empresa existente.

begin;

do $$
begin
  if exists (
    select 1
    from public.empresas
    group by regexp_replace(cuit, '[^0-9]', '', 'g')
    having count(*) > 1
  ) then
    raise exception 'Hay CUIT duplicados en empresas. Deben consolidarse antes de activar la restriccion unica.';
  end if;
end;
$$;

create unique index if not exists empresas_cuit_unico_idx
  on public.empresas (
    regexp_replace(cuit, '[^0-9]', '', 'g')
  );

create or replace function public.cuit_disponible_registro(p_cuit text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with entrada as (
    select regexp_replace(coalesce(p_cuit, ''), '[^0-9]', '', 'g') as cuit
  )
  select
    entrada.cuit ~ '^[0-9]{11}$'
    and not exists (
      select 1
      from public.empresas empresa
      where regexp_replace(empresa.cuit, '[^0-9]', '', 'g') = entrada.cuit
    )
  from entrada;
$$;

revoke all on function public.cuit_disponible_registro(text) from public;
grant execute on function public.cuit_disponible_registro(text)
  to anon, authenticated;

-- Fuerza a PostgREST a incorporar la nueva RPC sin esperar la recarga
-- periódica de su caché de esquema.
notify pgrst, 'reload schema';

commit;
