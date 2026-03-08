// FILE: src/pages/LandingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {title:"Smart Bookings",     desc:"Manage check-ins, extensions and cancellations in seconds.",           icon:"fa-regular fa-calendar-check",  color:"#f5f0e8"},
  {title:"AI Concierge",       desc:"Our 24/7 virtual assistant handles every request instantly.",          icon:"fa-regular fa-comment-dots",    color:"#e8f0e8"},
  {title:"GST Invoicing",      desc:"Automated, compliant digital invoices issued upon checkout.",          icon:"fa-regular fa-file-invoice",    color:"#e8eef5"},
  {title:"Room Service",       desc:"Order dining or amenities directly to your door.",                     icon:"fa-regular fa-bell-concierge",  color:"#f5e8f0"},
];

const STATS = [
  {val:"4,800+", label:"Happy Guests"},
  {val:"98%",    label:"Satisfaction Rate"},
  {val:"24/7",   label:"Concierge Support"},
  {val:"₹0",     label:"Hidden Fees"},
];

const ROOMS_PREVIEW = [
  {name:"Deluxe Room",      type:"Standard",    price:"8,500",  img:null, amenities:["King Bed","City View","WiFi"]},
  {name:"Premium Suite",    type:"Suite",       price:"18,000", img:null, amenities:["Living Area","Jacuzzi","Balcony"]},
  {name:"Presidential Suite",type:"Presidential",price:"28,000",img:null, amenities:["Butler","Private Pool","Helipad"]},
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredRoom, setHoveredRoom] = useState(null);

  return (
    <div style={{ background:"#f9f7f4", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes lpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .lp-btn-primary:hover{opacity:.88;}
        .lp-btn-outline:hover{background:#1F2A3A!important;color:#C6A15B!important;}
        .lp-feat-card:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.08)!important;}
        .lp-feat-card{transition:transform .22s,box-shadow .22s;}
        .lp-room-card:hover .lp-room-img{transform:scale(1.05);}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d4cbc0;border-radius:3px}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(255,255,255,.96)", backdropFilter:"blur(14px)", borderBottom:"1px solid #e8e2da", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", display:"flex", alignItems:"center", height:62, justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"#1F2A3A", display:"flex", alignItems:"center", gap:8 }}>
            <i className="fa-solid fa-star" style={{ color:"#C6A15B", fontSize:14 }} /> BOOKINN
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>navigate("/client/dashboard")} className="lp-btn-outline"
              style={{ padding:"9px 20px", background:"transparent", color:"#4a4a48", border:"1px solid #e8e2da", borderRadius:8, fontFamily:"inherit", fontSize:13.5, fontWeight:500, cursor:"pointer", transition:"all .2s" }}>
              Sign In
            </button>
            <button onClick={()=>navigate("/client/dashboard")} className="lp-btn-primary"
              style={{ padding:"9px 22px", background:"linear-gradient(135deg,#1F2A3A,#2C3A4F)", color:"#C6A15B", border:"none", borderRadius:8, fontFamily:"inherit", fontSize:13.5, fontWeight:600, cursor:"pointer" }}>
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"88vh", alignItems:"center", maxWidth:1200, margin:"0 auto", padding:"0 32px", gap:48 }}>
        {/* Left */}
        <div style={{ animation:"lpFadeUp .8s ease" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#f5f0e8", border:"1px solid rgba(198,161,91,.3)", color:"#9a6e1a", padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:500, marginBottom:24 }}>
            <i className="fa-solid fa-star" style={{ fontSize:10 }} /> Luxury Hotel Management
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,5.5vw,68px)", fontWeight:600, color:"#1F2A3A", lineHeight:1.1, marginBottom:24 }}>
            Experience <em style={{ color:"#C6A15B", fontStyle:"italic" }}>Effortless</em><br />
            Hotel Living.
          </h1>
          <p style={{ fontSize:17, color:"#7a7a76", lineHeight:1.7, marginBottom:40, maxWidth:480 }}>
            From smart room bookings to AI concierge, manage your entire luxury stay with elegance and ease.
          </p>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:48 }}>
            <button onClick={()=>navigate("/client/dashboard")} className="lp-btn-primary"
              style={{ padding:"14px 32px", background:"linear-gradient(135deg,#1F2A3A,#2C3A4F)", color:"#C6A15B", border:"none", borderRadius:10, fontFamily:"inherit", fontSize:15, fontWeight:600, cursor:"pointer" }}>
              <i className="fa-solid fa-arrow-right" style={{ marginRight:10 }} />Enter Portal
            </button>
            <button onClick={()=>navigate("/client/rooms")} className="lp-btn-outline"
              style={{ padding:"14px 32px", background:"transparent", color:"#4a4a48", border:"1px solid #d4cbc0", borderRadius:10, fontFamily:"inherit", fontSize:15, cursor:"pointer", transition:"all .2s" }}>
              Explore Rooms
            </button>
          </div>
          {/* Stats row */}
          <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:"#1F2A3A" }}>{s.val}</div>
                <div style={{ fontSize:12, color:"#a9a9a4", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual */}
        <div style={{ position:"relative", height:520, animation:"lpFadeUp 1s ease .2s both" }}>
          {/* Main card */}
          <div style={{ position:"absolute", top:"10%", left:"5%", right:"0", background:"linear-gradient(145deg,#1F2A3A,#2C3A4F)", borderRadius:20, padding:"36px 32px", boxShadow:"0 24px 60px rgba(31,42,58,.3)", animation:"lpFloat 5s ease infinite" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:14 }}>Featured Room</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:"#fff", marginBottom:6 }}>Presidential Suite</div>
            <div style={{ color:"#C6A15B", fontSize:13, marginBottom:22 }}>Top Floor · Ocean View</div>
            {[["Nightly Rate","₹28,000"],["Occupancy","2 Guests"],["Status","Available"]].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,.07)", fontSize:13 }}>
                <span style={{ color:"rgba(255,255,255,.45)" }}>{l}</span>
                <span style={{ color:"#fff", fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <button onClick={()=>navigate("/client/rooms")} style={{ marginTop:20, width:"100%", padding:"12px 0", background:"#C6A15B", color:"#1F2A3A", border:"none", borderRadius:9, fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Book This Room
            </button>
          </div>

          {/* Floating badge */}
          <div style={{ position:"absolute", bottom:"8%", left:"2%", background:"#fff", borderRadius:12, padding:"16px 20px", boxShadow:"0 8px 24px rgba(0,0,0,.1)", animation:"lpFloat 4s ease .8s infinite" }}>
            <div style={{ fontSize:11, color:"#a9a9a4", marginBottom:4 }}>Loyalty Points</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:"#C6A15B" }}>2,400 pts</div>
            <div style={{ fontSize:11, color:"#5F8B6F", marginTop:2 }}>↑ 120 this week</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:"100px 32px", background:"#fff" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ fontSize:11, color:"#C6A15B", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", marginBottom:10 }}>Why BOOKINN</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:600, color:"#1F2A3A", marginBottom:14 }}>
              Refined <em style={{ fontStyle:"italic", color:"#C6A15B" }}>Amenities</em>
            </h2>
            <p style={{ fontSize:16, color:"#7a7a76", maxWidth:520, margin:"0 auto", lineHeight:1.65 }}>
              Everything you need for a perfect stay, right at your fingertips.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>
            {FEATURES.map((f,i) => (
              <div key={f.title} className="lp-feat-card" style={{ background:"#f9f7f4", borderRadius:14, padding:"28px 24px", border:"1px solid #e8e2da", boxShadow:"0 2px 8px rgba(0,0,0,.04)", animationDelay:`${i*.07}s` }}>
                <div style={{ width:52, height:52, borderRadius:14, background:f.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#1F2A3A", marginBottom:18 }}>
                  <i className={f.icon} />
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:"#2A2A28", marginBottom:8 }}>{f.title}</h3>
                <p style={{ fontSize:13.5, color:"#7a7a76", lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOMS PREVIEW ── */}
      <section style={{ padding:"90px 32px", background:"#f9f7f4" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40, flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ fontSize:11, color:"#C6A15B", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Accommodations</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:600, color:"#1F2A3A" }}>Our <em style={{ fontStyle:"italic", color:"#C6A15B" }}>Rooms</em></h2>
            </div>
            <button onClick={()=>navigate("/client/rooms")}
              style={{ padding:"11px 24px", background:"transparent", color:"#4a4a48", border:"1px solid #d4cbc0", borderRadius:9, fontFamily:"inherit", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              View All Rooms <i className="fa-solid fa-arrow-right" style={{ fontSize:11 }} />
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
            {ROOMS_PREVIEW.map((room,i) => (
              <div key={room.name} onMouseEnter={()=>setHoveredRoom(i)} onMouseLeave={()=>setHoveredRoom(null)}
                style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #e8e2da", boxShadow:hoveredRoom===i?"0 14px 36px rgba(0,0,0,.1)":"0 2px 8px rgba(0,0,0,.04)", transform:hoveredRoom===i?"translateY(-4px)":"translateY(0)", transition:"all .24s", cursor:"pointer" }}
                onClick={()=>navigate("/client/rooms")}>
                <div style={{ height:200, background:`linear-gradient(135deg,hsl(${210+i*20},30%,${25+i*4}%) 0%,hsl(${220+i*15},25%,${35+i*4}%) 100%)`, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:.1, fontFamily:"'Cormorant Garamond',serif", fontSize:80, fontWeight:700, color:"#C6A15B" }}>B</div>
                  <div style={{ position:"absolute", top:12, right:12, background:"rgba(31,42,58,.82)", backdropFilter:"blur(6px)", color:"#C6A15B", padding:"5px 11px", borderRadius:8, fontSize:13, fontWeight:600 }}>
                    ₹{room.price}<span style={{ color:"rgba(255,255,255,.55)", fontWeight:400, fontSize:11 }}>/n</span>
                  </div>
                </div>
                <div style={{ padding:"20px 20px 22px" }}>
                  <div style={{ fontSize:10.5, color:"#C6A15B", fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>{room.type}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:"#2A2A28", marginBottom:12 }}>{room.name}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                    {room.amenities.map((a,j) => <span key={j} style={{ background:"#f5f3ef", color:"#7a7a76", padding:"3px 9px", borderRadius:6, fontSize:11 }}>{a}</span>)}
                  </div>
                  <div style={{ fontSize:13, color:"#C6A15B", fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                    Book Now <i className="fa-solid fa-arrow-right" style={{ fontSize:10 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"90px 32px", background:"linear-gradient(135deg,#1F2A3A 0%,#2C3A4F 100%)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 30% 50%,rgba(198,161,91,.12) 0%,transparent 55%),radial-gradient(circle at 70% 60%,rgba(95,139,111,.08) 0%,transparent 50%)" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:580, margin:"0 auto" }}>
          <div style={{ fontSize:11, color:"#C6A15B", fontWeight:600, textTransform:"uppercase", letterSpacing:".12em", marginBottom:16 }}>Ready?</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:600, color:"#fff", marginBottom:16, lineHeight:1.2 }}>
            Begin Your <em style={{ fontStyle:"italic", color:"#C6A15B" }}>Luxury</em> Stay
          </h2>
          <p style={{ fontSize:16, color:"rgba(255,255,255,.6)", marginBottom:36, lineHeight:1.65 }}>
            Join our membership for exclusive loyalty points, early check-in privileges, and curated offers.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>navigate("/client/dashboard")}
              style={{ padding:"14px 36px", background:"#C6A15B", color:"#1F2A3A", border:"none", borderRadius:10, fontFamily:"inherit", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              Enter Portal
            </button>
            <button onClick={()=>navigate("/client/rooms")}
              style={{ padding:"14px 36px", background:"rgba(255,255,255,.08)", color:"#fff", border:"1px solid rgba(255,255,255,.18)", borderRadius:10, fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
              Explore Rooms
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#141E2A", padding:"36px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#C6A15B", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <i className="fa-solid fa-star" style={{ fontSize:12 }} /> BOOKINN
        </div>
        <p style={{ fontSize:12.5, color:"rgba(255,255,255,.3)" }}>© {new Date().getFullYear()} BOOKINN. All rights reserved.</p>
      </footer>
    </div>
  );
}