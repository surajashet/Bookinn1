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
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed:   { bg: "#e8f2ef", color: "#2d6b5e" },
      pending:     { bg: "#FFF8E7", color: "#7A5C00" },
      cancelled:   { bg: "#faeaea", color: "#8a3030" },
      checked_in:  { bg: "#e5f0ee", color: "#2d6b5e" },
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
              background: "#4A7C72", color: "white",
              padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer"
            }}
          >
            Browse Rooms
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {bookings.map(booking => {
            const nightCount = Math.ceil(
              (new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24)
            );
            const isPending   = booking.booking_status === "pending";
            const isConfirmed = booking.booking_status === "confirmed";
            const isCancelled = booking.booking_status === "cancelled";

            return (
              <div key={booking.booking_id} style={{
                background: "white", borderRadius: "12px",
                border: isPending ? "1px solid #F0D070" : "1px solid #E4DDD4",
                overflow: "hidden",
              }}>
                {/* Pending payment reminder strip */}
                {isPending && (
                  <div style={{
                    background: "#FFF8E7", borderBottom: "1px solid #F0D070",
                    padding: "8px 20px", fontSize: "13px", color: "#7A5C00",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <span>⏳ <strong>Payment pending</strong> — pay to confirm this booking</span>
                    <button
                      onClick={() => navigate(`/client/invoice/${booking.booking_id}`)}
                      style={{
                        background: "#4A7C72", color: "#fff", border: "none",
                        padding: "5px 14px", borderRadius: "6px",
                        fontSize: "12px", fontWeight: "bold", cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Pay Now →
                    </button>
                  </div>
                )}

                <div style={{
                  padding: "20px",
                  borderBottom: "1px solid #F0EBE4",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", flexWrap: "wrap", gap: "12px"
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
                    <div style={{ fontWeight: "bold" }}>{nightCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Guests</div>
                    <div style={{ fontWeight: "bold" }}>{booking.guests || 1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#A09890", marginBottom: "4px" }}>Total Amount</div>
                    <div style={{ fontWeight: "bold", color: "#4A7C72" }}>
                      ₹{booking.total_price?.toLocaleString("en-IN") || 0}
                    </div>
                  </div>
                </div>
                
                {/* Actions footer — shown for all except cancelled */}
                {!isCancelled && (
                  <div style={{
                    padding: "16px 20px", borderTop: "1px solid #F0EBE4",
                    background: "#FDFCFB",
                    display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
                  }}>
                    {/* View Invoice — always visible */}
                    <button
                      onClick={() => navigate(`/client/invoice/${booking.booking_id}`)}
                      style={{
                        background: "transparent",
                        border: "1px solid #4A7C72",
                        color: "#4A7C72",
                        padding: "8px 16px", borderRadius: "6px",
                        fontSize: "13px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                      View Invoice
                    </button>

                    {/* Pay Now — only for pending */}
                    {isPending && (
                      <button
                        onClick={() => navigate(`/client/invoice/${booking.booking_id}`)}
                        style={{
                          background: "#4A7C72", color: "white",
                          border: "none", padding: "8px 16px",
                          borderRadius: "6px", fontSize: "13px",
                          fontWeight: "bold", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        💳 Pay Now
                      </button>
                    )}

                    {/* Cancel — for pending and confirmed */}
                    {(isPending || isConfirmed) && (
                      <button
                        onClick={() => cancelBooking(booking.booking_id)}
                        disabled={cancelling === booking.booking_id}
                        style={{
                          background: "#B45C5C", color: "white",
                          border: "none", padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: cancelling === booking.booking_id ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          opacity: cancelling === booking.booking_id ? 0.6 : 1,
                        }}
                      >
                        {cancelling === booking.booking_id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>
                )}

                {/* Cancelled state footer */}
                {isCancelled && (
                  <div style={{
                    padding: "12px 20px", borderTop: "1px solid #F0EBE4",
                    background: "#FDFCFB",
                    display: "flex", alignItems: "center", gap: "12px",
                  }}>
                    <button
                      onClick={() => navigate(`/client/invoice/${booking.booking_id}`)}
                      style={{
                        background: "transparent",
                        border: "1px solid #A09890",
                        color: "#6B6560",
                        padding: "8px 16px", borderRadius: "6px",
                        fontSize: "13px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      View Invoice
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