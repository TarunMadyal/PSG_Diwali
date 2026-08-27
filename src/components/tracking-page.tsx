"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { demoOrders, isDemoMode } from "@/lib/demo-data";
import { copy } from "@/lib/i18n";
import { money, statusLabel } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { useApp } from "./app-providers";
import { BrandLogo } from "./brand-logo";
import { CustomerHeader } from "./customer-header";
import { UpiQrCode } from "./upi-qr-code";

const path: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "collected"];

export function TrackingPage({ trackingKey }: { trackingKey: string }) {
  const { language } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isDemoMode()) {
        const stored = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[];
        setOrder([...stored, ...demoOrders].find((item) => item.trackingKey === trackingKey) ?? null);
      } else {
        const response = await fetch(`/api/orders/track/${trackingKey}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Order not found");
        setOrder(await response.json());
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not refresh order");
    } finally {
      setLoading(false);
    }
  }, [trackingKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [refresh]);

  if (!order && !loading) {
    return (
      <div className="customer-shell">
        <CustomerHeader />
        <main className="main">
          <div className="empty-state">
            <h1>{error || "Order not found"}</h1>
            <Link className="primary" href="/" style={{ marginTop: 14, display: "inline-block" }}>
              Return to Shop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="customer-shell">
        <CustomerHeader />
        <main className="main">
          <div className="empty-state">Loading your bill & order…</div>
        </main>
      </div>
    );
  }

  const current = path.indexOf(order.status);
  const exceptional = order.status === "cancelled" || order.status === "expired";
  const amountRupees = order.totalPaise / 100;

  const safeItems = order.items ?? [];
  const itemsText = safeItems
    .map((i) => `• ${i.productNameEn} (Size: ${i.size}) x ${i.quantity} = ₹${(i.lineTotalPaise / 100).toFixed(0)}`)
    .join("%0A");
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `*PADAMSHREE GARMENTS - ORDER BILL*\n📍 MG ROAD Haveri - 581110\n\n🧾 Token / Bill #: *${order.token}*\n👤 Customer Name: *${order.customerName}*${order.customerPhone ? `\n📞 Phone: ${order.customerPhone}` : ""}\n\n👗 *Items Ordered:*\n`,
  )}${itemsText}${encodeURIComponent(`\n\n💰 *Total Amount: ₹${amountRupees.toFixed(0)}*\n\nStatus: ${statusLabel[order.status].en}\n(Pay via UPI QR or Cash at counter)`) }`;

  return (
    <div className="customer-shell">
      <CustomerHeader />

      <main className="main" style={{ maxWidth: 640, margin: "0 auto", padding: "16px" }}>
        {/* Printable & Screen Bill Container */}
        <div
          className="success-card"
          style={{
            textAlign: "left",
            padding: "24px 20px",
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #e0dcd7",
            boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Shop Bill Header */}
          <div style={{ textAlign: "center", borderBottom: "2px dashed #ded9d4", paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <BrandLogo priority compact />
            </div>
            <h1 style={{ margin: "4px 0 2px", fontSize: "1.4rem", fontWeight: 900, color: "var(--ink)", letterSpacing: "0.02em" }}>
              PADAMSHREE GARMENTS
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700 }}>
              <MapPin size={14} color="var(--wine)" /> MG ROAD Haveri - 581110
            </div>
          </div>

          {/* Token & Order Metadata Box */}
          <div
            style={{
              background: "#fff9ee",
              border: "2px solid var(--gold)",
              borderRadius: 16,
              padding: "14px",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--wine)", letterSpacing: "0.1em" }}>
              YOUR PICKUP TOKEN
            </div>
            <div
              style={{
                fontSize: "2.4rem",
                fontWeight: 1000,
                color: "var(--wine)",
                letterSpacing: "0.08em",
                margin: "4px 0",
              }}
            >
              {order.token}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 700 }}>
              Show this token number at the shop counter
            </div>
          </div>

          {/* Customer & Date Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.88rem", marginBottom: 16, background: "#fbf9f6", padding: 12, borderRadius: 12 }}>
            <div>
              <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem", fontWeight: 800 }}>CUSTOMER NAME</span>
              <strong style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{order.customerName}</strong>
              {order.customerPhone && (
                <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={12} /> {order.customerPhone}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem", fontWeight: 800 }}>DATE & TIME</span>
              <span style={{ fontWeight: 800, color: "var(--ink)" }}>{new Date(order.placedAt).toLocaleDateString("en-IN")}</span>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                {new Date(order.placedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Itemized Bill Table */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "var(--ink)", fontWeight: 900 }}>Items on Bill:</h3>
            <table className="detail-table" style={{ width: "100%" }}>
              <thead>
                <tr style={{ background: "#f7f3ee" }}>
                  <th style={{ padding: "8px 10px", borderRadius: "8px 0 0 8px", fontSize: "0.8rem" }}>Item & Size</th>
                  <th style={{ padding: "8px 6px", textAlign: "center", fontSize: "0.8rem" }}>Qty</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderRadius: "0 8px 8px 0", fontSize: "0.8rem" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {safeItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "10px 8px" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--ink)" }}>{item.productNameEn}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--wine)", fontWeight: 800 }}>
                        Size: {item.size}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 800 }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", fontWeight: 900 }}>{money(item.lineTotalPaise)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--ink)" }}>
                  <th colSpan={2} style={{ padding: "12px 8px", fontSize: "1.05rem", fontWeight: 900 }}>
                    TOTAL AMOUNT DUE
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "right", fontSize: "1.25rem", fontWeight: 1000, color: "var(--wine)" }}>
                    {money(order.totalPaise)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Dynamic UPI QR Code Section */}
          <UpiQrCode amountRupees={amountRupees} token={order.token} customerName={order.customerName} />

          {/* Order Status Progress Tracker */}
          <div style={{ marginTop: 22, borderTop: "1px solid #e8e2da", paddingTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--ink)" }}>Order Status</h3>
              <span className={`status-pill ${order.status}`}>{statusLabel[order.status][language]}</span>
            </div>

            <div className="status-steps" style={{ margin: "10px 0" }}>
              {exceptional ? (
                <div className="status-step current">
                  <span className="status-dot">!</span>
                  <strong>{statusLabel[order.status][language]}</strong>
                </div>
              ) : (
                path.map((status, index) => (
                  <div
                    className={`status-step ${index < current ? "done" : index === current ? "current" : ""}`}
                    key={status}
                  >
                    <span className="status-dot">{index <= current ? <Check size={16} /> : index + 1}</span>
                    <div>
                      <strong>{statusLabel[status][language]}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions: WhatsApp Share, Print Bill, Refresh */}
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary full"
              style={{
                minHeight: 48,
                background: "#25d366",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 12,
                fontSize: "0.95rem",
              }}
            >
              <Share2 size={18} /> Send / Share Bill on WhatsApp
            </a>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => window.print()}
                style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.88rem" }}
              >
                <Printer size={16} /> Print Bill
              </button>

              <button
                type="button"
                className="secondary"
                onClick={refresh}
                disabled={loading}
                style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.88rem" }}
              >
                <RefreshCw size={16} /> Refresh Status
              </button>
            </div>

            <Link
              href="/"
              className="secondary full"
              style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.88rem", marginTop: 4 }}
            >
              <ShoppingBag size={16} /> Browse More Clothes
            </Link>
          </div>

          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.78rem", marginTop: 14, marginBottom: 0 }}>
            {copy[language].keepOpen}
          </p>
        </div>
      </main>
    </div>
  );
}
