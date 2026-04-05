import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event_title } = await req.json().catch(() => ({}));

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all players with telegram_chat_id
    const { data: players, error } = await supabase
      .from("game_data")
      .select("telegram_chat_id, wallet_address")
      .not("telegram_chat_id", "is", null);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const title = event_title || "Искатели";
    const message = `🔍 <b>Новый ивент: ${title}</b>\n\nНовое событие началось! Заходи в игру, чтобы принять участие и получить награды!`;

    let sent = 0;
    let failed = 0;

    for (const player of players || []) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: player.telegram_chat_id,
              text: message,
              parse_mode: "HTML",
            }),
          }
        );
        const body = await res.json();
        if (res.ok) {
          sent++;
        } else {
          console.error(`Failed for ${player.wallet_address}:`, body);
          failed++;
        }
        // Telegram rate limit: ~30 msg/sec, add small delay
        await new Promise((r) => setTimeout(r, 35));
      } catch (e) {
        console.error(`Error sending to ${player.wallet_address}:`, e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, failed, total: players?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
