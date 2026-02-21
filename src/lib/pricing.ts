import { Intervention, InventoryItem } from "@/types";

export interface PriceBreakdown {
  partsTotal: number;
  labor: number;
  subtotal: number;
  emergencySurcharge: number;
  socialDiscount: number;
  commercialDiscount: number;
  total: number;
}

export function calculatePriceBreakdown(
  intervention: Intervention,
  inventory: InventoryItem[],
  currentParts?: { id: string; qty: number }[]
): PriceBreakdown {
  // Use currentParts if provided (for tech side preview), else use intervention.parts_used
  const partsUsed = currentParts 
    ? currentParts.map(p => ({ item_id: p.id, quantity: p.qty }))
    : intervention.parts_used;

  const partsTotal = partsUsed.reduce((acc, p) => {
    const item = inventory.find(i => i.id === p.item_id);
    return acc + (item?.price || 0) * p.quantity;
  }, 0);

  const labor = intervention.labor_cost || 80;
  const subtotal = partsTotal + labor;
  
  // 1. Emergency Surcharge (x1.5)
  const emergencySurcharge = intervention.is_emergency ? subtotal * 0.5 : 0;
  
  let total = subtotal + emergencySurcharge;

  // 2. Social Discount (5%)
  let socialDiscount = 0;
  if (intervention.social_emergency_type && intervention.social_emergency_type !== "none") {
    socialDiscount = total * 0.05;
    total -= socialDiscount;
  }

  // 3. Commercial Discount (Absolute value)
  const commercialDiscount = intervention.discount || 0;
  total -= commercialDiscount;

  return {
    partsTotal,
    labor,
    subtotal,
    emergencySurcharge,
    socialDiscount,
    commercialDiscount,
    total: Math.round(total)
  };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount);
}
