import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ACCENT = "#4A7C72";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate authentication
    localStorage.setItem("token", "simulated-jwt-token"); 
    // Navigate to the dashboard route defined in App.jsx
    navigate("/client/dashboard"); 
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FDFCFB" }}>
      {/* Visual Brand Side */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <img src="/bg2.jpg" alt="Luxury Interior" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.3)" }} />
        <div style={{ position: "absolute", bottom: 64, left: 64 }}>
          <h1 style={{ fontFamily: "'Brolimo', serif", color: "#fff", fontSize: 48, marginBottom: 8 }}>BOOKINN</h1>
          <p style={{ fontFamily: "'CabinetGrotesk', sans-serif", color: "rgba(255,255,255,0.8)", fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase" }}>Refined Hospitality</p>
        </div>
      </div>

      {/* Entry Side */}
      <div style={{ width: 480, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px" }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Soria', serif", fontSize: 32, color: "#1E1C1A", marginBottom: 12 }}>Welcome Back</h2>
          <p style={{ fontFamily: "'CabinetGrotesk', sans-serif", color: "#A09890", fontSize: 14 }}>Enter your credentials to access your dashboard.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Email</label>
            <input 
              type="email" 
              required 
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Password</label>
            <input 
              type="password" 
              required 
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none" }} 
            />
          </div>
          <button type="submit" style={{ background: ACCENT, color: "#fff", padding: "16px", borderRadius: 999, border: "none", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", cursor: "pointer", marginTop: 12 }}>
            Sign In
          </button>
        </form>

        <p style={{ marginTop: 32, fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 13, color: "#6B6560", textAlign: "center" }}>
          New to Bookinn? <Link to="/signup" style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}