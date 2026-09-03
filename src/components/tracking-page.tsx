"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Download,
  MapPin,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { demoOrders, isDemoMode } from "@/lib/demo-data";
import { copy } from "@/lib/i18n";
import { money } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useApp } from "./app-providers";
import { BrandLogo } from "./brand-logo";
import { CustomerHeader } from "./customer-header";

export function TrackingPage({ trackingKey }: { trackingKey: string }) {
  const { language } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billSaved, setBillSaved] = useState(false);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
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
      if (isInitial) setError(reason instanceof Error ? reason.message : "Could not refresh order");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [trackingKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(true), 0);
    const interval = window.setInterval(() => void refresh(false), 8000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [refresh]);

  // Auto-save active order in localStorage for instant retrieval if user closes the tab
  useEffect(() => {
    if (order) {
      try {
        localStorage.setItem(
          "psg-active-order",
          JSON.stringify({
            trackingKey: order.trackingKey,
            token: order.token,
            customerName: order.customerName,
            placedAt: order.placedAt,
          }),
        );
      } catch {
        // ignore
      }
    }
  }, [order]);

  const handleSaveBill = () => {
    if (!order) return;
    try {
      // Save to localStorage saved bills list
      const savedBills = JSON.parse(localStorage.getItem("psg-saved-bills") ?? "[]");
      const exists = savedBills.some((b: Order) => b.token === order.token);
      if (!exists) {
        localStorage.setItem("psg-saved-bills", JSON.stringify([order, ...savedBills]));
      }
      setBillSaved(true);
      setTimeout(() => setBillSaved(false), 5000);
      // Trigger system print / save as PDF prompt
      window.print();
    } catch {
      setBillSaved(true);
    }
  };

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

  const safeItems = order.items ?? [];

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

          {/* Payment Status / Pickup Payment Info */}
          {order.paymentStatus === "paid" ? (
            <div
              style={{
                marginTop: 18,
                background: "linear-gradient(135deg, #edfbf3 0%, #d4f5e4 100%)",
                border: "2px solid #15803d",
                borderRadius: 16,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CheckCircle2 size={26} color="#15803d" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#15803d" }}>
                  {language === "kn" ? "ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ ✓" : "Payment Received ✓"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 600, marginTop: 2 }}>
                  {language === "kn"
                    ? "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಆರ್ಡರ್ ಕೌಂಟರ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲು ಸಿದ್ಧವಾಗಿದೆ."
                    : "Thank you! Your payment has been confirmed by the store."}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 18,
                background: "#fff9ee",
                border: "1.5px solid var(--gold)",
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💳</span>
              <div>
                <div style={{ fontSize: "0.96rem", fontWeight: 900, color: "var(--wine)" }}>
                  {language === "kn" ? "ಪಾವತಿ: ಕೌಂಟರ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ" : "Payment: Pay at Pickup Counter"}
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>
                  {language === "kn"
                    ? "ಕೌಂಟರ್‌ನಲ್ಲಿ UPI QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ನಗದು ಮೂಲಕ ಪಾವತಿಸಿ."
                    : "Pay via UPI (scan owner's QR) or cash when collecting your order."}
                </div>
              </div>
            </div>
          )}

          {/* Simplified Order Status Message */}
          <div
            style={{
              marginTop: 20,
              borderTop: "1.5px dashed #e8e2da",
              paddingTop: 18,
            }}
          >
            <div
              style={{
                background: "#edfbf3",
                border: "1.5px solid #17724c",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CheckCircle2 size={26} color="#17724c" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#17724c" }}>
                  {language === "kn" ? "ಆರ್ಡರ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!" : "Order Placed!"}
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--ink)", fontWeight: 700, marginTop: 2 }}>
                  {language === "kn"
                    ? "ದಯವಿಟ್ಟು ಕೌಂಟರ್‌ಗೆ ಬಂದು ನಿಮ್ಮ ಆರ್ಡರ್ ಪಡೆದುಕೊಳ್ಳಿ."
                    : "Please walk to the counter and collect your order."}
                </div>
              </div>
            </div>
          </div>

          {/* Actions: Save Bill & Browse Other Clothes */}
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleSaveBill}
              className="primary full"
              style={{
                minHeight: 48,
                fontSize: "0.98rem",
                fontWeight: 900,
                borderRadius: 14,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: billSaved ? "#17724c" : "var(--wine)",
                boxShadow: "0 4px 14px rgba(143,29,44,0.2)",
                transition: "all 0.2s ease",
              }}
            >
              {billSaved ? <Check size={20} /> : <Download size={20} />}
              {billSaved
                ? language === "kn"
                  ? "✓ ಬಿಲ್ ಸೇವ್ ಆಗಿದೆ!"
                  : "✓ Bill Saved to Phone!"
                : language === "kn"
                ? "💾 ಬಿಲ್ ಸೇವ್ ಮಾಡಿ"
                : "💾 Save Bill"}
            </button>

            <Link
              href="/"
              className="secondary full"
              style={{
                minHeight: 46,
                fontSize: "0.92rem",
                fontWeight: 800,
                borderRadius: 14,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ShoppingBag size={18} />
              {language === "kn" ? "ಬೇರೆ ಬಟ್ಟೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : "Browse Other Clothes"}
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
