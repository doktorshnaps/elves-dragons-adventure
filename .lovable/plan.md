

# Plan: Resolve Two Security Warnings Without Breaking Functionality

## Problem

Two security warnings flagged in the Security panel:
1. **"Player Wallet Addresses and Game Progress Could Be Stolen"** -- `game_data` table
2. **"NFT Ownership Data Could Be Scraped by Competitors"** -- `card_instances` table

## Analysis Results

After thorough investigation of the RLS policies, RPC functions, and data flow:

### game_data table
- Direct SELECT is already **blocked** for public users (policy `game_data_no_direct_select` with `USING (false)`)
- Admin SELECT is restricted to verified admin wallets only
- The main RPC function `get_game_data_by_wallet` does **NOT** return wallet_address in its output columns
- NEAR wallet addresses are public blockchain identifiers by nature

### card_instances table
- RLS requires authentication AND restricts access to own data only (matching `user_id` or `wallet_address`)
- All RPC functions require the caller's wallet address as input parameter -- users can only query their own cards
- NFT ownership on NEAR is publicly visible on-chain regardless

## Proposed Solution

**Mark both warnings as "ignored" with detailed justification**, because:
- The current RLS policies are correctly configured
- No actual data leakage path exists for regular users
- Admin access is intentional and necessary for game management
- NEAR wallet addresses and NFT ownership are inherently public (on-chain data)
- Changing these policies would break existing game functionality

No code or SQL changes are needed -- just updating the security findings status.

## Technical Details

Two `security--manage_security_finding` operations will be executed:

1. **game_data_wallet_exposure** -- ignore with reason: RLS blocks direct SELECT, RPC does not return wallet_address, NEAR wallets are public, admin access is intentional
2. **card_instances_nft_token_exposure** -- ignore with reason: RLS restricts to own data only, NFT ownership is public on-chain, no public endpoint exposes other users' data

