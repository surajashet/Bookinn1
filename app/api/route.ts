import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/intent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();
  const message = body.message;

  const intent = detectIntent(message);

  switch (intent) {
    case "greeting":
  return NextResponse.json({
    reply:
      "Hello 👋 I'm the Bookinn Assistant.\nI can help you check room availability, room details, WiFi info, and bookings.\nHow can I help you today?"
  });
    case "wifi_info":
      return NextResponse.json({
        reply: "📶 The WiFi password is BookinnGuest.",
      });


    case "breakfast_info":
      return NextResponse.json({
        reply: "🍳 Breakfast is served from 7 AM to 10 AM.",
      });

    case "checkin_info":
      return NextResponse.json({
        reply: "🕑 Check-in time is 12:00 PM.",
      });

    case "checkout_info":
      return NextResponse.json({
        reply: "🕚 Check-out time is 11:00 AM.",
      });

    case "booking_help":
      return NextResponse.json({
        reply:
          "You can book a room through the website or contact the front desk 📞 +91XXXXXXXX.",
      });

    case "cancel_help":
      return NextResponse.json({
        reply:
          "To cancel a booking, please contact our front desk or login to your account.",
      });

    default:
      return NextResponse.json({
        reply:
          "Sorry, I didn't understand that. I can help with room availability, hotel info, and bookings 😊",
      });
  }
}