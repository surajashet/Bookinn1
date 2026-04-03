import dotenv from 'dotenv';
dotenv.config();

console.log("📧 Server startup - EMAIL_USER:", process.env.EMAIL_USER);
console.log("📧 Server startup - EMAIL_PASS set:", !!process.env.EMAIL_PASS);

import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import taskRoutes from "./routes/task.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import clientRoutes from "./routes/client.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import { detectIntent, getReply } from "./lib/intent.js";
import supabase from "./config/supabaseClient.js"; // ← ADD THIS

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/verify", verificationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "BookInn API is running", timestamp: new Date().toISOString() });
});

// ── GET user info for chatbot greeting ───────────────────────────────────────
app.get("/api/chat/userinfo/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from("Users")
      .select("username, email")
      .eq("user_id", userId)
      .single();

    if (error || !data) return res.status(404).json({ success: false });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── POST chat ─────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId } = req.body; // ← now accepts userId
    if (!message) return res.status(400).json({ error: "Message is required" });

    let userContext = "";

    if (userId) {
      // Fetch user's name
      const { data: user } = await supabase
        .from("Users")
        .select("username, email")
        .eq("user_id", userId)
        .single();

      // Fetch their last 5 bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          booking_id, check_in_date, check_out_date,
          booking_status, guests,
          rooms (room_number, room_type)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (user) {
        userContext = `The user's name is ${user.username}. `;
      }

      if (bookings && bookings.length > 0) {
        const summary = bookings.map(b =>
          `Booking #${b.booking_id}: Room ${b.rooms?.room_number} (${b.rooms?.room_type}), ` +
          `Check-in: ${b.check_in_date}, Check-out: ${b.check_out_date}, ` +
          `Status: ${b.booking_status}, Guests: ${b.guests}`
        ).join(" | ");
        userContext += `Their recent bookings: ${summary}.`;
      } else {
        userContext += "They have no bookings yet.";
      }
    }

    const intent = await detectIntent(message, userContext); // ← passes context
    const reply = getReply(intent, userContext);             // ← passes context

    return res.json({ reply, intent });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});