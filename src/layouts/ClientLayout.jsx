// FILE: src/layouts/ClientLayout.jsx
import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../assets/client.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NAV = [
  { to: "/client/dashboard", label: "Home",     icon: "fa-solid fa-house" },
  { to: "/client/rooms",     label: "Rooms",     icon: "fa-solid fa-bed" },
  { to: "/client/bookings",  label: "Bookings",  icon: "fa-solid fa-calendar-check" },
  { to: "/client/services",  label: "Services",  icon: "fa-solid fa-concierge-bell" },
  { to: "/client/payments",  label: "Payments",  icon: "fa-solid fa-credit-card" },
  { to: "/client/invoices",  label: "Invoices",  icon: "fa-solid fa-file-invoice" },
];

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "bot", text: "Welcome to BOOKINN. How may I assist you today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput(""); setMsgs(p => [...p, { role: "user", text }]); setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/client/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: "bot", text: data.reply || "I'll look into that for you." }]);
    } catch {
      setMsgs(p => [...p, { role: "bot", text: "I'm having trouble connecting. Please try again shortly." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {open && (
        <div style={{ position:"fixed", bottom:90, right:28, width:340, background:"#fff", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,.15)", zIndex:500, overflow:"hidden", animation:"bkFadeUp .25s ease" }}>
          <div style={{ background:"#1E1C1A", padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ color:"#fff", fontFamily:"'Soria',serif", fontWeight:600, fontSize:15 }}>AI Concierge</div>
              <div style={{ color:"rgba(255,255,255,.5)", fontSize:11, marginTop:2 }}>BOOKINN · 24/7</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", width:28, height:28, borderRadius:12, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
          <div style={{ height:280, overflowY:"auto", padding:"16px 16px 8px", display:"flex", flexDirection:"column", gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", background:m.role==="user"?"#1F2A3A":"#EBF0EE", color:m.role==="user"?"#fff":"#2A2A28", padding:"10px 14px", borderRadius:m.role==="user"?"14px 14px 2px 14px":"14px 14px 14px 2px", fontSize:13, maxWidth:"82%", lineHeight:1.5 }}>{m.text}</div>
            ))}
            {loading && (
              <div style={{ alignSelf:"flex-start", background:"#E8EEEC", padding:"10px 14px", borderRadius:"14px 14px 14px 2px", display:"flex", gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#4A7C72", animation:`bkBounce 1s ease ${i*.15}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:"8px 12px 14px", display:"flex", gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything…"
              style={{ flex:1, border:"1px solid #D6E3DF", borderRadius:12, padding:"10px 14px", fontSize:13, fontFamily:"inherit", outline:"none", background:"#F4F7F6" }} />
            <button onClick={send} style={{ width:40, height:40, background:"#4A7C72", border:"none", borderRadius:12, cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(s=>!s)} style={{ position:"fixed", bottom:28, right:28, width:54, height:54, borderRadius:"50%", background:"#1E1C1A", border:"2px solid #4A7C72", color:"#4A7C72", fontSize:20, cursor:"pointer", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(31,42,58,.35)", transition:"transform .2s" }}>
        <i className={open ? "fa-solid fa-xmark" : "fa-regular fa-comment-dots"} />
      </button>
    </>
  );
}

export default function ClientLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try { const r = localStorage.getItem("client_profile"); if (r) setProfile(JSON.parse(r)); } catch {}
  }, []);

  const initials = profile?.name ? profile.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) : "G";
  const firstName = profile?.name?.split(" ")[0] || "Guest";
  const signOut = () => { localStorage.removeItem("token"); localStorage.removeItem("client_profile"); navigate("/login"); };

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7F6", fontFamily:"'CabinetGrotesk',sans-serif" }}>
      <style>{`
      
        @keyframes bkFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bkBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        @keyframes bkShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes bkSpin{to{transform:rotate(360deg)}}
        .bk-nav-link{transition:all .18s;text-decoration:none;}
        .bk-nav-link:hover{background:rgba(255,255,255,0.1)!important;color:#fff!important;}
        .bk-nav-link.active{background:rgba(255,255,255,0.15)!important;color:#fff!important;font-weight:400;letter-spacing:.04em;}.scrolled .bk-nav-link.active{background:#1E1C1A!important;color:#F4F7F6!important;}
        .bk-page{animation:bkFadeUp .35s ease;}
        .bk-row-hover:hover td{background:#f9f7f4;}
        .bk-card-hover{transition:transform .22s,box-shadow .22s;}
        .bk-card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,.09)!important;}
        .bk-btn-hover:hover{opacity:.86;}
        .bk-svc-btn:hover{border-color:#4A7C72!important;background:rgba(198,161,91,.04)!important;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d4cbc0;border-radius:3px}
      `}</style>

      {/* ── TOP NAV (Updated to Translucent) ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, background:scrolled?"rgba(244,247,246,0.92)":"transparent", backdropFilter:scrolled?"blur(16px)":"none", borderBottom:scrolled?"1px solid #D6E3DF":"none", boxShadow:"none", transition:"background .3s, backdrop-filter .3s, border .3s" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", display:"flex", alignItems:"center", justifyContent:"space-between", height:62 }}>
          {/* left — star logo */}
          <NavLink to="/client/dashboard" style={{ textDecoration:"none", display:"flex", alignItems:"center", flexShrink:0 }}>
            <i className="fa-solid fa-star" style={{ color:"#4A7C72", fontSize:16 }} />
          </NavLink>

          {/* right — nav links + divider + profile */}
          <div style={{ display:"flex", alignItems:"center", gap:2 }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `bk-nav-link${isActive?" active":""}`}
                style={{ display:"flex", alignItems:"center", padding:"7px 14px", borderRadius:12, color:scrolled?"#6B6560":"rgba(255,255,255,0.85)", fontSize:12.5, letterSpacing:".04em", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>
                {item.label}
              </NavLink>
            ))}
            <div style={{ width:1, height:18, background:scrolled?"#D6E3DF":"rgba(255,255,255,0.2)", margin:"0 12px" }} />
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:scrolled?"#E8EEEC":"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:scrolled?"1px solid #D6E3DF":"1px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><i className="fa-regular fa-user" style={{ fontSize:13, color:scrolled?"#6B6560":"rgba(255,255,255,0.85)" }} /></div>
              <div style={{ lineHeight:1.3 }}>
                <div style={{ fontSize:13, fontWeight:400, color:scrolled?"#1E1C1A":"rgba(255,255,255,0.85)" }}>{firstName}</div>
                <div style={{ fontSize:10.5, color:scrolled?"#A09890":"rgba(255,255,255,0.45)" }}>{profile?.since ? `Since ${new Date(profile.since).getFullYear()}` : "Member"}</div>
              </div>
            </div>
            <button onClick={signOut} title="Sign out" style={{ background:"transparent", border:"none", color:scrolled?"#A09890":"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:15, padding:"6px 8px", borderRadius:6 }}>
              <i className="fa-solid fa-sign-out-alt" />
            </button>
          </div>
          </div>{/* end right group */}
        </div>
      </nav>

      <main style={{ width:"100%" }} className="bk-page">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}