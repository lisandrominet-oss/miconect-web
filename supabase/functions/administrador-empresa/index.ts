/// <reference lib="deno.ns" />
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.2";

type AdminClient = SupabaseClient;

const allowedAppOrigins = new Set([
  "https://miconect.com",
  "https://www.miconect.com",
  "https://miconect-web.vercel.app",
]);

function resolveAppOrigin(origin: string | null) {
  return origin && allowedAppOrigins.has(origin) ? origin : null;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function response(origin: string, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
}

function jwtAssuranceLevel(authorization: string) {
  try {
    const token = authorization.slice(7).trim();
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(normalized)) as { aal?: unknown };
    return typeof parsed.aal === "string" ? parsed.aal : "";
  } catch {
    return "";
  }
}

async function consumeRateLimit(
  admin: AdminClient,
  scope: string,
  subject: string,
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await admin.rpc("consumir_limite_edge", {
    p_scope: scope,
    p_subject_hash: await sha256(subject),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}

function firstBundledSecret(name: string) {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const values = Object.values(parsed).filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
      return values[0] ?? "";
    }
  } catch {
    return raw;
  }
  return "";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publishableKey =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  firstBundledSecret("SUPABASE_PUBLISHABLE_KEYS");
const secretKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  firstBundledSecret("SUPABASE_SECRET_KEYS");

type CompanyUser = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
};

async function operationCounts(admin: AdminClient, companyId: string) {
  const [requests, quotes, awards] = await Promise.all([
    admin
      .from("solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("empresa_compradora_id", companyId),
    admin
      .from("cotizaciones")
      .select("id", { count: "exact", head: true })
      .eq("empresa_proveedora_id", companyId),
    admin
      .from("adjudicaciones")
      .select("id", { count: "exact", head: true })
      .eq("empresa_proveedora_id", companyId),
  ]);
  const errors = [requests.error, quotes.error, awards.error].filter(Boolean);
  if (errors.length) throw errors[0];
  return {
    solicitudes: requests.count ?? 0,
    cotizaciones: quotes.count ?? 0,
    adjudicaciones: awards.count ?? 0,
  };
}

async function companyUsers(admin: AdminClient, companyId: string) {
  const { data, error } = await admin
    .from("perfiles")
    .select("id, nombre, apellido, rol")
    .eq("empresa_id", companyId)
    .order("nombre");
  if (error) throw error;

  return await Promise.all(
    ((data ?? []) as CompanyUser[]).map(async (profile) => {
      const result = await admin.auth.admin.getUserById(profile.id);
      const user = result.data.user;
      return {
        ...profile,
        email: user?.email ?? "",
        email_confirmado: Boolean(user?.email_confirmed_at),
        bloqueado_hasta: user?.banned_until ?? null,
      };
    }),
  );
}

async function audit(
  admin: AdminClient,
  companyId: string | null,
  userId: string,
  action: string,
  detail: Record<string, unknown>,
) {
  await admin.from("eventos_auditoria").insert({
    empresa_id: companyId,
    usuario_id: userId,
    entidad: "empresa",
    entidad_id: companyId,
    accion: action,
    detalle: detail,
  });
}

Deno.serve(async (request) => {
  const appOrigin = resolveAppOrigin(request.headers.get("origin"));
  if (!appOrigin) {
    return new Response(JSON.stringify({ error: "Origen no autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const reply = (body: Record<string, unknown>, status = 200) =>
    response(appOrigin, body, status);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(appOrigin) });
  }
  if (request.method !== "POST") return reply({ error: "Metodo no permitido" }, 405);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 64 * 1024) return reply({ error: "Solicitud demasiado grande" }, 413);
  if (!supabaseUrl || !publishableKey || !secretKey) {
    console.error("administrador-empresa: missing required project secrets");
    return reply({ error: "Servicio temporalmente no disponible" }, 503);
  }

  try {
    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return reply({ error: "Sesion requerida" }, 401);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: userError } = await userClient.auth.getUser();
    if (userError || !userResult.user) return reply({ error: "Sesion invalida" }, 401);
    if (jwtAssuranceLevel(authorization) !== "aal2") {
      return reply({ error: "Verificacion de dos pasos requerida" }, 403);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [userLimitOk, ipLimitOk] = await Promise.all([
      consumeRateLimit(admin, "administrador-empresa:user", userResult.user.id, 60, 60),
      consumeRateLimit(admin, "administrador-empresa:ip", requestIp(request), 120, 60),
    ]);
    if (!userLimitOk || !ipLimitOk) {
      return reply({ error: "Demasiadas solicitudes. Intentá nuevamente en un minuto." }, 429);
    }
    const { data: profile, error: profileError } = await admin
      .from("perfiles")
      .select("rol")
      .eq("id", userResult.user.id)
      .maybeSingle();
    if (profileError || profile?.rol !== "administrador_plataforma") {
      return reply({ error: "Acceso reservado al administrador de plataforma" }, 403);
    }

    const body = await request.json();
    const action = String(body.action ?? "");
    const companyId = body.empresa_id ? String(body.empresa_id) : "";

    if (action === "detalle_empresa") {
      if (!companyId) return reply({ error: "Falta la empresa" }, 400);
      const [users, counts] = await Promise.all([
        companyUsers(admin, companyId),
        operationCounts(admin, companyId),
      ]);
      return reply({
        usuarios: users,
        actividad: counts,
        puede_eliminar:
          counts.solicitudes === 0 &&
          counts.cotizaciones === 0 &&
          counts.adjudicaciones === 0,
      });
    }

    if (action === "crear_empresa") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const canBuy = Boolean(body.puede_comprar);
      const canSell = Boolean(body.puede_vender);
      const categories = Array.isArray(body.rubros)
        ? body.rubros.map(Number).filter(Number.isFinite)
        : [];
      if (!email || !body.razon_social || !body.cuit || !body.localidad) {
        return reply({ error: "Completá los datos obligatorios" }, 400);
      }
      if (!canBuy && !canSell) return reply({ error: "Elegí al menos una actividad" }, 400);
      if (canSell && !categories.length) {
        return reply({ error: "Asigná al menos un rubro al proveedor" }, 400);
      }
      const { data: available, error: availableError } = await admin.rpc(
        "email_disponible_registro",
        { p_email: email },
      );
      if (availableError) throw availableError;
      if (!available) return reply({ error: "No se pudo crear el acceso con los datos indicados" }, 409);

      const invite = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: appOrigin,
        data: { miconect_admin_created: true },
      });
      if (invite.error || !invite.data.user) {
        console.error("administrador-empresa: invite failed", invite.error);
        return reply({ error: "No se pudo crear el acceso con los datos indicados" }, 409);
      }

      const userId = invite.data.user.id;
      const companyInsert = await admin
        .from("empresas")
        .insert({
          tipo: canBuy ? "compradora" : "proveedora",
          puede_comprar: canBuy,
          puede_vender: canSell,
          razon_social: String(body.razon_social).trim(),
          nombre_comercial: String(body.nombre_comercial ?? "").trim() || null,
          cuit: String(body.cuit).replace(/\D/g, ""),
          localidad: String(body.localidad).trim(),
          domicilio: String(body.domicilio ?? "").trim() || null,
          telefono: String(body.telefono ?? "").trim() || null,
          whatsapp: String(body.whatsapp ?? "").trim() || null,
          email_empresa: email,
          sitio_web: String(body.sitio_web ?? "").trim() || null,
          estado: "registro_incompleto",
          estado_operativo: "activa",
        })
        .select("id")
        .single();
      if (companyInsert.error || !companyInsert.data) {
        await admin.auth.admin.deleteUser(userId);
        throw companyInsert.error ?? new Error("No se pudo crear la empresa");
      }

      const newCompanyId = companyInsert.data.id;
      const profileInsert = await admin.from("perfiles").insert({
        id: userId,
        empresa_id: newCompanyId,
        nombre: String(body.nombre ?? "").trim(),
        apellido: String(body.apellido ?? "").trim(),
        cargo: String(body.cargo ?? "").trim() || "Responsable de cuenta",
        rol: "administrador_empresa",
      });
      if (profileInsert.error) {
        await admin.from("empresas").delete().eq("id", newCompanyId);
        await admin.auth.admin.deleteUser(userId);
        throw profileInsert.error;
      }

      if (canSell && categories.length) {
        const categoryInsert = await admin.from("empresa_rubros").insert(
          categories.map((rubroId: number) => ({
            empresa_id: newCompanyId,
            rubro_id: rubroId,
          })),
        );
        if (categoryInsert.error) throw categoryInsert.error;
      }
      await audit(admin, newCompanyId, userResult.user.id, "empresa_creada_por_admin", {
        email,
        puede_comprar: canBuy,
        puede_vender: canSell,
      });
      return reply({ ok: true, empresa_id: newCompanyId, usuario_id: userId });
    }

    if (!companyId) return reply({ error: "Falta la empresa" }, 400);
    const users = await companyUsers(admin, companyId);

    if (action === "reenviar_acceso" || action === "restablecer_password") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!users.some((user) => user.email.toLowerCase() === email)) {
        return reply({ error: "El usuario no pertenece a la empresa" }, 403);
      }
      const mailClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const result =
        action === "reenviar_acceso"
          ? await mailClient.auth.resend({
              type: "signup",
              email,
              options: { emailRedirectTo: appOrigin },
            })
          : await mailClient.auth.resetPasswordForEmail(email, {
              redirectTo: appOrigin,
            });
      if (result.error) throw result.error;
      await audit(admin, companyId, userResult.user.id, action, { email });
      return reply({ ok: true });
    }

    if (action === "pausar" || action === "reactivar" || action === "archivar") {
      const status = action === "pausar" ? "pausada" : action === "archivar" ? "archivada" : "activa";
      const update = await admin
        .from("empresas")
        .update({ estado_operativo: status, actualizada_en: new Date().toISOString() })
        .eq("id", companyId);
      if (update.error) throw update.error;
      await audit(admin, companyId, userResult.user.id, `empresa_${action}`, {
        motivo: String(body.motivo ?? "").trim() || null,
      });
      return reply({ ok: true, estado_operativo: status });
    }

    if (action === "bloquear") {
      const reason = String(body.motivo ?? "").trim();
      if (!reason) return reply({ error: "Indicá el motivo del bloqueo" }, 400);
      for (const user of users) {
        if (user.email) {
          const existing = await admin
            .from("emails_bloqueados")
            .select("id")
            .eq("activo", true)
            .ilike("email", user.email)
            .maybeSingle();
          if (!existing.data) {
            const inserted = await admin.from("emails_bloqueados").insert({
              email: user.email,
              motivo: reason,
              bloqueado_por: userResult.user.id,
            });
            if (inserted.error) throw inserted.error;
          }
        }
        const banned = await admin.auth.admin.updateUserById(user.id, {
          ban_duration: "876000h",
        });
        if (banned.error) throw banned.error;
      }
      const update = await admin
        .from("empresas")
        .update({ estado_operativo: "bloqueada", actualizada_en: new Date().toISOString() })
        .eq("id", companyId);
      if (update.error) throw update.error;
      await audit(admin, companyId, userResult.user.id, "empresa_bloqueada", { motivo: reason });
      return reply({ ok: true, estado_operativo: "bloqueada" });
    }

    if (action === "desbloquear") {
      for (const user of users) {
        if (user.email) {
          await admin
            .from("emails_bloqueados")
            .update({
              activo: false,
              desbloqueado_por: userResult.user.id,
              desbloqueado_en: new Date().toISOString(),
            })
            .eq("activo", true)
            .ilike("email", user.email);
        }
        const unbanned = await admin.auth.admin.updateUserById(user.id, {
          ban_duration: "none",
        });
        if (unbanned.error) throw unbanned.error;
      }
      const update = await admin
        .from("empresas")
        .update({ estado_operativo: "activa", actualizada_en: new Date().toISOString() })
        .eq("id", companyId);
      if (update.error) throw update.error;
      await audit(admin, companyId, userResult.user.id, "empresa_desbloqueada", {});
      return reply({ ok: true, estado_operativo: "activa" });
    }

    if (action === "eliminar_incompleta") {
      const counts = await operationCounts(admin, companyId);
      if (counts.solicitudes || counts.cotizaciones || counts.adjudicaciones) {
        return reply(
          { error: "La empresa tiene actividad comercial y no puede eliminarse" },
          409,
        );
      }
      const documents = await admin
        .from("documentos_empresa")
        .select("archivo_path")
        .eq("empresa_id", companyId);
      if (documents.error) throw documents.error;

      const purge = await admin.rpc("purgar_empresa_incompleta", {
        p_empresa_id: companyId,
      });
      if (purge.error) throw purge.error;

      const failedUsers: string[] = [];
      for (const user of users) {
        const deleted = await admin.auth.admin.deleteUser(user.id);
        if (deleted.error) failedUsers.push(user.email || user.id);
      }
      const paths = (documents.data ?? []).map((document) => document.archivo_path);
      if (paths.length) await admin.storage.from("documentos-empresas").remove(paths);

      return reply({ ok: true, usuarios_no_eliminados: failedUsers });
    }

    return reply({ error: "Accion desconocida" }, 400);
  } catch (error) {
    console.error(error);
    return reply({ error: "No se pudo completar la operacion" }, 500);
  }
});
