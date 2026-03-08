// FILE: src/pages/ClientPayments.jsx
import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const authFetch = (p,o={}) => fetch(`${BASE_URL}${p}`,{...o,headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`,...(o.headers||{})}}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json();});
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const Sk = ({w="100%",h=14,r=6,style={}}) => <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style}} />;
const Toast = ({type,msg}) => <div style={{position:"fixed",bottom:30,right:30,background:"#fff",border:"1px solid #D6E3DF",borderLeft:`3px solid ${type==="success"?"#5F8B6F":"#B45C5C"}`,padding:"12px 18px",borderRadius:12,fontSize:13,boxShadow:"none",zIndex:999,display:"flex",alignItems:"center",gap:10,maxWidth:340}}><i className={`fa-regular fa-circle-${type==="success"?"check":"exclamation"}`} style={{color:type==="success"?"#5F8B6F":"#B45C5C"}} />{msg}</div>;

export default function ClientPayments() {
  const [payments,setPayments] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [paying,setPaying]     = useState(null);
  const [error,setError]       = useState(null);
  const [toast,setToast]       = useState(null);

  useEffect(() => {
    authFetch("/api/client/payments")
      .then(d=>{setPayments(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(()=>{setError("Could not load payments.");setLoading(false);});
  },[]);

  const initiatePay = async (bookingId,amount) => {
    setPaying(bookingId);
    try {
      const data = await authFetch("/api/client/payments",{method:"POST",body:JSON.stringify({booking_id:bookingId,amount})});
      if(data.payment_url) { window.location.href=data.payment_url; }
      else { setToast({type:"success",msg:"Payment initiated. Check your email for confirmation."}); setTimeout(()=>setToast(null),5000); }
    } catch { setToast({type:"error",msg:"Payment failed. Please try again."}); setTimeout(()=>setToast(null),4000); }
    finally { setPaying(null); }
  };

  const pending = payments.filter(p=>p.status==="Pending"||p.status==="Due");
  const totalSpend = payments.filter(p=>p.status==="Paid").reduce((a,p)=>a+(p.amount||0),0);

  return (
    <>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>
      {/* Header */}
      <div style={{ paddingTop:56, marginBottom:36 }}>
        <div style={{ fontSize:10,color:"#4A7C72",fontWeight:400,textTransform:"uppercase",letterSpacing:".22em",marginBottom:12,fontFamily:"'CabinetGrotesk',sans-serif" }}>Finances</div>
        <h1 style={{ fontFamily:"'Brolimo',serif",fontStyle:"italic",fontSize:"clamp(36px,4vw,56px)",fontWeight:400,color:"#1E1C1A",marginBottom:12,lineHeight:1 }}>Payments & <em style={{ fontStyle:"italic",color:"#4A7C72" }}>Dues</em></h1>
        <p style={{ fontFamily:"'CabinetGrotesk',sans-serif",fontWeight:200,fontSize:14,color:"#A09890" }}>View outstanding balances and your complete payment history.</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:36 }}>
          {[
            {label:"Total Paid",    val:`₹${totalSpend.toLocaleString("en-IN")}`, icon:"fa-solid fa-circle-check",   color:"#5F8B6F", bg:"#e8f4ec"},
            {label:"Outstanding",  val:pending.length,                            icon:"fa-regular fa-clock",         color:"#9a6e1a", bg:"#fdf3e0"},
            {label:"Transactions", val:payments.length,                           icon:"fa-regular fa-credit-card",   color:"#5A7F9A", bg:"#e0f0fa"},
          ].map(s => (
            <div key={s.label} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"22px 24px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, fontSize:20 }}>
                <i className={s.icon} />
              </div>
              <div>
                <div style={{ fontFamily:"'Soria',serif", fontSize:26, fontWeight:600, color:"#1E1C1A" }}>{s.val}</div>
                <div style={{ fontSize:12, color:"#A09890", marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending dues */}
      {!loading && pending.length > 0 && (
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:10, color:"#4A7C72", fontWeight:400, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Action Required</div>
          <h2 style={{ fontFamily:"'Soria',serif", fontSize:22, fontWeight:400, color:"#1E1C1A", marginBottom:16 }}>Outstanding <em style={{ fontStyle:"italic", color:"#4A7C72" }}>Dues</em></h2>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {pending.map(p => (
              <div key={p.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", borderLeft:"4px solid #4A7C72", padding:"22px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap", boxShadow:"none" }}>
                <div>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:18, fontWeight:600, color:"#1E1C1A", marginBottom:4 }}>Booking #{p.booking_id}</div>
                  <div style={{ fontSize:12.5, color:"#A09890" }}>Due: {p.due_date?fmtDate(p.due_date):"Upon check-out"}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:28, fontWeight:400, color:"#4A7C72" }}>₹{(p.amount||0).toLocaleString("en-IN")}</div>
                  <button onClick={()=>initiatePay(p.booking_id,p.amount)} disabled={paying===p.booking_id}
                    style={{ background:"#1E1C1A", color:"#4A7C72", border:"none", padding:"11px 26px", borderRadius:9, fontFamily:"inherit", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity:paying===p.booking_id?.6:1 }}>
                    {paying===p.booking_id ? <span style={{ width:14, height:14, border:"2px solid rgba(198,161,91,.3)", borderTopColor:"#4A7C72", borderRadius:"50%", animation:"bkSpin .7s linear infinite", display:"inline-block" }} /> : <><i className="fa-solid fa-lock" />Pay Now</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div style={{ fontSize:10, color:"#4A7C72", fontWeight:400, textTransform:"uppercase", letterSpacing:".22em", marginBottom:12, fontFamily:"'CabinetGrotesk',sans-serif" }}>Ledger</div>
      <h2 style={{ fontFamily:"'Soria',serif", fontSize:22, fontWeight:400, color:"#1E1C1A", marginBottom:16 }}>Payment <em style={{ fontStyle:"italic", color:"#4A7C72" }}>History</em></h2>

      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", overflow:"hidden", boxShadow:"none" }}>
        {loading ? (
          <div style={{ padding:28, display:"flex", flexDirection:"column", gap:16 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ display:"flex", gap:16 }}><Sk w="14%" h={13} /><Sk w="12%" h={13} /><Sk w="20%" h={13} /><Sk w="12%" h={13} /><Sk w="14%" h={13} /><Sk w={70} h={22} r={999} /></div>)}
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding:"72px 32px", textAlign:"center" }}>
            <i className="fa-regular fa-credit-card" style={{ fontSize:40, color:"#d4cbc0", marginBottom:16, display:"block" }} />
            <div style={{ fontFamily:"'Soria',serif", fontSize:22, color:"#6B6560", marginBottom:8 }}>No Payment Records</div>
            <p style={{ fontSize:14, color:"#A09890" }}>Your payment history will appear here after your first transaction.</p>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr style={{ background:"#F4F7F6" }}>
                {["Date","Booking","Description","Amount","Method","Status"].map(h => (
                  <th key={h} style={{ padding:"13px 18px", textAlign:"left", fontSize:11, fontWeight:500, letterSpacing:".05em", textTransform:"uppercase", color:"#6B6560", borderBottom:"1px solid #D6E3DF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="bk-row-hover" style={{ borderBottom:"1px solid #E8EEEC" }}>
                  <td style={{ padding:"14px 18px", color:"#6B6560", whiteSpace:"nowrap" }}>{fmtDate(p.paid_at||p.created_at)}</td>
                  <td style={{ padding:"14px 18px", fontWeight:600, color:"#4A7C72" }}>#{p.booking_id}</td>
                  <td style={{ padding:"14px 18px", color:"#6B6560" }}>{p.description||"Room charges"}</td>
                  <td style={{ padding:"14px 18px", fontWeight:600, color:"#1E1C1A" }}>₹{(p.amount||0).toLocaleString("en-IN")}</td>
                  <td style={{ padding:"14px 18px", color:"#6B6560" }}>{p.method||"—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ background:p.status==="Paid"?"#e8f4ec":"#fde8e8", color:p.status==="Paid"?"#3a7a52":"#9a3535", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && <Toast type="error" msg={error} />}
      {toast && <Toast type={toast.type} msg={toast.msg} />}
      </div>
    </>
  );
}