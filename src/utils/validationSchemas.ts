import { z } from 'zod';

/**
 * Validation schemas for security - prevents injection attacks and data corruption
 * All user inputs must be validated before submission to RPC functions
 */

// Wallet address validation
export const walletAddressSchema = z.string()
  .trim()
  .min(1, "Wallet address is required")
  .max(100, "Wallet address too long")
  .regex(/^[a-z0-9._-]+\.(near|testnet|tg)$/i, "Invalid NEAR wallet format");

// UUID validation
export const uuidSchema = z.string()
  .trim()
  .uuid("Invalid UUID format");

// Balance and price validation
export const balanceSchema = z.number()
  .int("Balance must be an integer")
  .min(0, "Balance cannot be negative")
  .max(999999999, "Balance exceeds maximum allowed value");

export const priceSchema = z.number()
  .int("Price must be an integer")
  .min(0, "Price cannot be negative")
  .max(1000000, "Price exceeds maximum allowed value");

// Item template validation
export const itemTemplateSchema = z.object({
  item_id: z.string()
    .trim()
    .min(1, "Item ID is required")
    .max(50, "Item ID too long")
    .regex(/^[a-z0-9_-]+$/i, "Item ID can only contain letters, numbers, underscores and hyphens"),
  
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name too long (max 100 characters)"),
  
  type: z.string()
    .refine((val) => [
      'material', 'weapon', 'armor', 'accessory', 'consumable', 'cardPack',
      'healthPotion', 'woodChunks', 'magicalRoots', 'rockStones', 'blackCrystals',
      'illusionManuscript', 'darkMonocle', 'etherVine', 'dwarvenTongs',
      'healingOil', 'shimmeringCrystal', 'lifeCrystal'
    ].includes(val), {
      message: "Invalid item type"
    }),
  
  rarity: z.string()
    .refine((val) => ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].includes(val), {
      message: "Invalid rarity level"
    }),
  
  description: z.string()
    .trim()
    .max(500, "Description too long (max 500 characters)")
    .optional()
    .or(z.literal('')),
  
  source_type: z.string()
    .refine((val) => ['dungeon', 'shop', 'quest', 'craft', 'event'].includes(val), {
      message: "Invalid source type"
    }),
  
  image_url: z.string()
    .trim()
    .url("Invalid URL format")
    .max(500, "Image URL too long")
    .optional()
    .or(z.literal('')),
  
  slot: z.string()
    .refine((val) => !val || ['head', 'chest', 'hands', 'legs', 'feet', 'neck', 'ring', 'weapon', 'offhand'].includes(val), {
      message: "Invalid equipment slot"
    })
    .optional()
    .or(z.literal('')),
  
  value: z.number()
    .int("Value must be an integer")
    .min(0, "Value cannot be negative")
    .max(1000000, "Value too high"),
  
  sell_price: z.number()
    .int("Sell price must be an integer")
    .min(0, "Sell price cannot be negative")
    .max(1000000, "Sell price too high"),
  
  level_requirement: z.number()
    .int("Level requirement must be an integer")
    .min(1, "Level requirement must be at least 1")
    .max(100, "Level requirement too high"),
  
  drop_chance: z.number()
    .min(0, "Drop chance cannot be negative")
    .max(1, "Drop chance cannot exceed 1.0")
    .optional()
    .or(z.literal(0))
});

// Admin command validation
export const adminCommandBalanceSchema = z.object({
  userId: uuidSchema,
  amount: z.number()
    .int("Amount must be an integer")
    .min(-999999999, "Amount too low")
    .max(999999999, "Amount too high")
});

export const adminCommandBanSchema = z.object({
  userId: uuidSchema,
  reason: z.string()
    .trim()
    .min(3, "Ban reason must be at least 3 characters")
    .max(500, "Ban reason too long")
});

// Marketplace listing validation
export const marketplaceListingSchema = z.object({
  price: priceSchema,
  item: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    type: z.string().min(1),
    rarity: z.string().optional()
  })
});

// Quest validation
export const questSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Quest title required")
    .max(100, "Quest title too long"),
  
  description: z.string()
    .trim()
    .min(1, "Quest description required")
    .max(1000, "Quest description too long"),
  
  reward_balance: z.number()
    .int()
    .min(0, "Reward cannot be negative")
    .max(100000, "Reward too high"),
  
  requirement_value: z.number()
    .int()
    .min(1, "Requirement must be at least 1")
    .max(1000000, "Requirement too high")
});

// Card validation
export const cardSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['hero', 'dragon', 'spell', 'minion']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  power: z.number().int().min(0).max(9999),
  defense: z.number().int().min(0).max(9999),
  health: z.number().int().min(1).max(9999)
});

// Text input sanitization (for display purposes)
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    .slice(0, 1000) // Limit length
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Helper function to format validation errors for display
export const formatValidationErrors = (error: z.ZodError<any>): string => {
  return error.issues
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('\n');
};
