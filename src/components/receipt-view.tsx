"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { demoOrders, isDemoMode } from "@/lib/demo-data";
import { money } from "@/lib/format";
import type { Order } from "@/lib/types";
import { BrandLogo } from "./brand-logo";
import { UpiQrCode } from "./upi-qr-code";

export function ReceiptView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isDemoMode()) {
        const local = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[];
        setOrder([...local, ...demoOrders].find((o) => o.id === orderId) ?? null);
      } else {
        fetch("/api/owner/orders")
          .then((r) => r.json())
          .then((orders: Order[]) => setOrder(orders.find((o) => o.id === orderId) ?? null))
          .catch(() => {});
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [orderId]);

  if (!order) return <main className="empty-state">Loading receipt…</main>;

  const amountRupees = order.totalPaise / 100;

  return (
    <>
      <div className="no-print" style={{ padding: 16, textAlign: "center", display: "flex", gap: 10, justifyContent: "center" }}>
        <Link className="secondary" href="/owner" style={{ padding: "8px 16px", borderRadius: 10 }}>
          ← Back to Dashboard
        </Link>
        <button className="primary" onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      <main className="receipt">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <BrandLogo priority />
        </div>
        <h2 style={{ textAlign: "center", margin: "4px 0 2px", fontSize: "16px", fontWeight: 900 }}>
          PADAMSHREE GARMENTS
        </h2>
        <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: "11px", color: "#555" }}>
          MG ROAD Haveri - 581110
        </p>

        <div style={{ textAlign: "center", borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "6px 0", margin: "8px 0" }}>
          <div style={{ fontSize: "11px", fontWeight: 900 }}>TOKEN NUMBER</div>
          <div style={{ fontSize: "28px", fontWeight: 1000, letterSpacing: "2px" }}>{order.token}</div>
        </div>

        <div className="receipt-line">
          <span>Customer:</span>
          <strong>{order.customerName}</strong>
        </div>
        {order.customerPhone && (
          <div className="receipt-line">
            <span>Phone:</span>
            <span>{order.customerPhone}</span>
          </div>
        )}
        <div className="receipt-line">
          <span>Time:</span>
          <span>{new Date(order.placedAt).toLocaleString("en-IN")}</span>
        </div>

        <div style={{ borderTop: "1px dashed #888", marginTop: 8, paddingTop: 6 }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ padding: "6px 0", borderBottom: "1px dashed #ddd" }}>
              <div style={{ fontWeight: 800, fontSize: "12px" }}>{item.productNameEn}</div>
              <div style={{ fontSize: "11px", color: "#666" }}>Size: {item.size}</div>
              <div className="receipt-line" style={{ fontSize: "11px", marginTop: 2 }}>
                <span>{item.quantity} × {money(item.unitPricePaise)}</span>
                <strong>{money(item.lineTotalPaise)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-line" style={{ fontSize: 16, marginTop: 10, borderTop: "2px solid #000", paddingTop: 6 }}>
          <strong>TOTAL DUE:</strong>
          <strong>{money(order.totalPaise)}</strong>
        </div>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <UpiQrCode amountRupees={amountRupees} token={order.token} customerName={order.customerName} />
        </div>

        <p style={{ textAlign: "center", fontWeight: 800, fontSize: "11px", margin: "12px 0 2px" }}>
          PAYMENT DUE AT COLLECTION / UPI
        </p>
        <p style={{ textAlign: "center", fontSize: 10, margin: 0, color: "#666" }}>
          Thank you for shopping at Padamshree Garments!
        </p>
      </main>
    </>
  );
}
