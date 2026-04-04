import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Load Razorpay script dynamically
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

export default function ClientBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    check_in_date: "",
    check_out_date: "",
    guests: 1
  });
  const [priceDetails, setPriceDetails] = useState({
    nights: 0,
    totalPrice: 0,
    pricePerNight: 0
  });
  const [available, setAvailable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roomId = new URLSearchParams(location.search).get("room");

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    } else {
      setError("No room selected");
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (room && booking.check_in_date && booking.check_out_date) {
      calculatePrice();
      checkAvailability();
    }
  }, [room, booking.check_in_date, booking.check_out_date]);

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRoom(data.data);
      } else {
        setError("Room not found");
      }
    } catch (err) {
      console.error("Error fetching room:", err);
      setError("Error fetching room details");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.base_price;
    setPriceDetails({
      nights,
      totalPrice,
      pricePerNight: room.base_price
    });
  };

  const checkAvailability = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/bookings/availability/${roomId}?check_in=${booking.check_in_date}&check_out=${booking.check_out_date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setAvailable(data.available);
      if (!data.available) {
        setError(data.reason || "Room not available for selected dates");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Error checking availability:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!available) {
      setError("Room is not available for selected dates");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      // ── STEP 1: Load Razorpay SDK ──────────────────────────────────────────
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Razorpay failed to load. Check your internet connection.");
        setSubmitting(false);
        return;
      }

      // ── STEP 2: Create booking with status "pending" ───────────────────────
      const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id:        parseInt(roomId),
          user_id:        user.user_id,
          check_in_date:  booking.check_in_date,
          check_out_date: booking.check_out_date,
          guests:         booking.guests,
          total_price:    priceDetails.totalPrice,
          booking_status: "pending",            // ← pending until paid
        })
      });

      const bookingData = await bookingRes.json();
      if (!bookingData.success) {
        setError(bookingData.error || "Booking creation failed");
        setSubmitting(false);
        return;
      }

      const booking_id = bookingData.data.booking_id;

      // ── STEP 3: Create Razorpay order + pending Invoice on backend ─────────
      const orderRes = await fetch(`${BASE_URL}/api/payments/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id })
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setError(orderData.error || "Failed to create payment order");
        setSubmitting(false);
        return;
      }

      const { order_id, amount, currency, invoice_id, key_id, prefill } = orderData.data;

      // Calculate total with taxes for display
      const totalWithTax = priceDetails.totalPrice + Math.round(priceDetails.totalPrice * 0.12) + 150;

      // ── STEP 4: Open Razorpay checkout ─────────────────────────────────────
      const options = {
        key:         key_id,
        amount,
        currency,
        name:        "BookInn",
        description: `Room ${room.room_number} · ${priceDetails.nights} night${priceDetails.nights > 1 ? "s" : ""}`,
        order_id,
        prefill,
        theme:       { color: "#4A7C72" },

        handler: async (response) => {
          // ── STEP 5: Verify payment on backend → saves to DB + sends email ──
          try {
            const verifyRes = await fetch(`${BASE_URL}/api/payments/razorpay/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                invoice_id,
                booking_id,
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // ── STEP 6: Go to invoice page ─────────────────────────────────
              navigate(`/client/invoice/${booking_id}`);
            } else {
              setError("Payment verification failed. Please contact support.");
              setSubmitting(false);
            }
          } catch (err) {
            console.error("Verify error:", err);
            setError("Verification error. Please contact support.");
            setSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            // User closed Razorpay modal without paying
            setError("Payment was cancelled. Your booking is held for 10 minutes.");
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setSubmitting(false);
      });

      rzp.open();

    } catch (err) {
      console.error("Booking/payment error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading room details...
      </div>
    );
  }

  if (error && !room) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  const totalWithTax = priceDetails.totalPrice + Math.round(priceDetails.totalPrice * 0.12) + 150;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          marginBottom: "20px", fontSize: "14px", color: "#4A7C72"
        }}
      >
        ← Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* Left Column - Room Details */}
        <div>
          <div style={{
            height: "300px",
            background: room?.image_url
              ? `url(${room.image_url}) center/cover`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px", marginBottom: "20px", backgroundSize: "cover"
          }}>
            {!room?.image_url && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "64px" }}>
                🏨
              </div>
            )}
          </div>
          <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Room {room?.room_number}</h1>
          <p style={{ color: "#6B6560", marginBottom: "16px" }}>{room?.room_type} • Floor {room?.floor_number}</p>
          <p style={{ marginBottom: "8px" }}>👥 Capacity: {room?.capacity} guests</p>
          <p style={{ marginBottom: "8px" }}>💰 ₹{room?.base_price}/night</p>
          {room?.description && (
            <p style={{ color: "#6B6560", marginTop: "16px" }}>{room.description}</p>
          )}
        </div>

        {/* Right Column - Booking Form */}
        <div style={{ background: "white", padding: "30px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
          <h2 style={{ marginBottom: "24px" }}>Book This Room</h2>

          {error && (
            <div style={{
              background: "#fee", color: "#c00", padding: "12px",
              borderRadius: "8px", marginBottom: "20px"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Check-in Date *</label>
              <input
                type="date" required min={today}
                value={booking.check_in_date}
                onChange={(e) => setBooking({ ...booking, check_in_date: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E4DDD4" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Check-out Date *</label>
              <input
                type="date" required min={booking.check_in_date || today}
                value={booking.check_out_date}
                onChange={(e) => setBooking({ ...booking, check_out_date: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E4DDD4" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Number of Guests *</label>
              <input
                type="number" min="1" max={room?.capacity || 4} required
                value={booking.guests}
                onChange={(e) => setBooking({ ...booking, guests: parseInt(e.target.value) })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E4DDD4" }}
              />
            </div>

            {priceDetails.nights > 0 && available !== null && (
              <div style={{
                background: "#FDFCFB", padding: "16px", borderRadius: "12px",
                marginBottom: "24px", border: "1px solid #E4DDD4"
              }}>
                <h3 style={{ marginBottom: "12px" }}>Price Breakdown</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>₹{priceDetails.pricePerNight} × {priceDetails.nights} night{priceDetails.nights !== 1 ? "s" : ""}</span>
                  <span>₹{priceDetails.totalPrice}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#6B6560", fontSize: "13px" }}>GST (12%) + Service fee</span>
                  <span style={{ color: "#6B6560", fontSize: "13px" }}>
                    ₹{Math.round(priceDetails.totalPrice * 0.12 + 150)}
                  </span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", fontWeight: "bold",
                  borderTop: "1px solid #E4DDD4", paddingTop: "8px", marginTop: "8px"
                }}>
                  <span>Total Payable</span>
                  <span style={{ color: "#4A7C72", fontSize: "20px" }}>
                    ₹{totalWithTax.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {available === false && (
              <div style={{
                background: "#fee", color: "#c00", padding: "12px",
                borderRadius: "8px", marginBottom: "20px", textAlign: "center"
              }}>
                ❌ Room not available for selected dates
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !available || !booking.check_in_date || !booking.check_out_date}
              style={{
                width: "100%", padding: "14px",
                background: (!available || !booking.check_in_date || !booking.check_out_date) ? "#95B6B0" : "#4A7C72",
                color: "white", border: "none", borderRadius: "8px",
                fontSize: "16px", fontWeight: "bold",
                cursor: (!available || !booking.check_in_date || !booking.check_out_date) ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? "Opening Payment..." : "Confirm & Pay"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}