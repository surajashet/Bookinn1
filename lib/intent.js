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
booking_help, cancel_help, room_search, room_info, my_bookings, off_topic
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

// ─── Helper: Parse name from userContext ─────────────────────────────────────
function getUserName(userContext) {
  if (!userContext) return null;
  const match = userContext.match(/user's name is ([^.]+)/);
  return match ? match[1].trim() : null;
}

// ─── Helper: Parse bookings from userContext ──────────────────────────────────
function getBookingSummary(userContext) {
  if (!userContext) return null;
  if (userContext.includes("no bookings yet")) return null;

  const match = userContext.match(/recent bookings: (.+)$/);
  if (!match) return null;

  // Parse each booking entry
  const entries = match[1].split(" | ");
  return entries.map(entry => {
    const id      = entry.match(/Booking #([^:]+)/)?.[1];
    const room    = entry.match(/Room ([^ ]+)/)?.[1];
    const type    = entry.match(/\(([^)]+)\)/)?.[1];
    const checkin = entry.match(/Check-in: ([^,]+)/)?.[1];
    const checkout= entry.match(/Check-out: ([^,]+)/)?.[1];
    const status  = entry.match(/Status: ([^,]+)/)?.[1];
    const guests  = entry.match(/Guests: (\d+)/)?.[1];
    return { id, room, type, checkin, checkout, status, guests };
  }).filter(b => b.id);
}

// ─── Helper: Format date nicely ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Helper: Check if checkin is today or tomorrow ───────────────────────────
function getCheckinAlert(bookings) {
  if (!bookings) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const b of bookings) {
    if (!b.checkin || !["confirmed", "checked_in"].includes(b.status)) continue;
    const cin = new Date(b.checkin);
    cin.setHours(0, 0, 0, 0);
    const diff = (cin - today) / (1000 * 60 * 60 * 24);
    if (diff === 0) return `⏰ Reminder: Your check-in for Room ${b.room} is **today**!`;
    if (diff === 1) return `⏰ Reminder: Your check-in for Room ${b.room} is **tomorrow** (${formatDate(b.checkin)}).`;
  }
  return null;
}

// ─── Intent Detection ─────────────────────────────────────────────────────────
export async function detectIntent(message, userContext = "") {
  const text = message.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(text)) return "greeting";
  if (text.includes("wifi") || text.includes("wi-fi") || text.includes("internet") || text.includes("password")) return "wifi_info";
  if (text.match(/\b(breakfast|dinner|lunch|food|restaurant|meal|menu|eat|dining)\b/)) return "food_info";
  if (text.includes("check in") || text.includes("checkin") || text.includes("check-in")) return "checkin_info";
  if (text.includes("check out") || text.includes("checkout") || text.includes("check-out")) return "checkout_info";
  if (text.match(/\b(book|boook|booking|reservation|reserve)\b/)) return "booking_help";
  if (text.match(/\b(cancel|cancellation)\b/)) return "cancel_help";
  if (text.match(/\b(my booking|my reservation|my stay|my room|show booking|view booking)\b/)) return "my_bookings";

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
export function getReply(intent, userContext = "") {
  const name     = getUserName(userContext);
  const bookings = getBookingSummary(userContext);
  const hi       = name ? `Hi ${name}! ` : "";
  const alert    = getCheckinAlert(bookings);

  const replies = {
    greeting: () => {
      let msg = `Hello${name ? `, ${name}` : ""}! 👋 Welcome to Bookinn. How can I assist you today?`;
      if (alert) msg += `\n\n${alert}`;
      return msg;
    },

    my_bookings: () => {
      if (!bookings) {
        return `${hi}You don't have any bookings yet. Would you like help making one? 🏨`;
      }

      const lines = bookings.map((b, i) => {
        const statusEmoji = {
          confirmed:   "✅",
          checked_in:  "🟢",
          checked_out: "🔵",
          cancelled:   "❌",
          no_show:     "⚠️",
        }[b.status] || "📋";

        return (
          `${statusEmoji} **Booking #${b.id}**\n` +
          `   Room: ${b.room} (${b.type})\n` +
          `   Check-in: ${formatDate(b.checkin)}\n` +
          `   Check-out: ${formatDate(b.checkout)}\n` +
          `   Guests: ${b.guests} | Status: ${b.status}`
        );
      });

      return `${hi}Here are your recent bookings:\n\n${lines.join("\n\n")}`;
    },

    cancel_help: () => {
      if (bookings) {
        const active = bookings.filter(b => b.status === "confirmed");
        if (active.length > 0) {
          const ids = active.map(b => `#${b.id}`).join(", ");
          return `${hi}Your active booking(s): ${ids}.\n\nTo cancel, contact the front desk with your booking ID or use the cancellation page. Free cancellation is available 24hrs before check-in.`;
        }
      }
      return `${hi}To cancel a booking, contact the front desk with your booking ID. Free cancellation is available 24hrs before check-in.`;
    },

    booking_help: () =>
      `${hi}To make a new booking, visit our booking page or ask me about available rooms. Need help with dates or room type?`,

    checkin_info: () => {
      let msg = `${hi}✅ Check-in time is 2:00 PM. Early check-in is available on request.`;
      if (alert) msg += `\n\n${alert}`;
      return msg;
    },

    checkout_info: () => {
      if (bookings) {
        const active = bookings.find(b => b.status === "checked_in");
        if (active) {
          return `${hi}🕐 Check-out time is 11:00 AM. Your current stay (Room ${active.room}) checks out on ${formatDate(active.checkout)}. Late check-out is available for an extra charge — ask the front desk!`;
        }
      }
      return `${hi}🕐 Check-out time is 11:00 AM. Late check-out is available for an extra charge.`;
    },

    wifi_info:    () => `${hi}Our WiFi name is **Bookinn_Guest** and the password is **bookinn2024** 🔐 Enjoy!`,
    food_info:    () => `${hi}🍽️ Restaurant hours:\n- Breakfast: 7–10:30 AM\n- Lunch: 12–3 PM\n- Dinner: 7–11 PM\n\nRoom service is available 24/7!`,
    room_search:  () => `${hi}We have Single, Double, Deluxe, and Suite rooms available. Want details on any specific type or shall I help you check availability?`,
    room_availability: () => `${hi}Please contact the front desk with your preferred dates for real-time availability.`,
    room_info:    () => `${hi}Please specify the room type or number you're interested in and I'll help you out!`,
    off_topic:    () => `${hi}I can only assist with hotel-related queries — rooms, bookings, check-in/out, food, or WiFi. 😊`,
    fallback:     () => `${hi}I'm not sure I understood that. You can ask me about rooms, bookings, check-in/out, food, or WiFi 😊`,
  };

  const handler = replies[intent];
  return handler ? handler() : replies.fallback();
}