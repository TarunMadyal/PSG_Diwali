import { describe, expect, it } from "vitest";
import { calculateCartPricing } from "./pricing";

describe("3-Item Category Combo Pricing Rules", () => {
  it("calculates 3 pants at ₹250 each as 250*2+100 = ₹600 (saves ₹150)", () => {
    const result = calculateCartPricing([
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 25000,
        quantity: 3,
      },
    ]);

    expect(result.subtotalPaise).toBe(75000); // ₹750
    expect(result.totalPaise).toBe(60000); // ₹600 (250*2 + 100)
    expect(result.discountPaise).toBe(15000); // ₹150 saved
    expect(result.combos.length).toBe(1);
    expect(result.combos[0].highestPricePaise).toBe(25000);
    expect(result.combos[0].comboPricePaise).toBe(60000);
  });

  it("calculates 2 pants at ₹250 and 1 pant at ₹300 using highest price 300*2+100 = ₹700 (saves ₹100)", () => {
    const result = calculateCartPricing([
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 25000,
        quantity: 2,
      },
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 30000,
        quantity: 1,
      },
    ]);

    expect(result.subtotalPaise).toBe(80000); // 250*2 + 300 = ₹800
    expect(result.totalPaise).toBe(70000); // 300*2 + 100 = ₹700
    expect(result.discountPaise).toBe(10000); // ₹100 saved
    expect(result.combos.length).toBe(1);
    expect(result.combos[0].highestPricePaise).toBe(30000);
  });

  it("calculates 4 pants: 3 form a combo (₹600) + 1 regular (₹250) = ₹850", () => {
    const result = calculateCartPricing([
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 25000,
        quantity: 4,
      },
    ]);

    expect(result.subtotalPaise).toBe(100000); // ₹1000
    expect(result.totalPaise).toBe(85000); // ₹850 (600 + 250)
    expect(result.discountPaise).toBe(15000);
    expect(result.nudges.length).toBe(1);
    expect(result.nudges[0].itemsNeeded).toBe(2); // needs 2 more to make 6 items (2nd combo)
  });

  it("calculates 6 pants as 2 combos: 600 + 600 = ₹1200", () => {
    const result = calculateCartPricing([
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 25000,
        quantity: 6,
      },
    ]);

    expect(result.subtotalPaise).toBe(150000); // ₹1500
    expect(result.totalPaise).toBe(120000); // ₹1200 (600*2)
    expect(result.discountPaise).toBe(30000); // ₹300 saved
    expect(result.combos.length).toBe(2);
    expect(result.nudges.length).toBe(0);
  });

  it("does NOT apply combo if 3 items are from different categories (e.g. 2 pants + 1 t-shirt)", () => {
    const result = calculateCartPricing([
      {
        categoryId: "pants-cat",
        categoryNameEn: "Pants",
        unitPricePaise: 25000,
        quantity: 2,
      },
      {
        categoryId: "tshirts-cat",
        categoryNameEn: "T-Shirts",
        unitPricePaise: 20000,
        quantity: 1,
      },
    ]);

    expect(result.subtotalPaise).toBe(70000); // 250*2 + 200 = ₹700
    expect(result.totalPaise).toBe(70000);
    expect(result.discountPaise).toBe(0);
    expect(result.combos.length).toBe(0);
    // Nudges for both categories
    expect(result.nudges.find((n) => n.categoryId === "pants-cat")?.itemsNeeded).toBe(1);
    expect(result.nudges.find((n) => n.categoryId === "tshirts-cat")?.itemsNeeded).toBe(2);
  });
});
