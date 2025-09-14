export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      banned_users: {
        Row: {
          banned_at: string
          banned_by_wallet_address: string
          banned_wallet_address: string
          created_at: string
          id: string
          is_active: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          banned_at?: string
          banned_by_wallet_address: string
          banned_wallet_address: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          banned_at?: string
          banned_by_wallet_address?: string
          banned_wallet_address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      card_instances: {
        Row: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at: string
          current_health: number
          id: string
          is_in_medical_bay: boolean | null
          last_heal_time: string | null
          max_health: number
          medical_bay_heal_rate: number | null
          medical_bay_start_time: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at?: string
          current_health?: number
          id?: string
          is_in_medical_bay?: boolean | null
          last_heal_time?: string | null
          max_health?: number
          medical_bay_heal_rate?: number | null
          medical_bay_start_time?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          card_data?: Json
          card_template_id?: string
          card_type?: string
          created_at?: string
          current_health?: number
          id?: string
          is_in_medical_bay?: boolean | null
          last_heal_time?: string | null
          max_health?: number
          medical_bay_heal_rate?: number | null
          medical_bay_start_time?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      card_pack_images: {
        Row: {
          card_name: string
          card_type: string
          created_at: string | null
          faction: string | null
          id: string
          image_url: string
          rarity: number
          updated_at: string | null
        }
        Insert: {
          card_name: string
          card_type: string
          created_at?: string | null
          faction?: string | null
          id?: string
          image_url: string
          rarity: number
          updated_at?: string | null
        }
        Update: {
          card_name?: string
          card_type?: string
          created_at?: string | null
          faction?: string | null
          id?: string
          image_url?: string
          rarity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      card_templates: {
        Row: {
          card_type: string
          created_at: string
          defense: number
          description: string | null
          faction: string | null
          health: number
          id: string
          image_url: string | null
          name: string
          power: number
          rarity: string
          updated_at: string
        }
        Insert: {
          card_type?: string
          created_at?: string
          defense?: number
          description?: string | null
          faction?: string | null
          health?: number
          id?: string
          image_url?: string | null
          name: string
          power?: number
          rarity?: string
          updated_at?: string
        }
        Update: {
          card_type?: string
          created_at?: string
          defense?: number
          description?: string | null
          faction?: string | null
          health?: number
          id?: string
          image_url?: string | null
          name?: string
          power?: number
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_changes: {
        Row: {
          change_type: string
          created_at: string | null
          created_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          version_from: number | null
          version_to: number | null
          wallet_address: string | null
        }
        Insert: {
          change_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          version_from?: number | null
          version_to?: number | null
          wallet_address?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          version_from?: number | null
          version_to?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      game_data: {
        Row: {
          account_experience: number
          account_level: number
          adventure_current_monster: Json | null
          adventure_player_stats: Json | null
          balance: number
          barracks_upgrades: Json
          battle_state: Json | null
          cards: Json
          created_at: string
          dragon_eggs: Json | null
          dragon_lair_upgrades: Json
          id: string
          initialized: boolean
          inventory: Json | null
          marketplace_listings: Json | null
          selected_team: Json | null
          social_quests: Json | null
          updated_at: string
          user_id: string
          version: number | null
          wallet_address: string | null
        }
        Insert: {
          account_experience?: number
          account_level?: number
          adventure_current_monster?: Json | null
          adventure_player_stats?: Json | null
          balance?: number
          barracks_upgrades?: Json
          battle_state?: Json | null
          cards?: Json
          created_at?: string
          dragon_eggs?: Json | null
          dragon_lair_upgrades?: Json
          id?: string
          initialized?: boolean
          inventory?: Json | null
          marketplace_listings?: Json | null
          selected_team?: Json | null
          social_quests?: Json | null
          updated_at?: string
          user_id: string
          version?: number | null
          wallet_address?: string | null
        }
        Update: {
          account_experience?: number
          account_level?: number
          adventure_current_monster?: Json | null
          adventure_player_stats?: Json | null
          balance?: number
          barracks_upgrades?: Json
          battle_state?: Json | null
          cards?: Json
          created_at?: string
          dragon_eggs?: Json | null
          dragon_lair_upgrades?: Json
          id?: string
          initialized?: boolean
          inventory?: Json | null
          marketplace_listings?: Json | null
          selected_team?: Json | null
          social_quests?: Json | null
          updated_at?: string
          user_id?: string
          version?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          buyer_wallet_address: string | null
          created_at: string
          id: string
          item: Json
          price: number
          seller_id: string
          seller_wallet_address: string | null
          sold_at: string | null
          status: string
          type: string
          updated_at: string
          version: number | null
        }
        Insert: {
          buyer_id?: string | null
          buyer_wallet_address?: string | null
          created_at?: string
          id?: string
          item: Json
          price: number
          seller_id: string
          seller_wallet_address?: string | null
          sold_at?: string | null
          status?: string
          type: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          buyer_id?: string | null
          buyer_wallet_address?: string | null
          created_at?: string
          id?: string
          item?: Json
          price?: number
          seller_id?: string
          seller_wallet_address?: string | null
          sold_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      medical_bay: {
        Row: {
          card_instance_id: string
          created_at: string
          estimated_completion: string | null
          heal_rate: number
          id: string
          is_completed: boolean
          placed_at: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          card_instance_id: string
          created_at?: string
          estimated_completion?: string | null
          heal_rate?: number
          id?: string
          is_completed?: boolean
          placed_at?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          card_instance_id?: string
          created_at?: string
          estimated_completion?: string | null
          heal_rate?: number
          id?: string
          is_completed?: boolean
          placed_at?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_bay_card_instance_id_fkey"
            columns: ["card_instance_id"]
            isOneToOne: false
            referencedRelation: "card_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      shop_inventory: {
        Row: {
          available_quantity: number
          created_at: string
          id: string
          item_id: number
          last_reset_time: string
          next_reset_time: string
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          created_at?: string
          id?: string
          item_id: number
          last_reset_time?: string
          next_reset_time?: string
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          created_at?: string
          id?: string
          item_id?: number
          last_reset_time?: string
          next_reset_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_nft_cards: {
        Row: {
          card_template_name: string
          created_at: string
          id: string
          nft_contract_id: string
          nft_metadata: Json | null
          nft_token_id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          card_template_name: string
          created_at?: string
          id?: string
          nft_contract_id: string
          nft_metadata?: Json | null
          nft_token_id: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          card_template_name?: string
          created_at?: string
          id?: string
          nft_contract_id?: string
          nft_metadata?: Json | null
          nft_token_id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_nft_cards_card_template_name_fkey"
            columns: ["card_template_name"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["name"]
          },
        ]
      }
      wallet_connections: {
        Row: {
          connected_at: string
          created_at: string
          disconnected_at: string | null
          id: string
          identity_id: string | null
          ip_address: string | null
          is_active: boolean
          updated_at: string
          user_agent: string | null
          wallet_address: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          identity_id?: string | null
          ip_address?: string | null
          is_active?: boolean
          updated_at?: string
          user_agent?: string | null
          wallet_address: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          identity_id?: string | null
          ip_address?: string | null
          is_active?: boolean
          updated_at?: string
          user_agent?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_connections_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "wallet_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_identities: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      whitelist: {
        Row: {
          added_at: string
          added_by_wallet_address: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          added_at?: string
          added_by_wallet_address: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          added_at?: string
          added_by_wallet_address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_balance: {
        Args: {
          p_admin_wallet_address: string
          p_amount: number
          p_target_wallet_address: string
        }
        Returns: boolean
      }
      admin_add_balance_by_id: {
        Args: {
          p_admin_wallet_address: string
          p_amount: number
          p_target_user_id: string
        }
        Returns: boolean
      }
      admin_add_to_whitelist: {
        Args: {
          p_admin_wallet_address?: string
          p_notes?: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      admin_ban_user: {
        Args: {
          p_admin_wallet_address: string
          p_reason: string
          p_target_wallet_address: string
        }
        Returns: boolean
      }
      admin_ban_user_by_id: {
        Args: {
          p_admin_wallet_address: string
          p_reason: string
          p_target_user_id: string
        }
        Returns: boolean
      }
      admin_find_user_by_wallet: {
        Args: { p_admin_wallet_address: string; p_wallet_address: string }
        Returns: {
          account_level: number
          balance: number
          created_at: string
          user_id: string
          wallet_address: string
        }[]
      }
      admin_get_player_cards: {
        Args: { p_admin_wallet_address: string; p_user_id: string }
        Returns: Json
      }
      admin_get_player_inventory: {
        Args: { p_admin_wallet_address: string; p_user_id: string }
        Returns: Json
      }
      admin_get_user_info: {
        Args: { p_admin_wallet_address: string; p_user_id: string }
        Returns: Json
      }
      admin_give_player_card: {
        Args: {
          p_admin_wallet_address: string
          p_card_data: Json
          p_user_id: string
        }
        Returns: boolean
      }
      admin_give_player_item: {
        Args: {
          p_admin_wallet_address: string
          p_item_data: Json
          p_user_id: string
        }
        Returns: boolean
      }
      admin_remove_from_whitelist: {
        Args: { p_admin_wallet_address?: string; p_wallet_address: string }
        Returns: boolean
      }
      admin_remove_player_card: {
        Args: {
          p_admin_wallet_address: string
          p_card_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      admin_remove_player_item: {
        Args: {
          p_admin_wallet_address: string
          p_item_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      admin_set_player_balance: {
        Args: {
          p_admin_wallet_address: string
          p_balance: number
          p_user_id: string
        }
        Returns: boolean
      }
      admin_unban_user: {
        Args: {
          p_admin_wallet_address: string
          p_target_wallet_address: string
        }
        Returns: boolean
      }
      admin_unban_user_by_id: {
        Args: { p_admin_wallet_address: string; p_target_user_id: string }
        Returns: boolean
      }
      atomic_inventory_update: {
        Args: {
          p_new_item: Json
          p_price_deduction: number
          p_wallet_address: string
        }
        Returns: Json
      }
      authenticate_wallet_session: {
        Args: {
          p_message: string
          p_signature: string
          p_wallet_address: string
        }
        Returns: string
      }
      cancel_marketplace_listing: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      create_marketplace_listing: {
        Args: { p_item_id: string; p_listing_type: string; p_price: number }
        Returns: string
      }
      ensure_game_data_exists: {
        Args: { p_wallet_address: string }
        Returns: string
      }
      get_current_user_wallet: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_game_data_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          account_experience: number
          account_level: number
          adventure_current_monster: Json
          adventure_player_stats: Json
          balance: number
          barracks_upgrades: Json
          battle_state: Json
          cards: Json
          dragon_eggs: Json
          dragon_lair_upgrades: Json
          initialized: boolean
          inventory: Json
          marketplace_listings: Json
          selected_team: Json
          social_quests: Json
          user_id: string
        }[]
      }
      get_or_create_wallet_identity: {
        Args: { p_wallet_address: string }
        Returns: string
      }
      initialize_game_data_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          account_experience: number
          account_level: number
          balance: number
          cards: Json
          dragon_eggs: Json
          inventory: Json
          selected_team: Json
          user_id: string
        }[]
      }
      is_admin_wallet: {
        Args: { p_wallet_address?: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      is_whitelisted: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      open_card_packs: {
        Args: {
          p_count: number
          p_new_cards: Json
          p_pack_name: string
          p_wallet_address: string
        }
        Returns: Json
      }
      place_card_in_medical_bay: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      process_marketplace_purchase: {
        Args: { listing_id: string }
        Returns: undefined
      }
      process_medical_bay_healing: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_card_from_medical_bay: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      reset_shop_inventory: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_version_conflict: {
        Args: {
          p_expected_version: number
          p_new_data: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: Json
      }
      update_game_data_by_wallet: {
        Args: {
          p_account_experience?: number
          p_account_level?: number
          p_adventure_current_monster?: Json
          p_adventure_player_stats?: Json
          p_balance?: number
          p_barracks_upgrades?: Json
          p_battle_state?: Json
          p_cards?: Json
          p_dragon_eggs?: Json
          p_dragon_lair_upgrades?: Json
          p_initialized?: boolean
          p_inventory?: Json
          p_marketplace_listings?: Json
          p_selected_team?: Json
          p_social_quests?: Json
          p_wallet_address: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
