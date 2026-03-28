// ─── Groq LLM Fallback ────────────────────────────────────────────────────────
async function llmClassify(message) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return "fallback";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 20,
        messages: [
          {
            role: "system",
            content: `You are an intent classifier for a hotel booking chatbot called Bookinn.
Classify the message into exactly ONE of these intents:
greeting, wifi_info, food_info, checkin_info, checkout_info,
booking_help, cancel_help, room_search, room_info, off_topic
Use "off_topic" for anything NOT related to hotel services.
Reply with ONLY the intent label. Nothing else.`
          },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.trim();
    console.log("📦 Groq intent:", intent);
    return intent || "fallback";
  } catch (err) {
    console.error("❌ Groq classify error:", err.message);
    return "fallback";
  }
}

// ─── Intent Detection ─────────────────────────────────────────────────────────
export async function detectIntent(message) {
  const text = message.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(text)) return "greeting";
  if (text.includes("wifi") || text.includes("wi-fi") || text.includes("internet") || text.includes("password")) return "wifi_info";
  if (text.match(/\b(breakfast|dinner|lunch|food|restaurant|meal|menu|eat|dining)\b/)) return "food_info";
  if (text.includes("check in") || text.includes("checkin") || text.includes("check-in")) return "checkin_info";
  if (text.includes("check out") || text.includes("checkout") || text.includes("check-out")) return "checkout_info";
  if (text.match(/\b(book|boook|booking|reservation|reserve)\b/)) return "booking_help";
  if (text.match(/\b(cancel|cancellation)\b/)) return "cancel_help";

  if (
    text.includes("vacancy") ||
    text.match(/\b(deluxe|single|suite|double)\b/) ||
    text.match(/room for \d+/) ||
    text.match(/\b(need|want|looking for)\b.*\broom/) ||
    text.match(/\b(\d+)\s*(people|guests|members|persons|person)\b/) ||
    (text.includes("available") && !/room\s*\d+/.test(text))
  ) return "room_search";

  if (
    text.includes("room") && text.includes("available") &&
    /room\s*\d+/.test(text) && /\d{4}-\d{2}-\d{2}/.test(text)
  ) return "room_availability";

  if (/room\s*\d+/.test(text)) return "room_info";

  return await llmClassify(message);
}

// ─── Replies ──────────────────────────────────────────────────────────────────
export function getReply(intent) {
  const replies = {
    greeting: "Hello! Welcome to Bookinn 👋 How can I assist you today?",
    wifi_info: "Our WiFi is Bookinn_Guest, password: bookinn2024 🔐",
    food_info: "🍽️ Restaurant hours:\n- Breakfast: 7–10:30 AM\n- Lunch: 12–3 PM\n- Dinner: 7–11 PM\nRoom service available 24/7!",
    checkin_info: "✅ Check-in time is 2:00 PM. Early check-in available on request.",
    checkout_info: "🕐 Check-out time is 11:00 AM. Late check-out available for extra charge.",
    booking_help: "To book a room, visit our booking page or call the front desk. Need help with anything specific?",
    cancel_help: "To cancel, contact the front desk with your booking ID. Free cancellation 24hrs before check-in.",
    room_search: "We have Single, Double, Deluxe, and Suite rooms available. Want details on any specific type?",
    room_availability: "Please contact the front desk with your preferred dates for real-time availability.",
    room_info: "Please specify the room type or number you're interested in!",
    off_topic: "I can only assist with hotel-related queries — rooms, booking, check-in/out, food, or WiFi. 😊",
    fallback: "I'm not sure I understood that. You can ask me about rooms, booking, check-in/out, food, or WiFi 😊",
  };

  return replies[intent] || replies.fallback;
}