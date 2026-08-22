import { describe,expect,it } from "vitest";
import { availableStock,isProductVisible,tokenForSequence } from "./domain";
import { cancel,collect,createLedger,reserve } from "./inventory-model";

describe("critical inventory and token rules",()=>{
  it("prevents two orders from reserving the final unit",()=>{const ledger=createLedger(1);reserve(ledger,"request-a",1);expect(()=>reserve(ledger,"request-b",1)).toThrow("insufficient_stock");expect(ledger.variants.v1.reserved).toBe(1);});
  it("returns reservations on cancellation",()=>{const ledger=createLedger(2);const order=reserve(ledger,"request-a",2);cancel(ledger,order.id);expect(availableStock(ledger.variants.v1.onHand,ledger.variants.v1.reserved)).toBe(2);expect(ledger.variants.v1.sold).toBe(0);});
  it("converts reserved stock to sold on collection",()=>{const ledger=createLedger(2);const order=reserve(ledger,"request-a",1);collect(ledger,order.id);expect(ledger.variants.v1).toMatchObject({onHand:1,reserved:0,sold:1});});
  it("hides a product only when every active variant is unavailable",()=>{expect(isProductVisible([{active:true,stockOnHand:1,reservedQuantity:1},{active:false,stockOnHand:8,reservedQuantity:0}])).toBe(false);expect(isProductVisible([{active:true,stockOnHand:2,reservedQuantity:1}])).toBe(true);});
  it("returns the same order for a repeated idempotency key",()=>{const ledger=createLedger(5);const first=reserve(ledger,"same-key",2);const second=reserve(ledger,"same-key",2);expect(second.id).toBe(first.id);expect(ledger.variants.v1.reserved).toBe(2);});
  it("creates unique, human-readable daily tokens",()=>{const ledger=createLedger(20);const tokens=new Set(Array.from({length:10},(_,i)=>reserve(ledger,`key-${i}`,1).token));expect(tokens.size).toBe(10);expect([...tokens][0]).toBe("A001");expect(tokenForSequence(1000)).toBe("A1000");});
});
