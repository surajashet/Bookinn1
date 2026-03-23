import supabase from "../config/supabaseClient.js";

// Create room
export const createRoom = async (req, res) => {
  try {
    const {
      room_number,
      room_type,
      floor_number,
      capacity,
      base_price,
      room_status = 'available',
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
        room_status,
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

// Get all rooms with optional filters
export const getRooms = async (req, res) => {
  try {
    const { 
      status, 
      room_type, 
      min_price, 
      max_price,
      capacity,
      floor 
    } = req.query;

    let query = supabase
      .from("rooms")
      .select("*");

    if (status) {
      query = query.eq("room_status", status);
    }
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

// Update room status
export const updateRoomStatus = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { room_status } = req.body;

    const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning', 'reserved'];
    if (!validStatuses.includes(room_status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid room status. Must be one of: " + validStatuses.join(', ')
      });
    }

    const { data: currentRoom, error: fetchError } = await supabase
      .from("rooms")
      .select("room_status")
      .eq("room_id", room_id)
      .maybeSingle();

    if (fetchError || !currentRoom) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    const { data, error } = await supabase
      .from("rooms")
      .update({ 
        room_status,
        updated_at: new Date().toISOString()
      })
      .eq("room_id", room_id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Room status updated successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Update room status error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Update room details (full update)
export const updateRoom = async (req, res) => {
  try {
    const { room_id } = req.params;
    const {
      room_number,
      room_type,
      floor_number,
      capacity,
      base_price,
      room_status,
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
    if (room_status !== undefined) updates.room_status = room_status;
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

// Check room availability for specific dates
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
      .select("room_status")
      .eq("room_id", room_id)
      .maybeSingle();

    if (roomError || !room) {
      return res.status(404).json({ 
        success: false,
        error: "Room not found" 
      });
    }

    if (room.room_status === 'maintenance' || room.room_status === 'cleaning') {
      return res.json({
        success: true,
        room_id,
        check_in,
        check_out,
        available: false,
        reason: `Room is currently in ${room.room_status} status`
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
      ...(!isAvailable && { reason: "Room is already booked for these dates" })
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get room statistics
export const getRoomStats = async (req, res) => {
  try {
    const { data: allRooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*");

    if (roomsError) throw roomsError;

    const totalRooms = allRooms.length;
    const availableRooms = allRooms.filter(r => r.room_status === 'available').length;
    const occupiedRooms = allRooms.filter(r => r.room_status === 'occupied').length;
    const maintenanceRooms = allRooms.filter(r => r.room_status === 'maintenance').length;
    const cleaningRooms = allRooms.filter(r => r.room_status === 'cleaning').length;
    const reservedRooms = allRooms.filter(r => r.room_status === 'reserved').length;
    
    const averagePrice = totalRooms > 0 ? allRooms.reduce((sum, r) => sum + r.base_price, 0) / totalRooms : 0;
    const dailyRevenue = allRooms
      .filter(r => r.room_status === 'occupied')
      .reduce((sum, r) => sum + r.base_price, 0);

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
          available_rooms: availableRooms,
          occupied_rooms: occupiedRooms,
          maintenance_rooms: maintenanceRooms,
          cleaning_rooms: cleaningRooms,
          reserved_rooms: reservedRooms,
          average_price: Number(averagePrice.toFixed(2)),
          daily_revenue: dailyRevenue
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

// Bulk update room status
export const bulkUpdateRoomStatus = async (req, res) => {
  try {
    const { room_ids, room_status, floor_number } = req.body;

    if (!room_status) {
      return res.status(400).json({ 
        success: false,
        error: "Room status is required" 
      });
    }

    let query = supabase
      .from("rooms")
      .update({ 
        room_status,
        updated_at: new Date().toISOString()
      });

    if (room_ids && room_ids.length > 0) {
      query = query.in("room_id", room_ids);
    } else if (floor_number !== undefined) {
      query = query.eq("floor_number", floor_number);
    } else {
      return res.status(400).json({ 
        success: false,
        error: "Either room_ids or floor_number is required" 
      });
    }

    const { data, error } = await query.select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Updated ${data.length} rooms`,
      data: data
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get rooms for client (with image_url)
export const getClientRooms = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    if (error) throw error;

    const transformedRooms = data.map(room => ({
      id: room.room_id,
      name: `Room ${room.room_number}`,
      type: room.room_type,
      price: room.base_price,
      capacity: room.capacity,
      status: room.room_status === 'available' ? 'Available' : 'Booked',
      description: room.description,
      size: `${room.capacity} guests`,
      floor: room.floor_number,
      image_url: room.image_url || null
    }));

    res.json(transformedRooms);
  } catch (error) {
    console.error("Get client rooms error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};