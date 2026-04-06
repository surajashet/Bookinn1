import Razorpay from "razorpay";
import crypto from "crypto";
import supabase from "../config/supabaseClient.js";
import { sendBookingConfirmation } from "../utils/emailService.js";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in .env");
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── Create Razorpay Order ─────────────────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id)
      return res.status(400).json({ success: false, error: "booking_id is required" });

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("*, rooms(*), Users(*)")
      .eq("booking_id", booking_id)
      .single();

    if (bErr || !booking)
      return res.status(404).json({ success: false, error: "Booking not found" });

    const room = booking.rooms;
    const user = booking.Users;

    if (!room || !user)
      return res.status(400).json({ success: false, error: "Booking is missing room or user data" });

    const n = Math.max(
      1,
      Math.ceil(
        (new Date(booking.check_out_date) - new Date(booking.check_in_date)) / 86400000
      )
    );

    const base_amount  = room.base_price * n;
    const cgst_amount  = parseFloat((base_amount * 0.06).toFixed(2));
    const sgst_amount  = parseFloat((base_amount * 0.06).toFixed(2));
    const total_tax    = cgst_amount + sgst_amount;
    const serviceFee   = 150;
    const total_amount = base_amount + total_tax + serviceFee;

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   Math.round(total_amount * 100),
      currency: "INR",
      receipt:  `booking_${booking_id}`,
      notes:    { booking_id: String(booking_id), user_id: String(user.user_id) },
    });

    // ── Check if a pending invoice already exists for this booking ──
    const { data: existingInvoice } = await supabase
      .from("Invoices")
      .select("*")
      .eq("booking_id", booking_id)
      .eq("payment_state", "pending")
      .maybeSingle();

    let invoice;

    if (existingInvoice) {
      // Reuse the existing pending invoice — just update the amounts in case they changed
      console.log("♻️  Reusing existing invoice:", existingInvoice.invoice_number);
      const { data: updated, error: updateErr } = await supabase
        .from("Invoices")
        .update({
          base_amount,
          cgst_amount,
          sgst_amount,
          total_tax,
          total_amount,
        })
        .eq("invoice_id", existingInvoice.invoice_id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      invoice = updated;
    } else {
      // No pending invoice exists — create a fresh one
      const invoiceNumber = `INV-${String(booking_id).padStart(4, "0")}-${new Date().getFullYear()}`;
      console.log("📋 Inserting new invoice:", invoiceNumber);

      const { data: inserted, error: invErr } = await supabase
        .from("Invoices")
        .insert([{
          booking_id,
          user_id:        user.user_id,
          invoice_number: invoiceNumber,
          base_amount,
          cgst_amount,
          sgst_amount,
          total_tax,
          total_amount,
          payment_state:  "pending",
          created_at:     new Date().toISOString(),
        }])
        .select()
        .single();

      if (invErr) {
        console.error("❌ Invoice insert error:", invErr.message, invErr.details);
        throw new Error(`Invoice insert failed: ${invErr.message} | ${invErr.details || ""}`);
      }
      invoice = inserted;
    }

    console.log("✅ Razorpay order created:", order.id);

    return res.json({
      success: true,
      data: {
        order_id:       order.id,
        amount:         order.amount,
        currency:       order.currency,
        invoice_id:     invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        key_id:         process.env.RAZORPAY_KEY_ID,
        prefill: {
          name:  user.username,
          email: user.email,
        },
      },
    });

  } catch (err) {
    console.error("❌ createRazorpayOrder error:", err?.message || JSON.stringify(err));
    return res.status(500).json({
      success: false,
      error: err?.message || err?.details || JSON.stringify(err) || "Unknown error",
    });
  }
};

// ── Verify Payment + Save to DB + Send Email ──────────────────────────────────
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoice_id,
      booking_id,
    } = req.body;

    // 1. Signature check
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, error: "Invalid payment signature" });

    // 2. Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from("Invoices")
      .select("*")
      .eq("invoice_id", invoice_id)
      .single();

    if (invErr || !invoice)
      return res.status(404).json({ success: false, error: "Invoice not found" });

    // 3. Insert Payment row
    const { data: payment, error: payErr } = await supabase
      .from("Payments")
      .insert([{
        invoice_id,
        amount_paid:           invoice.total_amount,
        payment_paid:          String(invoice.total_amount),
        payment_method:        "razorpay",
        payment_status:        "completed",
        transaction_reference: razorpay_payment_id,
        payment_date:          new Date().toISOString(),
      }])
      .select()
      .single();

    if (payErr) throw payErr;

    // 4. Mark Invoice paid
    await supabase
      .from("Invoices")
      .update({
        payment_state:   "paid",
        payment_methods: "razorpay",
        invoice_data:    JSON.stringify({ razorpay_order_id, razorpay_payment_id }),
      })
      .eq("invoice_id", invoice_id);

    // 5. Confirm booking
    await supabase
      .from("bookings")
      .update({ booking_status: "confirmed", updated_at: new Date().toISOString() })
      .eq("booking_id", booking_id);

    // 6. Fetch full booking + room + user for email and room update
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, rooms(*), Users(*)")
      .eq("booking_id", booking_id)
      .single();

    // 7. Mark room as reserved
    if (booking?.rooms?.room_id) {
      await supabase
        .from("rooms")
        .update({ room_status: "reserved", updated_at: new Date().toISOString() })
        .eq("room_id", booking.rooms.room_id);
    }

    // 8. Send confirmation email + PDF invoice
    if (booking) {
      await sendBookingConfirmation(booking, booking.Users, booking.rooms);
    }

    // ── Activity log intentionally removed ──

    console.log("✅ Payment verified, booking confirmed:", booking_id);

    return res.json({
      success: true,
      message: "Payment verified. Booking confirmed. Email sent.",
      data:    { payment, invoice_id, booking_id },
    });

  } catch (err) {
    console.error("❌ verifyRazorpayPayment error:", err?.message || JSON.stringify(err));
    return res.status(500).json({
      success: false,
      error: err?.message || err?.details || JSON.stringify(err) || "Unknown error",
    });
  }
};

// ── Process Payment (manual) ──────────────────────────────────────────────────
export const processPayment = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { amount_paid, payment_method, transaction_reference } = req.body;

    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoices")
      .select("*")
      .eq("invoice_id", invoice_id)
      .single();

    if (invoiceError)
      return res.status(404).json({ success: false, error: "Invoice not found" });

    const { data: payment, error } = await supabase
      .from("Payments")
      .insert([{
        invoice_id,
        amount_paid:           amount_paid || invoice.total_amount,
        payment_method,
        payment_status:        "completed",
        transaction_reference,
        payment_date:          new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    const totalPaid    = amount_paid || invoice.total_amount;
    const paymentState = totalPaid >= invoice.total_amount ? "paid" : "partial";

    await supabase
      .from("Invoices")
      .update({ payment_state: paymentState, payment_methods: payment_method })
      .eq("invoice_id", invoice_id);

    if (paymentState === "paid") {
      await supabase
        .from("bookings")
        .update({ booking_status: "confirmed", updated_at: new Date().toISOString() })
        .eq("booking_id", invoice.booking_id);
    }

    res.status(201).json({ success: true, message: "Payment processed successfully", data: payment });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get Payment by ID ─────────────────────────────────────────────────────────
export const getPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;

    const { data: payment, error } = await supabase
      .from("Payments")
      .select(`*, Invoices (*, bookings (*, rooms (*), Users (*)))`)
      .eq("payment_id", payment_id)
      .single();

    if (error)
      return res.status(404).json({ success: false, error: "Payment not found" });

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get Payments for an Invoice ───────────────────────────────────────────────
export const getInvoicePayments = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const { data, error } = await supabase
      .from("Payments")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("payment_date", { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get All Payments (admin) ──────────────────────────────────────────────────
export const getAllPayments = async (req, res) => {
  try {
    const { payment_status, payment_method, start_date, end_date } = req.query;

    let query = supabase
      .from("Payments")
      .select(`*, Invoices (*, bookings (*, rooms (*), Users (*)))`);

    if (payment_status) query = query.eq("payment_status", payment_status);
    if (payment_method)  query = query.eq("payment_method",  payment_method);
    if (start_date)      query = query.gte("payment_date", start_date);
    if (end_date)        query = query.lte("payment_date", end_date);

    query = query.order("payment_date", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Refund Payment ────────────────────────────────────────────────────────────
export const refundPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { refund_reason } = req.body;

    const { data: payment, error: paymentError } = await supabase
      .from("Payments")
      .select("*, Invoices(*)")
      .eq("payment_id", payment_id)
      .single();

    if (paymentError)
      return res.status(404).json({ success: false, error: "Payment not found" });

    const { data, error } = await supabase
      .from("Payments")
      .update({ payment_status: "refunded" })
      .eq("payment_id", payment_id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("Invoices")
      .update({ payment_state: "refunded" })
      .eq("invoice_id", payment.invoice_id);

    res.json({ success: true, message: "Payment refunded successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Payment Stats (admin) ─────────────────────────────────────────────────────
export const getPaymentStats = async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from("Payments")
      .select("payment_status, amount_paid");

    if (error) throw error;

    const totalPayments     = payments.length;
    const totalAmount       = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const completedPayments = payments.filter((p) => p.payment_status === "completed").length;
    const pendingPayments   = payments.filter((p) => p.payment_status === "pending").length;
    const failedPayments    = payments.filter((p) => p.payment_status === "failed").length;
    const refundedPayments  = payments.filter((p) => p.payment_status === "refunded").length;

    res.json({
      success: true,
      data: {
        totalPayments,
        totalAmount,
        byStatus: {
          completed: completedPayments,
          pending:   pendingPayments,
          failed:    failedPayments,
          refunded:  refundedPayments,
        },
        averagePayment: totalPayments > 0 ? (totalAmount / totalPayments).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};