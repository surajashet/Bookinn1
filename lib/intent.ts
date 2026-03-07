export function detectIntent(message: string) {

  const text = message.toLowerCase();

  // Greeting
  if (
    text.includes("hi") ||
    text.includes("hello") ||
    text.includes("hey")
  )
    return "greeting";

  // WiFi
  if (text.includes("wifi"))
    return "wifi_info";

  // Breakfast
  if (text.includes("breakfast"))
    return "breakfast_info";

  // Check-in
  if (text.includes("check in"))
    return "checkin_info";

  // Check-out
  if (text.includes("check out"))
    return "checkout_info";

  // Booking help
  if (
    text.includes("book") ||
    text.includes("reservation") ||
    text.includes("reserve")
  )
    return "booking_help";

  // Cancel help
  if (
    text.includes("cancel") ||
    text.includes("cancellation")
  )
    return "cancel_help";

  // Room availability
  if (text.includes("room") && text.includes("available"))
    return "room_availability";

  // Room info (SMART REGEX)
  if (/room\s*\d+/.test(text) && !text.includes("available"))
    return "room_info";

  return "fallback";
}