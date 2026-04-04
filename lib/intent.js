// ─── Intent Detection (Keyword-based + LLM Fallback) ─────────────────────────

// ─── Groq LLM Fallback (if API key is available) ────────────────────────────
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
booking_help, cancel_help, room_search, room_info, my_bookings, 
amenities, help, off_topic
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

// ─── Intent Detection (Keyword-based + LLM Fallback) ─────────────────────────
export async function detectIntent(message, userContext = "") {
  const text = message.toLowerCase();

  // Greetings
  if (/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste)\b/.test(text)) return "greeting";
  
  // WiFi info
  if (text.includes("wifi") || text.includes("wi-fi") || text.includes("internet") || text.includes("password") || text.includes("network")) return "wifi_info";
  
  // Food info
  if (text.match(/\b(breakfast|dinner|lunch|food|restaurant|meal|menu|eat|dining|hungry|thirsty|coffee|tea)\b/)) return "food_info";
  
  // Check-in info
  if (text.includes("check in") || text.includes("checkin") || text.includes("check-in") || text.includes("arrival")) return "checkin_info";
  
  // Check-out info
  if (text.includes("check out") || text.includes("checkout") || text.includes("check-out") || text.includes("departure")) return "checkout_info";
  
  // Booking help
  if (text.match(/\b(book|booking|reservation|reserve|reserved|reserving)\b/)) return "booking_help";
  
  // Cancel help
  if (text.match(/\b(cancel|cancellation|cancelling|canceled)\b/)) return "cancel_help";

  // My bookings
  if (text.match(/\b(my booking|my reservation|my stay|my room|show booking|view booking|my bookings|my reservations)\b/)) return "my_bookings";

  // Amenities
  if (text.match(/\b(amenities|facilities|services|spa|gym|pool|concierge|laundry|transport|parking)\b/)) return "amenities";

  // Help
  if (text.match(/\b(help|what can you do|what do you do|capabilities)\b/)) return "help";

  // Room search
  if (
    text.includes("vacancy") ||
    text.includes("vacant") ||
    text.match(/\b(deluxe|single|suite|double|king|queen|presidential|classic|premier|villa)\b/) ||
    text.match(/room for \d+/) ||
    text.match(/\b(need|want|looking for|searching for)\b.*\broom/) ||
    text.match(/\b(\d+)\s*(people|guests|members|persons|person|adults?|children?)\b/)
  ) return "room_search";

  // Room availability with dates
  if (
    text.includes("room") && text.includes("available") &&
    /\d{4}-\d{2}-\d{2}/.test(text)
  ) return "room_availability";

  // Specific room info
  if (/room\s*\d+/.test(text)) return "room_info";
  if (text.includes("room") && (text.includes("tell") || text.includes("about") || text.includes("info") || text.includes("details"))) return "room_info";

  // Use LLM for complex queries (if API key available)
  return await llmClassify(message);
}

// ─── Replies with Personalization ────────────────────────────────────────────
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
      return `${hi}❌ **Cancellation Policy**\n\n• Free cancellation up to 24 hours before check-in\n• Cancellations within 24 hours: 1 night charge\n• No-shows: full booking amount charged\n\nTo cancel, visit 'My Bookings' page.`;
    },

    booking_help: () =>
      `${hi}📅 **Booking Information**\n\nTo book a room:\n1. Visit our 'Rooms' page\n2. Select your preferred room type\n3. Choose check-in/out dates\n4. Enter guest details\n5. Complete payment\n\nNeed help? Call our front desk!`,

    checkin_info: () => {
      let msg = `${hi}✅ **Check-in Details**\n• Standard check-in: 2:00 PM\n• Early check-in available upon request\n• 24/7 front desk service\n• ID proof required for all guests`;
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
      return `${hi}🕐 **Check-out Details**\n• Standard check-out: 11:00 AM\n• Late check-out available until 2:00 PM (charges apply)\n• Luggage storage available after check-out`;
    },

    wifi_info: () => `${hi}🔐 **WiFi Details**\nNetwork: **Bookinn_Guest**\nPassword: **bookinn2024**\n\nEnjoy complimentary high-speed internet throughout the property!`,
    
    food_info: () => `${hi}🍽️ **Restaurant Hours:**\n• Breakfast: 7:00 AM – 10:30 AM\n• Lunch: 12:00 PM – 3:00 PM\n• Dinner: 7:00 PM – 11:00 PM\n\n🍕 Room service is available 24/7! Just dial 9 from your room phone.`,
    
    room_search: () => `${hi}🏨 **Available Room Types:**\n\n• **Classic Room** - ₹4,200/night\n• **Deluxe Room** - ₹7,200/night  \n• **Premier Room** - ₹9,800/night\n• **Suite** - ₹12,500/night\n• **Pool Villa** - ₹22,000/night\n\nWould you like details about any specific room type?`,
    
    room_availability: () => `${hi}📆 For real-time room availability, please visit our 'Rooms' page and select your check-in/out dates. Or call our front desk for assistance!`,
    
    room_info: () => `${hi}🏨 Which room would you like to know more about? Options: Classic, Deluxe, Premier, Suite, or Pool Villa. Just tell me the name!`,
    
    amenities: () => `${hi}🌟 **Our Amenities & Services:**\n• 24/7 Concierge\n• In-Room Dining\n• Spa & Wellness Center\n• Fitness Centre\n• Swimming Pool\n• Chauffeur Service\n• Laundry Service\n• High-Speed WiFi\n\nAnything specific you'd like to know about?`,
    
    help: () => `${hi}🤖 I can help you with:\n• Room bookings and availability 🏨\n• Check-in/out times 🕐\n• Restaurant and food services 🍽️\n• WiFi information 🔐\n• Amenities and facilities 🌟\n• Cancellations ❌\n• Viewing your bookings 📋\n\nJust ask me anything about Bookinn!`,
    
    off_topic: () => `${hi}I can only assist with hotel-related queries — rooms, bookings, check-in/out, food, or WiFi. 😊`,
    
    fallback: () => `${hi}I'm not sure I understood that. You can ask me about:\n• Room bookings 🏨\n• Check-in/out times 🕐\n• Food & restaurant 🍽️\n• WiFi information 🔐\n• Amenities & services 🌟\n• Cancellations ❌\n• Your bookings 📋\n\nHow can I help you today?`
  };

  const handler = replies[intent];
  return handler ? handler() : replies.fallback();
}

// ─── Process message and get response (with optional user context) ───────────
export async function processMessage(message, userContext = "") {
  const intent = await detectIntent(message, userContext);
  const reply = getReply(intent, userContext);
  return { intent, reply };
}