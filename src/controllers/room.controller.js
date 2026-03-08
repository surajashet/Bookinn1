import pool from "../config/db.js";

// Create room
export const createRoom = async (req, res) => {
  try {
    const {
      room_number,
      room_type,
      floor_number,
      capacity,
      base_price,
      room_status,
      description
    } = req.body;

    const result = await pool.query(
      `INSERT INTO rooms 
       (room_number, room_type, floor_number, capacity, base_price, room_status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        room_number,
        room_type,
        floor_number,
        capacity,
        base_price,
        room_status,
        description
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rooms ORDER BY room_number"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update room status
export const updateRoomStatus = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { room_status } = req.body;

    const result = await pool.query(
      `UPDATE rooms
       SET room_status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE room_id = $2
       RETURNING *`,
      [room_status, room_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error });
  }
};
