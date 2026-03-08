// FILE: src/pages/ClientBookings.jsx
import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const authFetch = (p,o={}) => fetch(`${BASE_URL}${p}`,{...o,headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`,...(o.headers||{})}}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json();});
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const nights  = (ci,co) => Math.max(1,Math.round((new Date(co)-new Date(ci))/86400000));
const Sk = ({w="100%",h=14,r=6,style={}}) => <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style}} />;

const BADGE = {Confirmed:{bg:"#e8f4ec",c:"#3a7a52"},Pending:{bg:"#fdf3e0",c:"#9a6e1a"},Cancelled:{bg:"#fde8e8",c:"#9a3535"},"Checked In":{bg:"#e0f0fa",c:"#2a6080"},"Checked Out":{bg:"#ece9f4",c:"#5a4a80"}};
const StatusBadge = ({status}) => { const s=BADGE[status]||{bg:"#f0ede8",c:"#5a5a56"}; return <span style={{background:s.bg,color:s.c,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{status}</span>; };

const FILTERS = ["All","Confirmed","Checked In","Checked Out","Pending","Cancelled"];

export default function ClientBookings() {
  const [bookings,setBookings] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [cancelling,setCancelling] = useState(null);
  const [filter,setFilter]     = useState("All");
  const [error,setError]       = useState(null);
  const [toast,setToast]       = useState(null);

  useEffect(() => {
    authFetch("/api/client/bookings")
      .then(d=>{setBookings(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(()=>{setError("Could not load bookings.");setLoading(false);});
  },[]);

  const cancel = async id => {
    if(!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await authFetch(`/api/client/bookings/${id}`,{method:"DELETE"});
      setBookings(p=>p.map(b=>b.id===id?{...b,status:"Cancelled"}:b));
      setToast({type:"success",msg:"Booking cancelled successfully."});
    } catch { setToast({type:"error",msg:"Could not cancel. Please try again."}); }
    finally { setCancelling(null); setTimeout(()=>setToast(null),4000); }
  };

  const visible = bookings.filter(b=>filter==="All"||b.status===filter);

  return (
    <>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>
        <div style={{ paddingTop:56, marginBottom:36 }}>
          <div style={{ fontSize:10, color:"#4A7C72", fontWeight:400, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Reservations</div>
          <h1 style={{ fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"clamp(36px,4vw,56px)", fontWeight:400, color:"#1E1C1A", lineHeight:1 }}>My <em style={{ color:"#4A7C72" }}>Bookings</em></h1>
          <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:14, color:"#A09890", lineHeight:1.8 }}>View, track and manage all your reservations.</p>
        </div>

      {/* Filter chips */}
      {!loading && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:26 }}>
          {FILTERS.map(f => {
            const count = f==="All" ? bookings.length : bookings.filter(b=>b.status===f).length;
            return (
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 14px", borderRadius:999, fontSize:12.5, fontWeight:filter===f?600:400, cursor:"pointer", border:"1px solid", borderColor:filter===f?"#4A7C72":"#e8e2da", background:filter===f?"#4A7C72":"transparent", color:filter===f?"#fff":"#4a4a48", transition:"all .18s", display:"flex", alignItems:"center", gap:6 }}>
                {f}
                <span style={{ opacity:.7, fontSize:11 }}>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Table card */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", overflow:"hidden", boxShadow:"none" }}>
        {loading ? (
          <div style={{ padding:28, display:"flex", flexDirection:"column", gap:16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ display:"flex", gap:16, alignItems:"center" }}>
                <Sk w="10%" h={13} /><Sk w="12%" h={13} /><Sk w="14%" h={13} /><Sk w="14%" h={13} /><Sk w="14%" h={13} /><Sk w="8%" h={13} /><Sk w="12%" h={13} /><Sk w={70} h={22} r={999} />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding:"72px 32px", textAlign:"center" }}>
            <i className="fa-regular fa-calendar-xmark" style={{ fontSize:40, color:"#d4cbc0", marginBottom:16, display:"block" }} />
            <div style={{ fontFamily:"'Soria',serif", fontSize:22, color:"#6B6560", marginBottom:8 }}>No bookings found</div>
            <p style={{ fontSize:14, color:"#A09890" }}>{filter==="All"?"You haven't made any bookings yet.":`No ${filter} bookings at the moment.`}</p>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr style={{ background:"#F4F7F6" }}>
                {["Booking ID","Room","Type","Check-in","Check-out","Nights","Amount","Status",""].map(h => (
                  <th key={h} style={{ padding:"13px 18px", textAlign:"left", fontSize:11, fontWeight:500, letterSpacing:".05em", textTransform:"uppercase", color:"#6B6560", borderBottom:"1px solid #D6E3DF", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(b => (
                <tr key={b.id} className="bk-row-hover" style={{ borderBottom:"1px solid #E8EEEC" }}>
                  <td style={{ padding:"14px 18px", fontWeight:600, color:"#4A7C72" }}>#{b.id}</td>
                  <td style={{ padding:"14px 18px", color:"#1E1C1A", fontWeight:500 }}>{b.room_number}</td>
                  <td style={{ padding:"14px 18px", color:"#6B6560" }}>{b.room_type}</td>
                  <td style={{ padding:"14px 18px", color:"#6B6560", whiteSpace:"nowrap" }}>{fmtDate(b.check_in)}</td>
                  <td style={{ padding:"14px 18px", color:"#6B6560", whiteSpace:"nowrap" }}>{fmtDate(b.check_out)}</td>
                  <td style={{ padding:"14px 18px", textAlign:"center", color:"#6B6560" }}>{nights(b.check_in,b.check_out)}</td>
                  <td style={{ padding:"14px 18px", fontWeight:600, color:"#1E1C1A" }}>₹{(b.total_amount||0).toLocaleString("en-IN")}</td>
                  <td style={{ padding:"14px 18px" }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding:"14px 18px" }}>
                    {(b.status==="Confirmed"||b.status==="Pending") && (
                      <button onClick={()=>cancel(b.id)} disabled={cancelling===b.id}
                        style={{ padding:"5px 14px", background:"#fde8e8", color:"#9a3535", border:"1px solid rgba(180,92,92,.2)", borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, transition:"all .18s", whiteSpace:"nowrap" }}>
                        {cancelling===b.id ? <span style={{ width:12, height:12, border:"2px solid #d4cbc0", borderTopColor:"#9a3535", borderRadius:"50%", animation:"bkSpin .7s linear infinite", display:"inline-block" }} /> : "Cancel"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary bar */}
      {!loading && bookings.length > 0 && (
        <div style={{ marginTop:20, display:"flex", gap:24, flexWrap:"wrap" }}>
          {[["Total",bookings.length],["Confirmed",bookings.filter(b=>b.status==="Confirmed").length],["Active",bookings.filter(b=>b.status==="Checked In").length],["Cancelled",bookings.filter(b=>b.status==="Cancelled").length]].map(([l,v]) => (
            <div key={l} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"14px 22px", display:"flex", flexDirection:"column", gap:3 }}>
              <div style={{ fontFamily:"'Soria',serif", fontSize:24, fontWeight:600, color:"#4A7C72" }}>{v}</div>
              <div style={{ fontSize:11.5, color:"#A09890" }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {error && <Toast type="error" msg={error} />}
      {toast && <Toast type={toast.type} msg={toast.msg} />}
      </div>
    </>
  );
}

const Toast = ({type,msg}) => (
  <div style={{ position:"fixed", bottom:30, right:30, background:"#fff", border:"1px solid #D6E3DF", borderLeft:`3px solid ${type==="success"?"#5F8B6F":"#B45C5C"}`, padding:"12px 18px", borderRadius:12, fontSize:13, boxShadow:"none", zIndex:999, display:"flex", alignItems:"center", gap:10, animation:"bkFadeUp .2s ease", maxWidth:340 }}>
    <i className={`fa-regular fa-circle-${type==="success"?"check":"exclamation"}`} style={{ color:type==="success"?"#5F8B6F":"#B45C5C" }} />
    {msg}
  </div>
);