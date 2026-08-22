export type Language = "en" | "kn";
export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "collected"
  | "cancelled"
  | "expired";

export type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameKn: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};

export type Variant = {
  id: string;
  productId: string;
  size: string;
  colorEn: string;
  colorKn: string;
  stockOnHand: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  active: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  nameEn: string;
  nameKn: string;
  pricePaise: number;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  variants: Variant[];
};

export type CartLine = {
  lineId: string;
  productId: string;
  variantId: string;
  nameEn: string;
  nameKn: string;
  imageUrl: string;
  size: string;
  colorEn: string;
  colorKn: string;
  unitPricePaise: number;
  quantity: number;
};

export type OrderItem = {
  id: string;
  productNameEn: string;
  productNameKn: string;
  size: string;
  colorEn: string;
  colorKn: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export type Order = {
  id: string;
  token: string;
  trackingKey: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  source: "customer" | "staff";
  totalPaise: number;
  paymentStatus: "due" | "paid";
  placedAt: string;
  expiresAt?: string;
  items: OrderItem[];
};
