export type PricingItem = {
  productId?: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameKn?: string;
  unitPricePaise: number;
  quantity: number;
};

export type AppliedCombo = {
  categoryId: string;
  categoryNameEn: string;
  categoryNameKn?: string;
  highestPricePaise: number;
  comboPricePaise: number;
  regularPricePaise: number;
  savedPaise: number;
};

export type ComboNudge = {
  categoryId: string;
  categoryNameEn: string;
  categoryNameKn?: string;
  currentCount: number;
  itemsNeeded: number;
};

export type PricingResult = {
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  combos: AppliedCombo[];
  nudges: ComboNudge[];
};

/**
 * 3-Item Category Combo Pricing Rule:
 * - When a customer buys 3 items of the SAME category:
 *   Price for the 3-piece combo = (highest_unit_price * 2) + ₹100 (in paise: 10000 paise).
 * - Mixed categories are NOT allowed in the same combo.
 * - If 4 items are in a category: 3 form a combo and the 4th is charged at regular price.
 * - If 6 items are in a category: 2 separate 3-item combos are formed.
 */
export function calculateCartPricing(items: PricingItem[]): PricingResult {
  let subtotalPaise = 0;
  let discountPaise = 0;
  const combos: AppliedCombo[] = [];
  const nudges: ComboNudge[] = [];

  // Group items by categoryId (items without categoryId are charged individually)
  const categoryGroups = new Map<
    string,
    {
      nameEn: string;
      nameKn?: string;
      unitPrices: number[];
    }
  >();

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const lineTotal = item.unitPricePaise * item.quantity;
    subtotalPaise += lineTotal;

    const catKey = item.categoryId || "__uncategorized__";
    if (!categoryGroups.has(catKey)) {
      categoryGroups.set(catKey, {
        nameEn: item.categoryNameEn || "Items",
        nameKn: item.categoryNameKn,
        unitPrices: [],
      });
    }

    const group = categoryGroups.get(catKey)!;
    for (let i = 0; i < item.quantity; i++) {
      group.unitPrices.push(item.unitPricePaise);
    }
  }

  // Calculate combos per category
  for (const [catKey, group] of categoryGroups.entries()) {
    if (catKey === "__uncategorized__") continue;

    // Sort descending: highest price first
    group.unitPrices.sort((a, b) => b - a);

    const prices = [...group.unitPrices];
    while (prices.length >= 3) {
      // Pick top 3 prices
      const p0 = prices.shift()!;
      const p1 = prices.shift()!;
      const p2 = prices.shift()!;

      const regularTrioPaise = p0 + p1 + p2;
      // Formula: (highest_price * 2) + ₹100
      const comboTrioPaise = p0 * 2 + 10000;

      // Only apply if it actually saves money
      if (comboTrioPaise < regularTrioPaise) {
        const saved = regularTrioPaise - comboTrioPaise;
        discountPaise += saved;
        combos.push({
          categoryId: catKey,
          categoryNameEn: group.nameEn,
          categoryNameKn: group.nameKn,
          highestPricePaise: p0,
          comboPricePaise: comboTrioPaise,
          regularPricePaise: regularTrioPaise,
          savedPaise: saved,
        });
      }
    }

    // Check for nudge: if remaining items is 1 or 2
    if (prices.length > 0 && prices.length < 3) {
      nudges.push({
        categoryId: catKey,
        categoryNameEn: group.nameEn,
        categoryNameKn: group.nameKn,
        currentCount: prices.length,
        itemsNeeded: 3 - prices.length,
      });
    }
  }

  const totalPaise = Math.max(0, subtotalPaise - discountPaise);

  return {
    subtotalPaise,
    discountPaise,
    totalPaise,
    combos,
    nudges,
  };
}
