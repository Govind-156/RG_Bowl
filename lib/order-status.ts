export type OrderStatusUi =
  | "PLACED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

const STATUS_LABELS: Record<OrderStatusUi, string> = {
  PLACED: "Order locked 🔒",
  PREPARING: "Chef is cooking magic 🍜✨",
  OUT_FOR_DELIVERY: "Delivery hero on the way 🏍️",
  DELIVERED: "Mission successful 😎",
  CANCELLED: "Cancelled",
};

export function getOrderStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatusUi] ?? status.replace(/_/g, " ");
}

