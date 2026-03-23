import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ACCENT = "#4A7C72";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after signup
        const loginResponse = await fetch('http://localhost:3001/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify(loginData.user));
          navigate("/client/dashboard");
        }
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FDFCFB" }}>
      {/* Right Side Image */}
      <div style={{ width: 500, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Soria', serif", fontSize: 32, color: "#1E1C1A", marginBottom: 12 }}>Create Account</h2>
          <p style={{ fontFamily: "'CabinetGrotesk', sans-serif", color: "#A09890", fontSize: 14 }}>Join our exclusive community of guests.</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: "#fee", 
            color: "#c00", 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "20px",
            fontFamily: "'CabinetGrotesk', sans-serif",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Full Name</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={formData.email}
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Password</label>
            <input 
              type="password" 
              required 
              value={formData.password}
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none", fontFamily: "'CabinetGrotesk', sans-serif" }} 
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: loading ? '#95B6B0' : ACCENT, 
              color: "#fff", 
              padding: "16px", 
              borderRadius: 999, 
              border: "none", 
              fontFamily: "'CabinetGrotesk', sans-serif", 
              fontSize: 12, 
              letterSpacing: ".2em", 
              textTransform: "uppercase", 
              cursor: loading ? 'not-allowed' : "pointer", 
              marginTop: 12 
            }}
          >
            {loading ? "CREATING ACCOUNT..." : "JOIN BOOKINN"}
          </button>
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