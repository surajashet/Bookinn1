import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { room_id, check_in_date, check_out_date } = await req.json();

  if (!room_id || !check_in_date || !check_out_date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("Bookings")
    .select("*")
    .eq("room_id", room_id)
    .eq("booking_status", "Confirmed")
    .lt("check_in_date", check_out_date)
    .gt("check_out_date", check_in_date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const isAvailable = data.length === 0;

  return NextResponse.json({ available: isAvailable });
}