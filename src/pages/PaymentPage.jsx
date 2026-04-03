import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:5000";

// Load Razorpay script dynamically
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const s = document.createElement("script");
    s.id  = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function PaymentPage({ bookingId }) {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      const token = localStorage.getItem("token");

      // 1. Create order from your backend
      const res  = await fetch(`${BASE_URL}/api/payments/razorpay/create-order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ booking_id: bookingId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { order_id, amount, currency, invoice_id, key_id, prefill } = data.data;

      // 2. Open Razorpay checkout
      const options = {
        key:      key_id,
        amount,
        currency,
        name:     "BookInn",
        description: `Booking #${bookingId}`,
        order_id,
        prefill,
        theme:    { color: "#4A7C72" },  // your teal

        handler: async (response) => {
          // 3. Verify payment on your backend
          const vRes = await fetch(`${BASE_URL}/api/payments/razorpay/verify`, {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              invoice_id,
              booking_id: bookingId,
            }),
          });
          const vData = await vRes.json();

          if (vData.success) {
            navigate(`/client/bookings/${bookingId}/invoice`); // → your BookingInvoice page
          } else {
            setError("Payment verification failed. Contact support.");
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: "red", marginBottom: 12, fontSize: 13 }}>{error}</div>
      )}
      <button onClick={handlePayment} disabled={loading} style={{
        background: "#4A7C72", color: "#fff", border: "none",
        padding: "12px 32px", borderRadius: 999, cursor: "pointer",
        fontSize: 13, letterSpacing: ".1em",
      }}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}