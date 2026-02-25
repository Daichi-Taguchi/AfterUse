import { WasteType } from '../types';

export function validateWeight(weight: number): string | null {
  if (Number.isNaN(weight)) {
    return 'Please enter a weight.';
  }
  if (weight < 0.1 || weight > 100) {
    return 'Weight must be between 0.1kg and 100kg.';
  }
  return null;
}

export function validateWasteType(wasteType?: WasteType): string | null {
  if (!wasteType) {
    return 'Please select a waste type.';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) {
    return 'Please enter a phone number.';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return 'Invalid phone number format.';
  }
  return null;
}

export function validateProfile(name: string, organization: string): string | null {
  if (!name.trim() || !organization.trim()) {
    return 'Name and organization are required.';
  }
  return null;
}
