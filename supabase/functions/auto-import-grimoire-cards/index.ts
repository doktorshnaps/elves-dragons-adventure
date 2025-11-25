import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CardData {
  name: string;
  type: string;
  faction: string;
  image: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cards, walletAddress } = await req.json();

    if (!walletAddress || !cards || !Array.isArray(cards)) {
      return new Response(
        JSON.stringify({ error: 'Missing walletAddress or cards array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем админские права
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin_or_super_wallet', {
      p_wallet_address: walletAddress
    });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Маппинг названий на редкость
    const rarityMap: { [key: string]: number } = {
      // Герои
      'Рекрут': 1,
      'Страж': 2,
      'Ветеран': 3,
      'Чародей': 4,
      'Мастер Целитель': 5,
      'Защитник': 6,
      'Ветеран Защитник': 7,
      'Стратег': 8,
      'Верховный Стратег': 9,
      // Драконы (по ключевым словам)
      'Ординарный': 1,
      'Необычный': 2,
      'Редкий': 3,
      'Эпический': 4,
      'Легендарный': 5,
      'Мифический': 6,
      'Этернал': 7,
      'Империал': 8,
      'Титан': 9
    };

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const card of cards as CardData[]) {
      try {
        // Определяем редкость
        let rarity = 1;
        for (const [keyword, rarityValue] of Object.entries(rarityMap)) {
          if (card.name.includes(keyword)) {
            rarity = rarityValue;
            break;
          }
        }

        // Преобразуем тип
        const cardType = card.type === 'character' ? 'hero' : card.type === 'pet' ? 'dragon' : card.type;

        // Извлекаем UUID из пути изображения
        const imageUrl = card.image.replace('/lovable-uploads/', '').replace('.webp', '');

        const { error: upsertError } = await supabaseAdmin
          .from('card_images')
          .upsert({
            card_name: card.name,
            card_type: cardType,
            faction: card.faction,
            rarity: rarity,
            image_url: `https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/lovable-uploads/${imageUrl}`,
            created_by_wallet_address: walletAddress
          }, {
            onConflict: 'card_name,card_type,faction,rarity',
            ignoreDuplicates: false
          });

        if (upsertError) {
          results.errors.push(`${card.name} (${card.faction}): ${upsertError.message}`);
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.errors.push(`${card.name}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `✅ Импортировано: ${results.success}, Пропущено: ${results.skipped}`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Auto-import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
