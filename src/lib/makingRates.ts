export type FabricPattern = "plain" | "check";

export interface MakingRate {
  label: string;
  exVat: number;
  estimated?: boolean;
  note?: string;
}

export const MAKING_RATES: Record<string, Record<FabricPattern, MakingRate>> = {
  JACKET: {
    plain: { label: "Jacket (plain)", exVat: 720 },
    check: { label: "Jacket (check)", exVat: 765 },
  },
  TROUSERS: {
    plain: {
      label: "Trousers (plain)",
      exVat: 457.5,
      estimated: true,
      note: "Trouser making rate is estimated — confirm with Anthony before quoting",
    },
    check: {
      label: "Trousers (check)",
      exVat: 517.5,
      estimated: true,
      note: "Trouser making rate is estimated — confirm with Anthony before quoting",
    },
  },
  WAISTCOAT: {
    plain: { label: "Waistcoat (plain)", exVat: 375 },
    check: { label: "Waistcoat (check)", exVat: 405 },
  },
  THREE_QUARTER_COAT: {
    plain: { label: "¾ Coat (plain)", exVat: 765 },
    check: { label: "¾ Coat (check)", exVat: 810 },
  },
  FULL_LENGTH_COAT: {
    plain: { label: "Full Length Coat (plain)", exVat: 825 },
    check: { label: "Full Length Coat (check)", exVat: 870 },
  },
  SKIRT: {
    plain: { label: "Skirt (plain)", exVat: 420 },
    check: {
      label: "Skirt (check)",
      exVat: 480,
      note: "Skirt fabric meterage to be confirmed with Anthony",
    },
  },
};

export const FABRIC_METERAGE_DEFAULTS: Record<string, number | null> = {
  JACKET: 2,
  TROUSERS: 1.5,
  WAISTCOAT: 1,
  THREE_QUARTER_COAT: 2.5,
  FULL_LENGTH_COAT: 2.5,
  SKIRT: null,
};

export const BLOCK_FEE = 350;

export function calculatePricing(
  makingRate: number,
  blockFee: number,
  fabricPricePerMetre: number,
  fabricMeterage: number
) {
  const fabricTotalCost = fabricPricePerMetre * fabricMeterage;
  const subtotalExVat = makingRate + blockFee + fabricTotalCost;
  const vatAmount = subtotalExVat * 0.2;
  const totalIncVat = subtotalExVat + vatAmount;
  const depositRequired = totalIncVat * 0.5;
  return {
    fabricTotalCost,
    subtotalExVat,
    vatAmount,
    totalIncVat,
    depositRequired,
  };
}
