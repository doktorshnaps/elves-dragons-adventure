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
    const {
      admin_wallet,
      message,
      image_url,
      target_chat_ids, // optional: array of chat_ids for targeted send
      parse_mode = "HTML",
    } = await req.json();

    // Validate inputs
    if (!admin_wallet || typeof admin_wallet !== "string") {
      return jsonResponse({ error: "invalid admin_wallet" }, 400);
    }
    if (!message || typeof message !== "string" || message.length > 4096) {
      return jsonResponse({ error: "invalid message (max 4096 chars)" }, 400);
    }
    if (image_url && typeof image_url !== "string") {
      return jsonResponse({ error: "invalid image_url" }, 400);
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return jsonResponse({ error: "TELEGRAM_BOT_TOKEN not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin rights
    const { data: isAdmin } = await supabase.rpc("is_admin_or_super_wallet", {
      p_wallet_address: admin_wallet,
    });

    if (!isAdmin) {
      return jsonResponse({ error: "Not an admin" }, 403);
    }

    // Get target chat_ids
    let chatIds: number[] = [];

    if (target_chat_ids && Array.isArray(target_chat_ids) && target_chat_ids.length > 0) {
      // Targeted send
      chatIds = target_chat_ids.filter((id: unknown) => typeof id === "number" && id > 0);
    } else {
      // Broadcast to all players with chat_id
      const { data: players, error: dbError } = await supabase
        .from("game_data")
        .select("telegram_chat_id")
        .not("telegram_chat_id", "is", null);

      if (dbError) {
        console.error("[ADMIN-NOTIFY] DB error:", dbError);
        return jsonResponse({ error: "Failed to fetch players" }, 500);
      }

      chatIds = (players || [])
        .map((p: { telegram_chat_id: number | null }) => p.telegram_chat_id)
        .filter((id): id is number => id !== null && id > 0);
    }

    if (chatIds.length === 0) {
      return jsonResponse({ ok: true, sent: 0, failed: 0, message: "No recipients found" });
    }

    console.log(`[ADMIN-NOTIFY] Sending to ${chatIds.length} recipients. Has image: ${!!image_url}`);

    let sent = 0;
    let failed = 0;
    const errors: { chat_id: number; error: string }[] = [];

    for (const chatId of chatIds) {
      try {
        let tgResponse: Response;

        if (image_url) {
          // Send photo with caption
          tgResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendPhoto`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                photo: image_url,
                caption: message,
                parse_mode,
              }),
            }
          );
        } else {
          // Send text message
          tgResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode,
              }),
            }
          );
        }

        const tgResult = await tgResponse.json();

        if (tgResult.ok) {
          sent++;
        } else {
          failed++;
          errors.push({ chat_id: chatId, error: tgResult.description || "Unknown error" });
          console.warn(`[ADMIN-NOTIFY] Failed for ${chatId}:`, tgResult.description);
        }

        // Rate limit: small delay between messages to avoid Telegram flood limits
        if (chatIds.length > 1) {
          await new Promise((r) => setTimeout(r, 50));
        }
      } catch (err) {
        failed++;
        errors.push({ chat_id: chatId, error: String(err) });
      }
    }

    console.log(`[ADMIN-NOTIFY] Done. Sent: ${sent}, Failed: ${failed}`);

    return jsonResponse({
      ok: true,
      sent,
      failed,
      total: chatIds.length,
      errors: errors.slice(0, 10), // Return first 10 errors for debugging
    });
  } catch (error) {
    console.error("[ADMIN-NOTIFY] Unhandled error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
