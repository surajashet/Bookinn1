import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/intent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {

  const body = await req.json();
  const message = body.message;

  const intent = detectIntent(message);
  console.log("Intent detected:", intent)

  switch (intent) {
    
     case "greeting":
    return NextResponse.json({
      reply:
        "Hello 👋 I'm the Bookinn Assistant.\nI can help you check room availability, room details, WiFi info, and bookings.\nHow can I help you today?"
    });

    case "wifi_info":
      return NextResponse.json({
        reply: "📶 The WiFi password is BookinnGuest."
      });


    case "breakfast_info":
      return NextResponse.json({
        reply: "🍳 Breakfast is served from 7 AM to 10 AM."
      });


    case "checkin_info":
      return NextResponse.json({
        reply: "🕑 Check-in time is 12:00 PM."
      });


    case "checkout_info":
      return NextResponse.json({
        reply: "🕚 Check-out time is 11:00 AM."
      });


    case "room_info": {

      const roomMatch = message.match(/room\s*(\d+)/);

      if (!roomMatch) {
        return NextResponse.json({
          reply: "Please tell me the room number. Example: Tell me about room 101."
        });
      }

      const room_number = roomMatch[1];

      const { data, error } = await supabaseAdmin
        .from("rooms") // change if teammates renamed table
        .select("*")
        .eq("room_number", room_number)
        .single();

      if (error || !data) {
        return NextResponse.json({
          reply: `Sorry, I couldn't find room ${room_number}.`
        });
      }

      return NextResponse.json({
        reply: `Room ${data.room_number}
Type: ${data.room_type}
Capacity: ${data.capacity}
Price: ₹${data.base_price}
Status: ${data.room_status}`
      });

    }


    case "room_availability": {

      const roomMatch = message.match(/room\s*(\d+)/);
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/g);

      if (!roomMatch || !dateMatch || dateMatch.length < 2) {
        return NextResponse.json({
          reply:
            "Please ask like: Is room 102 available from 2026-03-02 to 2026-03-04?"
        });
      }

      const room_id = parseInt(roomMatch[1]);
      const check_in_date = dateMatch[0];
      const check_out_date = dateMatch[1];

      const res = await fetch("http://localhost:3000/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id,
          check_in_date,
          check_out_date
        })
      });

      const data = await res.json();

      return NextResponse.json({
        reply: data.available
          ? `✨ Room ${room_id} is available for those dates!`
          : `⚠️ Room ${room_id} is not available for those dates.`
      });

    }


    case "booking_help":
      return NextResponse.json({
        reply:
          "You can book a room through the website or contact the front desk 📞 +91XXXXXXXX."
      });


    case "cancel_help":
      return NextResponse.json({
        reply:
          "To cancel a booking, please contact our front desk or login to your account."
      });


    default:
      return NextResponse.json({
        reply:
          "Sorry, I didn’t understand that. I can help with room availability, wifi, breakfast time, and bookings 😊"
      });

  }

}