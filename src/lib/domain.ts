import type { OrderStatus } from "./types";

export const reservingStatuses: OrderStatus[] = ["placed", "accepted", "preparing", "ready"];

export const canTransition = (from: OrderStatus, to: OrderStatus) => {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    placed: ["accepted", "cancelled", "expired"],
    accepted: ["preparing", "cancelled", "expired"],
    preparing: ["ready", "cancelled"],
    ready: ["collected", "cancelled"],
    collected: [],
    cancelled: [],
    expired: [],
  };
  return transitions[from].includes(to);
};

export const availableStock = (onHand: number, reserved: number) => Math.max(0, onHand - reserved);
export const isProductVisible = (variants: Array<{ active: boolean; stockOnHand: number; reservedQuantity: number }>) =>
  variants.some((variant) => variant.active && availableStock(variant.stockOnHand, variant.reservedQuantity) > 0);

export const tokenForSequence = (sequence: number) => `A${String(sequence).padStart(3, "0")}`;
