import type { Category, Order, Product } from "./types";

const colors = [
  ["Navy", "ಕಡು ನೀಲಿ"],
  ["Maroon", "ಕಡು ಕೆಂಪು"],
  ["Black", "ಕಪ್ಪು"],
  ["Olive", "ಆಲಿವ್ ಹಸಿರು"],
] as const;

const categorySeed = [
  ["mens-night-pants", "Men’s night pants", "ಪುರುಷರ ನೈಟ್ ಪ್ಯಾಂಟ್", "🌙"],
  ["night-tshirts", "Night T-shirts", "ನೈಟ್ ಟಿ-ಶರ್ಟ್", "👕"],
  ["half-collar", "Half-collar shirts", "ಅರ್ಧ ತೋಳಿನ ಕಾಲರ್ ಶರ್ಟ್", "🧥"],
  ["full-collar", "Full-collar shirts", "ಉದ್ದ ತೋಳಿನ ಕಾಲರ್ ಶರ್ಟ್", "👔"],
  ["kids-festive", "Kids festive wear", "ಮಕ್ಕಳ ಹಬ್ಬದ ಉಡುಪು", "✨"],
  ["dhotis", "Dhotis", "ಪಂಚೆಗಳು", "🤍"],
  ["leggings", "Leggings", "ಲೆಗ್ಗಿಂಗ್ಸ್", "🎨"],
  ["innerwear", "Innerwear", "ಒಳ ಉಡುಪು", "☁️"],
] as const;

export const demoCategories: Category[] = categorySeed.map((item, index) => ({
  id: `cat-${index + 1}`,
  slug: item[0],
  nameEn: item[1],
  nameKn: item[2],
  imageUrl: `/demo/category-${(index % 6) + 1}.svg`,
  sortOrder: index,
  active: true,
}));

const productNames = [
  ["Cotton comfort", "ಕಾಟನ್ ಕಂಫರ್ಟ್"],
  ["Festival classic", "ಹಬ್ಬದ ಕ್ಲಾಸಿಕ್"],
  ["Soft everyday", "ಮೃದುವಾದ ದಿನನಿತ್ಯದ ಉಡುಪು"],
] as const;

export const demoProducts: Product[] = demoCategories.flatMap((category, categoryIndex) =>
  productNames.slice(0, categoryIndex < 4 ? 3 : 2).map((names, productIndex) => {
    const id = `product-${categoryIndex + 1}-${productIndex + 1}`;
    return {
      id,
      categoryId: category.id,
      nameEn: names[0],
      nameKn: names[1],
      pricePaise: (349 + categoryIndex * 35 + productIndex * 80) * 100,
      imageUrl: `/demo/product-${(categoryIndex + productIndex) % 6 + 1}.svg`,
      sortOrder: productIndex,
      active: true,
      variants: ["M", "L", "XL"].flatMap((size, sizeIndex) =>
        colors.slice(productIndex, productIndex + 2).map((color, colorIndex) => ({
          id: `${id}-${size}-${colorIndex}`,
          productId: id,
          size,
          colorEn: color[0],
          colorKn: color[1],
          stockOnHand: sizeIndex === 2 && colorIndex === 1 ? 0 : 6 - sizeIndex,
          reservedQuantity: 0,
          lowStockThreshold: 2,
          active: true,
        })),
      ),
    };
  }),
);

export const demoOrders: Order[] = [
  {
    id: "demo-order-1",
    token: "A014",
    trackingKey: "demo-tracking-1",
    customerName: "Ravi",
    customerPhone: "98765 43210",
    status: "placed",
    source: "customer",
    totalPaise: 77800,
    paymentStatus: "due",
    placedAt: new Date(Date.now() - 6 * 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 54 * 60_000).toISOString(),
    items: [{ id: "oi-1", productNameEn: "Cotton comfort", productNameKn: "ಕಾಟನ್ ಕಂಫರ್ಟ್", size: "L", colorEn: "Navy", colorKn: "ಕಡು ನೀಲಿ", quantity: 2, unitPricePaise: 38900, lineTotalPaise: 77800 }],
  },
  {
    id: "demo-order-2",
    token: "A013",
    trackingKey: "demo-tracking-2",
    customerName: "Lakshmi",
    status: "preparing",
    source: "staff",
    totalPaise: 51900,
    paymentStatus: "due",
    placedAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    items: [{ id: "oi-2", productNameEn: "Festival classic", productNameKn: "ಹಬ್ಬದ ಕ್ಲಾಸಿಕ್", size: "M", colorEn: "Maroon", colorKn: "ಕಡು ಕೆಂಪು", quantity: 1, unitPricePaise: 51900, lineTotalPaise: 51900 }],
  },
  {
    id: "demo-order-3",
    token: "A012",
    trackingKey: "demo-tracking-3",
    customerName: "Manjunath",
    status: "ready",
    source: "customer",
    totalPaise: 42900,
    paymentStatus: "due",
    placedAt: new Date(Date.now() - 32 * 60_000).toISOString(),
    items: [{ id: "oi-3", productNameEn: "Soft everyday", productNameKn: "ಮೃದುವಾದ ದಿನನಿತ್ಯದ ಉಡುಪು", size: "XL", colorEn: "Black", colorKn: "ಕಪ್ಪು", quantity: 1, unitPricePaise: 42900, lineTotalPaise: 42900 }],
  },
];

export const isDemoMode = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
