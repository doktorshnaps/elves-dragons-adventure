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
      card_instances: {
        Row: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at: string
          current_health: number
          id: string
          last_heal_time: string | null
          max_health: number
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
          last_heal_time?: string | null
          max_health?: number
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
          last_heal_time?: string | null
          max_health?: number
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
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
        }
        Relationships: []
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
          ip_address?: string | null
          is_active?: boolean
          updated_at?: string
          user_agent?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_marketplace_listing: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      create_marketplace_listing: {
        Args: { p_item_id: string; p_listing_type: string; p_price: number }
        Returns: string
      }
      process_marketplace_purchase: {
        Args: { listing_id: string }
        Returns: undefined
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
