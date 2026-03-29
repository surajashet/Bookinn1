import dotenv from 'dotenv';
dotenv.config();

// Debug: Print email config to verify
console.log("📧 Server startup - EMAIL_USER:", process.env.EMAIL_USER);
console.log("📧 Server startup - EMAIL_PASS set:", !!process.env.EMAIL_PASS);

import express from "express";
import cors from "cors";

// Import all routes
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import taskRoutes from "./routes/task.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import clientRoutes from "./routes/client.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { detectIntent, getReply } from "./lib/intent.js";

dotenv.config();
import verificationRoutes from "./routes/verification.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "BookInn API is running",
    timestamp: new Date().toISOString()
  });
});
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const intent = await detectIntent(message);
    const reply = getReply(intent);

    return res.json({ reply, intent });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
});