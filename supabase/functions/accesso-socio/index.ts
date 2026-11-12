// ==========================================================================
// ACCESSO DEL SOCIO — scambia il collegamento personale di proponi.html con
// una sessione Supabase, senza password e senza inviare email.
//
// Riceve { "invito": "<64 caratteri>" }. Chiede al database a quale socio
// appartiene (public.verifica_invito, riservata alla chiave segreta), crea
// l'utente se è la prima volta e fa generare ad Auth un accesso monouso, che
// la pagina consuma subito con verifyOtp(). L'invito non scade: lo annulla
// solo un redattore creandone uno nuovo.
//
// Pubblicata senza verifica del JWT: chi chiama non ha ancora una sessione.
// La chiave segreta la fornisce Supabase alla funzione; non sta nel codice.
// ==========================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINI = ["https://cdlaps.com", "https://www.cdlaps.com"];

function intestazioni(req: Request): Record<string, string> {
  const origine = req.headers.get("origin") ?? "";
  // Oltre al sito: le anteprime di Netlify e il server locale di chi sviluppa
  const ammessa = ORIGINI.includes(origine) ||
    /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/.test(origine) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origine);
  return {
    "Access-Control-Allow-Origin": ammessa ? origine : ORIGINI[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

function rispondi(req: Request, stato: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status: stato, headers: intestazioni(req) });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: intestazioni(req) });
  if (req.method !== "POST") return rispondi(req, 405, { errore: "Metodo non ammesso" });

  let invito = "";
  try {
    const corpo = await req.json();
    invito = typeof corpo?.invito === "string" ? corpo.invito.trim() : "";
  } catch {
    return rispondi(req, 400, { errore: "Richiesta non valida" });
  }
  if (!/^[0-9a-f]{64}$/.test(invito)) {
    return rispondi(req, 401, { errore: "Collegamento non valido" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const chiave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !chiave) return rispondi(req, 500, { errore: "Funzione non configurata" });

  const admin = createClient(url, chiave, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: socio, error: erroreInvito } = await admin.rpc("verifica_invito", { p_segreto: invito });
  if (erroreInvito) {
    console.error("verifica_invito", erroreInvito.message);
    return rispondi(req, 500, { errore: "Verifica non riuscita" });
  }
  if (!socio?.email) return rispondi(req, 401, { errore: "Collegamento non valido" });

  // Prima volta: l'utente non esiste ancora. Se esiste, l'errore si ignora.
  const creato = await admin.auth.admin.createUser({
    email: socio.email,
    email_confirm: true,
    user_metadata: { nome: socio.nome },
  });
  if (creato.error && !/already|registered|exists/i.test(creato.error.message)) {
    console.error("createUser", creato.error.message);
    return rispondi(req, 500, { errore: "Accesso non riuscito" });
  }

  const accesso = await admin.auth.admin.generateLink({ type: "magiclink", email: socio.email });
  if (accesso.error || !accesso.data?.properties?.hashed_token) {
    console.error("generateLink", accesso.error?.message);
    return rispondi(req, 500, { errore: "Accesso non riuscito" });
  }

  return rispondi(req, 200, {
    token_hash: accesso.data.properties.hashed_token,
    tipo: accesso.data.properties.verification_type ?? "magiclink",
  });
});
