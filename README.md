# Miconect

Portal B2B de compraventa minera para empresas compradoras y proveedores de
San Juan. Este repositorio conserva el frontend, las migraciones SQL y las
Edge Functions productivas de Supabase.

## Despliegue en Vercel

El proyecto mantiene el build de Sites y agrega un build independiente para
Vercel. Al importar el repositorio en Vercel se debe usar la raíz del proyecto;
`vercel.json` selecciona Next.js y ejecuta `npm run build:vercel`.

El dominio `miconect.com` no debe asignarse al proyecto de Vercel hasta terminar
la prueba funcional con la URL temporal. Esa URL temporal también debe agregarse
a la lista de orígenes permitidos de las Edge Functions, según se explica en
`supabase/functions/README.md`.

La autenticación falla de forma segura si falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
en el entorno de build. El secreto correspondiente se configura únicamente en
Supabase como `SUPABASE_AUTH_CAPTCHA_SECRET`. `supabase/config.toml` mantiene la
configuración auditable de CAPTCHA, TOTP, contraseñas, sesiones y redirects.
Después de vincular el proyecto correcto, `supabase config push` aplica esa
configuración. `scripts/apply-supabase-auth-security.ps1` activa y verifica las
opciones alojadas que no forman parte de `config.toml`: contraseñas filtradas,
una sola sesión por usuario y reautenticación para cambios de contraseña.

## Fuentes de Supabase

- Migraciones: `supabase/migrations/`
- Edge Functions: `supabase/functions/`

La versión migrada corresponde a la versión 57 de Sites.

## Base técnica de Sites

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout and then validates the Sites artifact. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: run all regression and security tests
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
