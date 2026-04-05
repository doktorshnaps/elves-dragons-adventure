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
    const { wallet_address, message, event_type } = await req.json();

    if (!wallet_address || !message) {
      return new Response(
        JSON.stringify({ error: "wallet_address and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Rate limiting: max 1 notification per event_type per wallet per 60 seconds
    if (event_type) {
      const { data: recentLog } = await supabase
        .from("telegram_notification_log")
        .select("id")
        .eq("wallet_address", wallet_address)
        .eq("event_type", event_type)
        .gte("sent_at", new Date(Date.now() - 60_000).toISOString())
        .limit(1);

      if (recentLog && recentLog.length > 0) {
        return new Response(
          JSON.stringify({ ok: true, skipped: true, reason: "rate_limited" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get telegram_chat_id
    const { data: gameData, error: dbError } = await supabase
      .from("game_data")
      .select("telegram_chat_id")
      .eq("wallet_address", wallet_address)
      .single();

    if (dbError || !gameData?.telegram_chat_id) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "no_chat_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Telegram Bot API
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: gameData.telegram_chat_id,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const tgResult = await tgResponse.json();

    if (!tgResponse.ok) {
      console.error("Telegram API error:", tgResult);
      return new Response(
        JSON.stringify({ error: "Telegram API failed", details: tgResult }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log notification
    if (event_type) {
      await supabase.from("telegram_notification_log").insert({
        wallet_address,
        event_type,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sent: true }),
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
