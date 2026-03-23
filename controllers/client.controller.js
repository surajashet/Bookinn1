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
        rooms (
          room_number,
          room_type,
          base_price
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
    
    // Calculate total spent (only from completed bookings)
    const totalSpend = bookings
      .filter(b => b.booking_status === 'checked_out')
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
    
    // Get recent bookings (last 5)
    const recent = bookings.slice(0, 5).map(b => ({
      id: b.booking_id,
      room_number: b.rooms?.room_number,
      room_type: b.rooms?.room_type,
      check_in: b.check_in_date,
      check_out: b.check_out_date,
      total_amount: b.rooms?.base_price ? 
        Math.max(1, Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000 * 60 * 60 * 24))) * b.rooms.base_price : 0,
      status: b.booking_status
    }));
    
    const response = {
      profile: {
        name: profile?.username || "Guest",
        email: profile?.email || ""
      },
      stats: {
        totalBookings: totalBookings,
        activeBookings: activeBookings,
        totalSpend: totalSpend,
        loyaltyPoints: Math.floor(totalSpend / 100)
      },
      upcoming: upcoming ? {
        room_number: upcoming.rooms?.room_number,
        room_type: upcoming.rooms?.room_type,
        check_in: upcoming.check_in_date,
        check_out: upcoming.check_out_date
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
      image_url: room.image_url || null  // FIXED: Now includes the actual image URL from database
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