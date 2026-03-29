import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const get = p => fetch(`${BASE_URL}${p}`, { headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` } }).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); });

const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const nights  = (ci,co) => Math.max(1,Math.round((new Date(co)-new Date(ci))/86400000));
const greeting = () => { const h=new Date().getHours(); return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening"; };

const ACCENT   = "#4A7C72";
const ACCENT_L = "#6A9E94";

const Sk = ({w="100%",h=14,style={}}) => (
  <div style={{ width:w,height:h,borderRadius:8,background:"linear-gradient(90deg,#EDE7DE 25%,#E4DDD4 50%,#EDE7DE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style }} />
);

const BADGE = { Confirmed:{bg:"#e8f2ef",c:"#2d6b5e"}, Pending:{bg:"#fdf5e8",c:"#7a5a1a"}, Cancelled:{bg:"#faeaea",c:"#8a3030"}, "Checked In":{bg:"#e5f0ee",c:"#2d6b5e"}, "Checked Out":{bg:"#f0eff6",c:"#4a4070"} };
const StatusBadge = ({status}) => { const s=BADGE[status]||{bg:"#F0EBE4",c:"#6B6560"}; return <span style={{ background:s.bg,color:s.c,padding:"3px 12px",borderRadius:999,fontSize:10,fontWeight:400,letterSpacing:".08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:"'CabinetGrotesk',sans-serif" }}>{status}</span>; };

const SERVICES = [
  { label:"Room Service",   eyebrow:"In-Room Dining",      desc:"Restaurant-quality meals delivered directly to your room, available around the clock during your stay.", img:"/service-room-service.jpg" },
  { label:"Spa & Wellness", eyebrow:"Rejuvenation",        desc:"Indulge in curated treatments designed to restore balance — massages, facials, and holistic therapies.", img:"/service-spa.jpg" },
  { label:"Laundry",        eyebrow:"Garment Care",        desc:"Same-day laundry and dry-cleaning handled with the utmost care. Your wardrobe, always impeccable.",    img:"/service-laundry.jpg" },
  { label:"Transportation", eyebrow:"Private Transfer",    desc:"Chauffeured vehicles for airport transfers, city excursions, and private tours at your request.",       img:"/service-transport.jpg" },
  { label:"Dining",         eyebrow:"Culinary Experience", desc:"Reserve a table at our signature restaurant or arrange an intimate private dining experience.",         img:"/service-dining.jpg" },
  { label:"Housekeeping",   eyebrow:"Daily Care",          desc:"Discreet, thorough housekeeping at your preferred time — your space, always pristine.",                 img:"/service-housekeeping.jpg" },
];

const TextLink = ({ children, onClick }) => (
  <button onClick={onClick} style={{ background:"transparent", border:"none", padding:0, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:11, color:"#1E1C1A", letterSpacing:".18em", textTransform:"uppercase", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:12 }}>
    {children}
    <span style={{ display:"inline-block", width:32, height:1, background:"#1E1C1A", flexShrink:0 }} />
  </button>
);

const Eyebrow = ({ children }) => (
  <div style={{ fontSize:10, color:ACCENT, fontWeight:400, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>{children}</div>
);

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [data,setData]         = useState(null);
  const [rooms,setRooms]       = useState([]);
  const [loading,setLoading]   = useState(true);
  const [rLoading,setRLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    get("/api/client/dashboard").then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
    get("/api/client/rooms").then(d=>{setRooms(Array.isArray(d)?d:[]);setRLoading(false);}).catch(()=>setRLoading(false));
  }, []);

  const firstName = data?.profile?.name?.split(" ")[0] || user?.username?.split(" ")[0] || "Guest";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tempPassword");
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  return (
    <>
      <Toaster position="top-center" />
      
      {/* HERO */}
      <div style={{ position:"relative", margin:"0 -32px 0 -32px", height:"92vh", minHeight:560, overflow:"hidden" }}>
        <img src="/bg2.jpg" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 55%" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(20,18,16,0.68) 0%, rgba(20,18,16,0.25) 60%, transparent 100%)" }} />
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", width:"100%", padding:"0 64px 80px", display:"flex", flexDirection:"column", justifyContent:"center", flex:1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:".28em", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200 }}>Welcome to BOOKINN</div>
              <button 
                onClick={handleLogout}
                style={{
                  background: "rgba(180,92,92,0.9)",
                  color: "white",
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "'CabinetGrotesk', sans-serif",
                  backdropFilter: "blur(4px)"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#B45C5C"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(180,92,92,0.9)"}
              >
                Logout
              </button>
            </div>
            {loading ? (
              <><Sk w={340} h={56} style={{ marginBottom:20, background:"rgba(255,255,255,.1)" }} /><Sk w={260} h={14} style={{ background:"rgba(255,255,255,.07)" }} /></>
            ) : (
              <>
                <h1 style={{ fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"clamp(44px,6vw,88px)", fontWeight:400, color:"#fff", lineHeight:0.95, marginBottom:24, letterSpacing:"-0.01em" }}>
                  {greeting()},<br /><em style={{ color:"#A8CEC8" }}>{firstName}.</em>
                </h1>
                <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, color:"rgba(255,255,255,0.6)", fontSize:14, marginBottom:48, maxWidth:360, lineHeight:1.9, letterSpacing:"0.04em" }}>
                  Your luxury stay awaits.<br />Browse rooms and exclusive services.
                </p>
              </>
            )}
            <div style={{ display:"flex", gap:16 }}>
              <button onClick={()=>navigate("/client/rooms")} style={{ background:ACCENT, color:"#fff", border:"none", padding:"14px 36px", borderRadius:999, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:11, letterSpacing:".18em", textTransform:"uppercase", cursor:"pointer" }}>Browse Rooms</button>
              <button onClick={()=>navigate("/client/bookings")} style={{ background:"transparent", color:"rgba(255,255,255,0.75)", border:"1px solid rgba(255,255,255,0.3)", padding:"14px 36px", borderRadius:999, fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:11, letterSpacing:".18em", textTransform:"uppercase", cursor:"pointer" }}>My Bookings</button>
            </div>
          </div>
        </div>
        {!loading && data?.stats && (
          <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:3, display:"flex" }}>
            {[
              { label:"Total Bookings", val:data.stats.totalBookings??0 },
              { label:"Active Stays",   val:data.stats.activeBookings??0 },
              { label:"Amount Spent",   val:`₹${(data.stats.totalSpend??0).toLocaleString("en-IN")}` },
              { label:"Loyalty Points", val:data.stats.loyaltyPoints??0 },
            ].map((s,i) => (
              <div key={s.label} style={{ flex:1, padding:"22px 0", textAlign:"center", borderTop:"1px solid rgba(255,255,255,0.08)", borderRight:i<3?"1px solid rgba(255,255,255,0.08)":"none", background:"rgba(20,18,16,0.5)", backdropFilter:"blur(16px)" }}>
                <div style={{ fontFamily:"'Soria',serif", fontStyle:"italic", fontSize:24, color:"#A8CEC8", lineHeight:1, marginBottom:6 }}>{s.val}</div>
                <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:".18em", textTransform:"uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── constrained content ── */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>

        {/* UPCOMING STAY */}
        <section style={{ padding:"96px 0 80px" }}>
          <Eyebrow>Next Visit</Eyebrow>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(24px,2.8vw,36px)", fontWeight:400, color:"#1E1C1A", marginBottom:48, lineHeight:1 }}>
            Upcoming <em style={{ fontStyle:"italic", color:ACCENT_L }}>Stay</em>
          </h2>
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderTop:"1px solid #E4DDD4", borderBottom:"1px solid #E4DDD4" }}>
              {[0,1,2,3].map(i => <div key={i} style={{ padding:"32px 0", borderRight:i<3?"1px solid #E4DDD4":"none" }}><Sk w="50%" h={10} style={{marginBottom:12}} /><Sk w="70%" h={18} /></div>)}
            </div>
          ) : !data?.upcoming ? (
            <div style={{ borderTop:"1px solid #E4DDD4", paddingTop:40, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontFamily:"'Soria',serif", fontSize:20, color:"#1E1C1A", marginBottom:8 }}>No upcoming reservation</div>
                <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#A09890", lineHeight:1.8 }}>Plan your next luxurious visit.</p>
              </div>
              <TextLink onClick={()=>navigate("/client/rooms")}>Browse Rooms</TextLink>
            </div>
          ) : (
            <div style={{ borderTop:"1px solid #E4DDD4", borderBottom:"1px solid #E4DDD4", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
              {[["Room",`${data.upcoming.room_number}`],["Type",data.upcoming.room_type],["Check-in",fmtDate(data.upcoming.check_in)],["Check-out",fmtDate(data.upcoming.check_out)]].map(([l,v],i) => (
                <div key={l} style={{ padding:"36px 32px", borderRight:i<3?"1px solid #E4DDD4":"none", paddingLeft:i===0?0:32 }}>
                  <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:10, color:"#A09890", textTransform:"uppercase", letterSpacing:".18em", marginBottom:12 }}>{l}</div>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:22, color:"#1E1C1A" }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AVAILABLE ROOMS */}
        <section style={{ paddingBottom:96 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48 }}>
            <div>
              <Eyebrow>Accommodations</Eyebrow>
              <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(24px,2.8vw,36px)", fontWeight:400, color:"#1E1C1A", lineHeight:1 }}>
                Available <em style={{ fontStyle:"italic", color:ACCENT_L }}>Rooms</em>
              </h2>
            </div>
            <TextLink onClick={()=>navigate("/client/rooms")}>View All</TextLink>
          </div>
          {rLoading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:32 }}>
              {[0,1,2].map(i => <div key={i}><Sk w="100%" h={260} style={{marginBottom:16,borderRadius:16}} /><Sk w="40%" h={10} style={{marginBottom:10}} /><Sk w="70%" h={18} /></div>)}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:32 }}>
              {rooms.slice(0,6).map((room) => (
                <div key={room.id} style={{ cursor:"pointer" }} onClick={()=>navigate("/client/rooms")}>
                  <div style={{ position:"relative", height:240, overflow:"hidden", background:"#EDE7DE", marginBottom:20, borderRadius:16 }}>
                    {room.image_url && <img src={room.image_url} alt={room.name} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s ease" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />}
                  </div>
                  <div style={{ fontSize:10, color:ACCENT, textTransform:"uppercase", letterSpacing:".18em", marginBottom:8, fontFamily:"'CabinetGrotesk',sans-serif" }}>{room.type}</div>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:20, color:"#1E1C1A", marginBottom:8 }}>{room.name}</div>
                  <TextLink onClick={()=>navigate("/client/rooms")}>Book Now</TextLink>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT BOOKINGS */}
        <section style={{ paddingBottom:96, borderTop:"1px solid #E4DDD4", paddingTop:80 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48 }}>
            <div>
              <Eyebrow>History</Eyebrow>
              <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(24px,2.8vw,36px)", fontWeight:400, color:"#1E1C1A", lineHeight:1 }}>
                Recent <em style={{ fontStyle:"italic", color:ACCENT_L }}>Bookings</em>
              </h2>
            </div>
            <TextLink onClick={()=>navigate("/client/bookings")}>View All</TextLink>
          </div>
          {loading ? (
            <div>{[0,1,2,3].map(i => <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"20px 0", borderBottom:"1px solid #E4DDD4" }}><Sk w={200} h={13} /><Sk w={80} h={20} /></div>)}</div>
          ) : !data?.recent?.length ? (
            <div>
              <div style={{ fontFamily:"'Soria',serif", fontSize:20, color:"#A09890", marginBottom:8 }}>No bookings yet</div>
              <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#A09890" }}>Your booking history will appear here.</p>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #E4DDD4" }}>
                  {["Room","Type","Check-in","Check-out","Nights","Amount","Status"].map(h => (
                    <th key={h} style={{ padding:"0 24px 16px 0", textAlign:"left", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:10, color:"#A09890", letterSpacing:".18em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                 </tr>
              </thead>
              <tbody>
                {data.recent.map((b,i) => (
                  <tr key={b.id} style={{ borderBottom:i<data.recent.length-1?"1px solid #F0EBE4":"none" }}>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'Soria',serif", fontSize:16, color:"#1E1C1A" }}>Room {b.room_number}</td>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560" }}>{b.room_type}</td>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560" }}>{fmtDate(b.check_in)}</td>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560" }}>{fmtDate(b.check_out)}</td>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560" }}>{nights(b.check_in,b.check_out)}</td>
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'Soria',serif", fontSize:16, color:"#1E1C1A" }}>{b.total_amount ? `₹${b.total_amount.toLocaleString("en-IN")}` : "—"}</td>
                    <td style={{ padding:"20px 0" }}><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* SERVICES ZIG-ZAG */}
      <section style={{ margin:"0", background:"#FDFCFB", paddingBottom: 80 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"80px 64px 40px" }}>
          <Eyebrow>Hospitality</Eyebrow>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:"clamp(24px,3vw,42px)", fontWeight:400, color:"#1E1C1A", lineHeight:1.05 }}>
            Hotel <em style={{ fontStyle:"italic", color:ACCENT_L }}>Services</em>
          </h2>
        </div>
        
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 64px" }}>
          {SERVICES.map((s, i) => {
            const isEven = i % 2 === 0;
            return (
              <div key={s.label} style={{ 
                display:"grid", 
                gridTemplateColumns: isEven ? "0.6fr 1fr" : "1fr 0.6fr", 
                alignItems: "center",
                gap: 64,
                padding: "32px 0",
                borderBottom: "1px solid rgba(0,0,0,0.03)"
              }}>
                <div style={{ order: isEven ? 1 : 2, aspectRatio: "1/1", overflow: "hidden", borderRadius: 24 }}>
                  <img src={s.img} alt={s.label} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                </div>
                <div style={{ order: isEven ? 2 : 1 }}>
                  <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:10, color:ACCENT, textTransform:"uppercase", letterSpacing:".22em", marginBottom:8 }}>
                    {String(i+1).padStart(2,"0")} — {s.eyebrow}
                  </div>
                  <h3 style={{ fontFamily:"'Soria',serif", fontSize: "clamp(20px, 1.8vw, 24px)", fontWeight: 400, color: "#1E1C1A", lineHeight: 1.2, marginBottom: 12 }}>{s.label}</h3>
                  <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560", lineHeight:1.6, marginBottom:16, maxWidth:360 }}>{s.desc}</p>
                  <TextLink onClick={()=>navigate("/client/services")}>Discover More</TextLink>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}