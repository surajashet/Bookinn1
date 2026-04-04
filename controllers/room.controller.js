import supabase from "../config/supabaseClient.js";

// Create room (without room_status)
export const createRoom = async (req, res) => {
  try {
    const {
      room_number,
      room_type,
      floor_number,
      capacity,
      base_price,
      description,
      image_url
    } = req.body;

    // Check if room number already exists
    const { data: existingRoom, error: checkError } = await supabase
      .from("rooms")
      .select("room_number")
      .eq("room_number", room_number)
      .maybeSingle();

    if (existingRoom) {
      return res.status(400).json({ 
        success: false,
        error: "Room with this number already exists" 
      });
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert([{
        room_number,
        room_type,
        floor_number,
        capacity,
        base_price,
        description,
        image_url
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get all rooms with optional filters (without room_status filter)
export const getRooms = async (req, res) => {
  try {
    const { 
      room_type, 
      min_price, 
      max_price,
      capacity,
      floor 
    } = req.query;

    let query = supabase
      .from("rooms")
      .select("*");

    if (room_type) {
      query = query.eq("room_type", room_type);
    }
    if (min_price) {
      query = query.gte("base_price", min_price);
    }
    if (max_price) {
      query = query.lte("base_price", max_price);
    }
    if (capacity) {
      query = query.gte("capacity", capacity);
    }
    if (floor) {
      query = query.eq("floor_number", floor);
    }

    query = query.order("room_number", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get single room by ID
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    // Get upcoming bookings for this room
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("booking_id, check_in_date, check_out_date, booking_status")
      .eq("room_id", id)
      .gte("check_out_date", new Date().toISOString().split('T')[0])
      .order("check_in_date", { ascending: true })
      .limit(10);

    if (!bookingsError) {
      data.upcoming_bookings = bookings;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Get room by ID error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Update room details (without room_status)
export const updateRoom = async (req, res) => {
  try {
    const { room_id } = req.params;
    const {
      room_number,
      room_type,
      floor_number,
      capacity,
      base_price,
      description,
      image_url
    } = req.body;

    const { data: existingRoom, error: checkError } = await supabase
      .from("rooms")
      .select("room_id, room_number")
      .eq("room_id", room_id)
      .maybeSingle();

    if (checkError || !existingRoom) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    if (room_number && room_number !== existingRoom.room_number) {
      const { data: conflictRoom, error: conflictError } = await supabase
        .from("rooms")
        .select("room_id")
        .eq("room_number", room_number)
        .neq("room_id", room_id)
        .maybeSingle();

      if (conflictRoom) {
        return res.status(400).json({ 
          success: false,
          error: "Room number already in use" 
        });
      }
    }

    const updates = {};
    if (room_number !== undefined) updates.room_number = room_number;
    if (room_type !== undefined) updates.room_type = room_type;
    if (floor_number !== undefined) updates.floor_number = floor_number;
    if (capacity !== undefined) updates.capacity = capacity;
    if (base_price !== undefined) updates.base_price = base_price;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("room_id", room_id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Room updated successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete room (normal delete - only if no bookings)
export const deleteRoom = async (req, res) => {
  try {
    const { room_id } = req.params;

    // Check if room has any bookings
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("room_id", room_id);

    if (bookingError) {
      console.error("Booking check error:", bookingError);
      return res.status(500).json({ 
        success: false,
        error: "Error checking room bookings" 
      });
    }

    if (bookings && bookings.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Cannot delete room. This room has ${bookings.length} booking(s). Use force delete to delete room and all bookings.`
      });
    }

    const { data, error } = await supabase
      .from("rooms")
      .delete()
      .eq("room_id", room_id)
      .select();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: "Room not found" 
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: "Room deleted successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Check if room has bookings
export const checkRoomBookings = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("booking_id, booking_status, check_in_date, check_out_date")
      .eq("room_id", room_id);
    
    if (error) throw error;
    
    const today = new Date().toISOString().split('T')[0];
    const hasActiveBookings = bookings?.some(b => 
      b.booking_status === 'confirmed' || 
      b.booking_status === 'checked_in' ||
      b.check_out_date >= today
    );
    
    res.json({
      success: true,
      hasBookings: bookings && bookings.length > 0,
      hasActiveBookings,
      bookingCount: bookings?.length || 0,
      bookings: bookings || []
    });
  } catch (error) {
    console.error("Check room bookings error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Force delete room with all its bookings
export const forceDeleteRoom = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    // First, delete all bookings for this room
    const { error: deleteBookingsError } = await supabase
      .from("bookings")
      .delete()
      .eq("room_id", room_id);
    
    if (deleteBookingsError) {
      console.error("Error deleting bookings:", deleteBookingsError);
      return res.status(500).json({ 
        success: false,
        error: "Error deleting associated bookings" 
      });
    }
    
    // Then delete the room
    const { data, error } = await supabase
      .from("rooms")
      .delete()
      .eq("room_id", room_id)
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: "Room not found" 
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      message: "Room and all associated bookings deleted successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Force delete room error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Check room availability for specific dates (without room_status)
export const checkRoomAvailability = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ 
        success: false,
        error: "Check-in and check-out dates are required" 
      });
    }

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_id", room_id)
      .maybeSingle();

    if (roomError || !room) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .or(`check_in_date.lte.${check_out},check_out_date.gte.${check_in}`);

    if (bookingError) throw bookingError;

    const isAvailable = !conflictingBookings || conflictingBookings.length === 0;

    res.json({
      success: true,
      room_id,
      check_in,
      check_out,
      available: isAvailable,
      room_details: {
        room_number: room.room_number,
        room_type: room.room_type,
        base_price: room.base_price,
        capacity: room.capacity,
        image_url: room.image_url
      }
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get room statistics (without room_status)
export const getRoomStats = async (req, res) => {
  try {
    const { data: allRooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*");

    if (roomsError) throw roomsError;

    const totalRooms = allRooms.length;
    
    // Calculate average price
    const averagePrice = totalRooms > 0 ? allRooms.reduce((sum, r) => sum + r.base_price, 0) / totalRooms : 0;

    // Get room type breakdown
    const typeBreakdown = {};
    allRooms.forEach(room => {
      if (!typeBreakdown[room.room_type]) {
        typeBreakdown[room.room_type] = {
          count: 0,
          totalPrice: 0
        };
      }
      typeBreakdown[room.room_type].count++;
      typeBreakdown[room.room_type].totalPrice += room.base_price;
    });

    Object.keys(typeBreakdown).forEach(type => {
      typeBreakdown[type].avgPrice = 
        typeBreakdown[type].totalPrice / typeBreakdown[type].count;
      delete typeBreakdown[type].totalPrice;
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_rooms: totalRooms,
          average_price: Number(averagePrice.toFixed(2))
        },
        by_type: typeBreakdown
      }
    });
  } catch (error) {
    console.error("Get room stats error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get rooms for client (with calculated status from bookings)
export const getClientRooms = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    if (error) throw error;

    // Get all active bookings
    const { data: activeBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("room_id, booking_status, check_in_date, check_out_date")
      .in("booking_status", ["confirmed", "checked_in"]);

    if (bookingError) throw bookingError;

    const transformedRooms = rooms.map(room => {
      const roomBookings = activeBookings?.filter(b => b.room_id === room.room_id) || [];
      
      // Calculate status based on bookings
      const isOccupiedToday = roomBookings.some(b => 
        b.booking_status === 'checked_in' ||
        (b.check_in_date <= today && b.check_out_date >= today)
      );
      
      const hasFutureBooking = roomBookings.some(b => 
        b.booking_status === 'confirmed' && b.check_in_date > today
      );
      
      let displayStatus;
      if (isOccupiedToday) {
        displayStatus = 'Occupied';
      } else if (hasFutureBooking) {
        displayStatus = 'Reserved';
      } else {
        displayStatus = 'Available';
      }
      
      // Check availability for specific dates if provided
      let isAvailableForDates = true;
      if (check_in && check_out) {
        const hasConflicting = roomBookings.some(b => 
          b.check_in_date <= check_out && b.check_out_date >= check_in
        );
        isAvailableForDates = !hasConflicting;
      }

      return {
        id: room.room_id,
        name: `Room ${room.room_number}`,
        room_number: room.room_number,
        type: room.room_type,
        price: room.base_price,
        capacity: room.capacity,
        status: displayStatus,
        is_available: isAvailableForDates,
        description: room.description,
        size: `${room.capacity} guests`,
        floor: room.floor_number,
        image_url: room.image_url || null
      };
    });

    res.json(transformedRooms);
  } catch (error) {
    console.error("Get client rooms error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};