import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate, garmentTypeLabel } from "@/lib/format";
import { GARMENT_MEASUREMENTS } from "@/lib/makingRates";
import type { Customer, OrderForm, OrderItem } from "@prisma/client";

const COLORS = {
  green: "#1e3d2f",
  cream: "#f5f0e8",
  gold: "#c4a35a",
  text: "#2a2a2a",
  muted: "#6b7c72",
  border: "#ede7d9",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.green,
    color: COLORS.cream,
    padding: 16,
    marginBottom: 18,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.gold,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 15,
    color: COLORS.cream,
  },
  meta: {
    fontSize: 9,
    color: COLORS.cream,
    marginTop: 6,
  },
  garmentBlock: {
    border: `1px solid ${COLORS.border}`,
    marginBottom: 14,
  },
  garmentHeader: {
    backgroundColor: COLORS.green,
    color: COLORS.cream,
    padding: 8,
    fontSize: 11,
  },
  garmentBody: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.gold,
    textTransform: "uppercase",
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: 4,
    marginBottom: 6,
    backgroundColor: COLORS.green,
    padding: 4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  field: {
    width: "50%",
    marginBottom: 5,
  },
  measField: {
    width: "33%",
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 8,
  },
  label: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  value: {
    fontSize: 10,
    marginTop: 1,
  },
  noteBox: {
    backgroundColor: "#faf7f2",
    border: `1px solid ${COLORS.border}`,
    padding: 6,
    fontSize: 9,
    marginTop: 4,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 10,
  },
  pricingTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "bold",
  },
});

type OrderWithDetails = OrderForm & {
  customer: Pick<Customer, "firstName" | "lastName">;
  items: OrderItem[];
};

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function OrderSummaryDocument({ order }: { order: OrderWithDetails }) {
  const garmentSummary = order.items.length
    ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
    : garmentTypeLabel(order.garmentType);

  return (
    <Document title={`Order Summary — ${order.customer.firstName} ${order.customer.lastName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Walker Slater · Made to Measure</Text>
          <Text style={styles.title}>Order Summary — {garmentSummary}</Text>
          <Text style={styles.meta}>
            Customer: {order.customer.firstName} {order.customer.lastName}
          </Text>
          <Text style={styles.meta}>Order Date: {formatDate(order.createdAt)}</Text>
          {order.estimatedCompletionDate && (
            <Text style={styles.meta}>Est. Completion: {formatDate(order.estimatedCompletionDate)}</Text>
          )}
        </View>

        {order.items.map((item, index) => {
          const fabricCost =
            item.fabricPricePerMetre && item.fabricMeterage
              ? Number(item.fabricPricePerMetre) * Number(item.fabricMeterage)
              : null;

          const mFields = GARMENT_MEASUREMENTS[item.garmentType] ?? [];
          const itemMeasurements = (item.measurements as Record<string, string> | null) ?? {};
          const activeMeasurements = mFields.filter(({ key }) => itemMeasurements[key]);

          return (
            <View key={item.id} style={styles.garmentBlock} wrap={false}>
              <Text style={styles.garmentHeader}>
                Garment {index + 1}: {garmentTypeLabel(item.garmentType)} —{" "}
                {item.fabricPattern === "check" ? "Check" : "Plain"}
                {item.itemSubtotal ? `   (${formatCurrency(Number(item.itemSubtotal))} ex. VAT)` : ""}
              </Text>
              <View style={styles.garmentBody}>
                {/* Fabric */}
                <Text style={styles.sectionTitle}>Fabric</Text>
                <View style={styles.row}>
                  <FieldRow label="Description" value={item.fabricDescription} />
                  <FieldRow label="Code" value={item.fabricCode} />
                  <FieldRow label="Colour" value={item.fabricColour} />
                  <FieldRow
                    label="Price per Metre"
                    value={item.fabricPricePerMetre ? `£${Number(item.fabricPricePerMetre).toFixed(2)}` : null}
                  />
                  <FieldRow label="Meterage" value={item.fabricMeterage ? `${item.fabricMeterage}m` : null} />
                  <FieldRow label="Fabric Total (ex. VAT)" value={fabricCost ? `£${fabricCost.toFixed(2)}` : null} />
                </View>

                {/* Construction */}
                <Text style={styles.sectionTitle}>Construction</Text>
                <View style={styles.row}>
                  <FieldRow
                    label="Lining"
                    value={item.lining ? `Yes${item.liningColour ? ` — ${item.liningColour}` : ""}` : "No lining"}
                  />
                  <FieldRow label="Lining Description" value={item.liningDescription} />
                  <FieldRow
                    label="Buttons"
                    value={item.buttons ? `${item.buttons}${item.buttonCount ? ` (×${item.buttonCount})` : ""}` : null}
                  />
                  <FieldRow label="Pockets" value={item.pockets} />
                  <FieldRow label="Lapel Style" value={item.lapelStyle} />
                  <FieldRow label="Vent Style" value={item.ventStyle} />
                  <FieldRow label="Sleeve Buttons" value={item.sleeveButtons ? String(item.sleeveButtons) : null} />
                  <FieldRow label="Waistband Style" value={item.waistbandStyle} />
                  <FieldRow label="Hem Style" value={item.hemStyle} />
                </View>
                {item.additionalConstructionNotes && (
                  <View>
                    <Text style={styles.label}>Additional Notes</Text>
                    <View style={styles.noteBox}>
                      <Text>{item.additionalConstructionNotes}</Text>
                    </View>
                  </View>
                )}

                {/* Measurements */}
                {activeMeasurements.length > 0 && (
                  <View>
                    <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Measurements (inches)</Text>
                    {item.measurementNotes && (
                      <Text style={{ fontSize: 9, color: COLORS.gold, marginBottom: 4 }}>
                        Adjustments: {item.measurementNotes}
                      </Text>
                    )}
                    <View style={styles.row}>
                      {activeMeasurements.map(({ key, label }) => (
                        <View key={key} style={styles.measField}>
                          <Text style={{ fontSize: 9, color: COLORS.muted }}>{label}</Text>
                          <Text style={{ fontSize: 9 }}>{itemMeasurements[key]}&quot;</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Pricing Summary */}
        <Text style={styles.sectionTitle}>Pricing Summary (ex. VAT)</Text>
        <View style={{ marginBottom: 12 }}>
          {order.items.map((it, i) => (
            <View key={it.id} style={styles.pricingRow}>
              <Text style={{ color: COLORS.muted }}>
                {garmentTypeLabel(it.garmentType)}
                {order.items.length > 1 ? ` (${i + 1})` : ""}
              </Text>
              <Text>{it.itemSubtotal ? formatCurrency(Number(it.itemSubtotal)) : "—"}</Text>
            </View>
          ))}
          {order.blockFee !== null && Number(order.blockFee) > 0 && (
            <View style={styles.pricingRow}>
              <Text style={{ color: COLORS.muted }}>Block Fee</Text>
              <Text>{formatCurrency(Number(order.blockFee))}</Text>
            </View>
          )}
          {order.subtotalExVat && (
            <View style={styles.pricingTotal}>
              <Text>Subtotal ex. VAT</Text>
              <Text>{formatCurrency(Number(order.subtotalExVat))}</Text>
            </View>
          )}
        </View>

        {order.internalNotes && (
          <View>
            <Text style={styles.sectionTitle}>Notes for Tailor</Text>
            <View style={styles.noteBox}>
              <Text>{order.internalNotes}</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
