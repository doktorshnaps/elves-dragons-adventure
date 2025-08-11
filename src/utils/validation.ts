import { Card } from '@/types/cards';
import { Item } from '@/types/inventory';
import { ERROR_TYPES } from './constants';

export class ValidationError extends Error {
  constructor(message: string, public type: string = ERROR_TYPES.VALIDATION_ERROR) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateCard = (card: any): card is Card => {
  if (!card || typeof card !== 'object') return false;
  
  const requiredFields = ['id', 'name', 'type', 'power', 'defense', 'health', 'rarity'];
  return requiredFields.every(field => card[field] !== undefined);
};

export const validateItem = (item: any): item is Item => {
  if (!item || typeof item !== 'object') return false;
  
  const requiredFields = ['id', 'name', 'type', 'value'];
  return requiredFields.every(field => item[field] !== undefined);
};

export const validateBalance = (balance: number): boolean => {
  return typeof balance === 'number' && balance >= 0 && balance <= 1000000000;
};

export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && price > 0 && price <= 1000000000;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().slice(0, 1000); // Ограничиваем длину
};