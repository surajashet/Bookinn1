"use client";

import { useEffect, useState } from "react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => setRooms(data.data));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Rooms</h1>

      {rooms.map((room) => (
        <div key={room.room_id} className="border p-4 mb-4 rounded">
          <p><strong>Room Number:</strong> {room.room_number}</p>
          <p><strong>Type:</strong> {room.room_type}</p>
          <p><strong>Floor:</strong> {room.floor_number}</p>
          <p><strong>Capacity:</strong> {room.capacity}</p>
          <p><strong>Base Price:</strong> ₹{room.base_price}</p>
          <p><strong>Status:</strong> {room.room_status}</p>
        </div>
      ))}
    </div>
  );
}