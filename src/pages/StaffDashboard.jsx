// FILE: src/pages/StaffDashboard.jsx
import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"; // Changed to 3001
const authFetch = (p, o = {}) =>
  fetch(`${BASE_URL}${p}`, {
    ...o,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      ...(o.headers || {}),
    },
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });

const fmtDate = d =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = d =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Sk = ({ w = "100%", h = 14, r = 6, style = {} }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#EBF0EE 25%,#D6E3DF 50%,#EBF0EE 75%)", backgroundSize: "200% 100%", animation: "bkShimmer 1.5s infinite", ...style }} />
);

const Toast = ({ type, msg }) => (
  <div style={{ position: "fixed", bottom: 30, right: 30, background: "#fff", border: "1px solid #D6E3DF", borderLeft: `3px solid ${type === "success" ? "#5F8B6F" : "#B45C5C"}`, padding: "12px 18px", borderRadius: 12, fontSize: 13, zIndex: 999, display: "flex", alignItems: "center", gap: 10, maxWidth: 340, animation: "bkFadeUp .2s ease" }}>
    <i className={`fa-regular fa-circle-${type === "success" ? "check" : "exclamation"}`} style={{ color: type === "success" ? "#5F8B6F" : "#B45C5C" }} />
    {msg}
  </div>
);

const PRIORITY_STYLE = {
  high:   { bg: "#fde8e8", c: "#9a3535", dot: "#B45C5C" },
  medium: { bg: "#fdf3e0", c: "#9a6e1a", dot: "#C49A2A" },
  low:    { bg: "#e8f4ec", c: "#3a7a52", dot: "#5F8B6F" },
  normal: { bg: "#e8f4ec", c: "#3a7a52", dot: "#5F8B6F" },
};

const TASK_TYPE_ICON = {
  "room_cleaning":   "fa-solid fa-broom",
  "cleaning":        "fa-solid fa-broom",
  "extra_towels":    "fa-solid fa-layer-group",
  "room_service":    "fa-solid fa-utensils",
  "laundry":         "fa-solid fa-shirt",
  "maintenance":     "fa-solid fa-wrench",
  "extra_pillows":   "fa-solid fa-bed",
  "wakeup_call":     "fa-regular fa-clock",
  "transportation":  "fa-solid fa-car",
  "turndown":        "fa-solid fa-moon",
  "inspection":      "fa-solid fa-clipboard-check",
  "other":           "fa-regular fa-message",
};

const FILTERS = ["All", "pending", "in_progress", "completed"];

// ─── Task Card Component ──────────────────────────────────────────────────────
function TaskCard({ task, onComplete, completing }) {
  const [expanded, setExpanded] = useState(false);
  const icon = TASK_TYPE_ICON[task.task_type] || "fa-regular fa-message";
  const pri  = PRIORITY_STYLE[task.priority?.toLowerCase()] || PRIORITY_STYLE.normal;
  const isOverdue = task.status !== "completed" && new Date(task.created_at) < new Date(Date.now() - 3600000);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${task.status === "completed" ? "#D6E3DF" : isOverdue ? "rgba(180,92,92,.3)" : "#D6E3DF"}`, overflow: "hidden", transition: "box-shadow .2s", opacity: task.status === "completed" ? 0.72 : 1 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", flexWrap: "wrap" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: task.status === "completed" ? "#EBF0EE" : "#F4F7F6", border: "1px solid #D6E3DF", display: "flex", alignItems: "center", justifyContent: "center", color: task.status === "completed" ? "#A09890" : "#4A7C72", fontSize: 18, flexShrink: 0 }}>
          {task.status === "completed"
            ? <i className="fa-solid fa-circle-check" style={{ color: "#5F8B6F" }} />
            : <i className={icon} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Soria',serif", fontSize: 16, fontWeight: 600, color: task.status === "completed" ? "#A09890" : "#1E1C1A", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
              {task.task_type?.replace(/_/g, " ").toUpperCase() || "Task"}
            </span>
            <span style={{ background: pri.bg, color: pri.c, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: pri.dot, display: "inline-block" }} />
              {task.priority || "Normal"}
            </span>
            {isOverdue && task.status !== "completed" && (
              <span style={{ background: "#fde8e8", color: "#9a3535", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>
                Overdue
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: "#A09890", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span><i className="fa-solid fa-door-open" style={{ marginRight: 5, color: "#4A7C72" }} />Room {task.rooms?.room_number || task.room_id}</span>
            <span><i className="fa-regular fa-clock" style={{ marginRight: 5, color: isOverdue && task.status !== "completed" ? "#B45C5C" : "#A09890" }} />
              Created {fmtDate(task.created_at)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <StatusPill status={task.status} />
          <button onClick={() => setExpanded(e => !e)} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #D6E3DF", borderRadius: 10, fontSize: 12, color: "#6B6560", cursor: "pointer", fontFamily: "inherit" }}>
            {expanded ? "Less" : "More"}
          </button>
          {task.status !== "completed" && (
            <button onClick={() => onComplete(task.task_id)} disabled={completing === task.task_id}
              style={{ padding: "7px 16px", background: "#1E1C1A", color: "#4A7C72", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, opacity: completing === task.task_id ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {completing === task.task_id
                ? <span style={{ width: 13, height: 13, border: "2px solid rgba(74,124,114,.3)", borderTopColor: "#4A7C72", borderRadius: "50%", animation: "bkSpin .7s linear infinite", display: "inline-block" }} />
                : <><i className="fa-solid fa-check" />Mark Done</>
              }
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #E8EEEC", background: "#F4F7F6", padding: "16px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
          <Detail label="Task ID" val={`#${task.task_id}`} />
          <Detail label="Room" val={task.rooms?.room_number || task.room_id} />
          <Detail label="Created" val={`${fmtDate(task.created_at)} · ${fmtTime(task.created_at)}`} />
          <Detail label="Requested By" val={task.Users_Tasks_raised_by_user_id_fkey?.username || "Admin"} />
          {task.description && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "#A09890", marginBottom: 5 }}>Notes</div>
              <div style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.55 }}>{task.description}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Detail = ({ label, val }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "#A09890", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, color: "#1E1C1A", fontWeight: 500 }}>{val}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    "pending":     { bg: "#fdf3e0", c: "#9a6e1a" },
    "in_progress": { bg: "#e0f0fa", c: "#2a6080" },
    "in progress": { bg: "#e0f0fa", c: "#2a6080" },
    "completed":   { bg: "#e8f4ec", c: "#3a7a52" },
  };
  const displayStatus = status === "in_progress" ? "In Progress" : status === "pending" ? "Pending" : status === "completed" ? "Completed" : status;
  const s = map[status] || map["pending"];
  return (
    <span style={{ background: s.bg, color: s.c, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {displayStatus}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [completing, setCompleting] = useState(null);
  const [filter, setFilter]     = useState("All");
  const [sortBy, setSortBy]     = useState("priority");
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [user, setUser]         = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await authFetch("/api/tasks/staff/tasks");
      // Transform to match component expectations
      const transformedTasks = (data.data?.active_tasks || []).map(task => ({
        ...task,
        task_type: task.task_type,
        priority: task.priority || "normal",
        status: task.status,
        created_at: task.created_at,
        description: task.description,
        rooms: task.rooms,
        Users_Tasks_raised_by_user_id_fkey: task.Users_Tasks_raised_by_user_id_fkey
      }));
      setTasks(transformedTasks);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Could not load tasks");
      setLoading(false);
    }
  };

  const markComplete = async id => {
    setCompleting(id);
    try {
      await authFetch(`/api/tasks/${id}/status`, { 
        method: "PATCH",
        body: JSON.stringify({ status: "completed" })
      });
      setTasks(prev => prev.map(t => t.task_id === id ? { ...t, status: "completed" } : t));
      showToast("success", "Task marked as completed.");
    } catch (err) {
      showToast("error", "Failed to update task.");
    } finally {
      setCompleting(null);
    }
  };

  // ── Filter + Sort ────────────────────────────────────────────────────────────
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, normal: 2 };

  let visible = tasks.filter(t => {
    const matchFilter = filter === "All" || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.rooms?.room_number?.toString().toLowerCase().includes(q) || t.task_type?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  if (sortBy === "priority") visible = [...visible].sort((a, b) => (PRIORITY_ORDER[a.priority?.toLowerCase()] ?? 2) - (PRIORITY_ORDER[b.priority?.toLowerCase()] ?? 2));
  if (sortBy === "room")     visible = [...visible].sort((a, b) => (a.rooms?.room_number || "").localeCompare(b.rooms?.room_number || ""));
  if (sortBy === "due")      visible = [...visible].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // ── Stats ────────────────────────────────────────────────────────────────────
  const pending     = tasks.filter(t => t.status === "pending").length;
  const inProgress  = tasks.filter(t => t.status === "in_progress").length;
  const completed   = tasks.filter(t => t.status === "completed").length;
  const highPri     = tasks.filter(t => t.priority?.toLowerCase() === "high" && t.status !== "completed").length;

  // ── Greeting ─────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      <style>{`
        @keyframes bkFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bkShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes bkSpin{to{transform:rotate(360deg)}}
        .staff-task-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.07)!important;}
        .staff-filter-btn:hover{border-color:#4A7C72!important;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F4F7F6", fontFamily: "'CabinetGrotesk',sans-serif" }}>

        {/* ── Hero banner ── */}
        <div style={{ background: "#1E1C1A", padding: "48px 64px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -60, top: -60, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(74,124,114,.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: -20, top: -20, width: 220, height: 220, borderRadius: "50%", border: "1px solid rgba(74,124,114,.08)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ fontSize: 10, color: "rgba(74,124,114,.8)", fontWeight: 400, textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 12, fontFamily: "'CabinetGrotesk',sans-serif" }}>
              Staff Portal
            </div>
            <h1 style={{ fontFamily: "'Brolimo',serif", fontStyle: "italic", fontSize: "clamp(32px,4vw,52px)", fontWeight: 400, color: "#fff", lineHeight: 1, marginBottom: 10 }}>
              {greeting}, <em style={{ color: "#4A7C72" }}>{user?.username || "Team"}.</em>
            </h1>
            <p style={{ fontFamily: "'CabinetGrotesk',sans-serif", fontWeight: 200, fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.8, marginBottom: 36 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Pending",     val: pending,    icon: "fa-regular fa-hourglass-half", accent: "#fdf3e0", ac: "#9a6e1a" },
                { label: "In Progress", val: inProgress, icon: "fa-solid fa-spinner",           accent: "#e0f0fa", ac: "#2a6080" },
                { label: "Completed",   val: completed,  icon: "fa-solid fa-circle-check",      accent: "#e8f4ec", ac: "#3a7a52" },
                { label: "High Priority",val: highPri,   icon: "fa-solid fa-triangle-exclamation", accent: "#fde8e8", ac: "#9a3535" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, minWidth: 140 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", color: s.ac, fontSize: 15 }}>
                    <i className={s.icon} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Soria',serif", fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 64px 80px" }}>

          {/* Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FILTERS.map(f => {
                const count = f === "All" ? tasks.length : tasks.filter(t => t.status === f).length;
                return (
                  <button key={f} className="staff-filter-btn" onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: filter === f ? 600 : 400, cursor: "pointer", border: "1px solid", borderColor: filter === f ? "#4A7C72" : "#e8e2da", background: filter === f ? "#4A7C72" : "transparent", color: filter === f ? "#fff" : "#4a4a48", transition: "all .18s", display: "flex", alignItems: "center", gap: 6 }}>
                    {f === "pending" ? "Pending" : f === "in_progress" ? "In Progress" : f === "completed" ? "Completed" : f}
                    <span style={{ opacity: .7, fontSize: 11 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <i className="fa-regular fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A09890", fontSize: 13, pointerEvents: "none" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Room, task…"
                  style={{ border: "1px solid #D6E3DF", borderRadius: 12, padding: "8px 14px 8px 34px", fontSize: 13, fontFamily: "inherit", color: "#1E1C1A", background: "#fff", outline: "none", width: 200 }}
                />
              </div>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: "1px solid #D6E3DF", borderRadius: 12, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", color: "#6B6560", background: "#fff", outline: "none", cursor: "pointer" }}>
                <option value="priority">Sort: Priority</option>
                <option value="due">Sort: Created</option>
                <option value="room">Sort: Room No.</option>
              </select>
            </div>
          </div>

          {/* Task list */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D6E3DF", padding: "22px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                  <Sk w={48} h={48} r={12} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Sk w="30%" h={15} style={{ marginBottom: 10 }} />
                    <Sk w="55%" h={11} />
                  </div>
                  <Sk w={80} h={30} r={999} />
                  <Sk w={100} h={36} r={10} />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D6E3DF", padding: "72px 32px", textAlign: "center" }}>
              <i className="fa-regular fa-clipboard-list" style={{ fontSize: 40, color: "#d4cbc0", marginBottom: 16, display: "block" }} />
              <div style={{ fontFamily: "'Soria',serif", fontSize: 22, color: "#6B6560", marginBottom: 8 }}>
                {search ? "No matching tasks" : filter === "All" ? "No tasks assigned" : `No ${filter} tasks`}
              </div>
              <p style={{ fontSize: 14, color: "#A09890" }}>
                {search ? "Try a different search term." : "Check back shortly — new tasks will appear here."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visible.map(task => (
                <div key={task.task_id} className="staff-task-card" style={{ transition: "box-shadow .2s" }}>
                  <TaskCard task={task} onComplete={markComplete} completing={completing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error  && <Toast type="error"   msg={error} />}
      {toast  && <Toast type={toast.type} msg={toast.msg} />}
    </>
  );
}