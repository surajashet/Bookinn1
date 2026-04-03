import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:5000";

/* ── helpers ── */
const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const nights = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const INR = (n) =>
  Number(n).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

/* ── colour tokens ── */
const T = {
  parchment:    "#F7F3EE",
  parchmentDark:"#EDE7DE",
  parchmentMid: "#E4DDD4",
  ink:          "#1E1C1A",
  inkLight:     "#6B6560",
  inkFaint:     "#A09890",
  teal:         "#4A7C72",
  tealLight:    "#6A9E94",
  tealBg:       "#EBF3F1",
  confirmed:    { bg: "#e8f2ef", c: "#2d6b5e" },
};

export default function BookingInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const user  = JSON.parse(localStorage.getItem("user") || "{}");

        const res  = await fetch(`${BASE_URL}/api/bookings/user/${user.user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          const found = data.data.find(
            (b) => String(b.booking_id) === String(id)
          );
          if (found) {
            setBooking(found);
          } else {
            setError("Booking not found.");
          }
        } else {
          setError("Failed to load booking.");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Invoice #${booking.booking_id} — BookInn</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            body { background:#fff; font-family: Georgia, serif; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: T.parchment, fontFamily: "'CabinetGrotesk', sans-serif",
        color: T.inkFaint, fontSize: 13, letterSpacing: ".08em",
      }}>
        Loading invoice...
      </div>
    );
  }

  /* ── error ── */
  if (error || !booking) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: T.parchment, fontFamily: "'CabinetGrotesk', sans-serif", gap: 16,
      }}>
        <div style={{ fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 22, color: T.ink }}>
          {error || "Booking not found"}
        </div>
        <button
          onClick={() => navigate("/client/bookings")}
          style={{
            background: T.teal, color: "#fff", border: "none",
            padding: "10px 24px", borderRadius: 999,
            fontFamily: "'CabinetGrotesk', sans-serif",
            fontWeight: 200, fontSize: 11, letterSpacing: ".18em",
            textTransform: "uppercase", cursor: "pointer",
          }}
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  /* ── derive values ── */
  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const guestName   = user.name || user.username || "Guest";
  const guestEmail  = user.email || "—";
  const roomNumber  = booking.rooms?.room_number || "—";
  const roomType    = booking.rooms?.room_type   || "—";
  const n           = nights(booking.check_in_date, booking.check_out_date);
  const roomCharge  = Number(booking.total_price) || 0;
  const ratePerNight= roomCharge / n;
  const taxes       = Math.round(roomCharge * 0.12);
  const serviceFee  = 150;
  const total       = roomCharge + taxes + serviceFee;

  return (
    <div style={{
      minHeight: "100vh", background: T.parchment,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "64px 24px", fontFamily: "'CabinetGrotesk', sans-serif",
    }}>

      {/* top bar */}
      <div style={{
        width: "100%", maxWidth: 760,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 32,
      }}>
        <div>
          <button
            onClick={() => navigate("/client/bookings")}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              color: T.inkFaint, fontFamily: "'CabinetGrotesk', sans-serif",
              fontWeight: 200, fontSize: 11, letterSpacing: ".14em",
              textTransform: "uppercase", marginBottom: 10, padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div style={{ fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 4 }}>
            BookInn · Refined Hospitality
          </div>
          <div style={{ fontFamily: "'Soria', serif", fontSize: 28, fontStyle: "italic", color: T.ink, lineHeight: 1 }}>
            Invoice
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handlePrint} style={{
            background: "transparent", border: `1px solid ${T.parchmentMid}`,
            color: T.inkLight, padding: "9px 22px", borderRadius: 999,
            fontFamily: "'CabinetGrotesk', sans-serif", fontWeight: 200, fontSize: 10,
            letterSpacing: ".18em", textTransform: "uppercase", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* invoice card */}
      <div ref={printRef} style={{
        width: "100%", maxWidth: 760,
        background: "#FDFCFB", borderRadius: 24,
        overflow: "hidden", boxShadow: "0 4px 48px rgba(30,28,26,0.07)",
      }}>

        {/* dark header */}
        <div style={{
          background: T.ink, padding: "40px 48px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".3em", fontWeight: 200, marginBottom: 10 }}>
              Refined Hospitality
            </div>
            <div style={{ fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 34, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
              BookInn
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 200, letterSpacing: ".08em", marginTop: 8 }}>
              bookinn.admin@gmail.com · +91 1234567890
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 8 }}>
              Invoice
            </div>
            <div style={{ fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 28, color: "#A8CEC8", lineHeight: 1, marginBottom: 8 }}>
              #{String(booking.booking_id).padStart(4, "0")}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 200, letterSpacing: ".06em" }}>
              Issued {fmtShort(booking.created_at)}
            </div>
            <div style={{
              marginTop: 14, display: "inline-flex",
              background: T.confirmed.bg, color: T.confirmed.c,
              padding: "4px 14px", borderRadius: 999,
              fontSize: 9, fontWeight: 400, letterSpacing: ".12em", textTransform: "uppercase",
            }}>
              {booking.booking_status}
            </div>
          </div>
        </div>

        {/* teal stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${T.teal}, ${T.tealLight}, ${T.parchmentMid})` }} />

        {/* billed to + stay details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${T.parchmentDark}` }}>
          <div style={{ padding: "36px 48px", borderRight: `1px solid ${T.parchmentDark}` }}>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 16 }}>Billed To</div>
            <div style={{ fontFamily: "'Soria', serif", fontSize: 20, color: T.ink, marginBottom: 8, lineHeight: 1.2 }}>{guestName}</div>
            <div style={{ fontSize: 12, color: T.inkLight, fontWeight: 200, lineHeight: 1.8 }}>{guestEmail}</div>
          </div>
          <div style={{ padding: "36px 48px" }}>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 16 }}>Stay Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 0" }}>
              {[
                ["Room",      `${roomNumber} · ${roomType}`],
                ["Guests",    `${booking.guests} persons`],
                ["Check-in",   fmtShort(booking.check_in_date)],
                ["Check-out",  fmtShort(booking.check_out_date)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: T.inkFaint, textTransform: "uppercase", letterSpacing: ".14em", fontWeight: 200, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: "'Soria', serif", fontSize: 15, color: T.ink }}>{value}</div>
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
            { desc: "GST & Taxes",   sub: "12% on room charge",       rate: "12%", qty: "—", amount: INR(taxes) },
            { desc: "Service Fee",   sub: "Platform & amenity charge", rate: "—",  qty: "—", amount: INR(serviceFee) },
          ].map((row, i, arr) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "18px 0",
              borderBottom: i < arr.length - 1 ? `1px solid ${T.parchmentMid}` : "none",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontFamily: "'Soria', serif", fontSize: 15, color: T.ink, marginBottom: 3 }}>{row.desc}</div>
                <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 200 }}>{row.sub}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: T.inkLight, fontWeight: 200 }}>{row.rate}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: T.inkLight, fontWeight: 200 }}>{row.qty}</div>
              <div style={{ textAlign: "right", fontFamily: "'Soria', serif", fontSize: 15, color: T.ink }}>{row.amount}</div>
            </div>
          ))}
        </div>

        {/* total */}
        <div style={{ margin: "0 48px 48px", background: T.tealBg, borderRadius: 16, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 6 }}>Total Due</div>
            <div style={{ fontSize: 11, color: T.teal, fontWeight: 200, letterSpacing: ".06em" }}>Room charge + taxes + service fee</div>
          </div>
          <div style={{ fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 36, color: T.teal, lineHeight: 1 }}>{INR(total)}</div>
        </div>

        <div style={{ height: 1, background: T.parchmentDark, margin: "0 48px" }} />

        {/* policies + payment */}
        <div style={{ padding: "36px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: ".22em", fontWeight: 200, marginBottom: 14 }}>Important Information</div>
            {[
              ["Check-in",     "2:00 PM"],
              ["Check-out",    "11:00 AM"],
              ["Cancellation", "Free up to 24 hrs before"],
              ["Support",      "+91 1234567890"],
            ].map(([k, v]) => (
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
                <div style={{ fontSize: 13, color: T.ink, fontWeight: 200 }}>Paid Online</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.tealBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <div style={{ background: T.parchmentDark, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 13, color: T.confirmed.c, fontWeight: 200 }}>Confirmed & Paid</div>
              </div>
              <div style={{ fontSize: 9, background: T.confirmed.bg, color: T.confirmed.c, padding: "3px 10px", borderRadius: 999, letterSpacing: ".1em", textTransform: "uppercase" }}>
                Cleared
              </div>
            </div>
          </div>
        </div>

        {/* footer strip */}
        <div style={{ background: T.parchmentDark, padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 16, color: T.inkLight }}>BookInn</div>
          <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, letterSpacing: ".08em" }}>© 2026 BookInn. All rights reserved.</div>
          <div style={{ fontSize: 10, color: T.inkFaint, fontWeight: 200, fontFamily: "monospace" }}>
            -{String(booking.booking_id).padStart(4, "0")}-{new Date(booking.created_at).getFullYear()}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center", fontFamily: "'Soria', serif", fontStyle: "italic", fontSize: 14, color: T.inkFaint }}>
        We look forward to welcoming you, {guestName.split(" ")[0]}.
      </div>
    </div>
  );
}