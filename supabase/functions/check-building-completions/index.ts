import { createClient } from "npm:@supabase/supabase-js@2";

const BUILDING_NAMES: Record<string, string> = {
  main_hall: "Главный зал",
  workshop: "Мастерская",
  storage: "Склад",
  sawmill: "Лесопилка",
  quarry: "Каменоломня",
  barracks: "Казармы",
  dragon_lair: "Драконье логово",
  medical: "Медицинский блок",
  forge: "Кузница",
};

Deno.serve(async (_req) => {
  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(JSON.stringify({ error: "no bot token" }), { status: 500 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = Date.now();

    // Get all players with active building upgrades and telegram_chat_id
    const { data: players, error } = await supabase
      .from("game_data")
      .select("wallet_address, active_building_upgrades, telegram_chat_id")
      .not("active_building_upgrades", "is", null)
      .not("telegram_chat_id", "is", null);

    if (error) {
      console.error("[BUILD-CHECK] DB error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let notificationsSent = 0;

    for (const player of players || []) {
      const upgrades = player.active_building_upgrades;
      if (!Array.isArray(upgrades) || upgrades.length === 0) continue;
      if (!player.telegram_chat_id) continue;

      for (const upgrade of upgrades) {
        // Only notify for in_progress upgrades that have finished
        if (upgrade.status === "ready") continue;
        
        const endTime = (upgrade.startTime || 0) + (upgrade.duration || 0);
        if (now < endTime) continue;

        const eventType = `building_offline_${upgrade.buildingId}_${upgrade.startTime}`;

        // Check rate limit (don't send duplicate)
        const { data: existing } = await supabase
          .from("telegram_notification_log")
          .select("id")
          .eq("wallet_address", player.wallet_address)
          .eq("event_type", eventType)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const buildingName = BUILDING_NAMES[upgrade.buildingId] || upgrade.buildingId;
        const message = `🏗️ Улучшение здания завершено!\n${buildingName}: доступно к установке уровень ${upgrade.targetLevel}`;

        // Send Telegram notification
        try {
          const tgResponse = await fetch(
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

          if (tgResponse.ok) {
            // Log to prevent duplicates
            await supabase.from("telegram_notification_log").insert({
              wallet_address: player.wallet_address,
              event_type: eventType,
            });
            notificationsSent++;
            console.log(`[BUILD-CHECK] Sent notification to ${player.wallet_address} for ${upgrade.buildingId}`);
          } else {
            const err = await tgResponse.json();
            console.warn(`[BUILD-CHECK] TG API error for ${player.wallet_address}:`, err.description);
          }

          // Rate limit: 30 msg/sec for Telegram
          await new Promise((r) => setTimeout(r, 50));
        } catch (e) {
          console.warn(`[BUILD-CHECK] Send error for ${player.wallet_address}:`, e);
        }
      }
    }

    console.log(`[BUILD-CHECK] Done. Sent ${notificationsSent} notifications.`);
    return new Response(JSON.stringify({ ok: true, sent: notificationsSent }));
  } catch (err) {
    console.error("[BUILD-CHECK] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
