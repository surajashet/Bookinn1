import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    // No token - set a guest user so it doesn't crash
    req.user = { id: null, role: "guest" };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { id: null, role: "guest" };
    next();
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

export const authorizeStaff = (req, res, next) => {
  if (!["admin", "staff"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Staff access required" });
  }
  next();
};