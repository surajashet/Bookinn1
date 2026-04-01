import supabase from "../config/supabaseClient.js";
import { sendBookingConfirmation, sendBookingCancellation } from "../utils/emailService.js";

/* ── helper: auto-generate invoice after booking ── */
const createInvoiceForBooking = async (booking, room) => {
  try {
    const cgst_percent = 6;
    const sgst_percent = 6;

    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
          (1000 * 60 * 60 * 24)
      )
    );

    const base_amount  = room.base_price * nights;
    const cgst_amount  = parseFloat((base_amount * (cgst_percent / 100)).toFixed(2));
    const sgst_amount  = parseFloat((base_amount * (sgst_percent / 100)).toFixed(2));
    const total_tax    = parseFloat((cgst_amount + sgst_amount).toFixed(2));
    const total_amount = parseFloat((base_amount + total_tax).toFixed(2));

    const invoice_number = `INV-${Date.now()}-${booking.booking_id}`;

    const { data: invoice, error } = await supabase
      .from("Invoices")
      .insert([{
        booking_id:      booking.booking_id,
        user_id:         booking.user_id,
        invoice_number,
        base_amount,
        cgst_amount,
        sgst_amount,
        total_tax,
        total_amount,
        payment_state:   "paid",
        payment_methods: "online",
        invoice_data: JSON.stringify({
          nights,
          room_number:    room.room_number,
          room_type:      room.room_type,
          rate_per_night: room.base_price,
          check_in:       booking.check_in_date,
          check_out:      booking.check_out_date,
          guests:         booking.guests,
          tax_breakdown: { cgst_percent, sgst_percent },
        }),
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error("❌ Invoice creation failed:", error.message);
    } else {
      console.log("🧾 Invoice created:", invoice.invoice_number);
    }

    return invoice;
  } catch (err) {
    // Non-fatal — booking already succeeded, just log
    console.error("❌ Unexpected invoice error:", err.message);
  }
};

// ── Create a new booking ──────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      room_id,
      user_id,
      check_in_date,
      check_out_date,
      guests,
      total_price,
      booking_status = "confirmed",
    } = req.body;

    console.log("📝 Creating booking:", { room_id, user_id, check_in_date, check_out_date });

    if (!check_in_date || !check_out_date) {
      return res.status(400).json({
        success: false,
        error: "Check-in and check-out dates are required",
      });
    }

    // Fetch user
    console.log("👤 Fetching user:", user_id);
    const { data: user, error: userError } = await supabase
      .from("Users")
      .select("email, username")
      .eq("user_id", user_id)
      .single();

    if (userError) console.error("❌ Error fetching user:", userError);
    else console.log("✅ User found:", user.email);

    // Fetch room
    console.log("🏨 Checking room:", room_id);
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("room_status, base_price, room_number, room_type")
      .eq("room_id", room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    if (room.room_status !== "available") {
      return res.status(400).json({
        success: false,
        error: `Room is currently ${room.room_status}`,
      });
    }

    // Check conflicts
    console.log("🔍 Checking for conflicting bookings...");
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .or(
        `check_in_date.lte.${check_out_date},check_out_date.gte.${check_in_date}`
      );

    if (conflictError) throw conflictError;

    if (conflictingBookings && conflictingBookings.length > 0) {
      console.log("⚠️ Conflicting bookings:", conflictingBookings.length);
      return res.status(400).json({
        success: false,
        error: "Room is not available for selected dates",
      });
    }

    // Create booking
    console.log("💾 Saving booking...");
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([{
        room_id,
        user_id,
        check_in_date,
        check_out_date,
        guests:         guests || 1,
        total_price:    total_price || 0,
        booking_status,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }])
      .select(`
        *,
        rooms (*),
        Users (user_id, username, email)
      `);

    if (error) throw error;
    console.log("✅ Booking created:", booking[0].booking_id);

    // Update room → reserved
    await supabase
      .from("rooms")
      .update({ room_status: "reserved", updated_at: new Date().toISOString() })
      .eq("room_id", room_id);

    // ── Auto-generate invoice ─────────────────────────────────────────────────
    console.log("🧾 Auto-generating invoice...");
    await createInvoiceForBooking(booking[0], room);
    // ─────────────────────────────────────────────────────────────────────────

    // Send confirmation email
    if (booking[0] && user) {
      console.log("📧 Sending confirmation email to:", user.email);
      const emailResult = await sendBookingConfirmation(booking[0], user, room);
      console.log("📧 Email result:", emailResult ? "SUCCESS" : "FAILED");
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking[0],
    });
  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get bookings by user ID ───────────────────────────────────────────────────
export const getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .select(`*, rooms (*)`)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get all bookings (admin) ──────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;

    let query = supabase
      .from("bookings")
      .select(`*, rooms (*), Users (user_id, username, email)`);

    if (status)     query = query.eq("booking_status", status);
    if (start_date) query = query.gte("check_in_date", start_date);
    if (end_date)   query = query.lte("check_out_date", end_date);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Update booking status ─────────────────────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const validStatuses = ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"];
    if (!validStatuses.includes(booking_status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    const { data: currentBooking } = await supabase
      .from("bookings")
      .select("room_id, booking_status")
      .eq("booking_id", id)
      .single();

    const { data, error } = await supabase
      .from("bookings")
      .update({ booking_status, updated_at: new Date().toISOString() })
      .eq("booking_id", id)
      .select()
      .single();

    if (error) throw error;

    // Sync room status
    const roomStatusMap = {
      checked_in:  "occupied",
      checked_out: "available",
      cancelled:   "available",
      confirmed:   "reserved",
    };
    const roomStatus = roomStatusMap[booking_status];
    if (roomStatus) {
      await supabase
        .from("rooms")
        .update({ room_status: roomStatus, updated_at: new Date().toISOString() })
        .eq("room_id", currentBooking.room_id);
    }

    // If cancelled, also update invoice payment_state
    if (booking_status === "cancelled") {
      await supabase
        .from("Invoices")
        .update({ payment_state: "cancelled" })
        .eq("booking_id", id);
      console.log("🧾 Invoice marked cancelled for booking:", id);
    }

    res.json({ success: true, message: `Booking ${booking_status} successfully`, data });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Cancel booking ────────────────────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .update({ booking_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("booking_id", id)
      .select()
      .single();

    if (error) throw error;

    // Free up the room
    await supabase
      .from("rooms")
      .update({ room_status: "available", updated_at: new Date().toISOString() })
      .eq("room_id", data.room_id);

    // Mark invoice as cancelled
    await supabase
      .from("Invoices")
      .update({ payment_state: "cancelled" })
      .eq("booking_id", id);
    console.log("🧾 Invoice marked cancelled for booking:", id);

    // Send cancellation email
    try {
      const { data: user } = await supabase
        .from("Users")
        .select("email, username")
        .eq("user_id", data.user_id)
        .single();

      const { data: room } = await supabase
        .from("rooms")
        .select("room_number, room_type")
        .eq("room_id", data.room_id)
        .single();

      if (user && room) {
        console.log("📧 Sending cancellation email to:", user.email);
        await sendBookingCancellation(user, data, room);
      }
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── Check room availability ───────────────────────────────────────────────────
export const checkRoomAvailability = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({
        success: false,
        error: "Check-in and check-out dates are required",
      });
    }

    const { data: conflictingBookings, error } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .or(`check_in_date.lte.${check_out},check_out_date.gte.${check_in}`);

    if (error) throw error;

    const available = !conflictingBookings || conflictingBookings.length === 0;

    res.json({ success: true, available, room_id, check_in, check_out });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};