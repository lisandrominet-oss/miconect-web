import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://miconect.com",
  "https://www.miconect.com",
  "https://miconect-web.vercel.app",
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
      throw new Error("Falta configuración del servidor.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: "La sesión no es válida." },
        { status: 401, headers },
      );
    }

    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const invitationUrl = String(body.invitationUrl ?? "").trim();

    if (!token || !invitationUrl) {
      return Response.json(
        { error: "Faltan datos de la invitación." },
        { status: 400, headers },
      );
    }

    const parsedUrl = new URL(invitationUrl);

    if (
      !allowedOrigins.has(parsedUrl.origin) ||
      parsedUrl.searchParams.get("invite") !== token
    ) {
      return Response.json(
        { error: "El enlace de invitación no es válido." },
        { status: 400, headers },
      );
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("invitaciones_empresa")
      .select("email, rol, vence_en, usada_en")
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      return Response.json(
        { error: "No tenés permiso para enviar esta invitación." },
        { status: 403, headers },
      );
    }

    if (invitation.usada_en) {
      return Response.json(
        { error: "La invitación ya fue utilizada." },
        { status: 409, headers },
      );
    }

    if (new Date(invitation.vence_en) <= new Date()) {
      return Response.json(
        { error: "La invitación está vencida." },
        { status: 410, headers },
      );
    }

    const roleLabel =
      invitation.rol === "administrador_empresa"
        ? "Administrador de empresa"
        : "Miembro";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Miconect <no-reply@auth.miconect.com>",
        to: [invitation.email],
        reply_to: "info@miconect.com",
        subject: "Te invitaron a formar parte de Miconect",
        html: `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif;color:#18352d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce6e1;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0f4c3a;padding:24px 32px;">
                <div style="font-size:26px;font-weight:700;color:#ffffff;">Miconect</div>
                <div style="margin-top:5px;font-size:13px;color:#cce2d9;">Conectando oportunidades</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                <h1 style="margin:0 0 18px;font-size:24px;color:#18352d;">Te invitaron a Miconect</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#465b54;">
                  Recibiste una invitación para incorporarte a una empresa dentro de Miconect con el rol de <strong>${roleLabel}</strong>.
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#465b54;">
                  Aceptá la invitación para crear tu acceso e ingresar al espacio de trabajo de la empresa.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="border-radius:8px;background:#17795b;">
                      <a href="${invitationUrl}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">
                        Aceptar invitación
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#64766f;">
                  Si no reconocés esta invitación, ignorá este mensaje.
                </p>
                <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e3ebe7;font-size:13px;line-height:1.6;color:#788981;">
                  Esta invitación es personal. No compartas este correo ni su enlace.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#edf3f0;padding:20px 32px;font-size:12px;line-height:1.6;color:#64766f;">
                Miconect es operado por MINPA S.A.S.<br>
                ¿Necesitás ayuda? Escribinos a
                <a href="mailto:info@miconect.com" style="color:#17795b;text-decoration:none;">info@miconect.com</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailResult);
      throw new Error("No se pudo enviar el correo.");
    }

    return Response.json(
      { success: true, emailId: emailResult.id },
      { status: 200, headers },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo enviar la invitación." },
      { status: 500, headers },
    );
  }
});
