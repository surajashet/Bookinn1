// FILE: src/pages/ClientServices.jsx
import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const authFetch = (p,o={}) => fetch(`${BASE_URL}${p}`,{...o,headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`,...(o.headers||{})}}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json();});
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const Sk = ({w="100%",h=14,r=6,style={}}) => <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style}} />;
const Toast = ({type,msg}) => <div style={{position:"fixed",bottom:30,right:30,background:"#fff",border:"1px solid #D6E3DF",borderLeft:`3px solid ${type==="success"?"#5F8B6F":"#B45C5C"}`,padding:"12px 18px",borderRadius:12,fontSize:13,boxShadow:"none",zIndex:999,display:"flex",alignItems:"center",gap:10,maxWidth:340}}><i className={`fa-regular fa-circle-${type==="success"?"check":"exclamation"}`} style={{color:type==="success"?"#5F8B6F":"#B45C5C"}} />{msg}</div>;

const SERVICE_TYPES = [
  {value:"Room Cleaning",  icon:"fa-solid fa-broom"},
  {value:"Extra Towels",   icon:"fa-solid fa-layer-group"},
  {value:"Room Service",   icon:"fa-solid fa-utensils"},
  {value:"Laundry",        icon:"fa-solid fa-shirt"},
  {value:"Maintenance",    icon:"fa-solid fa-wrench"},
  {value:"Extra Pillows",  icon:"fa-solid fa-bed"},
  {value:"Wake-up Call",   icon:"fa-regular fa-clock"},
  {value:"Transportation", icon:"fa-solid fa-car"},
  {value:"Other",          icon:"fa-regular fa-message"},
];

const STATUS_STYLE = {
  Pending:      {bg:"#fdf3e0",c:"#9a6e1a"},
  "In Progress":{bg:"#e0f0fa",c:"#2a6080"},
  Completed:    {bg:"#e8f4ec",c:"#3a7a52"},
  Cancelled:    {bg:"#fde8e8",c:"#9a3535"},
};

export default function ClientServices() {
  const [requests,setRequests]   = useState([]);
  const [bookings,setBookings]   = useState([]);
  const [loading,setLoading]     = useState(true);
  const [submitting,setSubmitting] = useState(false);
  const [form,setForm]           = useState({type:"",description:"",booking_id:""});
  const [error,setError]         = useState(null);
  const [toast,setToast]         = useState(null);

  useEffect(() => {
    Promise.all([authFetch("/api/client/services"), authFetch("/api/client/bookings")])
      .then(([svc,bkn]) => {
        setRequests(Array.isArray(svc)?svc:[]);
        const active = Array.isArray(bkn)?bkn.filter(b=>b.status==="Confirmed"||b.status==="Checked In"):[];
        setBookings(active);
        if(active.length>0) setForm(p=>({...p,booking_id:active[0].id}));
        setLoading(false);
      })
      .catch(()=>{setError("Could not load service data.");setLoading(false);});
  },[]);

  const submit = async () => {
    if(!form.type)       { setToast({type:"error",msg:"Please select a service type."}); return; }
    if(!form.booking_id) { setToast({type:"error",msg:"No active booking to attach request to."}); return; }
    setSubmitting(true);
    try {
      const bk = bookings.find(b=>b.id===form.booking_id);
      const data = await authFetch("/api/client/services",{method:"POST",body:JSON.stringify({type:form.type,description:form.description,booking_id:form.booking_id,room_number:bk?.room_number})});
      setRequests(p=>[{id:data.request_id,type:form.type,description:form.description,status:"Pending",created_at:new Date().toISOString(),booking_id:form.booking_id,room_number:bk?.room_number},...p]);
      setForm(p=>({...p,type:"",description:""}));
      setToast({type:"success",msg:"Request submitted. Our team will attend shortly."});
    } catch { setToast({type:"error",msg:"Could not submit request. Please try again."}); }
    finally { setSubmitting(false); setTimeout(()=>setToast(null),5000); }
  };

  return (
    <>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>
        <div style={{ paddingTop:56, marginBottom:36 }}>
          <div style={{ fontSize:10, color:"#4A7C72", fontWeight:400, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Hospitality</div>
          <h1 style={{ fontFamily:"'Brolimo',serif", fontStyle:"italic", fontSize:"clamp(36px,4vw,56px)", fontWeight:400, color:"#1E1C1A", marginBottom:12, lineHeight:1 }}>Room <em style={{ color:"#4A7C72" }}>Services</em></h1>
          <p style={{ fontFamily:"'CabinetGrotesk',sans-serif", fontWeight:200, fontSize:14, color:"#A09890", lineHeight:1.8 }}>Request anything — we'll take care of the rest.</p>
        </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>

        {/* Request form */}
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"28px", boxShadow:"none" }}>
          <div style={{ fontSize:11, color:"#4A7C72", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", marginBottom:5 }}>New Request</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:22, fontWeight:400, color:"#1E1C1A", marginBottom:22 }}>Submit a <em style={{ fontStyle:"italic", color:"#4A7C72" }}>Request</em></h2>

          {!loading && bookings.length === 0 ? (
            <div style={{ padding:"32px 0", textAlign:"center" }}>
              <i className="fa-regular fa-calendar-xmark" style={{ fontSize:36, color:"#d4cbc0", marginBottom:14, display:"block" }} />
              <div style={{ fontFamily:"'Soria',serif", fontSize:18, color:"#6B6560", marginBottom:8 }}>No active booking</div>
              <p style={{ fontSize:13, color:"#A09890" }}>Service requests require an active or upcoming booking.</p>
            </div>
          ) : (
            <>
              {bookings.length > 1 && (
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:500, letterSpacing:".05em", color:"#6B6560", marginBottom:6, textTransform:"uppercase" }}>Select Booking</label>
                  <select value={form.booking_id} onChange={e=>setForm(p=>({...p,booking_id:e.target.value}))}
                    style={{ width:"100%", border:"1px solid #D6E3DF", borderRadius:12, padding:"10px 14px", fontSize:14, fontFamily:"inherit", color:"#1E1C1A", background:"#F4F7F6", outline:"none" }}>
                    {bookings.map(b => <option key={b.id} value={b.id}>Room {b.room_number} · {new Date(b.check_in).toLocaleDateString("en-IN")}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:500, letterSpacing:".05em", color:"#6B6560", marginBottom:10, textTransform:"uppercase" }}>Service Type</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {SERVICE_TYPES.map(s => (
                    <button key={s.value} type="button" onClick={()=>setForm(p=>({...p,type:s.value}))} className="bk-svc-btn"
                      style={{ padding:"14px 8px", borderRadius:12, border:`1px solid ${form.type===s.value?"#4A7C72":"#e8e2da"}`, background:form.type===s.value?"rgba(198,161,91,.06)":"#f9f7f4", cursor:"pointer", textAlign:"center", transition:"all .18s" }}>
                      <div style={{ fontSize:20, color:form.type===s.value?"#4A7C72":"#1F2A3A", marginBottom:6 }}><i className={s.icon} /></div>
                      <div style={{ fontSize:11, fontWeight:500, color:form.type===s.value?"#4A7C72":"#4a4a48", lineHeight:1.3 }}>{s.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:500, letterSpacing:".05em", color:"#6B6560", marginBottom:6, textTransform:"uppercase" }}>Additional Details</label>
                <textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Any specific instructions or details…"
                  style={{ width:"100%", border:"1px solid #D6E3DF", borderRadius:12, padding:"10px 14px", fontSize:14, fontFamily:"inherit", color:"#1E1C1A", background:"#F4F7F6", outline:"none", resize:"vertical", minHeight:80 }} />
              </div>

              <button onClick={submit} disabled={submitting||!form.type}
                style={{ width:"100%", padding:"13px 0", background:"#1E1C1A", color:submitting||!form.type?"rgba(255,255,255,.4)":"#4A7C72", border:"none", borderRadius:12, fontFamily:"inherit", fontSize:14, fontWeight:600, cursor:submitting||!form.type?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <span style={{ width:16,height:16,border:"2px solid rgba(198,161,91,.3)",borderTopColor:"#4A7C72",borderRadius:"50%",animation:"bkSpin .7s linear infinite",display:"inline-block" }} /> : <><i className="fa-regular fa-paper-plane" />Submit Request</>}
              </button>
            </>
          )}
        </div>

        {/* Request history */}
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"28px", boxShadow:"none" }}>
          <div style={{ fontSize:11, color:"#4A7C72", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", marginBottom:5 }}>History</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:22, fontWeight:400, color:"#1E1C1A", marginBottom:22 }}>My <em style={{ fontStyle:"italic", color:"#4A7C72" }}>Requests</em></h2>

          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[0,1,2].map(i => <div key={i} style={{ display:"flex", gap:12 }}><Sk w={44} h={44} r={10} style={{flexShrink:0}} /><div style={{flex:1}}><Sk w="55%" h={13} style={{marginBottom:7}} /><Sk w="35%" h={10} /></div></div>)}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ padding:"40px 0", textAlign:"center" }}>
              <i className="fa-regular fa-rectangle-list" style={{ fontSize:36, color:"#d4cbc0", marginBottom:14, display:"block" }} />
              <div style={{ fontFamily:"'Soria',serif", fontSize:18, color:"#6B6560", marginBottom:8 }}>No requests yet</div>
              <p style={{ fontSize:13, color:"#A09890" }}>Your service request history will appear here.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {requests.map(r => {
                const sc = STATUS_STYLE[r.status]||STATUS_STYLE.Pending;
                const svc = SERVICE_TYPES.find(s=>s.value===r.type);
                return (
                  <div key={r.id} style={{ display:"flex", gap:14, padding:"14px", background:"#F4F7F6", borderRadius:12, border:"1px solid #E8EEEC" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:"#fff", border:"1px solid #D6E3DF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, color:"#4A7C72" }}>
                      <i className={svc?.icon||"fa-regular fa-message"} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:8, marginBottom:4, alignItems:"center" }}>
                        <div style={{ fontSize:14.5, fontWeight:600, color:"#1E1C1A" }}>{r.type}</div>
                        <span style={{ background:sc.bg, color:sc.c, padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:600, letterSpacing:".05em", textTransform:"uppercase" }}>{r.status}</span>
                      </div>
                      {r.description && <div style={{ fontSize:12.5, color:"#6B6560", marginBottom:4, lineHeight:1.45 }}>{r.description}</div>}
                      <div style={{ fontSize:11, color:"#A09890" }}>Room {r.room_number} · {fmtDate(r.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {error && <div style={{ position:"fixed",bottom:30,right:30,background:"#fff",border:"1px solid #D6E3DF",borderLeft:"3px solid #B45C5C",padding:"12px 18px",borderRadius:12,fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:999,display:"flex",alignItems:"center",gap:10 }}><i className="fa-regular fa-circle-exclamation" style={{color:"#B45C5C"}} />{error}</div>}
      {toast && <Toast type={toast.type} msg={toast.msg} />}
      </div>
    </>
  );
}