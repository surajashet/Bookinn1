import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const nights = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const INR = (n) =>
  Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const T = {
  parchment: "#F7F3EE", parchmentDark: "#EDE7DE", parchmentMid: "#E4DDD4",
  ink: "#1E1C1A", inkLight: "#6B6560", inkFaint: "#A09890",
  teal: "#4A7C72", tealLight: "#6A9E94", tealBg: "#EBF3F1",
  confirmed: { bg: "#e8f2ef", c: "#2d6b5e" },
  pending:   { bg: "#FFF8E7", c: "#7A5C00", border: "#F0D070" },
  cancelled: { bg: "#faeaea", c: "#8a3030" },
};

export default function BookingInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchInvoiceData(); }, [id]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const bookingsRes = await fetch(`${BASE_URL}/api/bookings/user/${user.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        const found = bookingsData.data.find((b) => String(b.booking_id) === String(id));
        if (found) {
          setBooking(found);
          try {
            const invoiceRes = await fetch(`${BASE_URL}/api/invoices/booking/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const invoiceData = await invoiceRes.json();
            if (invoiceData.success) setInvoice(invoiceData.data);
          } catch (_) {}
        } else {
          setError("Booking not found.");
        }
      } else {
        setError("Failed to load booking.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    setPayError("");
    try {
      const token = localStorage.getItem("token");
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPayError("Razorpay failed to load.");
        setPaying(false);
        return;
      }
      const orderRes = await fetch(`${BASE_URL}/api/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: booking.booking_id })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        setPayError(orderData.error || "Failed to create payment order");
        setPaying(false);
        return;
      }
      const { order_id, amount, currency, invoice_id, key_id, prefill } = orderData.data;

      const options = {
        key: key_id,
        amount,
        currency,
        name: "BookInn",
        description: `Room ${booking.rooms?.room_number} · ${nights(booking.check_in_date, booking.check_out_date)} night(s)`,
        order_id,
        prefill,
        theme: { color: "#4A7C72" },
        // Separated UPI and Netbanking into distinct blocks
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              banks: { name: "Pay via Netbanking", instruments: [{ method: "netbanking" }] },
              cards: { name: "Pay via Cards", instruments: [{ method: "card" }] },
            },
            sequence: ["block.upi", "block.banks", "block.cards"],
            preferences: { show_default_blocks: true },
          },
        },
        // Disable saved cards — fixes "saved card fails but new card works" bug
        save: 0,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BASE_URL}/api/payments/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                invoice_id,
                booking_id: booking.booking_id,
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await fetchInvoiceData();
            } else {
              setPayError("Payment verification failed. Please contact support.");
              setPaying(false);
            }
          } catch (err) {
            setPayError("Verification error. Please contact support.");
            setPaying(false);
          }
        },
        modal: {
          backdropclose: false,
          ondismiss: () => {
            setPayError("Payment cancelled. You can pay anytime from this page.");
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setPayError(`Payment failed: ${resp.error.description}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setPayError("Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/bookings/${booking.booking_id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) navigate("/client/bookings");
      else alert(data.error || "Failed to cancel booking.");
    } catch (err) {
      alert("Error cancelling booking.");
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Invoice #${booking.booking_id} — BookInn</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { background:#fff; font-family: Georgia, serif; }</style>
      </head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.parchment, color: T.inkFaint, fontSize: 13 }}>
      Loading invoice...
    </div>
  );

  if (error || !booking) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.parchment, gap: 16 }}>
      <div style={{ fontStyle: "italic", fontSize: 22, color: T.ink }}>{error || "Booking not found"}</div>
      <button onClick={() => navigate("/client/bookings")} style={{ background: T.teal, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 999, cursor: "pointer" }}>
        Back to Bookings
      </button>
    </div>
  );

  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const guestName   = user.username || user.name || "Guest";
  const guestEmail  = user.email || "—";
  const roomNumber  = booking.rooms?.room_number || "—";
  const roomType    = booking.rooms?.room_type || "—";
  const n           = nights(booking.check_in_date, booking.check_out_date);
  const roomCharge  = Number(booking.total_price) || 0;
  const ratePerNight = n > 0 ? roomCharge / n : roomCharge;
  const taxes       = Math.round(roomCharge * 0.12);
  const serviceFee  = 150;
  const total       = roomCharge + taxes + serviceFee;

  const isPending   = booking.booking_status === "pending";
  const isConfirmed = booking.booking_status === "confirmed";
  const isCancelled = booking.booking_status === "cancelled";

  const StatusBadge = ({ status }) => {
    const map = {
      confirmed:   { bg: T.confirmed.bg, c: T.confirmed.c },
      pending:     { bg: T.pending.bg,   c: T.pending.c   },
      cancelled:   { bg: T.cancelled.bg, c: T.cancelled.c },
      checked_in:  { bg: T.confirmed.bg, c: T.confirmed.c },
      checked_out: { bg: "#f0eff6",      c: "#4a4070"     },
    };
    const s = map[status] || { bg: "#F0EBE4", c: "#6B6560" };
    return (
      <div style={{ display: "inline-flex", background: s.bg, color: s.c, padding: "4px 14px", borderRadius: 999, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase" }}>
        {status.replace("_", " ")}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: T.parchment, display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px" }}>

      {/* PENDING BANNER */}
      {isPending && (
        <div style={{ width: "100%", maxWidth: 760, marginBottom: 24, background: T.pending.bg, border: `1px solid ${T.pending.border}`, borderRadius: 16, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: 28 }}>⏳</span>
            <div>
              <div style={{ fontWeight: "bold", color: T.pending.c, fontSize: 16, marginBottom: 4 }}>Payment Pending</div>
              <div style={{ fontSize: 13, color: "#7A5C00", lineHeight: 1.5 }}>
                Your booking is reserved but <strong>not yet confirmed</strong>. Complete payment to lock in your stay.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {payError && <div style={{ fontSize: 12, color: "#c00", alignSelf: "center", maxWidth: 200 }}>{payError}</div>}
            <button onClick={handleCancel} disabled={cancelling} style={{ background: "transparent", border: "1px solid #B45C5C", color: "#B45C5C", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: cancelling ? "not-allowed" : "pointer", opacity: cancelling ? 0.6 : 1 }}>
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </button>
            <button onClick={handlePayNow} disabled={paying} style={{ background: T.teal, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: "bold", cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              {paying ? <>⏳ Opening Payment...</> : <>💳 Pay Now to Confirm</>}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMED BANNER */}
      {isConfirmed && (
        <div style={{ width: "100%", maxWidth: 760, marginBottom: 24, background: T.confirmed.bg, border: `1px solid #B8D8D2`, borderRadius: 16, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.confirmed.c }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <span style={{ fontSize: 14, fontWeight: "bold" }}>Booking Confirmed & Paid</span>
          </div>
          <button onClick={handleCancel} disabled={cancelling} style={{ background: "transparent", border: "1px solid #B45C5C", color: "#B45C5C", padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: cancelling ? "not-allowed" : "pointer", opacity: cancelling ? 0.6 : 1 }}>
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ width: "100%", maxWidth: 760, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <button onClick={() => navigate("/client/bookings")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: T.inkFaint, fontWeight: 200, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Bookings
          </button>
          <div style={{ fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 4 }}>BookInn · Refined Hospitality</div>
          <div style={{ fontStyle: "italic", fontSize: 28, color: T.ink, lineHeight: 1 }}>Invoice</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {isPending && (
            <button onClick={handlePayNow} disabled={paying} style={{ background: T.teal, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 999, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1 }}>
              {paying ? "Opening..." : "Pay Now"}
            </button>
          )}
          <button onClick={handlePrint} style={{ background: "transparent", border: `1px solid ${T.parchmentMid}`, color: T.inkLight, padding: "9px 22px", borderRadius: 999, fontWeight: 200, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* INVOICE CARD */}
      <div ref={printRef} style={{ width: "100%", maxWidth: 760, background: "#FDFCFB", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 48px rgba(30,28,26,0.07)" }}>

        {/* dark header */}
        <div style={{ background: T.ink, padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".3em", fontWeight: 200, marginBottom: 10 }}>Refined Hospitality</div>
            <div style={{ fontStyle: "italic", fontSize: 34, color: "#fff", lineHeight: 1, marginBottom: 4 }}>BookInn</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 200, letterSpacing: ".08em", marginTop: 8 }}>bookinn.admin@gmail.com · +91 1234567890</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 8 }}>Invoice</div>
            <div style={{ fontStyle: "italic", fontSize: 28, color: "#A8CEC8", lineHeight: 1, marginBottom: 8 }}>#{String(booking.booking_id).padStart(4, "0")}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 200, letterSpacing: ".06em" }}>Issued {fmtShort(booking.created_at)}</div>
            <div style={{ marginTop: 14 }}><StatusBadge status={booking.booking_status} /></div>
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${T.teal}, ${T.tealLight}, ${T.parchmentMid})` }} />

        {/* billed to + stay details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${T.parchmentDark}` }}>
          <div style={{ padding: "36px 48px", borderRight: `1px solid ${T.parchmentDark}` }}>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 16 }}>Billed To</div>
            <div style={{ fontStyle: "italic", fontSize: 20, color: T.ink, marginBottom: 8, lineHeight: 1.2 }}>{guestName}</div>
            <div style={{ fontSize: 12, color: T.inkLight, fontWeight: 200, lineHeight: 1.8 }}>{guestEmail}</div>
          </div>
          <div style={{ padding: "36px 48px" }}>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 16 }}>Stay Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 0" }}>
              {[["Room", `${roomNumber} · ${roomType}`], ["Guests", `${booking.guests} persons`], ["Check-in", fmtShort(booking.check_in_date)], ["Check-out", fmtShort(booking.check_out_date)]].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: T.inkFaint, textTransform: "uppercase", letterSpacing: ".14em", fontWeight: 200, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontStyle: "italic", fontSize: 15, color: T.ink }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* line items */}
        <div style={{ padding: "40px 48px" }}>
          <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 24 }}>Charges</div>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "10px 0", borderBottom: `1px solid ${T.parchmentDark}`, marginBottom: 4 }}>
            {["Description", "Rate", "Qty", "Amount"].map((h, i) => (
              <div key={h} style={{ fontSize: 9, color: T.inkFaint, textTransform: "uppercase", letterSpacing: ".14em", fontWeight: 200, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
            ))}
          </div>
          {[
            { desc: `Room ${roomNumber} — ${roomType}`, sub: `${fmtShort(booking.check_in_date)} → ${fmtShort(booking.check_out_date)}`, rate: INR(ratePerNight), qty: `${n} night${n > 1 ? "s" : ""}`, amount: INR(roomCharge) },
            { desc: "GST & Taxes",  sub: "12% on room charge",        rate: "12%", qty: "—", amount: INR(taxes) },
            { desc: "Service Fee",  sub: "Platform & amenity charge", rate: "—",   qty: "—", amount: INR(serviceFee) },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "18px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.parchmentMid}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontStyle: "italic", fontSize: 15, color: T.ink, marginBottom: 3 }}>{row.desc}</div>
                <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 200 }}>{row.sub}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: T.inkLight, fontWeight: 200 }}>{row.rate}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: T.inkLight, fontWeight: 200 }}>{row.qty}</div>
              <div style={{ textAlign: "right", fontStyle: "italic", fontSize: 15, color: T.ink }}>{row.amount}</div>
            </div>
          ))}
        </div>

        {/* total */}
        <div style={{ margin: "0 48px 48px", background: T.tealBg, borderRadius: 16, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 6 }}>Total {isPending ? "Due" : "Paid"}</div>
            <div style={{ fontSize: 11, color: T.teal, fontWeight: 200, letterSpacing: ".06em" }}>Room charge + taxes + service fee</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontStyle: "italic", fontSize: 36, color: T.teal, lineHeight: 1 }}>{INR(total)}</div>
            {isPending && <div style={{ fontSize: 11, color: T.pending.c, marginTop: 8, fontWeight: "bold" }}>⚠️ Payment required to confirm</div>}
          </div>
        </div>

        {/* Pay CTA inside invoice — pending only */}
        {isPending && (
          <div style={{ margin: "0 48px 40px" }}>
            {payError && <div style={{ background: "#fee", color: "#c00", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{payError}</div>}
            <button onClick={handlePayNow} disabled={paying} style={{ width: "100%", padding: "16px", background: paying ? "#95B6B0" : T.teal, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: "bold", cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              {paying ? "Opening Payment Gateway..." : `Pay ${INR(total)} to Confirm Booking`}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: T.inkFaint, marginTop: 10 }}>Secured by Razorpay · UPI, Cards & Netbanking accepted</p>
          </div>
        )}

        <div style={{ height: 1, background: T.parchmentDark, margin: "0 48px" }} />

        {/* policies + payment status */}
        <div style={{ padding: "36px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 14 }}>Important Information</div>
            {[["Check-in", "2:00 PM"], ["Check-out", "11:00 AM"], ["Cancellation", "Free up to 24 hrs before"], ["Support", "+91 1234567890"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.parchmentMid}`, fontSize: 12 }}>
                <span style={{ color: T.inkFaint, fontWeight: 200 }}>{k}</span>
                <span style={{ color: T.ink, fontWeight: 200 }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 14 }}>Payment</div>
            <div style={{ background: T.parchmentDark, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, marginBottom: 4 }}>Method</div>
                <div style={{ fontSize: 13, color: T.ink, fontWeight: 200 }}>{isConfirmed ? "Paid Online" : isPending ? "Awaiting Payment" : "—"}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.tealBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isConfirmed
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C09020" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              </div>
            </div>
            <div style={{ background: T.parchmentDark, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 200, color: isConfirmed ? T.confirmed.c : isPending ? T.pending.c : T.cancelled.c }}>
                  {isConfirmed ? "Confirmed & Paid" : isPending ? "Pending Payment" : "Cancelled"}
                </div>
              </div>
              <div style={{ fontSize: 9, background: isConfirmed ? T.confirmed.bg : isPending ? T.pending.bg : T.cancelled.bg, color: isConfirmed ? T.confirmed.c : isPending ? T.pending.c : T.cancelled.c, padding: "3px 10px", borderRadius: 999, letterSpacing: ".1em", textTransform: "uppercase" }}>
                {isConfirmed ? "Cleared" : isPending ? "Pending" : "Void"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: T.parchmentDark, padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontStyle: "italic", fontSize: 16, color: T.inkLight }}>BookInn</div>
          <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, letterSpacing: ".08em" }}>© 2026 BookInn. All rights reserved.</div>
          <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, fontFamily: "monospace" }}>-{String(booking.booking_id).padStart(4, "0")}-{new Date(booking.created_at).getFullYear()}</div>
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center", fontStyle: "italic", fontSize: 14, color: T.inkFaint }}>
        {isConfirmed ? `We look forward to welcoming you, ${guestName.split(" ")[0]}.` : isPending ? "Complete your payment to secure your reservation." : "We hope to see you again soon."}
      </div>
    </div>
  );
}