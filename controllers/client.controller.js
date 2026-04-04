import supabase from "../config/supabaseClient.js";

export const getClientDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get user profile from Users table
    const { data: profile, error: profileError } = await supabase
      .from("Users")
      .select("username, email")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (profileError) {
      console.error("Profile error:", profileError);
    }
    
    // Get all bookings for this user
    const { data: allBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        booking_id,
        check_in_date,
        check_out_date,
        booking_status,
        room_id,
        total_price,
        guests,
        rooms (
          room_number,
          room_type,
          base_price,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (bookingsError) {
      console.error("Bookings error:", bookingsError);
    }
    
    const bookings = allBookings || [];
    
    // Calculate stats
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => 
      b.booking_status === 'confirmed' && 
      b.check_out_date >= today
    ).length;
    
    // Calculate total spent
    const totalSpend = bookings
      .filter(b => b.booking_status === 'checked_out' || b.booking_status === 'confirmed')
      .reduce((sum, b) => {
        const nights = Math.max(1, Math.ceil(
          (new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000 * 60 * 60 * 24)
        ));
        const roomPrice = b.rooms?.base_price || 0;
        return sum + (roomPrice * nights);
      }, 0);
    
    // Get upcoming booking (next confirmed booking)
    const upcoming = bookings
      .filter(b => b.booking_status === 'confirmed' && b.check_in_date >= today)
      .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date))[0];
    
    // Get recent bookings (last 5) - ADDED room_id here
    const recent = bookings.slice(0, 5).map(b => {
      const nights = Math.max(1, Math.ceil(
        (new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000 * 60 * 60 * 24)
      ));
      const calculatedTotal = b.rooms?.base_price ? nights * b.rooms.base_price : 0;
      
      return {
        id: b.booking_id,
        room_id: b.room_id,  // ← ADDED THIS LINE
        room_number: b.rooms?.room_number,
        room_type: b.rooms?.room_type,
        check_in: b.check_in_date,
        check_out: b.check_out_date,
        nights: nights,
        guests: b.guests || 1,
        total_amount: b.total_price || calculatedTotal,
        status: b.booking_status,
        room_image: b.rooms?.image_url
      };
    });
    
    // Get active booking count (currently checked in)
    const activeStays = bookings.filter(b => 
      b.booking_status === 'checked_in' && 
      b.check_in_date <= today && 
      b.check_out_date >= today
    ).length;
    
    const response = {
      profile: {
        name: profile?.username || "Guest",
        email: profile?.email || ""
      },
      stats: {
        totalBookings: totalBookings,
        activeBookings: activeBookings,
        activeStays: activeStays,
        totalSpend: totalSpend,
        loyaltyPoints: Math.floor(totalSpend / 100)
      },
      upcoming: upcoming ? {
        booking_id: upcoming.booking_id,
        room_id: upcoming.room_id,  // ← ADDED THIS LINE for upcoming too
        room_number: upcoming.rooms?.room_number,
        room_type: upcoming.rooms?.room_type,
        check_in: upcoming.check_in_date,
        check_out: upcoming.check_out_date,
        nights: Math.max(1, Math.ceil(
          (new Date(upcoming.check_out_date) - new Date(upcoming.check_in_date)) / (1000 * 60 * 60 * 24)
        )),
        guests: upcoming.guests || 1,
        room_image: upcoming.rooms?.image_url
      } : null,
      recent: recent
    };
    
    res.json(response);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getClientRooms = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    if (error) throw error;

    // Get all active bookings (confirmed and checked-in)
    const { data: activeBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("room_id, booking_status, check_in_date, check_out_date")
      .in("booking_status", ["confirmed", "checked_in"]);

    if (bookingError) throw bookingError;

    const transformedRooms = rooms.map(room => {
      const roomBookings = activeBookings?.filter(b => b.room_id === room.room_id) || [];
      
      // Calculate status based SOLELY on bookings (no room_status)
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
      
      // Calculate price per night
      let finalPrice = room.base_price;
      
      return {
        id: room.room_id,
        name: `Room ${room.room_number}`,
        room_number: room.room_number,
        type: room.room_type,
        price: finalPrice,
        capacity: room.capacity,
        status: displayStatus,
        is_available: isAvailableForDates && displayStatus === 'Available',
        description: room.description,
        size: `${room.capacity} guests`,
        floor: room.floor_number,
        image_url: room.image_url || null,
        amenities: []
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

// Get room details with availability for specific dates
export const getRoomDetailsWithAvailability = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { check_in, check_out } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    // Get room details
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

    // Get all bookings for this room
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("booking_id, booking_status, check_in_date, check_out_date")
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"]);

    if (bookingError) throw bookingError;

    // Check availability for requested dates
    let isAvailable = true;
    let conflictingBooking = null;
    
    if (check_in && check_out) {
      conflictingBooking = bookings?.find(b => 
        b.check_in_date <= check_out && b.check_out_date >= check_in
      );
      isAvailable = !conflictingBooking;
    }
    
    // Get all unavailable dates for calendar view
    const unavailableDates = [];
    bookings?.forEach(booking => {
      let currentDate = new Date(booking.check_in_date);
      const endDate = new Date(booking.check_out_date);
      
      while (currentDate <= endDate) {
        unavailableDates.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    // Determine current status based on bookings
    const isOccupiedToday = bookings?.some(b => 
      b.booking_status === 'checked_in' ||
      (b.check_in_date <= today && b.check_out_date >= today)
    );
    
    const hasFutureBooking = bookings?.some(b => 
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
    
    res.json({
      success: true,
      data: {
        id: room.room_id,
        room_number: room.room_number,
        room_type: room.room_type,
        floor_number: room.floor_number,
        capacity: room.capacity,
        base_price: room.base_price,
        description: room.description,
        image_url: room.image_url,
        status: displayStatus,
        is_available: isAvailable,
        unavailable_dates: [...new Set(unavailableDates)],
        conflicting_booking: conflictingBooking
      }
    });
  } catch (error) {
    console.error("Get room details with availability error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};