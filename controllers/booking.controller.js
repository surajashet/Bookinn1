import supabase from "../config/supabaseClient.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const {
      room_id,
      user_id,
      check_in_date,
      check_out_date,
      booking_status = 'confirmed'
    } = req.body;

    // Check if room exists and is available
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("room_status, base_price, room_number")
      .eq("room_id", room_id)
      .single();

    if (roomError) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    if (room.room_status !== 'available') {
      return res.status(400).json({ 
        success: false,
        error: `Room is currently ${room.room_status}` 
      });
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .or(`check_in_date.lte.${check_out_date},check_out_date.gte.${check_in_date}`);

    if (conflictError) throw conflictError;

    if (conflictingBookings && conflictingBookings.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Room is not available for selected dates" 
      });
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([{
        room_id,
        user_id,
        check_in_date,
        check_out_date,
        booking_status
      }])
      .select(`
        *,
        rooms (*),
        Users (*)
      `);

    if (error) throw error;

    // Update room status to reserved
    await supabase
      .from("rooms")
      .update({ 
        room_status: "reserved",
        updated_at: new Date().toISOString()
      })
      .eq("room_id", room_id);

    // Log activity
    await supabase
      .from("Activity Logs")
      .insert([{
        user_id,
        action: "CREATE_BOOKING",
        entity_type: "booking",
        description: `Booking created for room ${room.room_number}`
      }]);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking[0]
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get bookings with filters
export const getBookings = async (req, res) => {
  try {
    const { status, user_id, room_id, start_date, end_date } = req.query;

    let query = supabase
      .from("bookings")
      .select(`
        *,
        rooms (*),
        Users (user_id, username, email)
      `);

    if (status) {
      query = query.eq("booking_status", status);
    }
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    if (room_id) {
      query = query.eq("room_id", room_id);
    }
    if (start_date) {
      query = query.gte("check_in_date", start_date);
    }
    if (end_date) {
      query = query.lte("check_out_date", end_date);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get bookings by user ID
export const getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (*)
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (*),
        Users (user_id, username, email)
      `)
      .eq("booking_id", id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false,
        error: "Booking not found" 
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const validStatuses = ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
    if (!validStatuses.includes(booking_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status"
      });
    }

    // Get current booking to know room_id
    const { data: currentBooking } = await supabase
      .from("bookings")
      .select("room_id")
      .eq("booking_id", id)
      .single();

    const { data, error } = await supabase
      .from("bookings")
      .update({ 
        booking_status,
        updated_at: new Date().toISOString()
      })
      .eq("booking_id", id)
      .select()
      .single();

    if (error) throw error;

    // Update room status based on booking status
    let roomStatus;
    if (booking_status === 'checked_in') {
      roomStatus = 'occupied';
    } else if (booking_status === 'checked_out' || booking_status === 'cancelled') {
      roomStatus = 'available';
    } else if (booking_status === 'confirmed') {
      roomStatus = 'reserved';
    }

    if (roomStatus && currentBooking) {
      await supabase
        .from("rooms")
        .update({ 
          room_status: roomStatus,
          updated_at: new Date().toISOString()
        })
        .eq("room_id", currentBooking.room_id);
    }

    res.json({
      success: true,
      message: `Booking ${booking_status} successfully`,
      data
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .update({ 
        booking_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("booking_id", id)
      .select()
      .single();

    if (error) throw error;

    // Update room status back to available
    await supabase
      .from("rooms")
      .update({ 
        room_status: "available",
        updated_at: new Date().toISOString()
      })
      .eq("room_id", data.room_id);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get bookings by date range
export const getBookingsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (*),
        Users (user_id, username, email)
      `)
      .gte("check_in_date", start_date)
      .lte("check_out_date", end_date)
      .order("check_in_date", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get bookings by date range error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get booking statistics
export const getBookingStats = async (req, res) => {
  try {
    // Get all bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        booking_status, 
        check_in_date, 
        check_out_date,
        rooms (base_price)
      `);

    if (error) throw error;

    // Calculate statistics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed').length;
    const checkedInBookings = bookings.filter(b => b.booking_status === 'checked_in').length;
    const checkedOutBookings = bookings.filter(b => b.booking_status === 'checked_out').length;
    const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled').length;
    const noShowBookings = bookings.filter(b => b.booking_status === 'no_show').length;

    // Calculate revenue
    const totalRevenue = bookings
      .filter(b => b.booking_status !== 'cancelled' && b.booking_status !== 'no_show')
      .reduce((sum, b) => {
        const nights = Math.ceil(
          (new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000 * 60 * 60 * 24)
        );
        return sum + ((b.rooms?.base_price || 0) * nights);
      }, 0);

    // Calculate occupancy rate (active bookings / total rooms * 100)
    const { data: rooms } = await supabase
      .from("rooms")
      .select("room_id");

    const totalRooms = rooms?.length || 1;
    const activeBookings = confirmedBookings + checkedInBookings;
    const occupancyRate = ((activeBookings / totalRooms) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        totalBookings,
        byStatus: {
          confirmed: confirmedBookings,
          checkedIn: checkedInBookings,
          checkedOut: checkedOutBookings,
          cancelled: cancelledBookings,
          noShow: noShowBookings
        },
        totalRevenue,
        occupancyRate: parseFloat(occupancyRate),
        averageDailyRate: totalRevenue / 30 || 0 // Approximate
      }
    });
  } catch (error) {
    console.error("Get booking stats error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};