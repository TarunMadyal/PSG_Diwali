export type PricingItem = {
  productId?: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameKn?: string;
  unitPricePaise: number;
  quantity: number;
};

export type AppliedCombo = {
  highestPricePaise: number;
  comboPricePaise: number;
  regularPricePaise: number;
  savedPaise: number;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameKn?: string;
};

export type ComboNudge = {
  currentCount: number;
  itemsNeeded: number;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameKn?: string;
};

export type PricingResult = {
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  combos: AppliedCombo[];
  nudges: ComboNudge[];
};

/**
 * Universal 3-Item Combo Pricing Rule:
 * - When a customer buys any 3 items (across all products/categories):
 *   Price for the 3-piece combo = (highest_unit_price * 2) + ₹100 (in paise: 10000 paise).
 * - If 4 items are bought: 3 form a combo and the 4th is charged at regular price.
 * - If 6 items are bought: 2 separate 3-item combos are formed.
 */
export function calculateCartPricing(items: PricingItem[]): PricingResult {
  let subtotalPaise = 0;
  let discountPaise = 0;
  const combos: AppliedCombo[] = [];
  const nudges: ComboNudge[] = [];

  const allPrices: number[] = [];

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const lineTotal = item.unitPricePaise * item.quantity;
    subtotalPaise += lineTotal;

    for (let i = 0; i < item.quantity; i++) {
      allPrices.push(item.unitPricePaise);
    }
  }

  // Sort descending: highest unit prices first
  allPrices.sort((a, b) => b - a);

  const prices = [...allPrices];
  while (prices.length >= 3) {
    const p0 = prices.shift()!;
    const p1 = prices.shift()!;
    const p2 = prices.shift()!;

    const regularTrioPaise = p0 + p1 + p2;
    // Formula: (highest_price * 2) + ₹100
    const comboTrioPaise = p0 * 2 + 10000;

    // Apply if it saves money
    if (comboTrioPaise < regularTrioPaise) {
      const saved = regularTrioPaise - comboTrioPaise;
      discountPaise += saved;
      combos.push({
        highestPricePaise: p0,
        comboPricePaise: comboTrioPaise,
        regularPricePaise: regularTrioPaise,
        savedPaise: saved,
      });
    }
  }

  // Nudge if 1 or 2 items remain towards next 3-item combo
  if (prices.length > 0 && prices.length < 3) {
    nudges.push({
      currentCount: prices.length,
      itemsNeeded: 3 - prices.length,
    });
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
