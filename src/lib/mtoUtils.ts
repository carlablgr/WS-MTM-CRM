export const MTO_SURCHARGE_RATE = 0.6; // 60% on retail price
export const MTO_FABRIC_VAT_RATE = 0.2; // 20% VAT on external fabric only
export const MTO_ESTIMATED_ARRIVAL_DAYS = 70; // ~10 weeks guide

export interface MtoItemPricing {
  surcharge: number;
  externalFabricVat: number;
  totalIncVat: number;
}

// Base price = retail price (VAT already included) + 60% surcharge.
// External fabric (if any) is added at cost plus 20% VAT on the fabric only.
export function calculateMtoItemPricing(
  retailPrice: number,
  externalFabricCost: number
): MtoItemPricing {
  const surcharge = retailPrice * MTO_SURCHARGE_RATE;
  const externalFabricVat = externalFabricCost * MTO_FABRIC_VAT_RATE;
  const totalIncVat = retailPrice + surcharge + externalFabricCost + externalFabricVat;
  return { surcharge, externalFabricVat, totalIncVat };
}

export function calculateMtoOrderTotals(itemTotals: number[]) {
  const grandTotal = itemTotals.reduce((s, v) => s + v, 0);
  const depositRequired = grandTotal * 0.5;
  return { grandTotal, depositRequired };
}

export function mtoEstimatedArrival(submissionDate: Date | string | null | undefined): Date | null {
  if (!submissionDate) return null;
  const d = submissionDate instanceof Date ? submissionDate : new Date(submissionDate);
  if (Number.isNaN(d.getTime())) return null;
  const result = new Date(d);
  result.setDate(result.getDate() + MTO_ESTIMATED_ARRIVAL_DAYS);
  return result;
}

export const MTO_STATUSES = [
  { value: "DEPOSIT_TAKEN", label: "Deposit Taken" },
  { value: "SUBMITTED_TO_FACTORY", label: "Submitted to Factory" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "COLLECTED", label: "Collected" },
];
