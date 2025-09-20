export interface CardInstance {
  id: string;
  card_template_id: string;
  wallet_address: string;
  current_health: number;
  max_health: number;
  last_heal_time: string;
  card_type: string;
  card_data: any;
  created_at: string;
  updated_at: string;
  is_in_medical_bay?: boolean;
  medical_bay_start_time?: string;
  medical_bay_heal_rate?: number;
}