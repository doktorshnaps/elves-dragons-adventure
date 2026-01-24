import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  wallet_address: z.string().min(3).max(100),
  device_id: z.string().min(1),
  level: z.number().int().min(1).max(100),
});

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

    const { wallet_address, device_id, level } = parsed.data;
    const supabase = getSupabaseServiceClient();
    const now = Date.now();

    console.log('🔄 Updating dungeon session:', {
      wallet_address: wallet_address.substring(0, 10),
      device_id: device_id.substring(0, 20),
      level
    });

    // Обновляем уровень и last_activity для существующей сессии
    const { data, error } = await supabase
      .from('active_dungeon_sessions')
      .update({
        level,
        last_activity: now
      })
      .eq('account_id', wallet_address)
      .eq('device_id', device_id)
      .select('level, last_activity')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      // Если сессия не найдена - не критичная ошибка
      if (error.code === 'PGRST116') {
        return json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' }, 404);
      }
      return json({ error: 'Failed to update dungeon session' }, 500);
    }

    console.log('✅ Dungeon session updated:', { level: data.level });

    return json({ 
      success: true, 
      level: data.level,
      last_activity: data.last_activity
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Server error occurred' }, 500);
  }
});
