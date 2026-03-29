import jwt from "jsonwebtoken";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Access token required" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false,
      message: "Admin access required" 
    });
  }
  next();
};

export const authorizeStaff = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "staff") {
    return res.status(403).json({ 
      success: false,
      message: "Staff access required" 
    });
  }
  next();
};