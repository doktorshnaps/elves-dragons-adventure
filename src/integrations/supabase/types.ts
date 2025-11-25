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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_dungeon_sessions: {
        Row: {
          account_id: string
          created_at: string
          device_id: string
          dungeon_type: string
          id: string
          last_activity: number
          level: number
          started_at: number
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          device_id: string
          dungeon_type: string
          id?: string
          last_activity: number
          level?: number
          started_at: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          device_id?: string
          dungeon_type?: string
          id?: string
          last_activity?: number
          level?: number
          started_at?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
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
      building_configs: {
        Row: {
          background_image_url: string | null
          building_id: string
          building_name: string
          cost_ell: number | null
          cost_gold: number | null
          cost_gt: number | null
          cost_iron: number | null
          cost_stone: number | null
          cost_wood: number | null
          created_at: string
          created_by_wallet_address: string
          id: string
          is_active: boolean
          level: number
          production_per_hour: number | null
          required_buildings: Json | null
          required_items: Json | null
          required_main_hall_level: number | null
          storage_capacity: number | null
          updated_at: string
          upgrade_time_hours: number | null
          working_hours: number | null
        }
        Insert: {
          background_image_url?: string | null
          building_id: string
          building_name: string
          cost_ell?: number | null
          cost_gold?: number | null
          cost_gt?: number | null
          cost_iron?: number | null
          cost_stone?: number | null
          cost_wood?: number | null
          created_at?: string
          created_by_wallet_address: string
          id?: string
          is_active?: boolean
          level: number
          production_per_hour?: number | null
          required_buildings?: Json | null
          required_items?: Json | null
          required_main_hall_level?: number | null
          storage_capacity?: number | null
          updated_at?: string
          upgrade_time_hours?: number | null
          working_hours?: number | null
        }
        Update: {
          background_image_url?: string | null
          building_id?: string
          building_name?: string
          cost_ell?: number | null
          cost_gold?: number | null
          cost_gt?: number | null
          cost_iron?: number | null
          cost_stone?: number | null
          cost_wood?: number | null
          created_at?: string
          created_by_wallet_address?: string
          id?: string
          is_active?: boolean
          level?: number
          production_per_hour?: number | null
          required_buildings?: Json | null
          required_items?: Json | null
          required_main_hall_level?: number | null
          storage_capacity?: number | null
          updated_at?: string
          upgrade_time_hours?: number | null
          working_hours?: number | null
        }
        Relationships: []
      }
      card_class_drop_rates: {
        Row: {
          card_type: string
          class_key: string
          class_name: string
          created_at: string
          created_by_wallet_address: string
          display_order: number
          drop_chance: number
          id: string
          updated_at: string
        }
        Insert: {
          card_type: string
          class_key: string
          class_name: string
          created_at?: string
          created_by_wallet_address: string
          display_order: number
          drop_chance: number
          id?: string
          updated_at?: string
        }
        Update: {
          card_type?: string
          class_key?: string
          class_name?: string
          created_at?: string
          created_by_wallet_address?: string
          display_order?: number
          drop_chance?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_class_mappings: {
        Row: {
          card_name: string
          card_type: string
          class_name: string
          created_at: string
          created_by_wallet_address: string | null
          id: string
          updated_at: string
        }
        Insert: {
          card_name: string
          card_type: string
          class_name: string
          created_at?: string
          created_by_wallet_address?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          card_name?: string
          card_type?: string
          class_name?: string
          created_at?: string
          created_by_wallet_address?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_images: {
        Row: {
          card_name: string
          card_type: string
          created_at: string | null
          created_by_wallet_address: string
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
          created_by_wallet_address: string
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
          created_by_wallet_address?: string
          faction?: string | null
          id?: string
          image_url?: string
          rarity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      card_instances: {
        Row: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at: string
          current_defense: number
          current_health: number
          id: string
          is_in_medical_bay: boolean | null
          is_on_marketplace: boolean | null
          last_heal_time: string | null
          marketplace_listing_id: string | null
          max_defense: number
          max_health: number
          medical_bay_heal_rate: number | null
          medical_bay_start_time: string | null
          monster_kills: number
          nft_contract_id: string | null
          nft_token_id: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at?: string
          current_defense?: number
          current_health?: number
          id?: string
          is_in_medical_bay?: boolean | null
          is_on_marketplace?: boolean | null
          last_heal_time?: string | null
          marketplace_listing_id?: string | null
          max_defense?: number
          max_health?: number
          medical_bay_heal_rate?: number | null
          medical_bay_start_time?: string | null
          monster_kills?: number
          nft_contract_id?: string | null
          nft_token_id?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          card_data?: Json
          card_template_id?: string
          card_type?: string
          created_at?: string
          current_defense?: number
          current_health?: number
          id?: string
          is_in_medical_bay?: boolean | null
          is_on_marketplace?: boolean | null
          last_heal_time?: string | null
          marketplace_listing_id?: string | null
          max_defense?: number
          max_health?: number
          medical_bay_heal_rate?: number | null
          medical_bay_start_time?: string | null
          monster_kills?: number
          nft_contract_id?: string | null
          nft_token_id?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      card_upgrade_requirements: {
        Row: {
          card_class: string | null
          card_type: string
          cost_ell: number
          cost_gold: number | null
          cost_iron: number | null
          cost_stone: number | null
          cost_wood: number | null
          created_at: string | null
          created_by_wallet_address: string
          faction: string | null
          from_rarity: number
          id: string
          is_active: boolean | null
          rarity: string
          required_defeated_monsters: number
          required_items: Json | null
          success_chance: number
          to_rarity: number
          updated_at: string | null
        }
        Insert: {
          card_class?: string | null
          card_type: string
          cost_ell?: number
          cost_gold?: number | null
          cost_iron?: number | null
          cost_stone?: number | null
          cost_wood?: number | null
          created_at?: string | null
          created_by_wallet_address: string
          faction?: string | null
          from_rarity: number
          id?: string
          is_active?: boolean | null
          rarity: string
          required_defeated_monsters?: number
          required_items?: Json | null
          success_chance?: number
          to_rarity: number
          updated_at?: string | null
        }
        Update: {
          card_class?: string | null
          card_type?: string
          cost_ell?: number
          cost_gold?: number | null
          cost_iron?: number | null
          cost_stone?: number | null
          cost_wood?: number | null
          created_at?: string | null
          created_by_wallet_address?: string
          faction?: string | null
          from_rarity?: number
          id?: string
          is_active?: boolean | null
          rarity?: string
          required_defeated_monsters?: number
          required_items?: Json | null
          success_chance?: number
          to_rarity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      class_multipliers: {
        Row: {
          class_name: string
          created_at: string | null
          defense_multiplier: number
          health_multiplier: number
          id: string
          magic_multiplier: number
          power_multiplier: number
          updated_at: string | null
        }
        Insert: {
          class_name: string
          created_at?: string | null
          defense_multiplier?: number
          health_multiplier?: number
          id?: string
          magic_multiplier?: number
          power_multiplier?: number
          updated_at?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string | null
          defense_multiplier?: number
          health_multiplier?: number
          id?: string
          magic_multiplier?: number
          power_multiplier?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      crafting_recipes: {
        Row: {
          category: string | null
          crafting_time_hours: number
          created_at: string | null
          created_by_wallet_address: string
          description: string | null
          id: string
          is_active: boolean | null
          recipe_name: string
          required_materials: Json
          result_item_id: number
          result_quantity: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          crafting_time_hours?: number
          created_at?: string | null
          created_by_wallet_address: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recipe_name: string
          required_materials?: Json
          result_item_id: number
          result_quantity?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          crafting_time_hours?: number
          created_at?: string | null
          created_by_wallet_address?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recipe_name?: string
          required_materials?: Json
          result_item_id?: number
          result_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crafting_recipes_result_item_id_fkey"
            columns: ["result_item_id"]
            isOneToOne: false
            referencedRelation: "item_templates"
            referencedColumns: ["id"]
          },
        ]
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
      dragon_base_stats: {
        Row: {
          created_at: string | null
          defense: number
          health: number
          id: string
          magic: number
          power: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          defense?: number
          health?: number
          id?: string
          magic?: number
          power?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          defense?: number
          health?: number
          id?: string
          magic?: number
          power?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      dragon_class_multipliers: {
        Row: {
          class_name: string
          created_at: string | null
          defense_multiplier: number
          health_multiplier: number
          id: string
          magic_multiplier: number
          power_multiplier: number
          updated_at: string | null
        }
        Insert: {
          class_name: string
          created_at?: string | null
          defense_multiplier?: number
          health_multiplier?: number
          id?: string
          magic_multiplier?: number
          power_multiplier?: number
          updated_at?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string | null
          defense_multiplier?: number
          health_multiplier?: number
          id?: string
          magic_multiplier?: number
          power_multiplier?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      dungeon_item_drops: {
        Row: {
          allowed_monsters: string[] | null
          created_at: string
          created_by_wallet_address: string
          drop_chance: number
          dungeon_number: number
          id: string
          is_active: boolean
          item_template_id: number
          max_dungeon_level: number | null
          min_dungeon_level: number
          updated_at: string
        }
        Insert: {
          allowed_monsters?: string[] | null
          created_at?: string
          created_by_wallet_address: string
          drop_chance?: number
          dungeon_number: number
          id?: string
          is_active?: boolean
          item_template_id: number
          max_dungeon_level?: number | null
          min_dungeon_level?: number
          updated_at?: string
        }
        Update: {
          allowed_monsters?: string[] | null
          created_at?: string
          created_by_wallet_address?: string
          drop_chance?: number
          dungeon_number?: number
          id?: string
          is_active?: boolean
          item_template_id?: number
          max_dungeon_level?: number | null
          min_dungeon_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dungeon_item_drops_item_template_id_fkey"
            columns: ["item_template_id"]
            isOneToOne: false
            referencedRelation: "item_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeon_settings: {
        Row: {
          armor_growth: number
          atk_growth: number
          base_armor: number
          base_atk: number
          base_hp: number
          boss_armor_multipliers: Json | null
          boss_atk_multipliers: Json | null
          boss_hp_multipliers: Json | null
          created_at: string | null
          dungeon_name: string
          dungeon_number: number
          dungeon_type: string
          hp_growth: number
          id: string
          miniboss_armor_multiplier: number | null
          miniboss_atk_multiplier: number | null
          miniboss_hp_multiplier: number | null
          monster_spawn_config: Json | null
          updated_at: string | null
        }
        Insert: {
          armor_growth?: number
          atk_growth?: number
          base_armor?: number
          base_atk?: number
          base_hp?: number
          boss_armor_multipliers?: Json | null
          boss_atk_multipliers?: Json | null
          boss_hp_multipliers?: Json | null
          created_at?: string | null
          dungeon_name: string
          dungeon_number: number
          dungeon_type: string
          hp_growth?: number
          id?: string
          miniboss_armor_multiplier?: number | null
          miniboss_atk_multiplier?: number | null
          miniboss_hp_multiplier?: number | null
          monster_spawn_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          armor_growth?: number
          atk_growth?: number
          base_armor?: number
          base_atk?: number
          base_hp?: number
          boss_armor_multipliers?: Json | null
          boss_atk_multipliers?: Json | null
          boss_hp_multipliers?: Json | null
          created_at?: string | null
          dungeon_name?: string
          dungeon_number?: number
          dungeon_type?: string
          hp_growth?: number
          id?: string
          miniboss_armor_multiplier?: number | null
          miniboss_atk_multiplier?: number | null
          miniboss_hp_multiplier?: number | null
          monster_spawn_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      forge_bay: {
        Row: {
          card_instance_id: string
          created_at: string
          estimated_completion: string | null
          id: string
          is_completed: boolean
          placed_at: string
          repair_rate: number
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          card_instance_id: string
          created_at?: string
          estimated_completion?: string | null
          id?: string
          is_completed?: boolean
          placed_at?: string
          repair_rate?: number
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          card_instance_id?: string
          created_at?: string
          estimated_completion?: string | null
          id?: string
          is_completed?: boolean
          placed_at?: string
          repair_rate?: number
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forge_bay_card_instance_id_fkey"
            columns: ["card_instance_id"]
            isOneToOne: false
            referencedRelation: "card_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      game_data: {
        Row: {
          account_experience: number
          account_level: number
          active_building_upgrades: Json | null
          active_workers: Json
          adventure_current_monster: Json | null
          adventure_player_stats: Json | null
          balance: number
          barracks_upgrades: Json
          battle_state: Json | null
          building_levels: Json | null
          cards: Json
          created_at: string
          data_version: number | null
          dragon_eggs: Json | null
          dragon_lair_upgrades: Json
          gold: number
          id: string
          initialized: boolean
          iron: number
          marketplace_listings: Json | null
          max_iron: number | null
          max_stone: number | null
          max_wood: number | null
          selected_team: Json | null
          social_quests: Json | null
          stone: number
          stone_last_collection_time: number | null
          stone_production_data: Json | null
          updated_at: string
          user_id: string
          version: number | null
          wallet_address: string | null
          wood: number
          wood_last_collection_time: number | null
          wood_production_data: Json | null
        }
        Insert: {
          account_experience?: number
          account_level?: number
          active_building_upgrades?: Json | null
          active_workers?: Json
          adventure_current_monster?: Json | null
          adventure_player_stats?: Json | null
          balance?: number
          barracks_upgrades?: Json
          battle_state?: Json | null
          building_levels?: Json | null
          cards?: Json
          created_at?: string
          data_version?: number | null
          dragon_eggs?: Json | null
          dragon_lair_upgrades?: Json
          gold?: number
          id?: string
          initialized?: boolean
          iron?: number
          marketplace_listings?: Json | null
          max_iron?: number | null
          max_stone?: number | null
          max_wood?: number | null
          selected_team?: Json | null
          social_quests?: Json | null
          stone?: number
          stone_last_collection_time?: number | null
          stone_production_data?: Json | null
          updated_at?: string
          user_id: string
          version?: number | null
          wallet_address?: string | null
          wood?: number
          wood_last_collection_time?: number | null
          wood_production_data?: Json | null
        }
        Update: {
          account_experience?: number
          account_level?: number
          active_building_upgrades?: Json | null
          active_workers?: Json
          adventure_current_monster?: Json | null
          adventure_player_stats?: Json | null
          balance?: number
          barracks_upgrades?: Json
          battle_state?: Json | null
          building_levels?: Json | null
          cards?: Json
          created_at?: string
          data_version?: number | null
          dragon_eggs?: Json | null
          dragon_lair_upgrades?: Json
          gold?: number
          id?: string
          initialized?: boolean
          iron?: number
          marketplace_listings?: Json | null
          max_iron?: number | null
          max_stone?: number | null
          max_wood?: number | null
          selected_team?: Json | null
          social_quests?: Json | null
          stone?: number
          stone_last_collection_time?: number | null
          stone_production_data?: Json | null
          updated_at?: string
          user_id?: string
          version?: number | null
          wallet_address?: string | null
          wood?: number
          wood_last_collection_time?: number | null
          wood_production_data?: Json | null
        }
        Relationships: []
      }
      hero_base_stats: {
        Row: {
          created_at: string | null
          defense: number
          health: number
          id: string
          magic: number
          power: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          defense?: number
          health?: number
          id?: string
          magic?: number
          power?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          defense?: number
          health?: number
          id?: string
          magic?: number
          power?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      item_instances: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          name: string | null
          template_id: number | null
          type: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          name?: string | null
          template_id?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          name?: string | null
          template_id?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "item_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      item_templates: {
        Row: {
          created_at: string
          description: string | null
          drop_chance: number | null
          dungeon_drop_settings: Json | null
          id: number
          image_url: string | null
          item_id: string
          level_requirement: number | null
          name: string
          rarity: string
          sell_price: number | null
          slot: string | null
          source_details: Json | null
          source_type: string
          stats: Json | null
          type: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          drop_chance?: number | null
          dungeon_drop_settings?: Json | null
          id?: number
          image_url?: string | null
          item_id: string
          level_requirement?: number | null
          name: string
          rarity: string
          sell_price?: number | null
          slot?: string | null
          source_details?: Json | null
          source_type: string
          stats?: Json | null
          type: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          drop_chance?: number | null
          dungeon_drop_settings?: Json | null
          id?: number
          image_url?: string | null
          item_id?: string
          level_requirement?: number | null
          name?: string
          rarity?: string
          sell_price?: number | null
          slot?: string | null
          source_details?: Json | null
          source_type?: string
          stats?: Json | null
          type?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      maintenance_mode: {
        Row: {
          created_at: string
          enabled_by_wallet_address: string
          id: string
          is_enabled: boolean
          message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled_by_wallet_address?: string
          id?: string
          is_enabled?: boolean
          message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled_by_wallet_address?: string
          id?: string
          is_enabled?: boolean
          message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          buyer_wallet_address: string | null
          created_at: string
          id: string
          is_nft_listing: boolean | null
          item: Json
          nft_contract_id: string | null
          nft_token_id: string | null
          payment_token_contract: string | null
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
          is_nft_listing?: boolean | null
          item: Json
          nft_contract_id?: string | null
          nft_token_id?: string | null
          payment_token_contract?: string | null
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
          is_nft_listing?: boolean | null
          item?: Json
          nft_contract_id?: string | null
          nft_token_id?: string | null
          payment_token_contract?: string | null
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
      monsters: {
        Row: {
          created_at: string
          created_by_wallet_address: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          monster_id: string
          monster_name: string
          monster_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_wallet_address?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          monster_id: string
          monster_name: string
          monster_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_wallet_address?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          monster_id?: string
          monster_name?: string
          monster_type?: string
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
      quests: {
        Row: {
          created_at: string
          created_by_wallet_address: string
          description: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string
          quest_type: string
          reward_coins: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_wallet_address: string
          description: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url: string
          quest_type?: string
          reward_coins?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_wallet_address?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string
          quest_type?: string
          reward_coins?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rarity_multipliers: {
        Row: {
          created_at: string | null
          id: string
          multiplier: number
          rarity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          multiplier?: number
          rarity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          multiplier?: number
          rarity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          level: number
          referred_user_id: string | null
          referred_wallet_address: string
          referrer_user_id: string | null
          referrer_wallet_address: string
          source_activity: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          level: number
          referred_user_id?: string | null
          referred_wallet_address: string
          referrer_user_id?: string | null
          referrer_wallet_address: string
          source_activity?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          level?: number
          referred_user_id?: string | null
          referred_wallet_address?: string
          referrer_user_id?: string | null
          referrer_wallet_address?: string
          source_activity?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          referred_user_id: string | null
          referred_wallet_address: string
          referrer_user_id: string | null
          referrer_wallet_address: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          referred_user_id?: string | null
          referred_wallet_address: string
          referrer_user_id?: string | null
          referrer_wallet_address: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          referred_user_id?: string | null
          referred_wallet_address?: string
          referrer_user_id?: string | null
          referrer_wallet_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          claim_key: string
          created_at: string
          id: string
          wallet_address: string
        }
        Insert: {
          claim_key: string
          created_at?: string
          id?: string
          wallet_address: string
        }
        Update: {
          claim_key?: string
          created_at?: string
          id?: string
          wallet_address?: string
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
      shop_settings: {
        Row: {
          created_at: string
          created_by_wallet_address: string
          id: string
          is_open_access: boolean
          items_per_refresh: number
          refresh_interval_hours: number
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_wallet_address: string
          id?: string
          is_open_access?: boolean
          items_per_refresh?: number
          refresh_interval_hours?: number
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_wallet_address?: string
          id?: string
          is_open_access?: boolean
          items_per_refresh?: number
          refresh_interval_hours?: number
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      soul_donations: {
        Row: {
          amount: number
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      treasure_hunt_events: {
        Row: {
          created_at: string | null
          created_by_wallet_address: string
          drop_chance: number | null
          dungeon_number: number | null
          ended_at: string | null
          found_quantity: number | null
          id: string
          is_active: boolean | null
          item_image_url: string | null
          item_name: string
          item_template_id: number | null
          max_winners: number
          monster_id: string | null
          reward_amount: number
          started_at: string | null
          total_quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_wallet_address: string
          drop_chance?: number | null
          dungeon_number?: number | null
          ended_at?: string | null
          found_quantity?: number | null
          id?: string
          is_active?: boolean | null
          item_image_url?: string | null
          item_name: string
          item_template_id?: number | null
          max_winners: number
          monster_id?: string | null
          reward_amount: number
          started_at?: string | null
          total_quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_wallet_address?: string
          drop_chance?: number | null
          dungeon_number?: number | null
          ended_at?: string | null
          found_quantity?: number | null
          id?: string
          is_active?: boolean | null
          item_image_url?: string | null
          item_name?: string
          item_template_id?: number | null
          max_winners?: number
          monster_id?: string | null
          reward_amount?: number
          started_at?: string | null
          total_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasure_hunt_events_item_template_id_fkey"
            columns: ["item_template_id"]
            isOneToOne: false
            referencedRelation: "item_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      treasure_hunt_findings: {
        Row: {
          created_at: string | null
          event_id: string
          found_at: string | null
          found_quantity: number
          id: string
          reward_claimed: boolean | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          found_at?: string | null
          found_quantity: number
          id?: string
          reward_claimed?: boolean | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          found_at?: string | null
          found_quantity?: number
          id?: string
          reward_claimed?: boolean | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasure_hunt_findings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "treasure_hunt_events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      user_quest_progress: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          quest_id: string
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id: string
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by_wallet_address: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          created_by_wallet_address: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          created_by_wallet_address?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
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
          nft_contract_used: string | null
          notes: string | null
          updated_at: string
          wallet_address: string
          whitelist_source: string | null
        }
        Insert: {
          added_at?: string
          added_by_wallet_address: string
          created_at?: string
          id?: string
          is_active?: boolean
          nft_contract_used?: string | null
          notes?: string | null
          updated_at?: string
          wallet_address: string
          whitelist_source?: string | null
        }
        Update: {
          added_at?: string
          added_by_wallet_address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          nft_contract_used?: string | null
          notes?: string | null
          updated_at?: string
          wallet_address?: string
          whitelist_source?: string | null
        }
        Relationships: []
      }
      whitelist_contracts: {
        Row: {
          added_by_wallet_address: string
          contract_address: string
          contract_name: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          added_by_wallet_address: string
          contract_address: string
          contract_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          added_by_wallet_address?: string
          contract_address?: string
          contract_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_card_to_forge_bay: {
        Args: {
          p_card_instance_id: string
          p_repair_hours?: number
          p_wallet_address?: string
        }
        Returns: string
      }
      add_card_to_medical_bay: {
        Args: {
          p_card_instance_id: string
          p_healing_hours?: number
          p_wallet_address: string
        }
        Returns: string
      }
      add_item_instances: {
        Args: { p_items: Json; p_wallet_address: string }
        Returns: number
      }
      add_referral: {
        Args: {
          p_referred_wallet_address: string
          p_referrer_wallet_address: string
        }
        Returns: Json
      }
      admin_add_administrator: {
        Args: { p_admin_wallet_address?: string; p_wallet_address: string }
        Returns: boolean
      }
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
      admin_add_dungeon_item_drop:
        | {
            Args: {
              p_admin_wallet_address?: string
              p_drop_chance: number
              p_dungeon_number: number
              p_item_template_id: number
              p_max_dungeon_level: number
              p_min_dungeon_level: number
            }
            Returns: string
          }
        | {
            Args: {
              p_admin_wallet_address: string
              p_allowed_monsters?: string[]
              p_drop_chance: number
              p_dungeon_number: number
              p_item_template_id: number
              p_max_dungeon_level: number
              p_min_dungeon_level: number
            }
            Returns: undefined
          }
      admin_add_to_whitelist:
        | {
            Args: { p_notes?: string; p_wallet_address: string }
            Returns: boolean
          }
        | {
            Args: {
              p_admin_wallet_address?: string
              p_notes?: string
              p_wallet_address: string
            }
            Returns: boolean
          }
      admin_add_whitelist_contract: {
        Args: {
          p_admin_wallet_address: string
          p_contract_address: string
          p_contract_name: string
          p_description: string
          p_is_active?: boolean
        }
        Returns: string
      }
      admin_ban_user: {
        Args: {
          p_admin_wallet_address?: string
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
      admin_clear_user_card_instances: {
        Args: { p_admin_wallet_address?: string; p_wallet_address: string }
        Returns: boolean
      }
      admin_delete_card_upgrade_requirement: {
        Args: { p_id: string; p_wallet: string }
        Returns: undefined
      }
      admin_delete_crafting_recipe: {
        Args: { p_id: string; p_wallet: string }
        Returns: undefined
      }
      admin_delete_dungeon_item_drop: {
        Args: { p_admin_wallet_address?: string; p_drop_id: string }
        Returns: boolean
      }
      admin_delete_quest: {
        Args: { p_admin_wallet_address: string; p_id: string }
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
      admin_give_items_to_player: {
        Args: {
          p_admin_wallet_address: string
          p_items: Json
          p_target_wallet_address: string
        }
        Returns: boolean
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
      admin_insert_building_config: {
        Args: { p_data: Json; p_wallet_address?: string }
        Returns: string
      }
      admin_insert_crafting_recipe: {
        Args: {
          p_category: string
          p_crafting_time_hours: number
          p_description: string
          p_recipe_name: string
          p_required_materials: Json
          p_result_item_id: number
          p_result_quantity: number
          p_wallet_address: string
        }
        Returns: string
      }
      admin_insert_item_template:
        | {
            Args: {
              p_description: string
              p_drop_chance: number
              p_image_url: string
              p_item_id: string
              p_level_requirement: number
              p_name: string
              p_rarity: string
              p_slot: string
              p_source_type: string
              p_type: string
              p_value: number
              p_wallet_address: string
            }
            Returns: {
              created_at: string
              description: string | null
              drop_chance: number | null
              dungeon_drop_settings: Json | null
              id: number
              image_url: string | null
              item_id: string
              level_requirement: number | null
              name: string
              rarity: string
              sell_price: number | null
              slot: string | null
              source_details: Json | null
              source_type: string
              stats: Json | null
              type: string
              updated_at: string
              value: number | null
            }
            SetofOptions: {
              from: "*"
              to: "item_templates"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_description: string
              p_drop_chance: number
              p_image_url: string
              p_item_id: string
              p_level_requirement: number
              p_name: string
              p_rarity: string
              p_sell_price: number
              p_slot: string
              p_source_type: string
              p_type: string
              p_value: number
              p_wallet_address: string
            }
            Returns: undefined
          }
      admin_migrate_cards_to_instances: {
        Args: { p_admin_wallet?: string }
        Returns: {
          migrated_cards: number
          result_wallet: string
        }[]
      }
      admin_recalculate_all_card_stats: {
        Args: { p_admin_wallet_address?: string }
        Returns: Json
      }
      admin_remove_administrator: {
        Args: { p_admin_wallet_address?: string; p_wallet_address: string }
        Returns: boolean
      }
      admin_remove_from_whitelist:
        | { Args: { p_wallet_address: string }; Returns: boolean }
        | {
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
      admin_restore_nft_whitelist: {
        Args: { p_admin_wallet_address?: string; p_wallet_address: string }
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
      admin_toggle_maintenance_mode: {
        Args: {
          p_admin_wallet_address?: string
          p_enabled: boolean
          p_message?: string
        }
        Returns: boolean
      }
      admin_unban_user: {
        Args: {
          p_admin_wallet_address?: string
          p_target_wallet_address: string
        }
        Returns: boolean
      }
      admin_unban_user_by_id: {
        Args: { p_admin_wallet_address: string; p_target_user_id: string }
        Returns: boolean
      }
      admin_update_building_config: {
        Args: { p_id: string; p_update: Json; p_wallet_address?: string }
        Returns: boolean
      }
      admin_update_card_class_drop_rates: {
        Args: { p_admin_wallet_address: string; p_rates: Json }
        Returns: boolean
      }
      admin_update_class_multiplier: {
        Args: {
          p_admin_wallet_address?: string
          p_defense_multiplier: number
          p_health_multiplier: number
          p_id: string
          p_magic_multiplier: number
          p_power_multiplier: number
        }
        Returns: boolean
      }
      admin_update_crafting_recipe: {
        Args: {
          p_category: string
          p_crafting_time_hours: number
          p_description: string
          p_recipe_id: string
          p_recipe_name: string
          p_required_materials: Json
          p_result_item_id: number
          p_result_quantity: number
          p_wallet_address: string
        }
        Returns: undefined
      }
      admin_update_dragon_base_stats: {
        Args: {
          p_admin_wallet_address?: string
          p_defense: number
          p_health: number
          p_magic: number
          p_power: number
        }
        Returns: boolean
      }
      admin_update_dragon_class_multiplier: {
        Args: {
          p_admin_wallet_address?: string
          p_defense_multiplier: number
          p_health_multiplier: number
          p_id: string
          p_magic_multiplier: number
          p_power_multiplier: number
        }
        Returns: boolean
      }
      admin_update_dungeon_item_drop:
        | {
            Args: {
              p_admin_wallet_address?: string
              p_drop_chance: number
              p_drop_id: string
              p_is_active: boolean
              p_max_dungeon_level: number
              p_min_dungeon_level: number
            }
            Returns: boolean
          }
        | {
            Args: {
              p_admin_wallet_address: string
              p_allowed_monsters?: string[]
              p_drop_chance: number
              p_drop_id: string
              p_is_active: boolean
              p_max_dungeon_level: number
              p_min_dungeon_level: number
            }
            Returns: undefined
          }
      admin_update_dungeon_setting:
        | {
            Args: {
              p_admin_wallet_address?: string
              p_armor_growth: number
              p_armor_growth_old?: number
              p_atk_growth: number
              p_atk_growth_old?: number
              p_base_armor: number
              p_base_atk: number
              p_base_hp: number
              p_dungeon_alpha?: number
              p_hp_growth: number
              p_hp_growth_old?: number
              p_id: string
              p_level_beta?: number
              p_level_g_coefficient?: number
              p_s_mob_base?: number
            }
            Returns: boolean
          }
        | {
            Args: {
              p_admin_wallet_address: string
              p_armor_growth: number
              p_atk_growth: number
              p_base_armor: number
              p_base_atk: number
              p_base_hp: number
              p_dungeon_alpha: number
              p_hp_growth: number
              p_id: string
              p_level_beta: number
              p_level_g_coefficient: number
              p_s_mob_base: number
            }
            Returns: boolean
          }
      admin_update_dungeon_settings: {
        Args: {
          p_armor_growth?: number
          p_atk_growth?: number
          p_base_armor?: number
          p_base_atk?: number
          p_base_hp?: number
          p_boss_armor_multipliers?: Json
          p_boss_atk_multipliers?: Json
          p_boss_hp_multipliers?: Json
          p_hp_growth?: number
          p_id: string
          p_miniboss_armor_multiplier?: number
          p_miniboss_atk_multiplier?: number
          p_miniboss_hp_multiplier?: number
          p_monster_spawn_config?: Json
          p_wallet_address: string
        }
        Returns: {
          armor_growth: number
          atk_growth: number
          base_armor: number
          base_atk: number
          base_hp: number
          boss_armor_multipliers: Json | null
          boss_atk_multipliers: Json | null
          boss_hp_multipliers: Json | null
          created_at: string | null
          dungeon_name: string
          dungeon_number: number
          dungeon_type: string
          hp_growth: number
          id: string
          miniboss_armor_multiplier: number | null
          miniboss_atk_multiplier: number | null
          miniboss_hp_multiplier: number | null
          monster_spawn_config: Json | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dungeon_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_hero_base_stats: {
        Args: {
          p_admin_wallet_address?: string
          p_defense: number
          p_health: number
          p_magic: number
          p_power: number
        }
        Returns: boolean
      }
      admin_update_item_drop_chance: {
        Args: {
          p_admin_wallet_address?: string
          p_drop_chance: number
          p_item_id: number
        }
        Returns: boolean
      }
      admin_update_item_template:
        | {
            Args: {
              p_description: string
              p_drop_chance: number
              p_id: number
              p_image_url: string
              p_item_id: string
              p_level_requirement: number
              p_name: string
              p_rarity: string
              p_slot: string
              p_source_type: string
              p_type: string
              p_value: number
              p_wallet_address: string
            }
            Returns: {
              created_at: string
              description: string | null
              drop_chance: number | null
              dungeon_drop_settings: Json | null
              id: number
              image_url: string | null
              item_id: string
              level_requirement: number | null
              name: string
              rarity: string
              sell_price: number | null
              slot: string | null
              source_details: Json | null
              source_type: string
              stats: Json | null
              type: string
              updated_at: string
              value: number | null
            }
            SetofOptions: {
              from: "*"
              to: "item_templates"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_description: string
              p_drop_chance: number
              p_id: number
              p_image_url: string
              p_item_id: string
              p_level_requirement: number
              p_name: string
              p_rarity: string
              p_sell_price: number
              p_slot: string
              p_source_type: string
              p_type: string
              p_value: number
              p_wallet_address: string
            }
            Returns: undefined
          }
      admin_update_rarity_multiplier: {
        Args: {
          p_admin_wallet_address?: string
          p_id: string
          p_multiplier: number
        }
        Returns: boolean
      }
      admin_update_shop_settings: {
        Args: {
          p_admin_wallet_address: string
          p_is_open_access: boolean
          p_items_per_refresh: number
          p_refresh_interval_hours: number
        }
        Returns: boolean
      }
      admin_upsert_quest: {
        Args: {
          p_admin_wallet_address: string
          p_description: string
          p_display_order: number
          p_id: string
          p_image_url: string
          p_is_active: boolean
          p_link_url: string
          p_reward_coins: number
          p_title: string
        }
        Returns: string
      }
      admin_wipe_player: {
        Args: {
          p_admin_wallet_address: string
          p_target_wallet_address: string
        }
        Returns: boolean
      }
      apply_battle_rewards: {
        Args: {
          p_card_health_updates?: Json
          p_card_kills?: Json
          p_ell_reward?: number
          p_experience_reward?: number
          p_items?: Json
          p_wallet_address: string
        }
        Returns: Json
      }
      assign_worker_to_building: {
        Args: {
          p_active_worker: Json
          p_card_instance_id: string
          p_wallet_address: string
        }
        Returns: Json
      }
      atomic_balance_update: {
        Args: { p_price_deduction: number; p_wallet_address: string }
        Returns: Json
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
      backfill_item_instances_from_inventory: {
        Args: { p_wallet_address: string }
        Returns: number
      }
      batch_update_card_stats: {
        Args: { p_card_updates: Json; p_wallet_address: string }
        Returns: Json
      }
      cancel_marketplace_listing: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      check_and_add_to_whitelist_by_nft: {
        Args: { p_nft_contracts: string[]; p_wallet_address: string }
        Returns: boolean
      }
      claim_quest_and_reward: {
        Args: { p_quest_id: string; p_wallet_address: string }
        Returns: Json
      }
      cleanup_old_dungeon_sessions: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_phantom_item_instances: { Args: never; Returns: undefined }
      cleanup_transferred_nft_cards: {
        Args: { p_current_nft_tokens: Json; p_wallet_address: string }
        Returns: number
      }
      complete_user_quest: {
        Args: { p_quest_id: string; p_wallet_address: string }
        Returns: boolean
      }
      craft_multiple_items: {
        Args: { p_recipes: Json; p_wallet_address: string }
        Returns: Json
      }
      create_card_instance_by_wallet: {
        Args: { p_card: Json; p_wallet_address: string }
        Returns: string
      }
      create_game_data_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          account_experience: number
          account_level: number
          active_workers: Json
          adventure_current_monster: Json
          adventure_player_stats: Json
          balance: number
          barracks_upgrades: Json
          battle_state: Json
          cards: Json
          dragon_eggs: Json
          dragon_lair_upgrades: Json
          gold: number
          initialized: boolean
          inventory: Json
          iron: number
          marketplace_listings: Json
          selected_team: Json
          social_quests: Json
          stone: number
          user_id: string
          wood: number
        }[]
      }
      create_marketplace_listing: {
        Args: { p_item_id: string; p_listing_type: string; p_price: number }
        Returns: string
      }
      create_worker_card_instance: {
        Args: { p_wallet_address: string; p_worker_data: Json }
        Returns: string
      }
      delete_treasure_hunt_items: {
        Args: { p_template_id: number }
        Returns: number
      }
      ensure_game_data_exists: {
        Args: { p_wallet_address: string }
        Returns: string
      }
      force_clear_nft_cards: {
        Args: { p_contract_id?: string; p_wallet_address: string }
        Returns: number
      }
      get_card_class_drop_rates: {
        Args: never
        Returns: {
          card_type: string
          class_key: string
          class_name: string
          display_order: number
          drop_chance: number
          id: string
        }[]
      }
      get_card_instances_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          card_data: Json
          card_template_id: string
          card_type: string
          created_at: string
          current_defense: number
          current_health: number
          id: string
          is_in_medical_bay: boolean | null
          is_on_marketplace: boolean | null
          last_heal_time: string | null
          marketplace_listing_id: string | null
          max_defense: number
          max_health: number
          medical_bay_heal_rate: number | null
          medical_bay_start_time: string | null
          monster_kills: number
          nft_contract_id: string | null
          nft_token_id: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }[]
        SetofOptions: {
          from: "*"
          to: "card_instances"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_current_user_wallet: { Args: never; Returns: string }
      get_dungeon_item_drops: {
        Args: { p_dungeon_level: number; p_dungeon_number: number }
        Returns: {
          drop_chance: number
          item_id: number
          item_name: string
          item_rarity: string
          item_type: string
        }[]
      }
      get_forge_bay_entries: {
        Args: { p_wallet_address: string }
        Returns: {
          card_instance_id: string
          ci_card_data: Json
          ci_current_defense: number
          ci_current_health: number
          ci_id: string
          ci_max_defense: number
          ci_max_health: number
          estimated_completion: string
          id: string
          is_completed: boolean
          placed_at: string
          repair_rate: number
          user_id: string
          wallet_address: string
        }[]
      }
      get_game_data_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          account_experience: number
          account_level: number
          active_building_upgrades: Json
          active_workers: Json
          adventure_current_monster: Json
          adventure_player_stats: Json
          balance: number
          barracks_upgrades: Json
          battle_state: Json
          building_levels: Json
          cards: Json
          dragon_eggs: Json
          dragon_lair_upgrades: Json
          gold: number
          initialized: boolean
          iron: number
          marketplace_listings: Json
          selected_team: Json
          social_quests: Json
          stone: number
          user_id: string
          wood: number
        }[]
      }
      get_game_data_by_wallet_full: {
        Args: { p_wallet_address: string }
        Returns: {
          account_experience: number
          account_level: number
          active_building_upgrades: Json
          active_workers: Json
          adventure_current_monster: Json
          adventure_player_stats: Json
          balance: number
          barracks_upgrades: Json
          battle_state: Json
          building_levels: Json
          cards: Json
          dragon_eggs: Json
          dragon_lair_upgrades: Json
          gold: number
          iron: number
          marketplace_listings: Json
          max_iron: number
          max_stone: number
          max_wood: number
          selected_team: Json
          social_quests: Json
          stone: number
          stone_last_collection_time: number
          stone_production_data: Json
          user_id: string
          wallet_address: string
          wood: number
          wood_last_collection_time: number
          wood_production_data: Json
        }[]
      }
      get_item_instances_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          created_at: string
          id: string
          item_id: string
          name: string
          template_id: number
          type: string
          updated_at: string
          user_id: string
          wallet_address: string
        }[]
      }
      get_maintenance_status: { Args: never; Returns: Json }
      get_medical_bay_entries: {
        Args: { p_wallet_address: string }
        Returns: {
          card_instance_id: string
          ci_card_data: Json
          ci_current_health: number
          ci_id: string
          ci_max_health: number
          estimated_completion: string
          heal_rate: number
          id: string
          is_completed: boolean
          placed_at: string
          user_id: string
          wallet_address: string
        }[]
      }
      get_nft_card_instances_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          card_data: Json
          card_template_id: string
          current_health: number
          id: string
          is_in_medical_bay: boolean
          max_health: number
          monster_kills: number
          nft_contract_id: string
          nft_token_id: string
        }[]
      }
      get_nft_card_stats: {
        Args: { p_nft_contract_id: string; p_nft_token_id: string }
        Returns: {
          current_health: number
          current_owner: string
          is_in_medical_bay: boolean
          max_health: number
          monster_kills: number
        }[]
      }
      get_or_create_wallet_identity: {
        Args: { p_wallet_address: string }
        Returns: string
      }
      get_referral_details: {
        Args: { p_referrer_wallet: string; p_wl_only?: boolean }
        Returns: {
          created_at: string
          has_wl: boolean
          wallet_address: string
        }[]
      }
      get_referral_earnings_by_referrer: {
        Args: { p_wallet_address: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          level: number
          referred_wallet_address: string
        }[]
      }
      get_referral_stats: { Args: never; Returns: Json }
      get_referrals_by_referrer: {
        Args: { p_wallet_address: string }
        Returns: {
          created_at: string
          id: string
          referred_wallet_address: string
        }[]
      }
      get_referrer_for_wallet: {
        Args: { p_wallet_address: string }
        Returns: {
          created_at: string
          referrer_wallet_address: string
        }[]
      }
      get_shop_data_complete: {
        Args: { p_wallet_address: string }
        Returns: Json
      }
      get_shop_settings: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_open_access: boolean
          items_per_refresh: number
          refresh_interval_hours: number
          updated_at: string
        }[]
      }
      get_soul_donations_stats: {
        Args: never
        Returns: {
          donation_count: number
          last_donation_at: string
          rank: number
          total_donated: number
          wallet_address: string
        }[]
      }
      get_static_game_data: { Args: never; Returns: Json }
      get_user_quest_progress: {
        Args: { p_wallet_address: string }
        Returns: {
          claimed: boolean
          claimed_at: string
          completed: boolean
          completed_at: string
          quest_id: string
        }[]
      }
      has_admin_role: { Args: { p_wallet_address: string }; Returns: boolean }
      has_role:
        | {
            Args: {
              p_role: Database["public"]["Enums"]["app_role"]
              p_wallet_address: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      increment_card_monster_kills: {
        Args: {
          p_card_template_id: string
          p_kills_to_add?: number
          p_wallet_address: string
        }
        Returns: boolean
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
      is_admin_or_super: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      is_admin_or_super_wallet: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      is_admin_wallet: { Args: { p_wallet_address?: string }; Returns: boolean }
      is_quest_admin: { Args: never; Returns: boolean }
      is_super_admin_wallet: {
        Args: { p_wallet_address: string }
        Returns: boolean
      }
      is_user_banned: { Args: { p_wallet_address: string }; Returns: boolean }
      is_whitelisted: { Args: { p_wallet_address: string }; Returns: boolean }
      mark_quest_claimed: {
        Args: { p_quest_id: string; p_wallet_address: string }
        Returns: boolean
      }
      migrate_cards_to_instances:
        | {
            Args: never
            Returns: {
              migrated_cards: number
              result_wallet: string
            }[]
          }
        | { Args: { p_wallet_address: string }; Returns: Json }
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
      process_forge_bay_repair: { Args: never; Returns: undefined }
      process_marketplace_purchase: {
        Args: { listing_id: string }
        Returns: undefined
      }
      process_medical_bay_healing: { Args: never; Returns: undefined }
      process_referral_earnings: {
        Args: { p_amount: number; p_earner_wallet_address: string }
        Returns: undefined
      }
      recalculate_all_card_stats: { Args: never; Returns: Json }
      recalculate_card_stats: {
        Args: never
        Returns: {
          card_instance_id: string
          new_defense: number
          new_health: number
          old_defense: number
          old_health: number
        }[]
      }
      remove_card_from_forge_bay: {
        Args: { p_card_instance_id: string; p_wallet_address?: string }
        Returns: boolean
      }
      remove_card_from_forge_bay_v2: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      remove_card_from_medical_bay:
        | { Args: { p_card_instance_id: string }; Returns: boolean }
        | {
            Args: { p_card_instance_id: string; p_wallet_address: string }
            Returns: Json
          }
      remove_card_from_medical_bay_v2: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      remove_card_instance_by_id:
        | {
            Args: { p_instance_id: string; p_wallet_address: string }
            Returns: boolean
          }
        | {
            Args: { p_instance_id: string; p_wallet_address: string }
            Returns: boolean
          }
      remove_card_instance_by_wallet: {
        Args: { p_card_template_id: string; p_wallet_address: string }
        Returns: boolean
      }
      remove_card_instance_exact: {
        Args: { p_instance_id: string; p_wallet_address: string }
        Returns: boolean
      }
      remove_item_instances: {
        Args: { p_instance_ids: string[]; p_wallet_address: string }
        Returns: number
      }
      reset_shop_inventory:
        | { Args: never; Returns: undefined }
        | { Args: { p_force?: boolean }; Returns: Json }
      resolve_version_conflict: {
        Args: {
          p_expected_version: number
          p_new_data: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: Json
      }
      revoke_whitelist_if_no_nft: {
        Args: { p_nft_contracts: string[]; p_wallet_address: string }
        Returns: boolean
      }
      stop_healing_without_recovery: {
        Args: { p_card_instance_id: string }
        Returns: undefined
      }
      stop_healing_without_recovery_v2: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      stop_repair_without_recovery: {
        Args: { p_card_instance_id: string; p_wallet_address?: string }
        Returns: boolean
      }
      stop_repair_without_recovery_v2: {
        Args: { p_card_instance_id: string; p_wallet_address: string }
        Returns: Json
      }
      sync_card_instances_from_game_data: {
        Args: { p_wallet_address: string }
        Returns: number
      }
      sync_card_instances_health_from_game_data: {
        Args: { p_wallet_address: string }
        Returns: number
      }
      test_damage_card: {
        Args: {
          p_card_template_id: string
          p_damage_amount: number
          p_wallet_address: string
        }
        Returns: boolean
      }
      update_active_workers_by_wallet: {
        Args: { p_active_workers: Json; p_wallet_address: string }
        Returns: undefined
      }
      update_card_instance_defense_by_template: {
        Args: {
          p_card_template_id: string
          p_current_defense: number
          p_wallet_address: string
        }
        Returns: boolean
      }
      update_card_instance_health: {
        Args: {
          p_current_health: number
          p_instance_id: string
          p_last_heal_time?: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      update_card_instance_health_and_defense_by_template: {
        Args: {
          p_card_template_id: string
          p_current_defense: number
          p_current_health: number
          p_last_heal_time?: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      update_card_instance_health_by_template: {
        Args: {
          p_card_template_id: string
          p_current_health: number
          p_last_heal_time?: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      update_game_data_by_wallet_v2:
        | {
            Args: {
              p_account_experience?: number
              p_account_level?: number
              p_active_building_upgrades?: Json
              p_active_workers?: Json
              p_adventure_current_monster?: Json
              p_adventure_player_stats?: Json
              p_balance?: number
              p_barracks_upgrades?: Json
              p_battle_state?: Json
              p_building_levels?: Json
              p_cards?: Json
              p_dragon_eggs?: Json
              p_dragon_lair_upgrades?: Json
              p_expected_version?: number
              p_force?: boolean
              p_gold?: number
              p_initialized?: boolean
              p_iron?: number
              p_marketplace_listings?: Json
              p_max_iron?: number
              p_max_stone?: number
              p_max_wood?: number
              p_selected_team?: Json
              p_social_quests?: Json
              p_stone?: number
              p_stone_last_collection_time?: number
              p_stone_production_data?: Json
              p_wallet_address: string
              p_wood?: number
              p_wood_last_collection_time?: number
              p_wood_production_data?: Json
            }
            Returns: boolean
          }
        | {
            Args: {
              p_account_experience?: number
              p_account_level?: number
              p_active_building_upgrades?: Json
              p_active_workers?: Json
              p_adventure_current_monster?: Json
              p_adventure_player_stats?: Json
              p_balance?: number
              p_barracks_upgrades?: Json
              p_battle_state?: Json
              p_building_levels?: Json
              p_cards?: Json
              p_dragon_eggs?: Json
              p_dragon_lair_upgrades?: Json
              p_gold?: number
              p_initialized?: boolean
              p_iron?: number
              p_marketplace_listings?: Json
              p_max_iron?: number
              p_max_stone?: number
              p_max_wood?: number
              p_selected_team?: Json
              p_social_quests?: Json
              p_stone?: number
              p_stone_last_collection_time?: number
              p_stone_production_data?: Json
              p_wallet_address: string
              p_wood?: number
              p_wood_last_collection_time?: number
              p_wood_production_data?: Json
            }
            Returns: boolean
          }
      update_resource_production_state_by_wallet: {
        Args: {
          p_is_producing: boolean
          p_is_storage_full: boolean
          p_last_collection_time: number
          p_resource: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      upsert_nft_card_instance: {
        Args: {
          p_card_data: Json
          p_card_template_id: string
          p_card_type: string
          p_max_health: number
          p_nft_contract_id: string
          p_nft_token_id: string
          p_wallet_address: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
    Enums: {
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
