import jwt from "jsonwebtoken";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("🔐 Auth Middleware Debug:");
  console.log("   - Auth header:", authHeader ? `${authHeader.substring(0, 30)}...` : "MISSING");
  console.log("   - Token present:", !!token);

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ 
      success: false,
      message: "Access token required" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    console.log("✅ Auth successful - User:", { id: decoded.id, role: decoded.role });
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res.status(403).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  console.log("🔐 Admin check - User role:", req.user?.role);
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false,
      message: "Admin access required" 
    });
  }
  next();
};

export const authorizeStaff = (req, res, next) => {
  console.log("🔐 Staff check - User role:", req.user?.role);
  if (req.user.role !== "admin" && req.user.role !== "staff") {
    return res.status(403).json({ 
      success: false,
      message: "Staff access required" 
    });
  }
  next();
};