import supabase from "../config/supabaseClient.js";

// Generate invoice for booking
export const generateInvoice = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { cgst_percent = 9, sgst_percent = 9 } = req.body;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`*, rooms (*), Users (*)`)
      .eq("booking_id", booking_id)
      .single();

    if (bookingError) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    const nights = Math.ceil(
      (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
      (1000 * 60 * 60 * 24)
    );

    const base_amount = booking.rooms.base_price * nights;
    const cgst_amount = base_amount * (cgst_percent / 100);
    const sgst_amount = base_amount * (sgst_percent / 100);
    const total_tax = cgst_amount + sgst_amount;
    const total_amount = base_amount + total_tax;
    const invoice_number = `INV-${Date.now()}-${booking_id}`;

    const { data: invoice, error } = await supabase
      .from("Invoices")
      .insert([{
        booking_id,
        user_id: booking.user_id,
        invoice_number,
        base_amount,
        cgst_amount,
        sgst_amount,
        total_tax,
        total_amount,
        payment_state: "pending",
        invoice_data: JSON.stringify({
          nights,
          room_type: booking.rooms.room_type,
          room_number: booking.rooms.room_number,
          check_in: booking.check_in_date,
          check_out: booking.check_out_date,
          tax_breakdown: { cgst_percent, sgst_percent }
        }),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: "Invoice generated successfully", data: invoice });
  } catch (error) {
    console.error("Generate invoice error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get invoice by invoice ID
export const getInvoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const { data: invoice, error } = await supabase
      .from("Invoices")
      .select(`*, bookings (*, rooms (*)), Users (user_id, username, email), Payments (*)`)
      .eq("invoice_id", invoice_id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── NEW: Get invoice by booking ID (used by BookingInvoice.jsx) ───────────────
export const getInvoiceByBookingId = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const { data: invoice, error } = await supabase
      .from("Invoices")
      .select(`*, bookings (*, rooms (*)), Users (user_id, username, email), Payments (*)`)
      .eq("booking_id", booking_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No invoice yet for this booking — return success:false but don't crash
      return res.json({ success: false, data: null });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Get invoice by booking error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get invoices by user ID
export const getUserInvoices = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("Invoices")
      .select(`*, bookings (*, rooms (*))`)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get user invoices error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all invoices (admin, with filters)
export const getAllInvoices = async (req, res) => {
  try {
    const { payment_state, user_id, start_date, end_date } = req.query;

    let query = supabase
      .from("Invoices")
      .select(`*, bookings (*, rooms (*)), Users (user_id, username, email), Payments (*)`);

    if (payment_state) query = query.eq("payment_state", payment_state);
    if (user_id)       query = query.eq("user_id", user_id);
    if (start_date)    query = query.gte("created_at", start_date);
    if (end_date)      query = query.lte("created_at", end_date);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get all invoices error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update invoice payment status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { payment_state } = req.body;

    const validStates = ['pending', 'paid', 'partial', 'overdue', 'cancelled'];
    if (!validStates.includes(payment_state)) {
      return res.status(400).json({ success: false, message: "Invalid payment state" });
    }

    const { data, error } = await supabase
      .from("Invoices")
      .update({ payment_state, updated_at: new Date().toISOString() })
      .eq("invoice_id", invoice_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: "Invoice status updated successfully", data });
  } catch (error) {
    console.error("Update invoice status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download invoice
export const downloadInvoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const { data: invoice, error } = await supabase
      .from("Invoices")
      .select(`*, bookings (*, rooms (*)), Users (username, email)`)
      .eq("invoice_id", invoice_id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({ success: true, message: "Invoice download ready", data: invoice });
  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};