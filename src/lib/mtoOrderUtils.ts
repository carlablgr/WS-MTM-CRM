import { calculateMtoItemPricing } from "@/lib/mtoUtils";

export function buildMtoItemData(item: Record<string, unknown>, sortOrder: number) {
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;

  const retailPrice = dec(item.retailPrice) ?? 0;
  const externalFabricCost = dec(item.externalFabricCost) ?? 0;
  const { totalIncVat } = calculateMtoItemPricing(retailPrice, externalFabricCost);

  return {
    sortOrder,
    garmentName: (item.garmentName as string) ?? "",
    blockSize: (item.blockSize as string) || null,
    cloth: (item.cloth as string) || null,
    lining: (item.lining as string) || null,
    internal: (item.internal as string) || null,
    accents: (item.accents as string) || null,
    buttons: (item.buttons as string) || null,
    retailPrice: dec(item.retailPrice),
    externalFabricCost,
    totalIncVat,
    notes: (item.notes as string) || null,
  };
}
