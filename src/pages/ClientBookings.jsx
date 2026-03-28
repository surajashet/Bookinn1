// FILE: src/pages/ClientBookings.jsx
import { useState, useEffect } from "react";

const fmtDate = d =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const nights = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const Sk = ({ w = "100%", h = 14, r = 6, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background:
        "linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",
      backgroundSize: "200% 100%",
      animation: "bkShimmer 1.5s infinite",
      ...style
    }}
  />
);

const BADGE = {
  Confirmed: { bg: "#e8f4ec", c: "#3a7a52" },
  Pending: { bg: "#fdf3e0", c: "#9a6e1a" },
  Cancelled: { bg: "#fde8e8", c: "#9a3535" },
  "Checked In": { bg: "#e0f0fa", c: "#2a6080" },
  "Checked Out": { bg: "#ece9f4", c: "#5a4a80" }
};

const StatusBadge = ({ status }) => {
  const s = BADGE[status] || { bg: "#f0ede8", c: "#5a5a56" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.c,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap"
      }}
    >
      {status}
    </span>
  );
};

const FILTERS = [
  "All",
  "Confirmed",
  "Checked In",
  "Checked Out",
  "Pending",
  "Cancelled"
];

export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);

  // ✅ DEMO DATA (NO API)
  useEffect(() => {
    const dummy = [
      {
        id: 1,
        room_number: "101",
        room_type: "Deluxe",
        check_in: "2026-03-25",
        check_out: "2026-03-27",
        status: "Confirmed",
        total_amount: 4000
      },
      {
        id: 2,
        room_number: "202",
        room_type: "Suite",
        check_in: "2026-03-20",
        check_out: "2026-03-22",
        status: "Checked In",
        total_amount: 6000
      },
      {
        id: 3,
        room_number: "303",
        room_type: "Standard",
        check_in: "2026-03-10",
        check_out: "2026-03-12",
        status: "Cancelled",
        total_amount: 2000
      }
    ];

    setTimeout(() => {
      setBookings(dummy);
      setLoading(false);
    }, 800); // fake loading effect
  }, []);

  const cancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;

    setCancelling(id);

    setTimeout(() => {
      setBookings(p =>
        p.map(b => (b.id === id ? { ...b, status: "Cancelled" } : b))
      );

      setToast({ type: "success", msg: "Booking cancelled successfully." });
      setCancelling(null);

      setTimeout(() => setToast(null), 3000);
    }, 800);
  };

  const visible = bookings.filter(
    b => filter === "All" || b.status === filter
  );

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 64px" }}>
        <div style={{ paddingTop: 56, marginBottom: 36 }}>
          <div
            style={{
              fontSize: 10,
              color: "#4A7C72",
              textTransform: "uppercase",
              letterSpacing: ".22em",
              marginBottom: 12
            }}
          >
            Reservations
          </div>
          <h1 style={{ fontSize: 42 }}>
            My <span style={{ color: "#4A7C72" }}>Bookings</span>
          </h1>
          <p style={{ color: "#A09890" }}>
            View, track and manage all your reservations.
          </p>
        </div>

        {/* Filters */}
        {!loading && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {FILTERS.map(f => {
              const count =
                f === "All"
                  ? bookings.length
                  : bookings.filter(b => b.status === f).length;

              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: "1px solid",
                    background: filter === f ? "#4A7C72" : "transparent",
                    color: filter === f ? "#fff" : "#333"
                  }}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 12 }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              <Sk />
              <Sk />
              <Sk />
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              No bookings found
            </div>
          ) : (
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visible.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.room_number}</td>
                    <td>{b.room_type}</td>
                    <td>{fmtDate(b.check_in)}</td>
                    <td>{fmtDate(b.check_out)}</td>
                    <td>{nights(b.check_in, b.check_out)}</td>
                    <td>₹{b.total_amount}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      {(b.status === "Confirmed" ||
                        b.status === "Pending") && (
                        <button onClick={() => cancel(b.id)}>
                          {cancelling === b.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {toast && <Toast type={toast.type} msg={toast.msg} />}
      </div>
    </>
  );
}

const Toast = ({ type, msg }) => (
  <div
    style={{
      position: "fixed",
      bottom: 30,
      right: 30,
      background: "#fff",
      borderLeft: `3px solid ${
        type === "success" ? "#5F8B6F" : "#B45C5C"
      }`,
      padding: "10px 15px",
      borderRadius: 10
    }}
  >
    {msg}
  </div>
);