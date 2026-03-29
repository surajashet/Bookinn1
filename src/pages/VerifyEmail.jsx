import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = "http://localhost:5000";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const email = new URLSearchParams(location.search).get("email");

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/verify/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Email verified successfully! Logging you in...");
        
        // Auto-login with stored password from signup
        const storedPassword = localStorage.getItem("tempPassword");
        
        if (storedPassword) {
          const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: storedPassword })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            // Store user data and token
            localStorage.setItem("token", loginData.token);
            localStorage.setItem("user", JSON.stringify(loginData.user));
            
            // Clear temp password
            localStorage.removeItem("tempPassword");
            
            toast.success("Login successful! Redirecting to dashboard...");
            
            // Redirect based on user role
            setTimeout(() => {
              if (loginData.user.role === 'admin') {
                navigate("/admin/dashboard");
              } else {
                navigate("/client/dashboard");
              }
            }, 1000);
            return;
          } else {
            toast.error("Auto-login failed. Please login manually.");
          }
        } else {
          toast.info("Please login manually.");
        }
        
        // If auto-login fails, redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Verification failed");
        toast.error(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Connection error");
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/verify/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (data.success) {
        setMessage("New verification code sent!");
        toast.success("New verification code sent!");
        setResendDisabled(true);
        setTimer(60);
        const interval = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || "Failed to send code");
        toast.error(data.message || "Failed to send code");
      }
    } catch (err) {
      setError("Connection error");
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "450px", 
      margin: "100px auto", 
      padding: "30px", 
      textAlign: "center", 
      background: "white", 
      borderRadius: "16px", 
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)" 
    }}>
      <Toaster position="top-center" />
      
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ color: "#4A7C72", marginBottom: "10px" }}>Verify Your Email</h1>
        <p style={{ color: "#6B6560" }}>We've sent a verification code to</p>
        <p style={{ fontWeight: "bold", color: "#1E1C1A" }}>{email}</p>
      </div>
      
      {message && (
        <div style={{ 
          background: "#e8f2ef", 
          color: "#2d6b5e", 
          padding: "12px", 
          borderRadius: "8px", 
          margin: "15px 0" 
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: "#fee", 
          color: "#c00", 
          padding: "12px", 
          borderRadius: "8px", 
          margin: "15px 0" 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "20px",
            textAlign: "center",
            letterSpacing: "6px",
            borderRadius: "8px",
            border: "1px solid #E4DDD4",
            marginBottom: "20px",
            fontFamily: "monospace"
          }}
        />
        <button
          type="submit"
          disabled={loading || !otp}
          style={{
            width: "100%",
            padding: "12px",
            background: loading || !otp ? "#95B6B0" : "#4A7C72",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading || !otp ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>
      
      <button
        onClick={handleResendOTP}
        disabled={resendDisabled}
        style={{
          marginTop: "20px",
          background: "none",
          border: "none",
          color: resendDisabled ? "#95B6B0" : "#4A7C72",
          cursor: resendDisabled ? "not-allowed" : "pointer",
          textDecoration: "underline",
          fontSize: "14px"
        }}
      >
        {resendDisabled ? `Resend code in ${timer}s` : "Resend Code"}
      </button>
      
      <button
        onClick={() => navigate("/login")}
        style={{
          marginTop: "10px",
          background: "none",
          border: "none",
          color: "#4A7C72",
          cursor: "pointer",
          textDecoration: "underline",
          fontSize: "14px",
          display: "block",
          width: "100%",
          textAlign: "center"
        }}
      >
        Back to Login
      </button>
      
      <p style={{ marginTop: "20px", fontSize: "12px", color: "#6B6560" }}>
        Didn't receive the email? Check your spam folder.
      </p>
    </div>
  );
}