import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NEAR_RPC_URL = "https://rpc.mainnet.near.org";

interface NftToken {
  token_id: string;
  owner_id: string;
  metadata?: Record<string, unknown>;
}

async function fetchNftTokensForOwner(
  contractId: string,
  accountId: string
): Promise<NftToken[]> {
  try {
    const response = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "nft-check",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: contractId,
          method_name: "nft_tokens_for_owner",
          args_base64: btoa(
            JSON.stringify({ account_id: accountId, from_index: "0", limit: 10 })
          ),
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`NEAR RPC error for ${contractId}/${accountId}:`, data.error);
      return [];
    }

    if (data.result?.result) {
      const decoded = new TextDecoder().decode(
        new Uint8Array(data.result.result)
      );
      return JSON.parse(decoded) as NftToken[];
    }

    return [];
  } catch (err) {
    console.error(`Failed to fetch NFTs for ${contractId}/${accountId}:`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();

    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.length > 128) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get all active whitelisted contracts
    const { data: contracts, error: contractsErr } = await supabase
      .from("whitelist_contracts")
      .select("contract_id")
      .eq("is_active", true);

    if (contractsErr) {
      console.error("Failed to fetch whitelist_contracts:", contractsErr);
      return new Response(
        JSON.stringify({ error: "Failed to fetch contracts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: "No active whitelisted contracts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check each contract via NEAR RPC
    const results = [];

    for (const contract of contracts) {
      const contractId = contract.contract_id;
      let hasAccess = false;
      let tokenCount = 0;
      let tokenIds: string[] = [];
      let errorMessage: string | null = null;

      try {
        const tokens = await fetchNftTokensForOwner(contractId, wallet_address);
        hasAccess = tokens.length > 0;
        tokenCount = tokens.length;
        tokenIds = tokens.map((t) => t.token_id);
      } catch (err) {
        errorMessage = String(err);
        console.error(`Error checking ${contractId} for ${wallet_address}:`, err);
      }

      // 3. Upsert into wallet_whitelist_nft_access
      const { error: upsertErr } = await supabase
        .from("wallet_whitelist_nft_access")
        .upsert(
          {
            wallet_address,
            contract_id: contractId,
            has_access: hasAccess,
            token_count: tokenCount,
            token_ids: tokenIds,
            last_verified_at: new Date().toISOString(),
            verification_source: "near_rpc",
            error_message: errorMessage,
          },
          { onConflict: "wallet_address,contract_id" }
        );

      if (upsertErr) {
        console.error(`Upsert error for ${contractId}/${wallet_address}:`, upsertErr);
      }

      results.push({
        contract_id: contractId,
        has_access: hasAccess,
        token_count: tokenCount,
        error: errorMessage,
      });
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
