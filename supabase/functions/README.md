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

Las funciones aceptan actualmente `miconect.com`, `www.miconect.com`, el
despliegue vigente de Sites y `miconect-web.vercel.app`. Los enlaces de acceso
generados por `administrador-empresa` vuelven al origen autorizado desde el que
se solicitó la operación.

En Supabase Auth se debe conservar `https://miconect.com` como **Site URL** y
agregar `https://miconect-web.vercel.app/**` a **Additional Redirect URLs**
mientras se prueba el frontend migrado.
