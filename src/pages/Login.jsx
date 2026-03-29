import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const ACCENT = "#4A7C72";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'customer') {
        navigate('/client/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast.success("Login successful!");
        
        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === 'admin') {
            navigate("/admin/dashboard");
          } else if (data.user.role === 'staff') {
            navigate("/staff/dashboard");
          } else {
            navigate("/client/dashboard");
          }
        }, 500);
      } else {
        // Check if verification is required
        if (data.requiresVerification) {
          setError(data.message);
          toast.error(data.message);
          setTimeout(() => {
            navigate(`/verify?email=${formData.email}`);
          }, 1500);
        } else {
          setError(data.message || "Login failed");
          toast.error(data.message || "Login failed");
        }
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FDFCFB" }}>
      <Toaster position="top-center" />
      
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

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8, color: ACCENT }}>Email</label>
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
              style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid #E4DDD4", outline: "none" }} 
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
              fontSize: 11, 
              letterSpacing: ".2em", 
              textTransform: "uppercase", 
              cursor: loading ? 'not-allowed' : "pointer", 
              marginTop: 12 
            }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p style={{ marginTop: 32, fontFamily: "'CabinetGrotesk', sans-serif", fontSize: 13, color: "#6B6560", textAlign: "center" }}>
          New to Bookinn? <Link to="/signup" style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}