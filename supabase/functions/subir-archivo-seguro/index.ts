/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const allowedOrigins = new Set([
  "https://miconect.com",
  "https://www.miconect.com",
  "https://miconect-web.vercel.app",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type DetectedFile = { mime: string; extension: string };

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function detectFile(file: File): Promise<DetectedFile | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") {
    return { mime: "application/pdf", extension: "pdf" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d &&
    bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

function safeOriginalName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "archivo";
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigins.has(origin)) {
    return new Response(JSON.stringify({ error: "Origen no autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  }
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error("subir-archivo-seguro: missing project secrets");
    return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 503, headers });
  }

  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Sesion requerida" }), { status: 401, headers });
    }
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesion invalida" }), { status: 401, headers });
    }

    const [{ data: allowed }, form] = await Promise.all([
      admin.rpc("consumir_limite_edge", {
        p_scope: "subir-archivo-seguro",
        p_subject_hash: await sha256(`${userData.user.id}:${requestIp(request)}`),
        p_limit: 20,
        p_window_seconds: 60,
      }),
      request.formData(),
    ]);
    if (allowed !== true) {
      return new Response(JSON.stringify({ error: "Demasiadas cargas" }), { status: 429, headers });
    }

    const kind = String(form.get("tipo") ?? "");
    const parentId = String(form.get("entidad_id") ?? "");
    const fileValue = form.get("archivo");
    if (!(fileValue instanceof File) || !/^[0-9a-f-]{36}$/i.test(parentId)) {
      return new Response(JSON.stringify({ error: "Archivo invalido" }), { status: 400, headers });
    }
    const maxSize = kind === "publicidad" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileValue.size < 1 || fileValue.size > maxSize) {
      return new Response(JSON.stringify({ error: "Tamano de archivo invalido" }), { status: 400, headers });
    }
    const detected = await detectFile(fileValue);
    if (
      !detected ||
      (kind === "publicidad" && !detected.mime.startsWith("image/")) ||
      (kind === "pdf_cotizacion" && detected.mime !== "application/pdf")
    ) {
      return new Response(JSON.stringify({ error: "Tipo de archivo no permitido" }), { status: 400, headers });
    }

    const cleanName = safeOriginalName(fileValue.name);
    const uploadFile = new File([fileValue], `${crypto.randomUUID()}.${detected.extension}`, {
      type: detected.mime,
    });

    if (kind === "adjunto_solicitud") {
      const { data: canUpload, error: authorizationError } = await userClient.rpc(
        "puede_cargar_adjunto_solicitud",
        { p_solicitud_id: parentId },
      );
      if (authorizationError || canUpload !== true) {
        return new Response(JSON.stringify({ error: "Acceso denegado" }), { status: 403, headers });
      }
      const path = `${parentId}/${crypto.randomUUID()}-${cleanName}`;
      const upload = await admin.storage.from("adjuntos-solicitudes")
        .upload(path, uploadFile, { contentType: detected.mime, upsert: false });
      if (upload.error) throw upload.error;
      const metadata = await admin.from("adjuntos_solicitud").insert({
        solicitud_id: parentId,
        nombre_archivo: fileValue.name.slice(0, 255),
        archivo_path: path,
        tipo_mime: detected.mime,
        tamano_bytes: fileValue.size,
        cargado_por: userData.user.id,
      });
      if (metadata.error) {
        await admin.storage.from("adjuntos-solicitudes").remove([path]);
        throw metadata.error;
      }
      return new Response(JSON.stringify({ ok: true, path }), { status: 200, headers });
    }

    if (kind === "constancia_cuit") {
      const { data: profile } = await userClient.from("perfiles")
        .select("empresa_id").eq("id", userData.user.id).maybeSingle();
      if (profile?.empresa_id !== parentId) {
        return new Response(JSON.stringify({ error: "Acceso denegado" }), { status: 403, headers });
      }
      const path = `${parentId}/constancia-cuit-${Date.now()}.${detected.extension}`;
      const { data: company } = await admin.from("empresas")
        .select("estado").eq("id", parentId).maybeSingle();
      if (!["registro_incompleto", "observada", "rechazada", "pendiente"].includes(String(company?.estado))) {
        return new Response(JSON.stringify({ error: "La empresa no admite una nueva verificacion" }), {
          status: 409,
          headers,
        });
      }
      const upload = await admin.storage.from("documentos-empresas")
        .upload(path, uploadFile, { contentType: detected.mime, upsert: false });
      if (upload.error) throw upload.error;
      const metadata = await admin.from("documentos_empresa").insert({
        empresa_id: parentId,
        tipo_documento: "constancia_cuit",
        archivo_path: path,
        estado: "pendiente",
        cargado_por: userData.user.id,
      });
      if (metadata.error) {
        await admin.storage.from("documentos-empresas").remove([path]);
        throw metadata.error;
      }
      const update = await admin.from("empresas")
        .update({ estado: "pendiente", motivo_observacion: null }).eq("id", parentId);
      if (update.error) throw update.error;
      await admin.from("eventos_auditoria").insert({
        empresa_id: parentId,
        usuario_id: userData.user.id,
        entidad: "empresa",
        entidad_id: parentId,
        accion: "verificacion_enviada",
        detalle: { documento: "constancia_cuit" },
      });
      return new Response(JSON.stringify({ ok: true, path }), { status: 200, headers });
    }

    if (kind === "pdf_cotizacion") {
      const { data: canUpload, error: authorizationError } = await userClient.rpc(
        "puede_cargar_pdf_cotizacion",
        { p_cotizacion_id: parentId },
      );
      if (authorizationError || canUpload !== true) {
        return new Response(JSON.stringify({ error: "Acceso denegado" }), { status: 403, headers });
      }
      const path = `${parentId}/${crypto.randomUUID()}.pdf`;
      const upload = await admin.storage.from("pdf-cotizaciones")
        .upload(path, uploadFile, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw upload.error;
      const { data: previousPath, error: updateError } = await userClient.rpc(
        "actualizar_pdf_cotizacion",
        { p_cotizacion_id: parentId, p_pdf_path: path },
      );
      if (updateError) {
        await admin.storage.from("pdf-cotizaciones").remove([path]);
        throw updateError;
      }
      if (typeof previousPath === "string" && previousPath !== path) {
        await admin.storage.from("pdf-cotizaciones").remove([previousPath]);
      }
      return new Response(JSON.stringify({ ok: true, path }), { status: 200, headers });
    }

    if (kind === "publicidad") {
      const { data: profile } = await admin.from("perfiles")
        .select("rol").eq("id", userData.user.id).maybeSingle();
      if (profile?.rol !== "administrador_plataforma") {
        return new Response(JSON.stringify({ error: "Acceso denegado" }), { status: 403, headers });
      }
      const path = `${parentId}/${crypto.randomUUID()}.${detected.extension}`;
      const upload = await admin.storage.from("publicidad")
        .upload(path, uploadFile, { contentType: detected.mime, upsert: false });
      if (upload.error) throw upload.error;
      return new Response(JSON.stringify({ ok: true, path }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Tipo de carga invalido" }), { status: 400, headers });
  } catch (error) {
    console.error("subir-archivo-seguro failed", error);
    return new Response(JSON.stringify({ error: "No se pudo cargar el archivo" }), {
      status: 500,
      headers,
    });
  }
});
