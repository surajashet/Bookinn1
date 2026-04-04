import dotenv from 'dotenv';
dotenv.config();

// Debug: Print email config to verify
console.log("📧 Server startup - EMAIL_USER:", process.env.EMAIL_USER);
console.log("📧 Server startup - EMAIL_PASS set:", !!process.env.EMAIL_PASS);

import configRoutes from "./routes/config.routes.js";
import express from "express";
import cors from "cors";
// REMOVED: cron import - no longer needed for room status sync

// Import all routes
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import taskRoutes from "./routes/task.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import clientRoutes from "./routes/client.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
// REMOVED: syncRoomStatuses import - no longer needed

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Increase payload limit for image uploads (10MB limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/config", configRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "BookInn API is running",
    timestamp: new Date().toISOString()
  });
});

// REMOVED: runRoomStatusSync function - no longer needed
// REMOVED: setTimeout for initial sync - no longer needed
// REMOVED: cron schedule for hourly sync - no longer needed
// REMOVED: cron schedule for midnight sync - no longer needed

// Optional: Add a new health check for bookings
app.get("/api/health/bookings", async (req, res) => {
  try {
    // Simple check to verify booking system is working
    const supabase = (await import("./config/supabaseClient.js")).default;
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true });
    
    res.json({
      success: true,
      message: "Booking system is operational",
      total_bookings: count || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Booking system error",
      error: error.message
    });
  }
});

console.log("✅ Room status auto-sync disabled - availability now derived from bookings table");

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found" 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Room availability is now derived purely from bookings table`);
  console.log(`❌ No automatic status sync needed - room_status column removed`);
});