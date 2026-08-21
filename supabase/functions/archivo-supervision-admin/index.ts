import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://miconect.com",
  "https://www.miconect.com",
  "https://portal-minero-san-juan.liminregg.chatgpt.site",
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.has(origin) ? origin : "https://miconect.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Método no permitido." },
      { status: 405, headers },
    );
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { error: "No autorizado." },
        { status: 401, headers },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Falta configuración del servidor.");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: "La sesión no es válida." },
        { status: 401, headers },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profile?.rol !== "administrador_plataforma") {
      return Response.json(
        { error: "Acceso reservado al administrador." },
        { status: 403, headers },
      );
    }

    const body = await request.json();
    const tipo = String(body.tipo ?? "");
    const solicitudId = String(body.solicitudId ?? "");
    const archivoId = String(body.archivoId ?? "");

    if (
      !["cotizacion", "adjunto_solicitud"].includes(tipo) ||
      !solicitudId ||
      !archivoId
    ) {
      return Response.json(
        { error: "Solicitud de archivo inválida." },
        { status: 400, headers },
      );
    }

    const { data: solicitud } = await adminClient
      .from("solicitudes")
      .select(
        "id, empresa_compradora_id, apertura_al_vencimiento, fecha_limite",
      )
      .eq("id", solicitudId)
      .single();

    if (!solicitud) {
      return Response.json(
        { error: "La solicitud no existe." },
        { status: 404, headers },
      );
    }

    let bucket = "";
    let path = "";
    let entidad = "";

    if (tipo === "cotizacion") {
      if (
        solicitud.apertura_al_vencimiento &&
        new Date() < new Date(solicitud.fecha_limite)
      ) {
        return Response.json(
          { error: "La oferta está protegida hasta su apertura." },
          { status: 403, headers },
        );
      }

      const { data: cotizacion } = await adminClient
        .from("cotizaciones")
        .select("id, solicitud_id, pdf_path, estado")
        .eq("id", archivoId)
        .eq("solicitud_id", solicitudId)
        .eq("estado", "presentada")
        .single();

      if (!cotizacion?.pdf_path) {
        return Response.json(
          { error: "La cotización no tiene un PDF disponible." },
          { status: 404, headers },
        );
      }

      bucket = "pdf-cotizaciones";
      path = cotizacion.pdf_path;
      entidad = "cotizacion";
    } else {
      const { data: adjunto } = await adminClient
        .from("adjuntos_solicitud")
        .select("id, solicitud_id, archivo_path")
        .eq("id", archivoId)
        .eq("solicitud_id", solicitudId)
        .single();

      if (!adjunto?.archivo_path) {
        return Response.json(
          { error: "El adjunto no existe." },
          { status: 404, headers },
        );
      }

      bucket = "adjuntos-solicitudes";
      path = adjunto.archivo_path;
      entidad = "adjunto_solicitud";
    }

    const { data: signed, error: signedError } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(path, 300);

    if (signedError || !signed?.signedUrl) {
      throw new Error("No se pudo generar el enlace temporal.");
    }

    await adminClient.from("eventos_auditoria").insert({
      empresa_id: solicitud.empresa_compradora_id,
      usuario_id: user.id,
      entidad,
      entidad_id: archivoId,
      accion: "consulta_admin_archivo",
      detalle: {
        solicitud_id: solicitudId,
        bucket,
        archivo_path: path,
        expira_en_segundos: 300,
      },
    });

    return Response.json(
      {
        url: signed.signedUrl,
        expiresIn: 300,
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo abrir el archivo." },
      { status: 500, headers },
    );
  }
});
