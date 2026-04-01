import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:5000";

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

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  const getStatusBadge = (status) => {
    const styles = {
      confirmed:   { bg: "#e8f2ef", color: "#2d6b5e" },
      cancelled:   { bg: "#faeaea", color: "#8a3030" },
      checked_in:  { bg: "#e5f0ee", color: "#2d6b5e" },
      checked_out: { bg: "#f0eff6", color: "#4a4070" }
    };
    const s = styles[status] || { bg: "#F0EBE4", color: "#6B6560" };
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 400,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap"
      }}>
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'CabinetGrotesk', sans-serif",
        color: "#A09890",
        fontSize: 13,
        letterSpacing: ".08em"
      }}>
        Loading your bookings...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: "64px 40px",
      fontFamily: "'CabinetGrotesk', sans-serif"
    }}>

      {/* ── page heading ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontSize: 10,
          color: "#4A7C72",
          textTransform: "uppercase",
          letterSpacing: ".22em",
          fontWeight: 200,
          marginBottom: 10
        }}>
          Reservations
        </div>
        <h1 style={{
          fontFamily: "'Soria', serif",
          fontStyle: "italic",
          fontSize: "clamp(28px, 3vw, 40px)",
          fontWeight: 400,
          color: "#1E1C1A",
          lineHeight: 1,
          marginBottom: 10
        }}>
          My Bookings
        </h1>
        <p style={{ color: "#A09890", fontSize: 13, fontWeight: 200 }}>
          View and manage your reservations
        </p>
      </div>

      {/* ── empty state ── */}
      {bookings.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 40px",
          background: "#FDFCFB",
          borderRadius: 20,
          border: "1px solid #E4DDD4"
        }}>
          <div style={{
            fontFamily: "'Soria', serif",
            fontStyle: "italic",
            fontSize: 20,
            color: "#A09890",
            marginBottom: 10
          }}>
            No bookings yet
          </div>
          <p style={{ color: "#A09890", fontSize: 13, fontWeight: 200, marginBottom: 28 }}>
            Start your first booking by browsing our rooms.
          </p>
          <button
            onClick={() => navigate("/client/rooms")}
            style={{
              background: "#4A7C72",
              color: "#fff",
              padding: "12px 28px",
              border: "none",
              borderRadius: 999,
              fontFamily: "'CabinetGrotesk', sans-serif",
              fontWeight: 200,
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              cursor: "pointer"
            }}
          >
            Browse Rooms
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {bookings.map(booking => {
            const nights = Math.ceil(
              (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
              (1000 * 60 * 60 * 24)
            );
            const isConfirmed = booking.booking_status === "confirmed";

            return (
              <div
                key={booking.booking_id}
                style={{
                  background: "#FDFCFB",
                  borderRadius: 16,
                  border: "1px solid #E4DDD4",
                  overflow: "hidden"
                }}
              >
                {/* card header */}
                <div style={{
                  padding: "20px 28px",
                  borderBottom: "1px solid #F0EBE4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Soria', serif",
                      fontSize: 18,
                      color: "#1E1C1A",
                      marginBottom: 3
                    }}>
                      Room {booking.rooms?.room_number}
                    </div>
                    <div style={{ color: "#A09890", fontSize: 12, fontWeight: 200 }}>
                      {booking.rooms?.room_type} · Booking #{booking.booking_id}
                    </div>
                  </div>
                  {getStatusBadge(booking.booking_status)}
                </div>

                {/* booking details grid */}
                <div style={{
                  padding: "20px 28px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 16
                }}>
                  {[
                    ["Check-in",     formatDate(booking.check_in_date)],
                    ["Check-out",    formatDate(booking.check_out_date)],
                    ["Nights",       nights],
                    ["Guests",       booking.guests || 1],
                    ["Total Amount", `₹${(booking.total_price || 0).toLocaleString("en-IN")}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{
                        fontSize: 10,
                        color: "#A09890",
                        textTransform: "uppercase",
                        letterSpacing: ".14em",
                        fontWeight: 200,
                        marginBottom: 4
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontFamily: label === "Total Amount" ? "'Soria', serif" : "inherit",
                        fontSize: label === "Total Amount" ? 16 : 14,
                        fontWeight: label === "Total Amount" ? 400 : 200,
                        color: label === "Total Amount" ? "#4A7C72" : "#1E1C1A"
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* action bar — always visible */}
                <div style={{
                  padding: "14px 28px",
                  borderTop: "1px solid #F0EBE4",
                  background: "#F7F3EE",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap"
                }}>

                  {/* View Invoice button — shown for all bookings */}
                  <button
                    onClick={() => navigate(`/client/bookings/${booking.booking_id}/invoice`)}
                    style={{
                      background: "#4A7C72",
                      color: "#fff",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: 999,
                      fontFamily: "'CabinetGrotesk', sans-serif",
                      fontWeight: 200,
                      fontSize: 10,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    View Invoice
                  </button>

                  {/* Cancel button — only for confirmed bookings */}
                  {isConfirmed && (
                    <button
                      onClick={() => cancelBooking(booking.booking_id)}
                      disabled={cancelling === booking.booking_id}
                      style={{
                        background: "transparent",
                        color: "#B45C5C",
                        border: "1px solid #B45C5C",
                        padding: "8px 20px",
                        borderRadius: 999,
                        fontFamily: "'CabinetGrotesk', sans-serif",
                        fontWeight: 200,
                        fontSize: 10,
                        letterSpacing: ".16em",
                        textTransform: "uppercase",
                        cursor: cancelling === booking.booking_id ? "not-allowed" : "pointer",
                        opacity: cancelling === booking.booking_id ? 0.6 : 1
                      }}
                    >
                      {cancelling === booking.booking_id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}