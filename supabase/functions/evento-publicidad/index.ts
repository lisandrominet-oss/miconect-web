/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const allowedOrigins = new Set([
  "https://miconect.com",
  "https://www.miconect.com",
  "https://miconect-web.vercel.app",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
}

async function sha256Bytes(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function sha256Hex(value: string) {
  return Array.from(await sha256Bytes(value), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function dailyVisitorUuid(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  const bytes = (await sha256Bytes(`${day}:${ip}`)).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function headers(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigins.has(origin)) {
    return new Response(JSON.stringify({ error: "Origen no autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers(origin) });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), {
      status: 405,
      headers: { ...headers(origin), "Content-Type": "application/json" },
    });
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("evento-publicidad: missing project secrets");
    return new Response(JSON.stringify({ error: "Servicio no disponible" }), {
      status: 503,
      headers: { ...headers(origin), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const adId = String(body.anuncio_id ?? "");
    const eventType = String(body.tipo ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(adId) || !["impresion", "clic"].includes(eventType)) {
      return new Response(JSON.stringify({ error: "Evento invalido" }), {
        status: 400,
        headers: { ...headers(origin), "Content-Type": "application/json" },
      });
    }

    const ip = requestIp(request);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const subjectHash = await sha256Hex(ip);
    const { data: allowed, error: limitError } = await admin.rpc(
      "consumir_limite_edge",
      {
        p_scope: `evento-publicidad:${eventType}:${adId}`,
        p_subject_hash: subjectHash,
        p_limit: eventType === "clic" ? 10 : 30,
        p_window_seconds: 60,
      },
    );
    if (limitError) throw limitError;
    if (allowed !== true) {
      return new Response(JSON.stringify({ error: "Demasiados eventos" }), {
        status: 429,
        headers: { ...headers(origin), "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.rpc("registrar_evento_publicidad", {
      p_anuncio_id: adId,
      p_tipo: eventType,
      p_visitante_id: await dailyVisitorUuid(ip),
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...headers(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("evento-publicidad failed", error);
    return new Response(JSON.stringify({ error: "No se pudo registrar el evento" }), {
      status: 500,
      headers: { ...headers(origin), "Content-Type": "application/json" },
    });
  }
});
