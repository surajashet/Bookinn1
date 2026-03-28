// FILE: src/pages/ClientBookRoom.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const fmtDate = d =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const nights = (ci, co) =>
  ci && co
    ? Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000))
    : 0;

const Toast = ({ type, msg }) => (
  <div
    style={{
      position: "fixed",
      bottom: 30,
      right: 30,
      background: "#fff",
      border: "1px solid #D6E3DF",
      borderLeft: `3px solid ${
        type === "success" ? "#5F8B6F" : "#B45C5C"
      }`,
      padding: "12px 18px",
      borderRadius: 12,
      fontSize: 13,
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      gap: 10
    }}
  >
    {msg}
  </div>
);

export default function ClientBookRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const nightCount = nights(checkIn, checkOut);
  const today = new Date().toISOString().split("T")[0];

  const minCheckout = checkIn
    ? new Date(new Date(checkIn).getTime() + 86400000)
        .toISOString()
        .split("T")[0]
    : today;

  useEffect(() => {
    if (checkOut && checkIn && checkOut <= checkIn) {
      setCheckOut("");
    }
  }, [checkIn]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ DEMO SAFE BOOK FUNCTION (NO API)
  const bookRoom = async () => {
    if (!checkIn || !checkOut) {
      showToast("error", "Please select both dates.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      showToast("success", "Room booked successfully!");
      setLoading(false);

      // redirect after short delay
      setTimeout(() => {
        navigate("/client/bookings");
      }, 1200);
    }, 800);
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #D6E3DF",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    background: "#F4F7F6"
  };

  const labelStyle = {
    fontSize: 11,
    color: "#6B6560",
    marginBottom: 6
  };

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 64px" }}>
        <div style={{ paddingTop: 56, marginBottom: 36 }}>
          <h1>
            Book Your <span style={{ color: "#4A7C72" }}>Room</span>
          </h1>
          <p style={{ color: "#A09890" }}>
            Select your dates and confirm your reservation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 24
          }}
        >
          {/* LEFT FORM */}
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Check-in</label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={e => setCheckIn(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={minCheckout}
                onChange={e => setCheckOut(e.target.value)}
                style={inputStyle}
              />
            </div>

            {nightCount > 0 && (
              <div style={{ marginBottom: 20 }}>
                {nightCount} night(s): {fmtDate(checkIn)} →{" "}
                {fmtDate(checkOut)}
              </div>
            )}

            <button
              onClick={bookRoom}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#1E1C1A",
                color: "#4A7C72",
                borderRadius: 10,
                cursor: "pointer"
              }}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>

          {/* RIGHT SUMMARY */}
          <div style={{ background: "#1E1C1A", padding: 20, borderRadius: 12, color: "#fff" }}>
            <h3>Room {id}</h3>
            <p>Check-in: {checkIn ? fmtDate(checkIn) : "--"}</p>
            <p>Check-out: {checkOut ? fmtDate(checkOut) : "--"}</p>
            <p>Duration: {nightCount > 0 ? `${nightCount} nights` : "--"}</p>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} msg={toast.msg} />}
    </>
  );
}