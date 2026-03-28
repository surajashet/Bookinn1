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