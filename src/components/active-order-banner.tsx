"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Receipt, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface ActiveOrderInfo {
  trackingKey: string;
  token: string;
  customerName?: string;
  placedAt?: string;
}

export function ActiveOrderBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("psg-active-order");
      if (stored) {
        const parsed = JSON.parse(stored) as ActiveOrderInfo;
        if (parsed.placedAt) {
          const hoursAgo = (Date.now() - new Date(parsed.placedAt).getTime()) / (1000 * 60 * 60);
          if (hoursAgo > 24) {
            localStorage.removeItem("psg-active-order");
            return;
          }
        }
        window.requestAnimationFrame(() => {
          setActiveOrder(parsed);
        });
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  if (pathname.startsWith("/track/") || !activeOrder || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #64121e 0%, #8f1d2c 100%)",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "0.86rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Receipt size={18} style={{ flexShrink: 0, color: "#fcd34d" }} />
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Active Order: <strong style={{ color: "#fcd34d", letterSpacing: "0.05em" }}>TOKEN {activeOrder.token}</strong>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Link
          href={`/track/${activeOrder.trackingKey}`}
          style={{
            background: "#fff",
            color: "#64121e",
            fontWeight: 800,
            fontSize: "0.78rem",
            padding: "4px 10px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            textDecoration: "none",
          }}
        >
          View Bill <ArrowRight size={13} />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            padding: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
