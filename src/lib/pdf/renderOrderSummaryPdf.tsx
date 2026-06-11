import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { OrderSummaryDocument } from "./OrderSummaryDocument";
import type { Customer, OrderForm, OrderItem } from "@prisma/client";
import type { ReactElement } from "react";

type OrderWithDetails = OrderForm & {
  customer: Pick<Customer, "firstName" | "lastName">;
  items: OrderItem[];
};

export async function renderOrderSummaryPdf(order: OrderWithDetails): Promise<Buffer> {
  return renderToBuffer(<OrderSummaryDocument order={order} /> as ReactElement<DocumentProps>);
}
