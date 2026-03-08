// FILE: src/pages/ClientInvoices.jsx
import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const authFetch = p => fetch(`${BASE_URL}${p}`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json();});
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const Sk = ({w="100%",h=14,r=6,style={}}) => <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)",backgroundSize:"200% 100%",animation:"bkShimmer 1.5s infinite",...style}} />;

export default function ClientInvoices() {
  const [invoices,setInvoices] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [error,setError]       = useState(null);
  const [expanded,setExpanded] = useState(null);
  const [downloading,setDownloading] = useState(null);

  useEffect(() => {
    authFetch("/api/client/invoices")
      .then(d=>{setInvoices(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(()=>{setError("Could not load invoices.");setLoading(false);});
  },[]);

  const downloadPdf = async id => {
    setDownloading(id);
    try {
      const res = await fetch(`${BASE_URL}/api/client/invoices/${id}/pdf`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href=url; a.download=`invoice-${id}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch { alert("Could not download invoice. Please try again."); }
    finally { setDownloading(null); }
  };

  const totalGst = invoices.reduce((a,i)=>a+(i.gst_amount||0),0);
  const totalAmt  = invoices.reduce((a,i)=>a+(i.total_amount||0),0);

  return (
    <>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 64px" }}>
      {/* Header */}
      <div style={{ paddingTop:56, marginBottom:36 }}>
        <div style={{ fontSize:10,color:"#4A7C72",fontWeight:400,textTransform:"uppercase",letterSpacing:".22em",marginBottom:12,fontFamily:"'CabinetGrotesk',sans-serif" }}>Documents</div>
        <h1 style={{ fontFamily:"'Brolimo',serif",fontStyle:"italic",fontSize:"clamp(36px,4vw,56px)",fontWeight:400,color:"#1E1C1A",marginBottom:12,lineHeight:1 }}>GST <em style={{ fontStyle:"italic",color:"#4A7C72" }}>Invoices</em></h1>
        <p style={{ fontFamily:"'CabinetGrotesk',sans-serif",fontWeight:200,fontSize:14,color:"#A09890" }}>Download GST-compliant invoices for all your stays.</p>
      </div>

      {/* Summary */}
      {!loading && invoices.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:32 }}>
          {[
            {label:"Total Invoices",val:invoices.length,       icon:"fa-regular fa-file-invoice", color:"#5A7F9A", bg:"#e0f0fa"},
            {label:"Total Amount",  val:`₹${totalAmt.toLocaleString("en-IN")}`,  icon:"fa-solid fa-indian-rupee-sign",  color:"#3a7a52", bg:"#e8f4ec"},
            {label:"GST Paid",      val:`₹${totalGst.toLocaleString("en-IN")}`,  icon:"fa-regular fa-receipt",         color:"#9a6e1a", bg:"#fdf3e0"},
          ].map(s => (
            <div key={s.label} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"20px 22px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, fontSize:19 }}><i className={s.icon} /></div>
              <div>
                <div style={{ fontFamily:"'Soria',serif", fontSize:24, fontWeight:600, color:"#1E1C1A" }}>{s.val}</div>
                <div style={{ fontSize:12, color:"#A09890", marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"22px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ flex:1 }}><Sk w="36%" h={16} style={{marginBottom:9}} /><Sk w="55%" h={11} style={{marginBottom:6}} /><Sk w="28%" h={10} /></div>
              <div style={{ display:"flex", gap:10 }}><Sk w={72} h={36} r={8} /><Sk w={88} h={36} r={8} /></div>
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", padding:"72px 32px", textAlign:"center" }}>
          <i className="fa-regular fa-file-invoice" style={{ fontSize:40, color:"#d4cbc0", marginBottom:16, display:"block" }} />
          <div style={{ fontFamily:"'Soria',serif", fontSize:22, color:"#6B6560", marginBottom:8 }}>No Invoices Yet</div>
          <p style={{ fontSize:14, color:"#A09890", maxWidth:380, margin:"0 auto" }}>Invoices are generated automatically after check-out and will appear here.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {invoices.map(inv => (
            <div key={inv.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #D6E3DF", overflow:"hidden", boxShadow:"none" }}>
              {/* Invoice row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 24px", flexWrap:"wrap", gap:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:"#EBF0EE", border:"1px solid #D6E3DF", display:"flex", alignItems:"center", justifyContent:"center", color:"#4A7C72", fontSize:20 }}>
                    <i className="fa-regular fa-file-invoice" />
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Soria',serif", fontSize:17, fontWeight:600, color:"#1E1C1A", marginBottom:4 }}>Invoice #{inv.id}</div>
                    <div style={{ fontSize:12, color:"#A09890" }}>Booking {inv.booking_id} · Issued {fmtDate(inv.issued_at)}</div>
                    <div style={{ fontSize:11, color:"#A09890", marginTop:2 }}>GST: ₹{(inv.gst_amount||0).toLocaleString("en-IN")} {inv.gstin && `· GSTIN: ${inv.gstin}`}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ fontFamily:"'Soria',serif", fontSize:26, fontWeight:600, color:"#1E1C1A" }}>
                    ₹{(inv.total_amount||0).toLocaleString("en-IN")}
                  </div>
                  <button onClick={()=>setExpanded(expanded===inv.id?null:inv.id)}
                    style={{ padding:"8px 16px", background:"transparent", border:"1px solid #D6E3DF", borderRadius:12, fontSize:13, color:"#6B6560", fontFamily:"inherit", cursor:"pointer" }}>
                    {expanded===inv.id ? "Hide" : "Details"}
                  </button>
                  <button onClick={()=>downloadPdf(inv.id)} disabled={downloading===inv.id}
                    style={{ padding:"8px 16px", background:"#1E1C1A", color:"#4A7C72", border:"none", borderRadius:12, fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:downloading===inv.id?.6:1 }}>
                    {downloading===inv.id ? <span style={{ width:12,height:12,border:"2px solid rgba(198,161,91,.3)",borderTopColor:"#4A7C72",borderRadius:"50%",animation:"bkSpin .7s linear infinite",display:"inline-block" }} /> : <i className="fa-regular fa-file-pdf" />}
                    PDF
                  </button>
                </div>
              </div>

              {/* Expanded line items */}
              {expanded===inv.id && inv.line_items?.length > 0 && (
                <div style={{ borderTop:"1px solid #E8EEEC", background:"#F4F7F6", padding:"18px 24px" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr>
                        {["Description","Qty","Rate","Amount"].map(h => <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:500, letterSpacing:".05em", textTransform:"uppercase", color:"#6B6560", borderBottom:"1px solid #D6E3DF" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {inv.line_items.map((li,i) => (
                        <tr key={i} style={{ borderBottom:"1px solid #E8EEEC" }}>
                          <td style={{ padding:"11px 14px", color:"#6B6560" }}>{li.description}</td>
                          <td style={{ padding:"11px 14px", color:"#6B6560" }}>{li.qty}</td>
                          <td style={{ padding:"11px 14px", color:"#6B6560" }}>₹{(li.rate||0).toLocaleString("en-IN")}</td>
                          <td style={{ padding:"11px 14px", fontWeight:500, color:"#1E1C1A" }}>₹{(li.amount||0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} style={{ padding:"12px 14px", textAlign:"right", fontWeight:600, color:"#1E1C1A", fontSize:13 }}>Total</td>
                        <td style={{ padding:"12px 14px", fontFamily:"'Soria',serif", fontSize:20, fontWeight:600, color:"#4A7C72" }}>₹{(inv.total_amount||0).toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ position:"fixed", bottom:30, right:30, background:"#fff", border:"1px solid #D6E3DF", borderLeft:"3px solid #B45C5C", padding:"12px 18px", borderRadius:12, fontSize:13, boxShadow:"0 4px 16px rgba(0,0,0,.1)", zIndex:999, display:"flex", alignItems:"center", gap:10 }}><i className="fa-regular fa-circle-exclamation" style={{ color:"#B45C5C" }} />{error}</div>}
      </div>
    </>
  );
}