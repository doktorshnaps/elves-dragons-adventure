import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { wallet_address, message, event_type } = await req.json();
    console.log("[TG-NOTIFY] Request received:", { wallet_address, event_type, messageLen: message?.length });

    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.length > 128) {
      return jsonResponse({ error: "invalid wallet_address" }, 400);
    }
    if (!message || typeof message !== "string" || message.length > 4096) {
      return jsonResponse({ error: "invalid message" }, 400);
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("[TG-NOTIFY] TELEGRAM_BOT_TOKEN not configured!");
      return jsonResponse({ error: "TELEGRAM_BOT_TOKEN not configured" }, 500);
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
        console.log("[TG-NOTIFY] Rate limited:", { wallet_address, event_type });
        return jsonResponse({ ok: true, skipped: true, reason: "rate_limited" });
      }
    }

    // Get telegram_chat_id
    const { data: gameData, error: dbError } = await supabase
      .from("game_data")
      .select("telegram_chat_id")
      .eq("wallet_address", wallet_address)
      .single();

    if (dbError) {
      console.error("[TG-NOTIFY] DB error:", dbError);
      return jsonResponse({ ok: true, skipped: true, reason: "db_error" });
    }

    if (!gameData?.telegram_chat_id) {
      console.log("[TG-NOTIFY] No chat_id for wallet:", wallet_address);
      return jsonResponse({ ok: true, skipped: true, reason: "no_chat_id" });
    }

    console.log("[TG-NOTIFY] Sending to chat_id:", gameData.telegram_chat_id);

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
    console.log("[TG-NOTIFY] Telegram API response:", { ok: tgResult.ok, status: tgResponse.status });

    if (!tgResponse.ok) {
      console.error("[TG-NOTIFY] Telegram API error:", tgResult);
      return jsonResponse(
        { error: "Telegram API failed", details: tgResult.description || tgResult },
        502
      );
    }

    // Log notification
    if (event_type) {
      await supabase.from("telegram_notification_log").insert({
        wallet_address,
        event_type,
      });
    }

    return jsonResponse({ ok: true, sent: true });
  } catch (error) {
    console.error("[TG-NOTIFY] Unhandled error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
