'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Room {
  room_id: number;
  room_number: string;
  room_type: string;
  floor_number: number;
  capacity: number;
  base_price: number;
  room_status: string;
  description: string | null;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRooms(data.data);
        } else {
          setError('Failed to fetch rooms');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rooms:', err);
        setError('Could not connect to server');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading rooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Our Rooms</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.room_id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2">Room {room.room_number}</h2>
                <p className="text-gray-600 mb-2">Type: {room.room_type}</p>
                <p className="text-gray-600 mb-2">Floor: {room.floor_number}</p>
                <p className="text-gray-600 mb-2">Capacity: {room.capacity} guests</p>
                <p className="text-2xl font-bold text-blue-600 mb-4">₹{room.base_price}/night</p>
                <p className="text-gray-600 mb-4">
                  Status: 
                  <span className={`ml-2 ${
                    room.room_status === 'available' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {room.room_status}
                  </span>
                </p>
                {room.description && (
                  <p className="text-gray-600 mb-4">{room.description}</p>
                )}
                <Link 
                  href={`/book?room=${room.room_id}`}
                  className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
