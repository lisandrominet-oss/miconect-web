import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("client does not persist sessions or sensitive workflows in localStorage", () => {
  const page = read("app/page.tsx");
  assert.doesNotMatch(page, /localStorage/);
  assert.doesNotMatch(page, /Math\.random/);
  assert.match(page, /persistSession:\s*false/);
  assert.doesNotMatch(page, /rpc\("registrar_evento_publicidad"/);
  assert.doesNotMatch(page, /rpc\("cuit_disponible_registro"/);
  assert.doesNotMatch(page, /rpc\("email_disponible_registro"/);
  assert.doesNotMatch(page, /select\("[^"]*\btoken\b/);
});

test("advertising URLs and uploads cross explicit security boundaries", () => {
  const page = read("app/page.tsx");
  assert.match(page, /function safeHttpsUrl/);
  assert.match(page, /uploadSecureFile\("adjunto_solicitud"/);
  assert.match(page, /"constancia_cuit",\s*account\.empresas\.id/);
  assert.match(page, /uploadSecureFile\(\s*"publicidad"/);
  assert.doesNotMatch(page, /href=\{(?:buyerAd|providerAd|requestListAd|publicAd|creative)\.enlace_destino\}/);
});

test("database migration closes the reported RLS and mutation paths", () => {
  const sql = read("supabase/migrations/20260827041309_security_hardening.sql");
  for (const required of [
    "trg_proteger_identidad_perfil",
    "trg_proteger_estado_empresa",
    "items_cotizacion_alicuota_iva_rango",
    "adjuntos_solicitud_select_segura",
    "items_cotizacion_select_segura",
    "items_solicitud_select_segura",
    "solicitud_rubros_select_segura",
    "reabrir_solicitud",
    "consumir_limite_edge",
    "soy_admin_plataforma",
  ]) assert.match(sql, new RegExp(required));
  assert.doesNotMatch(sql, /create policy (?:adjuntos_solicitudes|pdf_cotizaciones)_(?:insert|update|delete)_segura/i);
  assert.match(sql, /revoke insert on public\.adjuntos_solicitud from authenticated/i);
  assert.match(sql, /revoke insert on public\.documentos_empresa from authenticated/i);
  assert.match(sql, /revoke all on function public\.cuit_disponible_registro\(text\) from anon/i);
  assert.match(sql, /revoke all on function public\.email_disponible_registro\(text\) from anon/i);
  assert.match(sql, /auth\.jwt\(\)\s*->>\s*'aal'\s*=\s*'aal2'/i);
  assert.match(sql, /registrar_evento_publicidad[\s\S]*service_role/i);
});

test("edge functions reject wildcard CORS and raw internal failures", () => {
  for (const path of [
    "supabase/functions/administrador-empresa/index.ts",
    "supabase/functions/evento-publicidad/index.ts",
    "supabase/functions/subir-archivo-seguro/index.ts",
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /Access-Control-Allow-Origin["']?\s*:\s*["']\*["']/);
    assert.match(source, /allowed(?:App)?Origins/);
  }
  const admin = read("supabase/functions/administrador-empresa/index.ts");
  assert.doesNotMatch(admin, /error instanceof Error \? error\.message/);
  assert.doesNotMatch(admin, /liminregg\.chatgpt\.site/);
  assert.match(admin, /jwtAssuranceLevel\(authorization\) !== "aal2"/);
});

test("Auth is wired for bot protection, strong passwords, bounded sessions and admin MFA", () => {
  const page = read("app/page.tsx");
  const config = read("supabase/config.toml");
  const hostedConfig = read("scripts/apply-supabase-auth-security.ps1");
  assert.match(page, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(page, /captchaToken/);
  assert.match(page, /challengeAndVerify/);
  assert.match(config, /\[auth\.captcha\][\s\S]*enabled = true[\s\S]*provider = "turnstile"/);
  assert.match(config, /minimum_password_length = 12/);
  assert.match(config, /password_requirements = "lower_upper_letters_digits_symbols"/);
  assert.match(config, /secure_password_change = true/);
  assert.match(config, /\[auth\.sessions\][\s\S]*timebox = "24h"[\s\S]*inactivity_timeout = "8h"/);
  assert.match(config, /\[auth\.mfa\.totp\][\s\S]*enroll_enabled = true[\s\S]*verify_enabled = true/);
  assert.match(hostedConfig, /password_hibp_enabled = \$true/);
  assert.match(hostedConfig, /sessions_single_per_user = \$true/);
});

test("security headers cover both deployment runtimes", () => {
  for (const source of [read("next.config.ts"), read("worker/index.ts")]) {
    assert.match(source, /Content-Security-Policy/);
    assert.match(source, /Strict-Transport-Security/);
    assert.match(source, /X-Frame-Options/);
    assert.match(source, /X-Content-Type-Options/);
  }
});

test("destructive pilot resets and trusted-header auth helper are absent", () => {
  for (const path of [
    "app/chatgpt-auth.ts",
    "supabase/migrations/20260818_reinicio_total_piloto.sql",
    "supabase/migrations/20260818_reinicio_total_piloto_v2.sql",
    "supabase/migrations/20260818_reinicio_total_piloto_v3.sql",
  ]) assert.equal(existsSync(new URL(path, root)), false, path);
});
