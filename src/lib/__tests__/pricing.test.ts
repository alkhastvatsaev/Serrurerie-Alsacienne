import { describe, it, expect } from 'vitest';
import { calculatePriceBreakdown } from '../pricing';
import { Intervention, InventoryItem } from '@/types';

const mockInventory: InventoryItem[] = [
  { id: 'i1', item_name: 'Cylindre', quantity: 10, price: 100, min_threshold: 2 },
  { id: 'i2', item_name: 'Serrure', quantity: 5, price: 200, min_threshold: 1 },
];

const baseIntervention: Intervention = {
  id: 'int-1',
  address: '123 Test St',
  status: 'pending',
  tech_id: 'tech-1',
  asset_id: 'a1',
  payment_status: 'unpaid',
  date: '2026-02-09',
  time: '10:00',
  description: 'Test',
  latitude: 48.5,
  longitude: 7.7,
  category: 'repair',
  client_id: 'c1',
  parts_used: [],
  labor_cost: 80,
  is_emergency: false,
};

describe('pricing utility', () => {
  it('should calculate base price with only labor', () => {
    const result = calculatePriceBreakdown(baseIntervention, mockInventory);
    expect(result.subtotal).toBe(80);
    expect(result.total).toBe(80);
  });

  it('should include parts in the subtotal', () => {
    const intervention = {
      ...baseIntervention,
      parts_used: [{ item_id: 'i1', quantity: 2 }],
    };
    const result = calculatePriceBreakdown(intervention, mockInventory);
    expect(result.partsTotal).toBe(200);
    expect(result.subtotal).toBe(280);
    expect(result.total).toBe(280);
  });

  it('should apply emergency surcharge (x1.5)', () => {
    const intervention = {
      ...baseIntervention,
      is_emergency: true,
    };
    const result = calculatePriceBreakdown(intervention, mockInventory);
    expect(result.emergencySurcharge).toBe(40); // 50% of 80
    expect(result.total).toBe(120);
  });

  it('should apply social discount (5%)', () => {
    const intervention: Intervention = {
      ...baseIntervention,
      social_emergency_type: 'elderly_person',
    };
    const result = calculatePriceBreakdown(intervention, mockInventory);
    expect(result.socialDiscount).toBe(4); // 5% of 80
    expect(result.total).toBe(76);
  });

  it('should apply both surcharge and social discount correctly', () => {
    const intervention: Intervention = {
      ...baseIntervention,
      is_emergency: true,
      social_emergency_type: 'elderly_person',
    };
    const result = calculatePriceBreakdown(intervention, mockInventory);
    // Subtotal: 80
    // Surcharge: 40 -> Total: 120
    // Social Discount: 5% of 120 = 6
    // Total: 114
    expect(result.emergencySurcharge).toBe(40);
    expect(result.socialDiscount).toBe(6);
    expect(result.total).toBe(114);
  });
});
