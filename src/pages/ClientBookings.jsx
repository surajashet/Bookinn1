<<<<<<< HEAD
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
=======
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3001";

export default function ClientBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`${BASE_URL}/api/bookings/user/${user.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancelling(bookingId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert("Booking cancelled successfully!");
        fetchBookings();
      } else {
        alert(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Error cancelling booking");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: "#e8f2ef", color: "#2d6b5e" },
      cancelled: { bg: "#faeaea", color: "#8a3030" },
      checked_in: { bg: "#e5f0ee", color: "#2d6b5e" },
      checked_out: { bg: "#f0eff6", color: "#4a4070" }
    };
    const s = styles[status] || { bg: "#F0EBE4", color: "#6B6560" };
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px"
      }}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading your bookings...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>My Bookings</h1>
      <p style={{ color: "#6B6560", marginBottom: "32px" }}>View and manage your reservations</p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
          <h3>No bookings yet</h3>
          <p style={{ color: "#6B6560", marginBottom: "24px" }}>Start your first booking by browsing our rooms.</p>
          <button
            onClick={() => navigate("/client/rooms")}
            style={{
              background: "#4A7C72",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Browse Rooms
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {bookings.map(booking => {
            const nights = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={booking.booking_id} style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #E4DDD4",
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "20px",
                  borderBottom: "1px solid #F0EBE4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div>
                    <h3 style={{ fontSize: "18px" }}>Room {booking.rooms?.room_number}</h3>
                    <p style={{ color: "#6B6560", fontSize: "14px" }}>{booking.rooms?.room_type}</p>
                  </div>
                  {getStatusBadge(booking.booking_status)}
                </div>
                
                <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Check-in</div>
                    <div style={{ fontWeight: "bold" }}>{formatDate(booking.check_in_date)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Check-out</div>
                    <div style={{ fontWeight: "bold" }}>{formatDate(booking.check_out_date)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Nights</div>
                    <div style={{ fontWeight: "bold" }}>{nights}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Guests</div>
                    <div style={{ fontWeight: "bold" }}>{booking.guests || 1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Total Amount</div>
                    <div style={{ fontWeight: "bold", color: "#4A7C72" }}>₹{booking.total_price?.toLocaleString("en-IN") || 0}</div>
                  </div>
                </div>
                
                {booking.booking_status === "confirmed" && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #F0EBE4", background: "#FDFCFB" }}>
                    <button
                      onClick={() => cancelBooking(booking.booking_id)}
                      disabled={cancelling === booking.booking_id}
                      style={{
                        background: "#B45C5C",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: cancelling === booking.booking_id ? "not-allowed" : "pointer"
                      }}
                    >
                      {cancelling === booking.booking_id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
>>>>>>> 6ca6f8f40a27d59ae1dd8034235927a168bb88ec
