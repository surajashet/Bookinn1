// FILE: src/pages/LandingPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────
   DESIGN TOKENS  (mirrors dashboard palette exactly)
───────────────────────────────────────────────────── */
const T = {
  green:       "#4A7C72",
  greenDark:   "#3a6259",
  greenLight:  "#EBF0EE",
  greenBorder: "#D6E3DF",
  bg:          "#F4F7F6",
  surface:     "#FDFCFB",
  ink:         "#1E1C1A",
  inkMid:      "#6B6560",
  inkSoft:     "#A09890",
  inkFaint:    "#C4BBB4",
  ghostText:   "rgba(214,227,221,0.5)",
  h2Color:     "#5C5956",
};

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SERVICES = [
  { icon:"fa-solid fa-concierge-bell",  title:"24/7 Concierge",    desc:"Personal concierge available round the clock for any request." },
  { icon:"fa-solid fa-utensils",        title:"In-Room Dining",    desc:"Curated menus delivered to your room, any hour of the day." },
  { icon:"fa-solid fa-spa",             title:"Wellness & Spa",    desc:"Signature treatments, steam and hydrotherapy in our private spa." },
  { icon:"fa-solid fa-car",             title:"Chauffeur Service", desc:"Seamless transfers and city tours in luxury vehicles." },
  { icon:"fa-solid fa-wifi",            title:"High-Speed WiFi",   desc:"Complimentary ultra-fast connectivity throughout the property." },
  { icon:"fa-solid fa-dumbbell",        title:"Fitness Centre",    desc:"State-of-the-art gym with personal trainers on request." },
  { icon:"fa-solid fa-shirt",           title:"Laundry Service",   desc:"Same-day laundry and dry cleaning handled with care." },
  { icon:"fa-solid fa-broom",           title:"Housekeeping",      desc:"Meticulous daily service keeping your space immaculate." },
];

const REVIEWS = [
  { id:1, name:"Priya Nair",     role:"Entrepreneur, Kochi",   rating:5, avatar:"PN",
    text:"BOOKINN redefined what luxury hospitality means to me. Every detail — from the scent of the lobby to the thread count of the sheets — was perfection." },
  { id:2, name:"Arjun Mehta",    role:"Architect, Mumbai",     rating:5, avatar:"AM",
    text:"The only hotel where I feel genuinely at home. The service is intuitive — they anticipate before you ask." },
  { id:3, name:"Sofia D'Souza",  role:"Travel Writer, Goa",    rating:5, avatar:"SD",
    text:"The rooms are magazine-worthy but what sets BOOKINN apart is the quiet attentiveness of the staff." },
  { id:4, name:"Rahul Krishnan", role:"Consultant, Bangalore", rating:4, avatar:"RK",
    text:"Arrived late, exhausted. By the time I reached my room there was warm tea and soft music. I didn't even request it. That's BOOKINN." },
];

const WHY = [
  { icon:"fa-solid fa-star",          title:"Award-Winning Service", desc:"Recognised by Condé Nast and Travel+Leisure as India's finest boutique hotel." },
  { icon:"fa-solid fa-leaf",          title:"Sustainable Luxury",    desc:"Solar-powered, zero single-use plastic, farm-to-table dining." },
  { icon:"fa-solid fa-shield-halved", title:"Privacy Guaranteed",    desc:"Discreet, secure and deeply respectful of every guest's privacy." },
  { icon:"fa-solid fa-location-dot",  title:"Prime Location",        desc:"Situated in the cultural heart of the city, steps from everything." },
];

/* ─────────────────────────────────────────────────────
   INTERSECTION OBSERVER HOOK
───────────────────────────────────────────────────── */
function useFadeUp(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => el.classList.add("lp-visible"), delay);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ─────────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────────── */
const Stars = ({ n = 5 }) => (
  <div style={{ display:"flex", gap:3 }}>
    {Array.from({length:5}).map((_,i) => (
      <i key={i} className="fa-solid fa-star" style={{ fontSize:10, color: i<n ? T.green : T.greenBorder }} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────
   IMAGE PLACEHOLDER — easy to swap: just pass src prop
───────────────────────────────────────────────────── */
function ImgSlot({ src, alt, label, style={} }) {
  if (src) return <img src={src} alt={alt||label} style={{ width:"100%", height:"100%", objectFit:"cover", ...style }} />;
  return (
    <div style={{ width:"100%", height:"100%", background:T.greenLight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:9, ...style }}>
      <i className="fa-regular fa-image" style={{ fontSize:26, color:T.green, opacity:.45 }} />
      <span style={{ fontSize:10.5, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", letterSpacing:".06em", fontWeight:400 }}>{label||"Image"}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const to = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  const NAV = [
    {label:"Home",id:"hero"},{label:"Rooms",id:"rooms"},
    {label:"Services",id:"services"},{label:"Reviews",id:"reviews"},
    {label:"Contact",id:"footer"},
  ];
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:900, background: scrolled?"rgba(244,247,246,0.95)":"transparent", backdropFilter:scrolled?"blur(18px)":"none", borderBottom:scrolled?`1px solid ${T.greenBorder}`:"none", transition:"all .35s ease" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", height:66, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={() => to("hero")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <i className="fa-solid fa-star" style={{ color:T.green, fontSize:14 }} />
          <span style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:600, fontSize:15, letterSpacing:".12em", color: scrolled ? T.ink : "#fff", transition:"color .3s" }}>BOOKINN</span>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:2 }}>
          {NAV.map((link,i) => (
            <button key={i} onClick={() => to(link.id)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 13px", borderRadius:10, fontSize:12.5, fontWeight:300, letterSpacing:".04em", fontFamily:"'CabinetGrotesk',sans-serif", color: scrolled ? T.inkMid : "rgba(255,255,255,0.82)", transition:"all .18s" }}
              onMouseEnter={e => { e.currentTarget.style.background= scrolled ? T.greenLight : "rgba(255,255,255,0.12)"; e.currentTarget.style.color= scrolled ? T.green : "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color= scrolled ? T.inkMid : "rgba(255,255,255,0.82)"; }}>
              {link.label}
            </button>
          ))}
          <div style={{ width:1, height:18, background:T.greenBorder, margin:"0 10px" }} />
          <button onClick={() => navigate("/login")}
            style={{ padding:"7px 16px", borderRadius:999, background:"transparent", border:`1px solid ${ scrolled ? T.greenBorder : "rgba(255,255,255,0.35)"}`, color: scrolled ? T.inkMid : "rgba(255,255,255,0.82)", fontSize:12.5, fontFamily:"'CabinetGrotesk',sans-serif", cursor:"pointer", transition:"all .2s", marginRight:8 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.green; e.currentTarget.style.color=scrolled?T.green:"#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=scrolled?T.greenBorder:"rgba(255,255,255,0.35)"; e.currentTarget.style.color=scrolled?T.inkMid:"rgba(255,255,255,0.82)"; }}>
            Sign In
          </button>
          <button onClick={() => navigate("/signup")}
            style={{ padding:"8px 20px", borderRadius:999, background:T.green, border:"none", color:"#fff", fontSize:12.5, fontWeight:500, fontFamily:"'CabinetGrotesk',sans-serif", cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background=T.greenDark; e.currentTarget.style.transform="translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background=T.green; e.currentTarget.style.transform="translateY(0)"; }}>
            Book Now
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────── */
function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);
  const ease = (d) => ({ opacity:loaded?1:0, transform:loaded?"translateY(0)":"translateY(20px)", transition:`all .85s ease ${d}s` });

  return (
    <section id="hero" style={{ position:"relative", height:"100vh", minHeight:600, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src="/bg.jpg" alt="BOOKINN" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0 }} />
      <div style={{ position:"absolute", inset:0, zIndex:1, background:"linear-gradient(to bottom, rgba(20,18,14,0.25) 0%, rgba(20,18,14,0.52) 50%, rgba(20,18,14,0.72) 100%)" }} />
      <div style={{ position:"relative", zIndex:2, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", ...ease(.1) }}>
        <h1 style={{ fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"clamp(3.5rem,8vw,9rem)", fontWeight:400, lineHeight:1, color:"#fff", marginBottom:18, letterSpacing:"-.01em" }}>
          BOOKINN
        </h1>
        <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:"clamp(0.7rem,1vw,0.88rem)", color:"rgba(255,255,255,0.52)", letterSpacing:".18em", textTransform:"uppercase" }}>
          Refined hospitality · Kochi, India
        </p>
      </div>
      <div style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:2, opacity:loaded?1:0, transition:"opacity 1s ease 1.2s" }}>
        <div style={{ width:1, height:38, background:"rgba(255,255,255,0.25)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", background:"rgba(255,255,255,0.7)", animation:"lpScrollLine 2s ease infinite" }} />
        </div>
        <span style={{ fontSize:9, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", fontFamily:"'CabinetGrotesk',sans-serif" }}>Scroll</span>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────
   ABOUT
───────────────────────────────────────────────────── */
function About() {
  const refL = useFadeUp(0);
  const refR = useFadeUp(130);
  const navigate = useNavigate();
  return (
    <section id="about" style={{ background:T.surface, padding:"120px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", bottom:-55, right:-30, fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"18vw", color:T.ghostText, pointerEvents:"none", userSelect:"none", lineHeight:1 }}>Stay</div>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", zIndex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
          <div ref={refL} className="lp-fade" style={{ position:"relative", height:540 }}>
            <div style={{ position:"absolute", top:0, left:0, width:"68%", height:"72%", borderRadius:16, overflow:"hidden" }}>
              <ImgSlot src="/bg1.jpg" label="About — Hotel Exterior" />
            </div>
            <div style={{ position:"absolute", bottom:0, right:0, width:"55%", height:"56%", borderRadius:16, overflow:"hidden", border:`4px solid ${T.surface}` }}>
              <ImgSlot src="/bg2.jpg" label="About — Lounge / Common Area" />
            </div>
          </div>
          <div ref={refR} className="lp-fade">
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:14, fontFamily:"'CabinetGrotesk',sans-serif" }}>Our Story</div>
            <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, lineHeight:1.15, color:T.h2Color, marginBottom:18 }}>
              A Legacy of<br /><em style={{ color:T.green, fontStyle:"italic" }}>Quiet Luxury</em>
            </h2>
            <h3 style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:"clamp(1rem,1.5vw,1.5rem)", color:T.inkSoft, lineHeight:1.7, marginBottom:20 }}>
              A state of quiet contemplation, where every detail is considered.
            </h3>
            <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:14, color:T.inkMid, lineHeight:1.9, marginBottom:18 }}>
              Founded with a single conviction — that true hospitality lies in the details that go unnoticed until they are absent — BOOKINN blends heritage architecture with contemporary craft to create spaces that feel both timeless and alive.
            </p>
            <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:14, color:T.inkMid, lineHeight:1.9, marginBottom:34 }}>
              Every room is a considered composition. Every service, an act of anticipation. We don't merely accommodate — we immerse our guests in an experience they carry long after checkout.
            </p>
            <div style={{ display:"flex", gap:32, marginBottom:36 }}>
              {[["48","Rooms & Suites"],["2.4k","Guests Served"],["4.9★","Average Rating"]].map(([val,label]) => (
                <div key={label}>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:26, color:T.ink, fontWeight:400 }}>{val}</div>
                  <div style={{ fontSize:11, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", marginTop:3, fontWeight:200 }}>{label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => document.getElementById("rooms")?.scrollIntoView({behavior:"smooth"})}
              style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"12px 26px", borderRadius:999, background:T.green, border:"none", color:"#fff", fontSize:13, fontWeight:500, fontFamily:"'CabinetGrotesk',sans-serif", cursor:"pointer", transition:"all .22s" }}
              onMouseEnter={e => { e.currentTarget.style.background=T.greenDark; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background=T.green; e.currentTarget.style.transform="translateY(0)"; }}>
              Explore Our Rooms <i className="fa-solid fa-arrow-right" style={{ fontSize:11 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────
   ROOMS CAROUSEL — with real data from API
───────────────────────────────────────────────────── */
function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();
  const headerRef = useFadeUp(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/client/rooms`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
    })
      .then(res => res.json())
      .then(data => {
        setRooms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch rooms:", err);
        setLoading(false);
      });
  }, []);

  const TOTAL = rooms.length;
  const go = useCallback((dir) => {
    if (animating || TOTAL === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(c => dir === "next" ? (c+1)%TOTAL : (c-1+TOTAL)%TOTAL);
      setAnimating(false);
    }, 400);
  }, [animating, TOTAL]);

  useEffect(() => {
    if (TOTAL === 0) return;
    intervalRef.current = setInterval(() => go("next"), 4800);
    return () => clearInterval(intervalRef.current);
  }, [go, TOTAL]);

  const reset = () => { 
    clearInterval(intervalRef.current); 
    if (TOTAL > 0) intervalRef.current = setInterval(() => go("next"), 4800); 
  };
  const prev  = () => { go("prev"); reset(); };
  const next  = () => { go("next"); reset(); };
  const jumpTo = (i) => { if (!animating && i !== current && i < TOTAL) { setAnimating(true); setTimeout(() => { setCurrent(i); setAnimating(false); }, 400); reset(); } };

  if (loading) {
    return (
      <section id="rooms" style={{ background:T.bg, padding:"120px 0" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", textAlign:"center" }}>
          <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12 }}>Accommodations</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color }}>Loading Rooms...</h2>
        </div>
      </section>
    );
  }

  if (TOTAL === 0) {
    return (
      <section id="rooms" style={{ background:T.bg, padding:"120px 0" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", textAlign:"center" }}>
          <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12 }}>Accommodations</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color }}>No Rooms Available</h2>
          <p style={{ marginTop:16, color:T.inkSoft }}>Check back soon for availability.</p>
        </div>
      </section>
    );
  }

  const idx = (i) => (i+TOTAL)%TOTAL;
  const cards = [idx(current-1), current, idx(current+1)];

  return (
    <section id="rooms" style={{ background:T.bg, padding:"120px 0", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", top:-35, left:-20, fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"18vw", color:T.ghostText, pointerEvents:"none", userSelect:"none", lineHeight:1 }}>Rooms</div>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", zIndex:1 }}>
        <div ref={headerRef} className="lp-fade" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:52 }}>
          <div>
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Accommodations</div>
            <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color, lineHeight:1.1 }}>
              Our <em style={{ color:T.green, fontStyle:"italic" }}>Rooms</em>
            </h2>
            <h3 style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:"clamp(1rem,1.3vw,1.3rem)", color:T.inkSoft, marginTop:8 }}>
              Curated spaces for every kind of stay.
            </h3>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={prev}
              style={{ width:42, height:42, borderRadius:"50%", background:T.surface, border:`1px solid ${T.greenBorder}`, cursor:"pointer", color:T.inkMid, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background=T.green; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor=T.green; }}
              onMouseLeave={e => { e.currentTarget.style.background=T.surface; e.currentTarget.style.color=T.inkMid; e.currentTarget.style.borderColor=T.greenBorder; }}>
              <i className="fa-solid fa-arrow-left" />
            </button>
            <button onClick={next}
              style={{ width:42, height:42, borderRadius:"50%", background:T.green, border:"none", cursor:"pointer", color:"#fff", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
              onMouseEnter={e => e.currentTarget.style.background=T.greenDark}
              onMouseLeave={e => e.currentTarget.style.background=T.green}>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr 1fr", gap:18, alignItems:"center" }}>
          {cards.map((roomIdx, slot) => {
            const room = rooms[roomIdx];
            const isCenter = slot === 1;
            if (!room) return null;
            return (
              <RoomCard
                key={`${room.id}-${slot}`}
                room={room}
                isCenter={isCenter}
                animating={animating}
                navigate={navigate}
              />
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:38 }}>
          {rooms.map((_,i) => (
            <button key={i} onClick={() => jumpTo(i)}
              style={{ width:i===current?24:6, height:6, borderRadius:999, border:"none", background:i===current?T.green:T.greenBorder, cursor:"pointer", transition:"all .28s ease", padding:0 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RoomCard({ room, isCenter, animating, navigate }) {
  const [hov, setHov] = useState(false);
  const pricePerNight = room.price || 0;
  const roomType = room.type || "Deluxe";
  const roomName = room.name || `Room ${room.room_number}`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:T.surface, borderRadius:16,
        border:`1px solid ${isCenter&&hov ? T.green : T.greenBorder}`,
        overflow:"hidden",
        transform:`scale(${isCenter?1.038:0.965}) translateY(${hov&&isCenter?"-5px":"0px"})`,
        opacity: animating ? (isCenter?0.7:0.45) : (isCenter?1:0.65),
        boxShadow: isCenter ? (hov?`0 22px 52px rgba(74,124,114,0.15)`:`0 8px 26px rgba(74,124,114,0.08)`) : "none",
        transition:"transform .4s cubic-bezier(.4,0,.2,1), opacity .4s ease, box-shadow .28s, border-color .2s",
        cursor:"pointer",
        pointerEvents: animating ? "none" : "auto",
      }}>
      <div style={{ position:"relative", height:isCenter?268:215, overflow:"hidden" }}>
        <div style={{ width:"100%", height:"100%", transform:hov&&isCenter?"scale(1.05)":"scale(1)", transition:"transform .55s ease" }}>
          <ImgSlot src={room.image_url} label={roomName} />
        </div>
        <div style={{ position:"absolute", top:12, right:12, background:"rgba(244,247,246,0.92)", backdropFilter:"blur(8px)", border:`1px solid ${T.greenBorder}`, color:T.ink, padding:"5px 11px", borderRadius:10, fontSize:13, fontWeight:600, fontFamily:"'CabinetGrotesk',sans-serif" }}>
          ₹{pricePerNight.toLocaleString("en-IN")}<span style={{ color:T.inkSoft, fontWeight:300, fontSize:11 }}>/night</span>
        </div>
        <div style={{ position:"absolute", top:12, left:12, background:T.green, color:"#fff", padding:"3px 9px", borderRadius:6, fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", fontFamily:"'CabinetGrotesk',sans-serif" }}>{roomType}</div>
      </div>
      <div style={{ padding:isCenter?"22px 20px 24px":"16px 16px 18px" }}>
        <div style={{ fontFamily:"'Soria',serif", fontSize:isCenter?19:15.5, color:T.h2Color, marginBottom:isCenter?8:0 }}>{roomName}</div>
        {isCenter && room.description && <p style={{ fontSize:13, color:T.inkMid, lineHeight:1.65, marginBottom:14, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>{room.description}</p>}
        {isCenter && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:18 }}>
            <span style={{ background:T.greenLight, color:T.green, padding:"3px 9px", borderRadius:6, fontSize:11, fontFamily:"'CabinetGrotesk',sans-serif" }}>Capacity: {room.capacity} guests</span>
            <span style={{ background:T.greenLight, color:T.green, padding:"3px 9px", borderRadius:6, fontSize:11, fontFamily:"'CabinetGrotesk',sans-serif" }}>Floor {room.floor}</span>
          </div>
        )}
        {isCenter && (
          <button onClick={() => navigate(`/client/book?room=${room.id}`)}
            style={{ width:"100%", padding:"11px 0", background:T.green, color:"#fff", border:"none", borderRadius:10, fontFamily:"'CabinetGrotesk',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background=T.greenDark; }}
            onMouseLeave={e => { e.currentTarget.style.background=T.green; }}>
            Book This Room
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SERVICES
───────────────────────────────────────────────────── */
function Services() {
  const ref = useFadeUp(0);
  const navigate = useNavigate();
  return (
    <section id="services" style={{ background:T.surface, padding:"100px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", bottom:-40, right:-30, fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"15vw", color:T.ghostText, pointerEvents:"none", userSelect:"none", lineHeight:1 }}>Services</div>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", zIndex:1 }}>
        <div ref={ref} className="lp-fade" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"flex-end", marginBottom:56 }}>
          <div>
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:14, fontFamily:"'CabinetGrotesk',sans-serif" }}>Hospitality</div>
            <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color, lineHeight:1.1 }}>
              Services
            </h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:20 }}>
            <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:14, color:T.inkSoft, lineHeight:1.8 }}>
              From intimate dining to seamless transfers — every service at BOOKINN is designed to feel effortless and personal.
            </p>
            <div>
              <button onClick={() => navigate("/client/services")}
                style={{ padding:"10px 26px", borderRadius:999, background:"transparent", border:`1px solid ${T.ink}`, color:T.ink, fontSize:11.5, fontWeight:400, letterSpacing:".1em", textTransform:"uppercase", fontFamily:"'CabinetGrotesk',sans-serif", cursor:"pointer", transition:"all .22s" }}
                onMouseEnter={e => { e.currentTarget.style.background=T.ink; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.ink; }}>
                Services
              </button>
            </div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {SERVICES.map((svc,i) => <ServiceCard key={i} svc={svc} delay={i*55} navigate={navigate} />)}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ svc, delay, navigate }) {
  const [hov, setHov] = useState(false);
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="lp-fade"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface,
        border:`1px solid ${hov ? T.green : T.greenBorder}`,
        borderRadius:16, padding:"30px 24px 26px",
        transition:"all .28s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov ? `0 18px 40px rgba(74,124,114,0.11)` : `0 1px 4px rgba(74,124,114,0.04)`,
        cursor:"default",
        display:"flex", flexDirection:"column",
      }}>
      <div style={{
        width:52, height:52, borderRadius:"50%",
        background:"transparent",
        border:`1.5px solid ${hov ? T.green : T.greenBorder}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:22,
        transition:"all .28s",
      }}>
        <i className={svc.icon} style={{ fontSize:20, color: hov ? T.green : T.inkMid, transition:"all .28s" }} />
      </div>
      <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontSize:15, fontWeight:500, color:T.ink, marginBottom:10 }}>
        {svc.title}
      </div>
      <p style={{ fontSize:12.5, color:T.inkSoft, lineHeight:1.75, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, flex:1, marginBottom:20 }}>
        {svc.desc}
      </p>
      <button onClick={() => navigate("/client/services")}
        style={{ background:"none", border:"none", padding:0, display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:500, color: hov ? T.green : T.inkMid, fontFamily:"'CabinetGrotesk',sans-serif", cursor:"pointer", transition:"color .2s", letterSpacing:".03em" }}
        onMouseEnter={e => e.currentTarget.style.color=T.green}
        onMouseLeave={e => e.currentTarget.style.color= hov ? T.green : T.inkMid}>
        Read more
        <i className="fa-solid fa-arrow-right" style={{ fontSize:10 }} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   REVIEWS
───────────────────────────────────────────────────── */
function Reviews() {
  const ref = useFadeUp(0);
  return (
    <section id="reviews" style={{ background:T.bg, padding:"120px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-30, left:-20, fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"16vw", color:T.ghostText, pointerEvents:"none", userSelect:"none", lineHeight:1 }}>Guests</div>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", zIndex:1 }}>
        <div ref={ref} className="lp-fade" style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Testimonials</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color }}>
            Guests Who<br /><em style={{ color:T.green, fontStyle:"italic" }}>Remember Us</em>
          </h2>
          <h3 style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:"clamp(1rem,1.3vw,1.3rem)", color:T.inkSoft, marginTop:10 }}>
            Stories carried far beyond checkout.
          </h3>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:18 }}>
          {REVIEWS.map((r,i) => <ReviewCard key={r.id} review={r} delay={i*80} />)}
        </div>
        <div style={{ marginTop:44, background:T.surface, borderRadius:14, border:`1px solid ${T.greenBorder}`, padding:"24px 36px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:18 }}>
            <div style={{ fontFamily:"'Soria',serif", fontSize:46, color:T.ink, fontWeight:400, lineHeight:1 }}>4.9</div>
            <div>
              <Stars n={5} />
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:5, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>Based on 2,400+ verified reviews</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:30 }}>
            {[["98%","Would recommend"],["4.9","Cleanliness"],["4.8","Value"]].map(([v,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Soria',serif", fontSize:21, color:T.green }}>{v}</div>
                <div style={{ fontSize:11, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", marginTop:4, fontWeight:200 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review, delay }) {
  const ref = useFadeUp(delay);
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref} className="lp-fade"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:T.surface, borderRadius:14, border:`1px solid ${hov?T.green:T.greenBorder}`, padding:"26px", position:"relative", transition:"all .25s", transform:hov?"translateY(-2px)":"translateY(0)", boxShadow:hov?`0 8px 22px rgba(74,124,114,0.09)`:"none" }}>
      <i className="fa-solid fa-quote-left" style={{ position:"absolute", top:20, right:22, fontSize:30, color:T.greenLight }} />
      <Stars n={review.rating} />
      <p style={{ fontFamily:"'Soria',serif", fontSize:15.5, fontStyle:"italic", color:T.inkMid, lineHeight:1.85, margin:"15px 0 20px", fontWeight:400 }}>"{review.text}"</p>
      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:T.greenLight, border:`1px solid ${T.greenBorder}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontSize:12, fontWeight:500, color:T.green }}>{review.avatar}</span>
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:500, color:T.ink, fontFamily:"'CabinetGrotesk',sans-serif" }}>{review.name}</div>
          <div style={{ fontSize:11, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>{review.role}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   WHY CHOOSE US
───────────────────────────────────────────────────── */
function WhyUs() {
  const refL = useFadeUp(0);
  const refR = useFadeUp(130);
  return (
    <section id="why" style={{ background:T.surface, padding:"120px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", bottom:-55, right:-35, fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"16vw", color:T.ghostText, pointerEvents:"none", userSelect:"none", lineHeight:1 }}>Why</div>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px", position:"relative", zIndex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:80, alignItems:"center" }}>
          <div ref={refL} className="lp-fade">
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Our Difference</div>
            <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(1.4rem,2.8vw,2.8rem)", fontWeight:400, color:T.h2Color, lineHeight:1.12, marginBottom:14 }}>
              Why Guests<br />Return to<br /><em style={{ color:T.green, fontStyle:"italic" }}>BOOKINN</em>
            </h2>
            <h3 style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:"clamp(1rem,1.3vw,1.3rem)", color:T.inkSoft, lineHeight:1.7, marginBottom:30 }}>
              Excellence is not a feature — it is the foundation.
            </h3>
            <div style={{ height:1, width:48, background:T.green, marginBottom:30 }} />
            <div style={{ borderRadius:14, overflow:"hidden", height:235 }}>
              <ImgSlot src="/why-ambience.jpg" label="Why Us — Hotel Ambience" />
            </div>
          </div>
          <div ref={refR} className="lp-fade" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {WHY.map((item,i) => <WhyCard key={i} item={item} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyCard({ item }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.surface : T.greenLight,
        borderRadius:16, padding:"28px 22px",
        border:`1px solid ${hov ? T.green : T.greenBorder}`,
        transition:"all .28s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 16px 36px rgba(74,124,114,0.12)` : "none",
      }}>
      <div style={{
        width:52, height:52, borderRadius:"50%",
        background: hov ? `rgba(74,124,114,0.15)` : T.surface,
        border:`1.5px solid ${hov ? T.green : T.greenBorder}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:18, transition:"all .28s",
        boxShadow: hov ? `0 4px 14px rgba(74,124,114,0.15)` : "none",
      }}>
        <i className={item.icon} style={{ fontSize:20, color:T.green, transition:"transform .28s", transform: hov ? "scale(1.15)" : "scale(1)" }} />
      </div>
      <div style={{ fontFamily:"'Soria',serif", fontSize:15.5, color: hov ? T.ink : T.h2Color, marginBottom:6, transition:"color .2s" }}>{item.title}</div>
      <div style={{ width: hov ? 28 : 14, height:1.5, background:T.green, borderRadius:999, marginBottom:10, transition:"width .3s ease", opacity: hov ? 1 : 0.5 }} />
      <p style={{ fontSize:12.5, color:T.inkMid, lineHeight:1.75, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>{item.desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────── */
function Footer() {
  const to = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return (
    <footer id="footer" style={{ background:T.bg, borderTop:`1px solid ${T.greenBorder}`, padding:"80px 0 0" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 64px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1.2fr", gap:60, paddingBottom:60, borderBottom:`1px solid ${T.greenBorder}` }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
              <i className="fa-solid fa-star" style={{ color:T.green, fontSize:13 }} />
              <span style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontSize:15, fontWeight:600, color:T.ink, letterSpacing:".1em" }}>BOOKINN</span>
            </div>
            <p style={{ fontSize:13.5, color:T.inkSoft, lineHeight:1.8, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, marginBottom:24, maxWidth:240 }}>
              Refined hospitality that turns every stay into a story worth telling.
            </p>
            <div style={{ display:"flex", gap:8 }}>
              {[["fa-brands fa-instagram","#"],["fa-brands fa-facebook-f","#"],["fa-brands fa-x-twitter","#"],["fa-brands fa-linkedin-in","#"]].map(([icon,href]) => (
                <a key={icon} href={href}
                  style={{ width:33, height:33, borderRadius:8, background:T.surface, border:`1px solid ${T.greenBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.inkSoft, fontSize:12.5, transition:"all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background=T.greenLight; e.currentTarget.style.color=T.green; e.currentTarget.style.borderColor=T.green; }}
                  onMouseLeave={e => { e.currentTarget.style.background=T.surface; e.currentTarget.style.color=T.inkSoft; e.currentTarget.style.borderColor=T.greenBorder; }}>
                  <i className={icon} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".18em", marginBottom:18, fontFamily:"'CabinetGrotesk',sans-serif" }}>Navigate</div>
            {[["Home","hero"],["Rooms","rooms"],["Services","services"],["Reviews","reviews"],["Why Us","why"]].map(([label,id]) => (
              <button key={id+label} onClick={() => to(id)}
                style={{ display:"block", background:"none", border:"none", padding:"5px 0", fontSize:13.5, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, cursor:"pointer", transition:"color .18s", textAlign:"left" }}
                onMouseEnter={e => e.currentTarget.style.color=T.green}
                onMouseLeave={e => e.currentTarget.style.color=T.inkSoft}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".18em", marginBottom:18, fontFamily:"'CabinetGrotesk',sans-serif" }}>Room Types</div>
            {["Suite","Deluxe","Premier","Villa","Classic"].map(r => (
              <div key={r} style={{ padding:"5px 0", fontSize:13.5, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>{r}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:10, color:T.green, textTransform:"uppercase", letterSpacing:".18em", marginBottom:18, fontFamily:"'CabinetGrotesk',sans-serif" }}>Contact</div>
            {[
              {icon:"fa-solid fa-location-dot",text:"12 Hospitality Lane, MG Road\nKochi, Kerala 682 001"},
              {icon:"fa-solid fa-phone",        text:"+91 484 400 0000"},
              {icon:"fa-regular fa-envelope",   text:"hello@bookinn.in"},
              {icon:"fa-regular fa-clock",       text:"Check-in 2 PM · Check-out 12 PM"},
            ].map((c,i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12 }}>
                <i className={c.icon} style={{ color:T.green, fontSize:12, marginTop:3, flexShrink:0 }} />
                <span style={{ fontSize:13, color:T.inkSoft, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, lineHeight:1.65, whiteSpace:"pre-line" }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"18px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:T.inkFaint, fontFamily:"'CabinetGrotesk',sans-serif" }}>© 2025 BOOKINN. All rights reserved.</span>
          <div style={{ display:"flex", gap:18 }}>
            {["Privacy Policy","Terms of Service","Cookie Policy"].map(l => (
              <a key={l} href="#"
                style={{ fontSize:12, color:T.inkFaint, fontFamily:"'CabinetGrotesk',sans-serif", transition:"color .18s" }}
                onMouseEnter={e => e.currentTarget.style.color=T.green}
                onMouseLeave={e => e.currentTarget.style.color=T.inkFaint}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();

  // Check if already logged in and redirect immediately
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log("🔍 LandingPage - Checking auth:", { token: !!token, role: user.role });
    
    if (token && user.role) {
      const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      console.log("🔀 Redirecting to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [navigate]);

  // Fade animations
  useEffect(() => {
    const els = document.querySelectorAll(".lp-fade");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lp-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes lpScrollLine {
          0%   { transform:scaleY(0); transform-origin:top; }
          49%  { transform:scaleY(1); transform-origin:top; }
          50%  { transform:scaleY(1); transform-origin:bottom; }
          100% { transform:scaleY(0); transform-origin:bottom; }
        }
        .lp-fade { opacity:0; transform:translateY(26px); transition:opacity .72s ease, transform .72s ease; }
        .lp-fade.lp-visible { opacity:1; transform:translateY(0); }
        *  { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { overflow-x:hidden; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D6E3DF; border-radius:3px; }
      `}</style>
      <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:300, background:"#F4F7F6", color:"#1E1C1A" }}>
        <Navbar />
        <Hero />
        <About />
        <Rooms />
        <Services />
        <Reviews />
        <WhyUs />
        <Footer />
      </div>
    </>
  );
}