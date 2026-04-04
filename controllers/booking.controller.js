import supabase from "../config/supabaseClient.js";
import { sendBookingCancellation } from "../utils/emailService.js";
// sendBookingConfirmation removed — will be called from payment.controller.js after payment verification

// ── Create a new booking (pending until payment) ─────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      room_id,
      user_id,
      check_in_date,
      check_out_date,
      guests,
      total_price,
      booking_status = "pending",   // "pending" until Razorpay payment verified
    } = req.body;

    console.log("📝 Creating booking:", { room_id, user_id, check_in_date, check_out_date });

    if (!check_in_date || !check_out_date) {
      return res.status(400).json({
        success: false,
        error: "Check-in and check-out dates are required",
      });
    }

    // Fetch room details (NO room_status check!)
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("base_price, room_number, room_type")
      .eq("room_id", room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    // ✅ Check for conflicting bookings using reliable .filter() method
    console.log("🔍 Checking for conflicting bookings...");
    console.log(`Checking dates: ${check_in_date} to ${check_out_date}`);
    
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from("bookings")
      .select("booking_id, booking_status, check_in_date, check_out_date")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .filter("check_in_date", "lt", check_out_date)
      .filter("check_out_date", "gt", check_in_date);

    if (conflictError) throw conflictError;

    if (conflictingBookings && conflictingBookings.length > 0) {
      console.log("⚠️ Conflicting bookings found:", conflictingBookings.length);
      conflictingBookings.forEach(b => {
        console.log(`  - Booking ${b.booking_id}: ${b.check_in_date} to ${b.check_out_date} (${b.booking_status})`);
      });
      return res.status(400).json({
        success: false,
        error: "Room is not available for selected dates",
        conflictingBookings: conflictingBookings.map(b => ({
          id: b.booking_id,
          check_in: b.check_in_date,
          check_out: b.check_out_date,
          status: b.booking_status
        }))
      });
    }

    // Create booking as PENDING — no invoice, no email, no room status change yet
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([{
        room_id,
        user_id,
        check_in_date,
        check_out_date,
        guests: guests || 1,
        total_price: total_price || 0,
        booking_status,             // "pending" until payment verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select(`*, rooms(*), Users(user_id, username, email)`)
      .single();

    if (error) throw error;

    console.log("✅ Booking created as pending:", booking.booking_id);
    // ↑ No invoice creation here
    // ↑ No email here
    // ↑ No room status change here
    // All three happen in payment.controller.js after payment verification

    res.status(201).json({
      success: true,
      message: "Booking created. Proceed to payment.",
      data: booking,
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
      .select(`*, rooms(*)`)
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
      .select(`*, rooms(*), Users(user_id, username, email)`);

    if (status) query = query.eq("booking_status", status);
    if (start_date) query = query.gte("check_in_date", start_date);
    if (end_date) query = query.lte("check_out_date", end_date);

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

    const validStatuses = ["confirmed", "checked_in", "checked_out", "cancelled", "no_show", "pending"];
    if (!validStatuses.includes(booking_status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    // Get current booking before update
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

    // REMOVED: Room status update logic - no longer needed
    // Room availability is now derived purely from bookings table

    // If cancelled, mark invoice as cancelled too
    if (booking_status === "cancelled") {
      await supabase
        .from("Invoices")
        .update({ payment_state: "cancelled" })
        .eq("booking_id", id);
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

    // REMOVED: Room status update - no longer needed

    // Mark invoice as cancelled if it exists
    await supabase
      .from("Invoices")
      .update({ payment_state: "cancelled" })
      .eq("booking_id", id);

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
      console.error("Cancellation email error:", emailError);
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

// ── Check room availability (enhanced with reliable date filtering) ─────────
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

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("room_number")
      .eq("room_id", room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // ✅ Use reliable .filter() method for date conflict check
    const { data: conflictingBookings, error } = await supabase
      .from("bookings")
      .select("booking_id, booking_status, check_in_date, check_out_date")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .filter("check_in_date", "lt", check_out)
      .filter("check_out_date", "gt", check_in);

    if (error) throw error;

    const isAvailable = !conflictingBookings || conflictingBookings.length === 0;

    res.json({
      success: true,
      available: isAvailable,
      room_id,
      room_number: room.room_number,
      check_in,
      check_out,
      ...(!isAvailable && {
        reason: "Room is already booked for these dates",
        conflicting_bookings: conflictingBookings.map(b => ({
          id: b.booking_id,
          check_in: b.check_in_date,
          check_out: b.check_out_date,
          status: b.booking_status
        }))
      })
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};