import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeMediaUrl(media?: string, baseUri?: string): string {
  const PLACEHOLDER = '/placeholder.svg';
  if (!media && !baseUri) return PLACEHOLDER;
  try {
    const isAbs = (u?: string) => !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:'));
    const toIpfsPath = (cidOrPath: string) => {
      if (!cidOrPath) return '';
      if (cidOrPath.startsWith('ipfs://')) return cidOrPath.replace('ipfs://', 'https://ipfs.io/ipfs/');
      if (/^[a-zA-Z0-9]{46,}$/.test(cidOrPath)) return `https://ipfs.io/ipfs/${cidOrPath}`;
      return cidOrPath;
    };

    if (media && isAbs(media)) return media;

    const base = baseUri ? toIpfsPath(baseUri) : '';
    const mediaPath = media ? toIpfsPath(media) : '';

    if (mediaPath && isAbs(mediaPath)) return mediaPath;

    if (base && mediaPath) return `${base.replace(/\/$/, '')}/${mediaPath.replace(/^\//, '')}`;
    if (mediaPath) return mediaPath;
    if (base) return base;
    return PLACEHOLDER;
  } catch {
    return '/placeholder.svg';
  }
}

interface RequestBody {
  wallet_address: string;
  contract_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { wallet_address, contract_id } = body || {};

    if (!wallet_address || typeof wallet_address !== 'string') {
      return new Response(JSON.stringify({ error: 'wallet_address required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from('user_nft_cards')
      .select('*')
      .eq('wallet_address', wallet_address);

    if (contract_id) {
      query = query.eq('nft_contract_id', contract_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('get-user-nft-cards error');
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cards = (data || []).map((mapping: any) => {
      const meta = mapping.nft_metadata || {};
      let extra: any = undefined;
      if (typeof meta?.extra === 'string') {
        try { extra = JSON.parse(meta.extra); } catch {}
      }

      const name = meta?.title || meta?.description || mapping.card_template_name || `Token #${mapping.nft_token_id}`;
      const baseUri = meta?.base_uri || extra?.base_uri;
      const mediaCandidate = meta?.media || extra?.media || extra?.image || extra?.img;
      const image = normalizeMediaUrl(mediaCandidate, baseUri);
      const power = meta?.power || extra?.power || 20;
      const defense = meta?.defense || extra?.defense || 15;
      const health = meta?.health || extra?.health || 100;
      const rarity = meta?.rarity || extra?.rarity || 'common';
      const type = (meta?.type || extra?.type) === 'character' ? 'character' : 'pet';
      const faction = meta?.faction || extra?.faction;
      const description = meta?.description || extra?.description || 'NFT Card';

      return {
        id: `${mapping.nft_contract_id}_${mapping.nft_token_id}`,
        name,
        power,
        defense,
        health,
        currentHealth: health,
        rarity,
        faction,
        type,
        description,
        image,
        nft_token_id: mapping.nft_token_id,
        nft_contract_id: mapping.nft_contract_id,
      };
    });

    return new Response(JSON.stringify({ cards }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('get-user-nft-cards exception:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
