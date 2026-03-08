import pool from "../config/db.js";

// CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const {
      user_id,
      room_id,
      check_in_date,
      check_out_date,
      booking_status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO bookings
       (user_id, room_id, check_in_date, check_out_date, booking_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user_id,
        room_id,
        check_in_date,
        check_out_date,
        booking_status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// GET ALL BOOKINGS
export const getBookings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings ORDER BY booking_id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error });
  }
};