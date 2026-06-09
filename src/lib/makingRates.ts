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

// Measurements relevant to each garment type — shown & auto-filled in the order form
export const GARMENT_MEASUREMENTS: Record<string, { key: string; label: string }[]> = {
  JACKET: [
    { key: "neck", label: "Neck" },
    { key: "chest", label: "Chest" },
    { key: "underChest", label: "Under Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulderWidth", label: "Shoulder Width" },
    { key: "shoulderToWaist", label: "Shoulder to Waist" },
    { key: "shoulderToHip", label: "Shoulder to Hip" },
    { key: "shoulderToKnee", label: "Shoulder to Knee" },
    { key: "shoulderToFloor", label: "Shoulder to Floor" },
    { key: "backLength", label: "Back Length" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "sleeveWidth", label: "Sleeve Width" },
    { key: "wristWidth", label: "Wrist Width" },
    { key: "frontChestWidth", label: "Front Chest Width" },
    { key: "backChestWidth", label: "Back Chest Width" },
    { key: "napeToWaist", label: "Nape to Waist" },
    { key: "bustPointToBustPoint", label: "Bust Pt to Bust Pt" },
    { key: "shoulderToBust", label: "Shoulder to Bust" },
    { key: "underarm", label: "Underarm" },
    { key: "armhole", label: "Armhole" },
    { key: "necklineDepth", label: "Neckline Depth" },
  ],
  TROUSERS: [
    { key: "waist", label: "Waist" },
    { key: "highHip", label: "High Hip" },
    { key: "hip", label: "Hip" },
    { key: "thigh", label: "Thigh" },
    { key: "knee", label: "Knee" },
    { key: "calf", label: "Calf" },
    { key: "ankle", label: "Ankle" },
    { key: "inseam", label: "Inseam" },
    { key: "outseam", label: "Outseam" },
    { key: "rise", label: "Rise" },
    { key: "trouserWidth", label: "Trouser Width" },
  ],
  SKIRT: [
    { key: "waist", label: "Waist" },
    { key: "highHip", label: "High Hip" },
    { key: "hip", label: "Hip" },
    { key: "waistToHip", label: "Waist to Hip" },
    { key: "waistToKnee", label: "Waist to Knee" },
    { key: "waistToFloor", label: "Waist to Floor" },
    { key: "skirtLength", label: "Skirt Length" },
  ],
  WAISTCOAT: [
    { key: "chest", label: "Chest" },
    { key: "underChest", label: "Under Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulderWidth", label: "Shoulder Width" },
    { key: "shoulderToWaist", label: "Shoulder to Waist" },
    { key: "backLength", label: "Back Length" },
    { key: "napeToWaist", label: "Nape to Waist" },
    { key: "frontChestWidth", label: "Front Chest Width" },
    { key: "backChestWidth", label: "Back Chest Width" },
    { key: "bustPointToBustPoint", label: "Bust Pt to Bust Pt" },
    { key: "shoulderToBust", label: "Shoulder to Bust" },
  ],
  THREE_QUARTER_COAT: [
    { key: "neck", label: "Neck" },
    { key: "chest", label: "Chest" },
    { key: "underChest", label: "Under Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulderWidth", label: "Shoulder Width" },
    { key: "shoulderToWaist", label: "Shoulder to Waist" },
    { key: "shoulderToHip", label: "Shoulder to Hip" },
    { key: "shoulderToKnee", label: "Shoulder to Knee" },
    { key: "shoulderToFloor", label: "Shoulder to Floor" },
    { key: "backLength", label: "Back Length" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "sleeveWidth", label: "Sleeve Width" },
    { key: "wristWidth", label: "Wrist Width" },
    { key: "frontChestWidth", label: "Front Chest Width" },
    { key: "backChestWidth", label: "Back Chest Width" },
    { key: "napeToWaist", label: "Nape to Waist" },
    { key: "bustPointToBustPoint", label: "Bust Pt to Bust Pt" },
    { key: "shoulderToBust", label: "Shoulder to Bust" },
    { key: "underarm", label: "Underarm" },
    { key: "armhole", label: "Armhole" },
  ],
  FULL_LENGTH_COAT: [
    { key: "neck", label: "Neck" },
    { key: "chest", label: "Chest" },
    { key: "underChest", label: "Under Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulderWidth", label: "Shoulder Width" },
    { key: "shoulderToWaist", label: "Shoulder to Waist" },
    { key: "shoulderToHip", label: "Shoulder to Hip" },
    { key: "shoulderToKnee", label: "Shoulder to Knee" },
    { key: "shoulderToFloor", label: "Shoulder to Floor" },
    { key: "backLength", label: "Back Length" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "sleeveWidth", label: "Sleeve Width" },
    { key: "wristWidth", label: "Wrist Width" },
    { key: "frontChestWidth", label: "Front Chest Width" },
    { key: "backChestWidth", label: "Back Chest Width" },
    { key: "napeToWaist", label: "Nape to Waist" },
    { key: "bustPointToBustPoint", label: "Bust Pt to Bust Pt" },
    { key: "shoulderToBust", label: "Shoulder to Bust" },
    { key: "underarm", label: "Underarm" },
    { key: "armhole", label: "Armhole" },
  ],
};

export interface ItemPricing {
  fabricCost: number;
  itemSubtotal: number; // makingRate + fabricCost
}

export function calculateItemPricing(
  makingRate: number,
  fabricPricePerMetre: number,
  fabricMeterage: number
): ItemPricing {
  const fabricCost = fabricPricePerMetre * fabricMeterage;
  return { fabricCost, itemSubtotal: makingRate + fabricCost };
}

export function calculateOrderTotals(
  itemSubtotals: number[],
  blockFee: number
) {
  const itemsTotal = itemSubtotals.reduce((s, v) => s + v, 0);
  const subtotalExVat = itemsTotal + blockFee;
  const vatAmount = subtotalExVat * 0.2;
  const totalIncVat = subtotalExVat + vatAmount;
  const depositRequired = totalIncVat * 0.5;
  return { itemsTotal, subtotalExVat, vatAmount, totalIncVat, depositRequired };
}
