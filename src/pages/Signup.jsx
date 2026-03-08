import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ACCENT = "#4A7C72";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/client");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FDFCFB" }}>
      {/* Right Side Image (Flipped for variety) */}
      <div style={{ width: 500, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Soria', serif", fontSize: 32, color: "#1E1C1A", marginBottom: 12 }}>Create Account</h2>
          <p style={{ fontFamily: "'CabinetGrotesk', sans-serif", color: "#A09890", fontSize: 14 }}>Join our exclusive community of guests.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Full Name</label>
            <input 
              type="text" 
              required 
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Email Address</label>
            <input 
              type="email" 
              required 
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Password</label>
            <input 
              type="password" 
              required 
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" style={{ background: ACCENT, color: "#fff", padding: "16px", borderRadius: 999, border: "none", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", cursor: "pointer", marginTop: 12 }}>Join Bookinn</button>
        </form>

        <p style={{ marginTop: 32, fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 13, color: "#6B6560", textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: ACCENT, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <img src="/bg2.jpg" alt="Luxury Stay" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.2)" }} />
      </div>
    </div>
  );
}