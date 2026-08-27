"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CheckCircle2, CircleCheck, Loader2, QrCode as QrIcon, Smartphone } from "lucide-react";

interface UpiQrCodeProps {
  amountRupees: number;
  token: string;
  trackingKey?: string;
  paymentStatus?: "due" | "paid";
  onPaymentConfirmed?: () => void;
  upiId?: string;
  payeeName?: string;
}

export function UpiQrCode({
  amountRupees,
  token,
  trackingKey,
  paymentStatus = "due",
  onPaymentConfirmed,
  upiId = "8123426350@okbizaxis",
  payeeName = "Padamshree Garments",
}: UpiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const confirmed = paymentStatus === "paid" || localConfirmed;

  const formattedAmount = amountRupees.toFixed(2);

  // Build UPI URL without encoding pa/pn — many UPI apps break on encoded @
  const upiUrl = `upi://pay?pa=${upiId}&pn=${payeeName.replace(/\s/g, "+")}&am=${formattedAmount}&cu=INR&tn=Bill+${token}`;


  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#211b18", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => console.error("QR error:", err));
    return () => {
      active = false;
    };
  }, [upiUrl]);

  const handleConfirmPayment = async () => {
    if (!trackingKey || confirmed) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/track/${trackingKey}/paid`, { method: "POST" });
      if (res.ok) {
        setLocalConfirmed(true);
        onPaymentConfirmed?.();
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setConfirming(false);
    }
  };

  // Already paid — show success state
  if (confirmed) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #edfbf3 0%, #d4f5e4 100%)",
          border: "2px solid var(--green)",
          borderRadius: 18,
          padding: "24px 16px",
          textAlign: "center",
          marginTop: 18,
        }}
      >
        <CircleCheck size={48} color="var(--green)" style={{ marginBottom: 8 }} />
        <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", color: "var(--green)" }}>Payment Received ✓</h3>
        <p style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 900, color: "var(--ink)" }}>₹{formattedAmount}</p>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
          Paid via UPI · Thank you!
        </p>
      </div>
    );
  }

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

      {/* Actions */}
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

        {/* Confirm Payment Button */}
        {trackingKey && (
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={confirming}
            className="primary full"
            style={{
              minHeight: 46,
              fontSize: "0.95rem",
              background: "var(--green)",
              boxShadow: "0 4px 12px rgba(23,114,76,0.22)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
            }}
          >
            {confirming ? (
              <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Confirming…</>
            ) : (
              <><CheckCircle2 size={18} /> I have Paid via UPI</>
            )}
          </button>
        )}

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
