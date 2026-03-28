import { useState, useRef, useEffect } from "react";

export default function BookinnChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = { sender: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Something went wrong." }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 28, right: 28, width: 56, height: 56,
          borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          border: "none", color: "#fff", fontSize: 22, cursor: "pointer",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,99,235,0.4)", transition: "transform .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, width: 360,
          height: 500, background: "#fff", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex",
          flexDirection: "column", overflow: "hidden", zIndex: 1000,
          animation: "chatFadeUp 0.3s ease",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>🤖</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Bookinn Assistant</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Online • Replies instantly</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 30, height: 30, borderRadius: 10, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px", display: "flex",
            flexDirection: "column", gap: 12, background: "#f8fafc",
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
                <p style={{ fontWeight: 600, color: "#475569", margin: 0 }}>Hello!</p>
                <p style={{ fontSize: 13, margin: "4px 0 0" }}>How can I help you today?</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end", gap: 8,
                }}>
                  {msg.sender === "bot" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", background: "#2563eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>AI</div>
                  )}
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", borderRadius: 16,
                    fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: msg.sender === "user" ? "#2563eb" : "#fff",
                    color: msg.sender === "user" ? "#fff" : "#1e293b",
                    borderBottomRightRadius: msg.sender === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.sender === "bot" ? 4 : 16,
                    boxShadow: msg.sender === "bot" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                    {msg.text}
                  </div>
                  {msg.sender === "user" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", background: "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#64748b", fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>You</div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                style={{
                  flex: 1, border: "1px solid #e2e8f0", borderRadius: 12,
                  padding: "10px 14px", fontSize: 13, fontFamily: "inherit",
                  outline: "none", resize: "none", maxHeight: 100,
                  color: "#1e293b", background: "#f8fafc", lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 12, border: "none",
                  background: message.trim() ? "#2563eb" : "#e2e8f0",
                  color: message.trim() ? "#fff" : "#94a3b8",
                  cursor: message.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}
              >➤</button>
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "6px 0 0" }}>
              Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}