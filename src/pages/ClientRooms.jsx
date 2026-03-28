import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"; // Changed to 3001
const authFetch = p => fetch(`${BASE_URL}${p}`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json();});

const Sk = ({w="100%",h=14,r=6,style={}}) => <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style}} />;

export default function ClientRooms() {
  const [rooms,setRooms]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter] = useState("All");
  const [sort,setSort]     = useState("default");
  const [error,setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    authFetch("/api/client/rooms")
      .then(d=>{setRooms(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(()=>{setError("Could not load rooms.");setLoading(false);});
  },[]);

  const types = ["All",...new Set(rooms.map(r=>r.type).filter(Boolean))];

  let visible = rooms.filter(r=>filter==="All"||r.type===filter);
  if(sort==="price-asc")  visible=[...visible].sort((a,b)=>(a.price||0)-(b.price||0));
  if(sort==="price-desc") visible=[...visible].sort((a,b)=>(b.price||0)-(a.price||0));

  return (
    <>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>
      {/* Page header */}
      <div style={{ paddingTop:56, marginBottom:36 }}>
        <div style={{ fontSize:10,color:"#4A7C72",fontWeight:400,textTransform:"uppercase",letterSpacing:".22em",marginBottom:12,fontFamily:"'CabinetGrotesk',sans-serif" }}>Accommodations</div>
        <h1 style={{ fontFamily:"'Brolimo',serif",fontStyle:"italic",fontSize:"clamp(36px,4vw,56px)",fontWeight:400,color:"#1E1C1A",marginBottom:12,lineHeight:1 }}>Browse <em style={{ fontStyle:"italic",color:"#4A7C72" }}>Rooms</em></h1>
        <p style={{ fontFamily:"'CabinetGrotesk',sans-serif",fontWeight:200,fontSize:14,color:"#A09890" }}>Choose from our curated selection of premium rooms and suites.</p>
      </div>

      {/* Filters row */}
      {!loading && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {types.map(t => (
              <button key={t} onClick={()=>setFilter(t)} style={{ padding:"6px 16px", borderRadius:999, fontSize:12.5, fontWeight:filter===t?600:400, cursor:"pointer", border:"1px solid", borderColor:filter===t?"#4A7C72":"#e8e2da", background:filter===t?"#4A7C72":"transparent", color:filter===t?"#fff":"#4a4a48", transition:"all .18s" }}>
                {t}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ border:"1px solid #D6E3DF", borderRadius:12, padding:"7px 12px", fontSize:13, fontFamily:"inherit", color:"#6B6560", background:"#fff", outline:"none", cursor:"pointer" }}>
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #D6E3DF" }}>
              <Sk w="100%" h={200} r={0} />
              <div style={{ padding:20 }}><Sk w="28%" h={10} style={{marginBottom:8}} /><Sk w="68%" h={19} style={{marginBottom:10}} /><Sk w="100%" h={11} style={{marginBottom:5}} /><Sk w="80%" h={11} style={{marginBottom:16}} /><div style={{display:"flex",gap:6,marginBottom:14}}>{[0,1,2].map(j=><Sk key={j} w={56} h={22} r={6} />)}</div><Sk w="100%" h={38} r={8} /></div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"72px 32px", textAlign:"center" }}>
          <div style={{ fontSize:40, color:"#d4cbc0", marginBottom:16, display:"block" }}>🏨</div>
          <div style={{ fontFamily:"'Soria',serif", fontSize:22, color:"#6B6560", marginBottom:8 }}>
            {filter==="All" ? "No rooms available" : `No ${filter} rooms available`}
          </div>
          <p style={{ fontSize:14, color:"#A09890" }}>Please check back later or contact the front desk.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22 }}>
          {visible.map((room,idx) => (
            <RoomCard key={room.id} room={room} idx={idx} />
          ))}
        </div>
      )}

      {error && <div style={{ position:"fixed", bottom:30, right:30, background:"#fff", border:"1px solid #D6E3DF", borderLeft:"3px solid #B45C5C", padding:"12px 18px", borderRadius:12, fontSize:13, color:"#1E1C1A", boxShadow:"0 4px 16px rgba(0,0,0,.1)", zIndex:300 }}>{error}</div>}
      </div>
    </>
  );
}

function RoomCard({ room, idx }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleBookNow = () => {
    // Navigate to booking page with room ID
    navigate(`/client/book?room=${room.id}`);
  };

  const handleViewDetails = () => {
    // Navigate to room details page (you can create this page later)
    // For now, just show alert or navigate to rooms page
    alert(`Room ${room.id} details coming soon!`);
    // Or: navigate(`/client/rooms/${room.id}`);
  };

  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #D6E3DF", boxShadow:hovered?"0 14px 36px rgba(0,0,0,.1)":"0 2px 8px rgba(0,0,0,.04)", transform:hovered?"translateY(-4px)":"translateY(0)", transition:"transform .24s,box-shadow .24s", animationDelay:`${idx*.05}s` }}>
      <div style={{ position:"relative", height:210, overflow:"hidden", background:"#EBF0EE" }}>
        {room.image_url
          ? <img src={room.image_url} alt={room.name} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hovered?"scale(1.06)":"scale(1)", transition:"transform .4s" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"#c0b8ae", fontSize:40 }}>🏨</div>
        }
        <div style={{ position:"absolute", top:12, right:12, background:"rgba(31,42,58,.84)", backdropFilter:"blur(6px)", color:"#4A7C72", padding:"5px 11px", borderRadius:12, fontSize:13, fontWeight:600 }}>
          ₹{room.price?.toLocaleString("en-IN")}<span style={{ color:"rgba(255,255,255,.55)", fontWeight:400, fontSize:11 }}>/night</span>
        </div>
        {room.status && (
          <div style={{ position:"absolute", top:12, left:12, background:room.status==="Available"?"#5F8B6F":"#B45C5C", color:"#fff", padding:"3px 9px", borderRadius:6, fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>{room.status}</div>
        )}
      </div>
      <div style={{ padding:"20px 20px 22px" }}>
        <div style={{ fontSize:10.5, color:"#4A7C72", fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>{room.type}</div>
        <div style={{ fontFamily:"'Soria',serif", fontSize:20, fontWeight:600, color:"#1E1C1A", marginBottom:6 }}>{room.name}</div>
        {room.size && <div style={{ fontSize:12, color:"#A09890", marginBottom:8 }}>{room.type} · {room.size} sq ft</div>}
        {room.description && <p style={{ fontSize:13, color:"#6B6560", lineHeight:1.55, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{room.description}</p>}
        {room.amenities?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:16 }}>
            {room.amenities.slice(0,4).map((a,i) => <span key={i} style={{ background:"#EBF0EE", color:"#6B6560", padding:"3px 8px", borderRadius:6, fontSize:11 }}>{a}</span>)}
            {room.amenities.length > 4 && <span style={{ background:"#EBF0EE", color:"#6B6560", padding:"3px 8px", borderRadius:6, fontSize:11 }}>+{room.amenities.length-4}</span>}
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleBookNow}
            style={{ flex:1, padding:"11px 0", background:"#1E1C1A", color:"#fff", border:"none", borderRadius:12, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", transition:"opacity .2s" }}>
            Book Now
          </button>
          <button onClick={handleViewDetails}
            style={{ padding:"11px 16px", background:"transparent", color:"#6B6560", border:"1px solid #D6E3DF", borderRadius:12, fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
            Details
          </button>
        </div>
      </div>
    </div>
  );
}