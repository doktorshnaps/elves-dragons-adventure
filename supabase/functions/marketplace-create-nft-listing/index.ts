// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const {
      seller_wallet_address,
      item,
      price,
      nft_contract_id,
      nft_token_id,
      payment_token_contract,
    } = body || {};

    console.log("📥 marketplace-create-nft-listing input:", body);

    if (!seller_wallet_address || !nft_contract_id || !nft_token_id || typeof price !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 1) Resolve seller user_id by wallet address from game_data
    const { data: gameData, error: gameErr } = await supabase
      .from("game_data")
      .select("user_id")
      .eq("wallet_address", seller_wallet_address)
      .maybeSingle();

    if (gameErr) {
      console.error("❌ Error fetching game_data:", gameErr);
      return new Response(JSON.stringify({ error: "Unable to verify seller", code: "SELLER_ERROR" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const seller_id = gameData?.user_id;
    if (!seller_id) {
      return new Response(
        JSON.stringify({ error: "Seller user not found for this wallet" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2) Create marketplace listing
    const { data: listing, error: listingErr } = await supabase
      .from("marketplace_listings")
      .insert([
        {
          seller_id,
          seller_wallet_address,
          item,
          price,
          type: "card",
          status: "active",
          is_nft_listing: true,
          nft_contract_id,
          nft_token_id,
          payment_token_contract: payment_token_contract || null,
        },
      ])
      .select()
      .single();

    if (listingErr) {
      console.error("❌ Error creating listing:", listingErr);
      return new Response(JSON.stringify({ error: "Unable to create listing", code: "LISTING_ERROR" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3) Lock NFT in card_instances
    const { error: lockErr } = await supabase
      .from("card_instances")
      .update({ is_on_marketplace: true, marketplace_listing_id: listing.id })
      .eq("nft_contract_id", nft_contract_id)
      .eq("nft_token_id", nft_token_id)
      .eq("wallet_address", seller_wallet_address);

    if (lockErr) {
      console.error("❌ Error locking NFT:", lockErr);
      // rollback listing
      await supabase.from("marketplace_listings").delete().eq("id", listing.id);
      return new Response(JSON.stringify({ error: "Unable to lock item", code: "LOCK_ERROR" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("✅ Listing created via edge function:", listing.id);

    return new Response(JSON.stringify({ listing }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("❌ Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Internal server error", code: "SERVER_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

Deno.serve(handler);
