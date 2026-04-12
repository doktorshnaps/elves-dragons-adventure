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

async function sendTg(
  botToken: string,
  chatId: number,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      console.warn(`[TG] API error:`, err.description);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[TG] Send error:`, e);
    return false;
  }
}

async function isDuplicate(
  supabase: any,
  walletAddress: string,
  eventType: string
): Promise<boolean> {
  const { data } = await supabase
    .from("telegram_notification_log")
    .select("id")
    .eq("wallet_address", walletAddress)
    .eq("event_type", eventType)
    .limit(1);
  return !!(data && data.length > 0);
}

async function logNotification(
  supabase: any,
  walletAddress: string,
  eventType: string
) {
  await supabase.from("telegram_notification_log").insert({
    wallet_address: walletAddress,
    event_type: eventType,
  });
}

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
    const nowISO = new Date().toISOString();
    let notificationsSent = 0;

    // ========== 1. Building upgrades ==========
    const { data: players, error } = await supabase
      .from("game_data")
      .select("wallet_address, active_building_upgrades, telegram_chat_id")
      .not("active_building_upgrades", "is", null)
      .not("telegram_chat_id", "is", null);

    if (error) {
      console.error("[BUILD-CHECK] DB error:", error);
    } else {
      for (const player of players || []) {
        const upgrades = player.active_building_upgrades;
        if (!Array.isArray(upgrades) || upgrades.length === 0) continue;
        if (!player.telegram_chat_id) continue;

        for (const upgrade of upgrades) {
          if (upgrade.status === "ready") continue;
          const endTime = (upgrade.startTime || 0) + (upgrade.duration || 0);
          if (now < endTime) continue;

          const eventType = `building_offline_${upgrade.buildingId}_${upgrade.startTime}`;
          if (await isDuplicate(supabase, player.wallet_address, eventType)) continue;

          const buildingName = BUILDING_NAMES[upgrade.buildingId] || upgrade.buildingId;
          const message = `🏗️ Улучшение здания завершено!\n${buildingName}: доступно к установке уровень ${upgrade.targetLevel}`;

          if (await sendTg(botToken, player.telegram_chat_id, message)) {
            await logNotification(supabase, player.wallet_address, eventType);
            notificationsSent++;
            console.log(`[BUILD-CHECK] Sent for ${player.wallet_address} - ${upgrade.buildingId}`);
          }
          await new Promise((r) => setTimeout(r, 50));
        }
      }
    }

    // ========== 2. Medical Bay completions ==========
    const { data: medicalEntries, error: medErr } = await supabase
      .from("medical_bay")
      .select("id, card_instance_id, wallet_address, estimated_completion, is_completed")
      .eq("is_completed", false)
      .not("wallet_address", "is", null)
      .lte("estimated_completion", nowISO);

    if (medErr) {
      console.error("[MED-CHECK] DB error:", medErr);
    } else {
      for (const entry of medicalEntries || []) {
        if (!entry.wallet_address) continue;

        // Get telegram_chat_id for this wallet
        const { data: gd } = await supabase
          .from("game_data")
          .select("telegram_chat_id")
          .eq("wallet_address", entry.wallet_address)
          .single();

        if (!gd?.telegram_chat_id) continue;

        const eventType = `medical_complete_${entry.id}`;
        if (await isDuplicate(supabase, entry.wallet_address, eventType)) continue;

        // Get card name
        const { data: ci } = await supabase
          .from("card_instances")
          .select("card_data")
          .eq("id", entry.card_instance_id)
          .single();
        const cardName = ci?.card_data?.name || "Карта";

        const message = `💊 Лечение завершено!\n${cardName}: здоровье полностью восстановлено. Заберите карту из медпункта.`;

        if (await sendTg(botToken, gd.telegram_chat_id, message)) {
          await logNotification(supabase, entry.wallet_address, eventType);
          notificationsSent++;
          console.log(`[MED-CHECK] Sent for ${entry.wallet_address} - ${entry.id}`);
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    // ========== 3. Forge Bay completions ==========
    const { data: forgeEntries, error: forgeErr } = await supabase
      .from("forge_bay")
      .select("id, card_instance_id, wallet_address, estimated_completion, is_completed")
      .eq("is_completed", false)
      .not("wallet_address", "is", null)
      .lte("estimated_completion", nowISO);

    if (forgeErr) {
      console.error("[FORGE-CHECK] DB error:", forgeErr);
    } else {
      for (const entry of forgeEntries || []) {
        if (!entry.wallet_address) continue;

        const { data: gd } = await supabase
          .from("game_data")
          .select("telegram_chat_id")
          .eq("wallet_address", entry.wallet_address)
          .single();

        if (!gd?.telegram_chat_id) continue;

        const eventType = `forge_complete_${entry.id}`;
        if (await isDuplicate(supabase, entry.wallet_address, eventType)) continue;

        const { data: ci } = await supabase
          .from("card_instances")
          .select("card_data")
          .eq("id", entry.card_instance_id)
          .single();
        const cardName = ci?.card_data?.name || "Карта";

        const message = `⚒️ Ремонт завершён!\n${cardName}: броня полностью восстановлена. Заберите карту из кузницы.`;

        if (await sendTg(botToken, gd.telegram_chat_id, message)) {
          await logNotification(supabase, entry.wallet_address, eventType);
          notificationsSent++;
          console.log(`[FORGE-CHECK] Sent for ${entry.wallet_address} - ${entry.id}`);
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    console.log(`[CHECK-ALL] Done. Sent ${notificationsSent} notifications.`);
    return new Response(JSON.stringify({ ok: true, sent: notificationsSent }));
  } catch (err) {
    console.error("[CHECK-ALL] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
