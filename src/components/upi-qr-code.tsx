"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CheckCircle2, QrCode as QrIcon, Smartphone } from "lucide-react";

interface UpiQrCodeProps {
  amountRupees: number;
  token: string;
  customerName?: string;
  upiId?: string;
  payeeName?: string;
}

export function UpiQrCode({
  amountRupees,
  token,
  upiId = "8123426350@okbizaxis",
  payeeName = "Padamshree Garments",
}: UpiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const formattedAmount = amountRupees.toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName,
  )}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Bill ${token}`)}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: "#211b18",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
      });

    return () => {
      active = false;
    };
  }, [upiUrl]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e0dcd7",
        borderRadius: 18,
        padding: "20px 16px",
        textAlign: "center",
        boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
        marginTop: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
        <QrIcon size={22} color="var(--wine)" />
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)" }}>Scan & Pay via UPI</h3>
      </div>

      <p style={{ margin: "0 0 14px", fontSize: "0.86rem", color: "var(--muted)" }}>
        Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong> to pay exact amount:
      </p>

      {/* QR Code Container */}
      <div
        style={{
          display: "inline-block",
          padding: 10,
          background: "#fff",
          borderRadius: 16,
          border: "2px solid var(--wine)",
          boxShadow: "0 4px 14px rgba(143,29,44,0.12)",
          marginBottom: 12,
        }}
      >
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt={`UPI QR Code for ₹${formattedAmount}`}
            width={200}
            height={200}
            style={{ display: "block", borderRadius: 8 }}
            priority
          />
        ) : (
          <div
            style={{
              width: 200,
              height: 200,
              display: "grid",
              placeItems: "center",
              background: "#f7f3ee",
              color: "var(--muted)",
              fontSize: "0.85rem",
            }}
          >
            Generating QR…
          </div>
        )}
      </div>

      {/* Amount & UPI Details */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--wine-dark)" }}>
          ₹{formattedAmount}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: 2 }}>
          UPI ID: <strong style={{ color: "var(--ink)" }}>{upiId}</strong>
        </div>
      </div>

      {/* Mobile Direct Pay Button */}
      <div style={{ display: "grid", gap: 10, maxWidth: 360, margin: "0 auto" }}>
        <a
          href={upiUrl}
          className="primary full"
          style={{
            minHeight: 46,
            fontSize: "0.95rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 12,
          }}
        >
          <Smartphone size={18} /> Tap to Pay in UPI App
        </a>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: "0.82rem",
            color: "var(--green)",
            fontWeight: 800,
            background: "#edfbf3",
            padding: "8px 12px",
            borderRadius: 10,
          }}
        >
          <CheckCircle2 size={16} /> Cash payment at counter is also accepted
        </div>
      </div>
    </div>
  );
}
