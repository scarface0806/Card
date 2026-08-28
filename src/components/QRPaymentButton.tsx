"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = { existingOrderId: string };
type PaymentDetails = { orderId: string; amount: number; currency: string; qrCode: string; qrCodeId: string };

export default function QRPaymentButton({ existingOrderId }: Props) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!payment) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/payment/check-upi-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            existingOrderId,
            razorpayOrderId: payment.orderId,
            razorpayQrCodeId: payment.qrCodeId,
          }),
        });
        const result = await response.json();
        if (result.success) {
          window.clearInterval(timer);
          window.location.assign(`/order-success?orderId=${encodeURIComponent(existingOrderId)}`);
        } else {
          setMessage("Waiting for payment confirmation...");
        }
      } catch {
        setMessage("We could not check payment status. Retrying...");
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [existingOrderId, payment]);

  async function startPayment() {
    if (started.current || payment) return;
    started.current = true;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/payment/create-upi-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingOrderId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create payment QR code");
      }
      setPayment(result);
    } catch (error) {
      started.current = false;
      setMessage(error instanceof Error ? error.message : "Unable to create payment QR code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-live="polite">
      <button type="button" onClick={startPayment} disabled={loading || Boolean(payment)}>
        {loading ? "Preparing payment..." : "Pay via UPI / Google Pay / QR Code"}
      </button>
      {payment && (
        <div>
          <QRCodeCanvas value={payment.qrCode} size={280} includeMargin aria-label="UPI payment QR code" />
          <p>Scan with any UPI app like GPay, PhonePe, or Paytm</p>
          <a href={payment.qrCode} target="_blank" rel="noreferrer">Open UPI payment link</a>
          <p>{message || "Waiting for payment..."}</p>
        </div>
      )}
      {!payment && message && <p role="alert">{message}</p>}
    </section>
  );
}