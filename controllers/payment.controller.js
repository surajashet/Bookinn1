import supabase from "../config/supabaseClient.js";

// Process payment
export const processPayment = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const {
      amount_paid,
      payment_method,
      transaction_reference
    } = req.body;

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoices")
      .select("*")
      .eq("invoice_id", invoice_id)
      .single();

    if (invoiceError) {
      return res.status(404).json({ 
        success: false,
        error: "Invoice not found" 
      });
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from("Payments")
      .insert([{
        invoice_id,
        amount_paid: amount_paid || invoice.total_amount,
        payment_method,
        payment_status: "completed",
        transaction_reference,
        payment_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update invoice payment state
    const totalPaid = amount_paid || invoice.total_amount;
    const paymentState = totalPaid >= invoice.total_amount ? "paid" : "partial";

    await supabase
      .from("Invoices")
      .update({ 
        payment_state: paymentState,
        payment_methods: payment_method,
        updated_at: new Date().toISOString()
      })
      .eq("invoice_id", invoice_id);

    // Update booking status if fully paid
    if (paymentState === "paid") {
      await supabase
        .from("bookings")
        .update({ 
          booking_status: "confirmed",
          updated_at: new Date().toISOString()
        })
        .eq("booking_id", invoice.booking_id);
    }

    // Log activity
    await supabase
      .from("Activity Logs")
      .insert([{
        user_id: req.user?.id || null,
        action: "PROCESS_PAYMENT",
        entity_type: "payment",
        description: `Payment processed for invoice ${invoice_id}`
      }]);

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: payment
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get payment by ID
export const getPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;

    const { data: payment, error } = await supabase
      .from("Payments")
      .select(`
        *,
        Invoices (*, bookings (*, rooms (*), Users (*)))
      `)
      .eq("payment_id", payment_id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false,
        error: "Payment not found" 
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get all payments for an invoice
export const getInvoicePayments = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const { data, error } = await supabase
      .from("Payments")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("payment_date", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get invoice payments error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get all payments (with filters)
export const getAllPayments = async (req, res) => {
  try {
    const { payment_status, payment_method, start_date, end_date } = req.query;

    let query = supabase
      .from("Payments")
      .select(`
        *,
        Invoices (*, bookings (*, rooms (*), Users (*)))
      `);

    if (payment_status) {
      query = query.eq("payment_status", payment_status);
    }
    if (payment_method) {
      query = query.eq("payment_method", payment_method);
    }
    if (start_date) {
      query = query.gte("payment_date", start_date);
    }
    if (end_date) {
      query = query.lte("payment_date", end_date);
    }

    query = query.order("payment_date", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Refund payment
export const refundPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { refund_reason } = req.body;

    // Get payment
    const { data: payment, error: paymentError } = await supabase
      .from("Payments")
      .select("*, Invoices(*)")
      .eq("payment_id", payment_id)
      .single();

    if (paymentError) {
      return res.status(404).json({ 
        success: false,
        error: "Payment not found" 
      });
    }

    // Update payment status to refunded
    const { data, error } = await supabase
      .from("Payments")
      .update({ 
        payment_status: "refunded",
        updated_at: new Date().toISOString()
      })
      .eq("payment_id", payment_id)
      .select()
      .single();

    if (error) throw error;

    // Update invoice payment state
    await supabase
      .from("Invoices")
      .update({ 
        payment_state: "refunded",
        updated_at: new Date().toISOString()
      })
      .eq("invoice_id", payment.invoice_id);

    // Log activity
    await supabase
      .from("Activity Logs")
      .insert([{
        user_id: req.user?.id || null,
        action: "REFUND_PAYMENT",
        entity_type: "payment",
        description: `Payment ${payment_id} refunded: ${refund_reason || 'No reason provided'}`
      }]);

    res.json({
      success: true,
      message: "Payment refunded successfully",
      data
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from("Payments")
      .select("payment_status, amount_paid");

    if (error) throw error;

    // Calculate statistics
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const completedPayments = payments.filter(p => p.payment_status === 'completed').length;
    const pendingPayments = payments.filter(p => p.payment_status === 'pending').length;
    const failedPayments = payments.filter(p => p.payment_status === 'failed').length;
    const refundedPayments = payments.filter(p => p.payment_status === 'refunded').length;

    res.json({
      success: true,
      data: {
        totalPayments,
        totalAmount,
        byStatus: {
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments,
          refunded: refundedPayments
        },
        averagePayment: totalPayments > 0 ? (totalAmount / totalPayments).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};