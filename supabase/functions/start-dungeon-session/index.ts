import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  wallet_address: z.string().min(3).max(100),
  dungeon_type: z.string().min(1),
  level: z.number().int().min(1).max(100),
  device_id: z.string().min(1),
});

type RequestBody = z.infer<typeof RequestSchema>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabaseServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.format());
      return json({ error: 'Invalid request parameters' }, 400);
    }

    const { wallet_address, dungeon_type, level, device_id }: RequestBody = parsed.data;

    console.log('🎮 Starting dungeon session:', {
      wallet_address,
      dungeon_type,
      level,
      device_id
    });

    const supabase = getSupabaseServiceClient();

    // Генерируем claim_key на сервере - это ключевая защита!
    const claim_key = crypto.randomUUID();
    const now = Date.now();

    // Создаём или обновляем сессию подземелья
    const { data, error } = await supabase
      .from('active_dungeon_sessions')
      .upsert({
        account_id: wallet_address,
        device_id,
        dungeon_type,
        level,
        claim_key,
        started_at: now,
        last_activity: now
      }, { 
        onConflict: 'account_id,device_id',
        ignoreDuplicates: false 
      })
      .select('claim_key')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return json({ error: 'Failed to create dungeon session' }, 500);
    }

    console.log('✅ Dungeon session created:', { claim_key: data.claim_key });

    return json({ 
      success: true, 
      claim_key: data.claim_key,
      message: 'Dungeon session started successfully'
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Server error occurred' }, 500);
  }
});
