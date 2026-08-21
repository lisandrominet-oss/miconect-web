# Edge Functions de Miconect

El nombre de cada carpeta coincide con el nombre de la función desplegada en
Supabase. Estas fuentes fueron descargadas del proyecto productivo y
sincronizadas con el repositorio el 20 de agosto de 2026.

## Funciones

- `administrador-empresa`: operaciones reservadas al administrador de
  plataforma sobre empresas y usuarios.
- `archivo-supervision-admin`: genera enlaces temporales para que el
  administrador consulte adjuntos y PDFs autorizados.
- `enviar-invitacion-empresa`: valida una invitación y envía su correo mediante
  Resend.

## Variables requeridas

Los valores se configuran como secretos del proyecto de Supabase y nunca deben
guardarse en Git.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

La función `administrador-empresa` también admite los secretos empaquetados
`SUPABASE_PUBLISHABLE_KEYS` y `SUPABASE_SECRET_KEYS` como alternativa.

## Migración del frontend

Las funciones con lista de orígenes permitidos aceptan actualmente
`miconect.com`, `www.miconect.com` y el despliegue vigente de Sites. Antes de
probar el frontend migrado se debe agregar explícitamente el origen temporal
del nuevo hosting y retirarlo cuando deje de utilizarse.
