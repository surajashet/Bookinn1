// Simple auth middleware (placeholder for now)
export const authenticateToken = (req, res, next) => {
  // For now, just pass through
  // You can add JWT verification here later
  next();
};

export const authorizeAdmin = (req, res, next) => {
  // For now, just pass through
  next();
};

export const authorizeStaff = (req, res, next) => {
  // For now, just pass through
  next();
};
