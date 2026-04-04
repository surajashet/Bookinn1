import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const get = p => fetch(`${BASE_URL}${p}`, { headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` } }).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); });
const post = (p, body) => fetch(`${BASE_URL}${p}`, { method:"POST", headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` }, body: JSON.stringify(body) }).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); });

const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const nights  = (ci,co) => Math.max(1,Math.round((new Date(co)-new Date(ci))/86400000));
const greeting = () => { const h=new Date().getHours(); return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening"; };

const ACCENT   = "#4A7C72";
const ACCENT_L = "#6A9E94";

const Sk = ({w="100%",h=14,style={}}) => (
  <div style={{ width:w, height:h, borderRadius:8, background:"linear-gradient(90deg,#EDE7DE 25%,#E4DDD4 50%,#EDE7DE 75%)", backgroundSize:"200% 100%", animation:"bkShimmer 1.5s infinite", ...style }} />
);

const BADGE = { Confirmed:{bg:"#e8f2ef",c:"#2d6b5e"}, Pending:{bg:"#fdf5e8",c:"#7a5a1a"}, Cancelled:{bg:"#faeaea",c:"#8a3030"}, "Checked In":{bg:"#e5f0ee",c:"#2d6b5e"}, "Checked Out":{bg:"#f0eff6",c:"#4a4070"} };
const StatusBadge = ({status}) => { const s=BADGE[status]||{bg:"#F0EBE4",c:"#6B6560"}; return <span style={{ background:s.bg, color:s.c, padding:"3px 12px", borderRadius:999, fontSize:10, fontWeight:400, letterSpacing:".08em", textTransform:"uppercase", whiteSpace:"nowrap", fontFamily:"'CabinetGrotesk',sans-serif" }}>{status}</span>; };

// Room Service Modal Component
const RoomServiceModal = ({ isOpen, onClose, roomId, userId, onSuccess }) => {
  const [formData, setFormData] = useState({
    task_type: '',
    description: '',
    priority: 'normal'
  });
  const [submitting, setSubmitting] = useState(false);

  const serviceOptions = [
    { value: 'cleaning', label: '🧹 Room Cleaning', eta: '15-30 min' },
    { value: 'towels', label: '🛁 Extra Towels', eta: '5-10 min' },
    { value: 'pillows', label: '🛏️ Extra Pillows/Bedding', eta: '5-10 min' },
    { value: 'food', label: '🍽️ Food & Beverage', eta: '30-45 min' },
    { value: 'maintenance', label: '🔧 Maintenance Issue', eta: 'Varies' },
    { value: 'laundry', label: '👕 Laundry Pickup', eta: '2-4 hours' },
    { value: 'other', label: '📝 Other Request', eta: 'As needed' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.task_type) {
      toast.error('Please select a service type');
      return;
    }

    if (!roomId) {
      toast.error('Room ID not found. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Submitting your request...');

    try {
      console.log("📤 Submitting service request:", {
        room_id: roomId,
        task_type: formData.task_type,
        description: formData.description,
        priority: formData.priority
      });

      await post('/api/tasks/service-request', {
        room_id: roomId,
        task_type: formData.task_type,
        description: formData.description,
        priority: formData.priority
      });

      toast.dismiss(loadingToast);
      toast.success('✅ Service request submitted! Staff will be with you shortly.');
      
      setFormData({ task_type: '', description: '', priority: 'normal' });
      onClose();
      if (onSuccess) onSuccess();
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("❌ Service request error:", error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 480,
        margin: 16,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #E4DDD4'
        }}>
          <h2 style={{ fontFamily: "'Soria',serif", fontSize: 24, color: '#1E1C1A', margin: 0 }}>🛎️ Room Service</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#A09890' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1E1C1A' }}>
              What do you need?
            </label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({...formData, task_type: e.target.value})}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E4DDD4', borderRadius: 12, fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 14 }}
              required
            >
              <option value="">Select service</option>
              {serviceOptions.map(service => (
                <option key={service.value} value={service.value}>
                  {service.label} (ETA: {service.eta})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1E1C1A' }}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E4DDD4', borderRadius: 12, fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 14 }}
            >
              <option value="normal">Normal</option>
              <option value="high">🔥 High (Urgent)</option>
              <option value="low">⏰ Low (Anytime)</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1E1C1A' }}>
              Additional Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g., Extra pillows, specific instructions, etc."
              rows="3"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E4DDD4', borderRadius: 12, fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 14, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                background: ACCENT,
                color: '#fff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: 999,
                fontFamily: "'CabinetGrotesk',sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                color: '#A09890',
                border: '1px solid #E4DDD4',
                padding: '14px 24px',
                borderRadius: 999,
                fontFamily: "'CabinetGrotesk',sans-serif",
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        <div style={{ padding: '16px 24px', background: '#F8F6F4', fontSize: 12, color: '#A09890', fontFamily: "'CabinetGrotesk',sans-serif" }}>
          ⏱️ Estimated response: 5-15 minutes &nbsp;|&nbsp; 📞 For emergencies, call front desk (ext 0)
        </div>
      </div>
    </div>
  );
};

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
  const [showRoomService, setShowRoomService] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    fetchDashboardData();
    fetchRooms();
  }, [refetchKey]);

  const fetchDashboardData = async () => {
    try {
      const d = await get("/api/client/dashboard");
      setData(d);
      
      if (d?.recent?.length) {
        const today = new Date().toISOString().split('T')[0];
        const active = d.recent.find(b => 
          (b.status === 'confirmed' || b.status === 'Checked In') &&
          b.check_in <= today && 
          b.check_out >= today
        );
        
        console.log("🔍 Active booking found:", active);
        console.log("📝 Room ID:", active?.room_id);
        
        setActiveBooking(active);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const d = await get("/api/client/rooms");
      setRooms(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Rooms error:", error);
    } finally {
      setRLoading(false);
    }
  };

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

  const canRequestRoomService = () => {
    if (!activeBooking) return false;
    const today = new Date().toISOString().split('T')[0];
    return (activeBooking.status === 'confirmed' || activeBooking.status === 'Checked In') &&
           activeBooking.check_in <= today && 
           activeBooking.check_out >= today;
  };

  const getDaysRemaining = () => {
    if (!activeBooking) return 0;
    const today = new Date().toISOString().split('T')[0];
    const checkOut = new Date(activeBooking.check_out);
    const todayDate = new Date(today);
    const diffTime = checkOut - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
      <Toaster position="top-center" />
      
      {/* Room Service Modal */}
      <RoomServiceModal
        isOpen={showRoomService}
        onClose={() => setShowRoomService(false)}
        roomId={activeBooking?.room_id}
        userId={user?.user_id}
        onSuccess={() => setRefetchKey(prev => prev + 1)}
      />
      
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
              <div>
                <Sk w={340} h={56} style={{ marginBottom:20, background:"rgba(255,255,255,.1)" }} />
                <Sk w={260} h={14} style={{ background:"rgba(255,255,255,.07)" }} />
              </div>
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
              { label:"Total Bookings", val:data.stats.totalBookings ?? 0 },
              { label:"Active Stays",   val:data.stats.activeBookings ?? 0 },
              { label:"Amount Spent",   val:`₹${(data.stats.totalSpend ?? 0).toLocaleString("en-IN")}` },
              { label:"Loyalty Points", val:data.stats.loyaltyPoints ?? 0 },
            ].map((s,i) => (
              <div key={s.label} style={{ flex:1, padding:"22px 0", textAlign:"center", borderTop:"1px solid rgba(255,255,255,0.08)", borderRight:i<3?"1px solid rgba(255,255,255,0.08)":"none", background:"rgba(20,18,16,0.5)", backdropFilter:"blur(16px)" }}>
                <div style={{ fontFamily:"'Soria',serif", fontStyle:"italic", fontSize:24, color:"#A8CEC8", lineHeight:1, marginBottom:6 }}>{s.val}</div>
                <div style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:".18em", textTransform:"uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* constrained content */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>

        {/* ACTIVE STAY + ROOM SERVICE BUTTON */}
        {activeBooking && canRequestRoomService() && (
          <section style={{ padding: "48px 0 24px" }}>
            <div style={{
              background: "linear-gradient(135deg, #F8F6F4 0%, #F0EBE4 100%)",
              borderRadius: 24,
              padding: "32px 40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 24,
              border: "1px solid #E4DDD4"
            }}>
              <div>
                <div style={{ fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 8 }}>
                  🏠 Currently Staying
                </div>
                <h3 style={{ fontFamily: "'Soria',serif", fontSize: 28, color: "#1E1C1A", marginBottom: 8 }}>
                  Room {activeBooking.room_number}
                </h3>
                <p style={{ fontFamily: "'CabinetGrotesk',sans-serif", fontSize: 13, color: "#6B6560", margin: 0 }}>
                  {fmtDate(activeBooking.check_in)} — {fmtDate(activeBooking.check_out)} &nbsp;|&nbsp;
                  {getDaysRemaining()} night(s) remaining
                </p>
              </div>
              <button
                onClick={() => setShowRoomService(true)}
                style={{
                  background: ACCENT,
                  color: "#fff",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: 999,
                  fontFamily: "'CabinetGrotesk',sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.background = ACCENT_L}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                <span style={{ fontSize: 20 }}>🛎️</span>
                Request Room Service
              </button>
            </div>
          </section>
        )}

        {/* UPCOMING STAY - Only show if no active stay */}
        <section style={{ padding: activeBooking ? "40px 0 80px" : "96px 0 80px" }}>
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
              {[
                ["Room", `${data.upcoming.room_number}`],
                ["Type", data.upcoming.room_type],
                ["Check-in", fmtDate(data.upcoming.check_in)],
                ["Check-out", fmtDate(data.upcoming.check_out)]
              ].map(([l,v],i) => (
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
              {[0,1,2].map(i => (
                <div key={i}>
                  <Sk w="100%" h={260} style={{marginBottom:16,borderRadius:16}} />
                  <Sk w="40%" h={10} style={{marginBottom:10}} />
                  <Sk w="70%" h={18} />
                </div>
              ))}
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
            <div>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"20px 0", borderBottom:"1px solid #E4DDD4" }}>
                  <Sk w={200} h={13} />
                  <Sk w={80} h={20} />
                </div>
              ))}
            </div>
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
                    <td style={{ padding:"20px 24px 20px 0", fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:13, color:"#6B6560" }}>{nights(b.check_in, b.check_out)}</td>
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