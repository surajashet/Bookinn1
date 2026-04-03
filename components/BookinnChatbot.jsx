import { useState, useRef, useEffect } from "react";

const ACCENT = "#4A7C72";
const ACCENT_L = "#6A9E94";

export default function BookinnChatbot({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Fetch user info when chat opens
  useEffect(() => {
    if (isOpen && userId && !userData) {
      setLoadingUser(true);
      fetch(`http://localhost:5000/api/chat/userinfo/${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setUserData(d.data);
        })
        .catch(() => {})
        .finally(() => setLoadingUser(false));
    }
  }, [isOpen, userId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = { sender: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userId }), // ✅ send userId to backend
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong. Please try again." },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Greeting name: use fetched username or fallback
  const displayName = userData?.username || null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 28, right: 28, width: 56, height: 56,
          borderRadius: "50%", background: ACCENT,
          border: "none", color: "#fff", fontSize: 22, cursor: "pointer",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(74,124,114,0.3)", transition: "transform .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed", bottom: 96, right: 28, width: 380,
            height: 540, background: "#fff", borderRadius: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
            display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1000,
            animation: "chatFadeUp 0.3s ease", fontFamily: "'CabinetGrotesk', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: ACCENT, padding: "20px 24px", display: "flex",
              alignItems: "center", justifyContent: "space-between",
              borderBottom: `1px solid ${ACCENT_L}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, backdropFilter: "blur(4px)",
                }}
              >
                🏨
              </div>
              <div>
                <div
                  style={{
                    color: "#fff", fontWeight: 500, fontSize: 15, letterSpacing: "-0.2px",
                  }}
                >
                  Bookinn Assistant
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: "0.3px",
                  }}
                >
                  {/* Show user's name in header subtitle if available */}
                  {displayName ? `Hi, ${displayName} · Available 24/7` : "Available 24/7"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
                width: 32, height: 32, borderRadius: 12, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1, overflowY: "auto", padding: "20px", display: "flex",
              flexDirection: "column", gap: 12, background: "#FDFCFB",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center", marginTop: "auto", marginBottom: "auto",
                  padding: "20px 0",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>✨</div>

                {/* Personalised greeting */}
                {loadingUser ? (
                  <p
                    style={{
                      fontWeight: 400, color: "#A09890", margin: 0, fontSize: 13,
                      fontFamily: "'CabinetGrotesk', sans-serif",
                    }}
                  >
                    Loading…
                  </p>
                ) : (
                  <>
                    <p
                      style={{
                        fontWeight: 400, color: "#1E1C1A", margin: 0, fontSize: 14,
                        fontFamily: "'Soria', serif",
                      }}
                    >
                      {displayName ? `Hello, ${displayName} 👋` : "Hello there 👋"}
                    </p>
                    <p
                      style={{
                        fontSize: 12, margin: "8px 0 0", color: "#6B6560",
                        fontFamily: "'CabinetGrotesk', sans-serif", fontWeight: 200,
                      }}
                    >
                      {displayName
                        ? `How can I assist with your stay today?`
                        : "How can I assist with your stay?"}
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-end", gap: 8,
                  }}
                >
                  {msg.sender === "bot" && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: "50%", background: ACCENT,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 400, flexShrink: 0,
                      }}
                    >
                      🏨
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "75%", padding: "12px 16px", borderRadius: 16,
                      fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: msg.sender === "user" ? ACCENT : "#fff",
                      color: msg.sender === "user" ? "#fff" : "#1E1C1A",
                      borderBottomRightRadius: msg.sender === "user" ? 4 : 16,
                      borderBottomLeftRadius: msg.sender === "bot" ? 4 : 16,
                      boxShadow:
                        msg.sender === "bot" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      border: msg.sender === "bot" ? "1px solid #EDE7DE" : "none",
                      fontFamily: "'CabinetGrotesk', sans-serif", fontWeight: 200,
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === "user" && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: "50%", background: "#EDE7DE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: ACCENT, fontSize: 11, fontWeight: 400, flexShrink: 0,
                      }}
                    >
                      {/* Show user initial if name available */}
                      {displayName ? displayName[0].toUpperCase() : "You"}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "16px 20px", background: "#fff", borderTop: "1px solid #EDE7DE",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                rows={1}
                style={{
                  flex: 1, border: "1px solid #EDE7DE", borderRadius: 16,
                  padding: "10px 16px", fontSize: 12,
                  fontFamily: "'CabinetGrotesk', sans-serif",
                  outline: "none", resize: "none", maxHeight: 100,
                  color: "#1E1C1A", background: "#FDFCFB", lineHeight: 1.5,
                  fontWeight: 200, transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE7DE")}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 40, border: "none",
                  background: message.trim() ? ACCENT : "#EDE7DE",
                  color: message.trim() ? "#fff" : "#A09890",
                  cursor: message.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0, transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (message.trim()) e.currentTarget.style.background = ACCENT_L;
                }}
                onMouseLeave={(e) => {
                  if (message.trim()) e.currentTarget.style.background = ACCENT;
                }}
              >
                ➤
              </button>
            </div>
            <p
              style={{
                fontSize: 9, color: "#A09890", textAlign: "center",
                margin: "8px 0 0", letterSpacing: "0.3px",
                fontFamily: "'CabinetGrotesk', sans-serif", fontWeight: 200,
              }}
            >
              Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
      `}</style>
    </>
  );
}