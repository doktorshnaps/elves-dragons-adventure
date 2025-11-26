import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  wallet_address: z.string().min(3).max(100),
  device_id: z.string().optional(),
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

    const { wallet_address, device_id }: RequestBody = parsed.data;

    console.log('🛑 Ending dungeon session:', {
      wallet_address,
      device_id: device_id || 'all devices'
    });

    const supabase = getSupabaseServiceClient();

    // Удаляем сессии для кошелька (опционально для конкретного устройства)
    let query = supabase
      .from('active_dungeon_sessions')
      .delete()
      .eq('account_id', wallet_address);
    
    if (device_id) {
      query = query.eq('device_id', device_id);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return json({ error: 'Failed to end dungeon session' }, 500);
    }

    console.log('✅ Dungeon session ended successfully');

    return json({ 
      success: true,
      message: 'Dungeon session ended successfully'
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Server error occurred' }, 500);
  }
});
