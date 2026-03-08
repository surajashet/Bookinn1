import dotenv from "dotenv";
dotenv.config();   // ✅ MUST be first

import express from "express";
import cors from "cors";

import roomRoutes from "./routes/room.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

// 🔎 Temporary debug line (remove later)
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("Hotel CRM API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});