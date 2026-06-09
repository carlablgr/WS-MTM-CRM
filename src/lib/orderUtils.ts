export function buildItemData(item: Record<string, unknown>, sortOrder: number) {
  const dec = (v: unknown) =>
    v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null;
  return {
    sortOrder,
    garmentType: item.garmentType as never,
    fabricPattern: (item.fabricPattern as string) || "plain",
    fabricDescription: (item.fabricDescription as string) || null,
    fabricCode: (item.fabricCode as string) || null,
    fabricColour: (item.fabricColour as string) || null,
    fabricPricePerMetre: dec(item.fabricPricePerMetre),
    fabricMeterage: dec(item.fabricMeterage),
    lining: Boolean(item.lining),
    liningColour: (item.liningColour as string) || null,
    liningDescription: (item.liningDescription as string) || null,
    buttons: (item.buttons as string) || null,
    buttonCount: item.buttonCount ? parseInt(String(item.buttonCount)) : null,
    pockets: (item.pockets as string) || null,
    lapelStyle: (item.lapelStyle as string) || null,
    ventStyle: (item.ventStyle as never) || null,
    sleeveButtons: item.sleeveButtons ? parseInt(String(item.sleeveButtons)) : null,
    waistbandStyle: (item.waistbandStyle as string) || null,
    hemStyle: (item.hemStyle as string) || null,
    additionalConstructionNotes: (item.additionalConstructionNotes as string) || null,
    measurements: item.measurements ?? null,
    measurementNotes: (item.measurementNotes as string) || null,
    sketchUrl: (item.sketchUrl as string) || null,
    inspirationImageUrls: item.inspirationImageUrls ?? null,
    fabricSwatchUrl: (item.fabricSwatchUrl as string) || null,
    makingRate: dec(item.makingRate),
    itemSubtotal: dec(item.itemSubtotal),
  };
}
