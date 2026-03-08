// ============================================================
// FILE: src/pages/staff/StaffDashboard.jsx
//
// PURPOSE:
//   Personal task dashboard for a single logged-in staff member.
//   Fetches all data from Supabase via your Express.js backend.
//   No mock data — shows loading skeletons and empty states.
//
// SUPABASE / EXPRESS ROUTES NEEDED:
//   GET   /api/staff/me          → { id, name, role, shift }
//   GET   /api/staff/tasks       → Task[]  (server filters by JWT staff ID)
//   PATCH /api/staff/tasks/:id   → Updated task  (body: { status?, note? })
//
// AUTH:
//   JWT stored in localStorage as "token" after login.
//   e.g.  localStorage.setItem("token", responseData.token)
//
// Task shape (from Supabase tasks table):
//   {
//     id:          string | number,
//     title:       string,
//     status:      "Pending" | "In Progress" | "Completed" | "Overdue",
//     priority:    "High" | "Medium" | "Low",
//     category:    string,   e.g. "Housekeeping", "Maintenance"
//     room:        string?,  e.g. "204"
//     due_time:    string?,  e.g. "10:00 AM"
//     note:        string?,
//     assigned_at: string?,  ISO date string
//   }
//
// LOGO:
//   1. Place your logo.jpg in src/assets/
//   2. Uncomment the import line below
//   3. Replace the text fallback in the topbar with <img src={logo} ... />
// ============================================================

import { useState, useEffect, useCallback } from "react";
import "./StaffDashboard.css";

// import logo from "../../assets/logo.jpg";  // ← uncomment when logo is ready

// ── API ───────────────────────────────────────────────────────
// Set VITE_API_URL=http://localhost:5000 in your .env file
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const api = {
  getProfile: () =>
    fetch(`${BASE_URL}/api/staff/me`, { headers: getHeaders() })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),

  getTasks: () =>
    fetch(`${BASE_URL}/api/staff/tasks`, { headers: getHeaders() })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),

  updateTask: (id, payload) =>
    fetch(`${BASE_URL}/api/staff/tasks/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
};

// ── CONSTANTS ─────────────────────────────────────────────────
const CATEGORY_ICON = {
  Housekeeping:  "🧹",
  Maintenance:   "🔧",
  Concierge:     "🛎️",
  "Room Service":"🍽️",
  "Front Desk":  "🏨",
  Security:      "🔒",
  Laundry:       "👕",
  Other:         "📋",
};

const STATUS_SORT = { Overdue: 0, "In Progress": 1, Pending: 2, Completed: 3 };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

// ── SMALL COMPONENTS ──────────────────────────────────────────

function SkeletonStats() {
  return (
    <div className="stats-grid">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="skeleton" style={{ width: "55%", height: 11, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: "35%", height: 30, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "50%", height: 10 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonTaskCard() {
  return (
    <div className="skeleton-card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="skeleton" style={{ width: "52%", height: 14 }} />
        <div className="skeleton" style={{ width: "18%", height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: "18%", height: 20, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: "24%", height: 20, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: "36%", height: 11 }} />
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__title">{title}</div>
      <p className="empty-state__sub">{sub}</p>
    </div>
  );
}

function ProgressRing({ done, total, size = 62 }) {
  const pct  = total === 0 ? 0 : Math.round((done / total) * 100);
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--color-border)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--color-green)" strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          color: "var(--color-green)", fontSize: 12, fontWeight: 700,
          fontFamily: "var(--font-display)",
        }}>{pct}%</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = {
    "Pending":      "badge badge--status-pending",
    "In Progress":  "badge badge--status-progress",
    "Completed":    "badge badge--status-completed",
    "Overdue":      "badge badge--status-overdue",
  };
  return <span className={cls[status] || "badge"}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const cls = {
    High:   "badge badge--priority-high",
    Medium: "badge badge--priority-medium",
    Low:    "badge badge--priority-low",
  };
  return <span className={cls[priority] || "badge"}>{priority}</span>;
}

// ── TASK CARD ─────────────────────────────────────────────────
function TaskCard({ task, onUpdateStatus, onAddNote, updatingId }) {
  const [showNote, setShowNote] = useState(false);
  const [noteVal, setNoteVal]   = useState(task.note || "");
  const [saving,  setSaving]    = useState(false);

  const isCompleted = task.status === "Completed";
  const isOverdue   = task.status === "Overdue";
  const isUpdating  = updatingId === task.id;

  const stripeClass = isCompleted
    ? "task-card__stripe task-card__stripe--done"
    : { High: "task-card__stripe task-card__stripe--high",
        Low:  "task-card__stripe task-card__stripe--low"  }[task.priority]
      ?? "task-card__stripe task-card__stripe--medium";

  const cardClass = [
    "task-card",
    isCompleted ? "task-card--completed" : "",
    isOverdue   ? "task-card--overdue"   : "",
  ].filter(Boolean).join(" ");

  const saveNote = async () => {
    setSaving(true);
    await onAddNote(task.id, noteVal);
    setSaving(false);
    setShowNote(false);
  };

  return (
    <div className={cardClass}>
      <div className={stripeClass} />

      {/* Header row */}
      <div className="task-card__header">
        <div style={{ flex: 1 }}>
          <div className="task-card__title">{task.title}</div>
          {task.room && (
            <div className="task-card__room">📍 Room {task.room}</div>
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Meta row */}
      <div className="task-card__meta">
        <PriorityBadge priority={task.priority} />
        <span className="badge badge--category">
          {CATEGORY_ICON[task.category] || "📋"} {task.category}
        </span>
        {task.due_time && (
          <span className={`task-card__due${isOverdue ? " task-card__due--urgent" : ""}`}>
            ⏰ {task.due_time}
          </span>
        )}
        {task.assigned_at && (
          <span className="task-card__due">
            Assigned:{" "}
            {new Date(task.assigned_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short",
            })}
          </span>
        )}
      </div>

      {/* Saved note preview */}
      {task.note && !showNote && (
        <div className="task-card__note">💬 {task.note}</div>
      )}

      {/* Note textarea */}
      {showNote && (
        <div style={{ marginBottom: 12 }}>
          <textarea
            className="task-card__note-input"
            rows={2}
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            placeholder="Add a note about this task…"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--save" onClick={saveNote} disabled={saving}>
              {saving ? <span className="spinner" /> : "Save Note"}
            </button>
            <button className="btn btn--cancel"
              onClick={() => { setNoteVal(task.note || ""); setShowNote(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isCompleted && (
        <div className="task-card__actions">
          {(task.status === "Pending" || task.status === "Overdue") && (
            <button className="btn btn--start"
              onClick={() => onUpdateStatus(task.id, "In Progress")}
              disabled={isUpdating}>
              {isUpdating ? <span className="spinner" /> : "▶ Start"}
            </button>
          )}

          {task.status === "In Progress" && (
            <button className="btn btn--done"
              onClick={() => onUpdateStatus(task.id, "Completed")}
              disabled={isUpdating}>
              {isUpdating ? <span className="spinner" /> : "✓ Mark Done"}
            </button>
          )}

          <button className="btn btn--note"
            onClick={() => setShowNote(s => !s)}>
            {showNote ? "Close" : "💬 Note"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────
export default function StaffDashboard() {
  const [profile,      setProfile]      = useState(null);
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [apiError,     setApiError]     = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Fetch profile + tasks on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const [prof, tsk] = await Promise.all([
          api.getProfile(),
          api.getTasks(),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setTasks(Array.isArray(tsk) ? tsk : []);
      } catch {
        if (!cancelled)
          setApiError(
            "Cannot reach the server. Make sure your Express backend is running " +
            "and your JWT token is set in localStorage."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Update status via API, then sync local state ────────────
  const handleUpdateStatus = useCallback(async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch {
      setApiError("Failed to update task status. Please try again.");
      setTimeout(() => setApiError(null), 4000);
    } finally {
      setUpdatingTask(null);
    }
  }, []);

  // ── Save note via API, then sync local state ────────────────
  const handleSaveNote = useCallback(async (taskId, note) => {
    try {
      const updated = await api.updateTask(taskId, { note });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch {
      setApiError("Failed to save note. Please try again.");
      setTimeout(() => setApiError(null), 4000);
    }
  }, []);

  // ── Counts ──────────────────────────────────────────────────
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === "Completed").length;
  const inProg  = tasks.filter(t => t.status === "In Progress").length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const overdue = tasks.filter(t => t.status === "Overdue").length;

  // ── Filtered + sorted task list ─────────────────────────────
  const visibleTasks = tasks
    .filter(t => activeFilter === "All" || t.status === activeFilter)
    .sort((a, b) => (STATUS_SORT[a.status] ?? 4) - (STATUS_SORT[b.status] ?? 4));

  const FILTERS = [
    { label: "All",         count: total,   cls: "filter-pill--active-all"      },
    { label: "Pending",     count: pending, cls: "filter-pill--active-pending"  },
    { label: "In Progress", count: inProg,  cls: "filter-pill--active-progress" },
    { label: "Completed",   count: done,    cls: "filter-pill--active-done"     },
    ...(overdue > 0 ? [{ label: "Overdue", count: overdue, cls: "filter-pill--active-overdue" }] : []),
  ];

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div className="staff-dashboard">

      {/* Error toast */}
      {apiError && <div className="toast-error">⚠️ {apiError}</div>}

      {/* ── TOPBAR ── */}
      <header className="topbar">
        {/*
          LOGO — once you have logo.jpg in src/assets/:
            1. Uncomment:  import logo from "../../assets/logo.jpg";
            2. Replace the div below with:
               <img src={logo} alt="BOOKINN" className="topbar__logo" />
        */}
        <div className="topbar__logo-fallback">BOOKINN</div>

        <div className="topbar__right">
          <span className="topbar__date">{todayStr}</span>

          {loading && (
            <div className="skeleton" style={{ width: 120, height: 34, borderRadius: 999 }} />
          )}

          {!loading && profile && (
            <div className="profile-chip">
              <div className="profile-chip__avatar">
                {profile.name
                  ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase()
                  : "ST"}
              </div>
              <div>
                <div className="profile-chip__name">{profile.name}</div>
                <div className="profile-chip__role">
                  {profile.role}{profile.shift ? ` · ${profile.shift}` : ""}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="staff-main">

        {/* Greeting */}
        <div className="greeting">
          {loading ? (
            <>
              <div className="skeleton" style={{ width: "46%", height: 28, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "32%", height: 13 }} />
            </>
          ) : (
            <>
              <h1 className="greeting__title">
                {getGreeting()}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
              </h1>
              <p className="greeting__sub">
                {profile?.shift
                  ? `${profile.shift} · Here are your tasks for today`
                  : "Here are your assigned tasks for today"}
              </p>
            </>
          )}
        </div>

        {/* Stat cards */}
        {loading ? <SkeletonStats /> : (
          <div className="stats-grid">
            {[
              { label: "Total Tasks",  value: total,   mod: "gold",  sub: "assigned to you"  },
              { label: "In Progress",  value: inProg,  mod: "blue",  sub: "currently active" },
              { label: "Completed",    value: done,    mod: "green", sub: "tasks finished"    },
              { label: "Overdue",      value: overdue, mod: overdue > 0 ? "red" : "muted",
                sub: overdue > 0 ? "needs attention" : "all on time" },
            ].map((s, i) => (
              <div key={s.label}
                className={`stat-card stat-card--${s.mod}`}
                style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__sub">{s.sub}</div>
                <div className="stat-card__bar" />
              </div>
            ))}
          </div>
        )}

        {/* Tasks section */}
        {!loading && (
          <>
            {/* Progress ring + filters */}
            <div style={{
              display: "flex", alignItems: "center",
              gap: 16, marginBottom: 20, flexWrap: "wrap",
            }}>
              {total > 0 && (
                <div className="progress-wrap">
                  <ProgressRing done={done} total={total} />
                  <div>
                    <div className="progress-wrap__label">{done}/{total} done</div>
                    <div className="progress-wrap__sub">Task completion</div>
                  </div>
                </div>
              )}

              <div className="filter-bar" style={{ margin: 0 }}>
                {FILTERS.map(f => (
                  <button key={f.label}
                    className={`filter-pill ${activeFilter === f.label ? f.cls : ""}`}
                    onClick={() => setActiveFilter(f.label)}>
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Task list */}
            <div className="task-list">
              {visibleTasks.length === 0 ? (
                <EmptyState
                  icon={activeFilter === "Completed" ? "🎉" : "📋"}
                  title={
                    activeFilter === "All"
                      ? "No tasks assigned yet"
                      : `No ${activeFilter} tasks`
                  }
                  sub={
                    activeFilter === "All"
                      ? "Your tasks will appear here once the admin assigns them to you."
                      : `You have no tasks with status "${activeFilter}" right now.`
                  }
                />
              ) : (
                visibleTasks.map((task, i) => (
                  <div key={task.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <TaskCard
                      task={task}
                      onUpdateStatus={handleUpdateStatus}
                      onAddNote={handleSaveNote}
                      updatingId={updatingTask}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Loading skeletons for task list */}
        {loading && (
          <div className="task-list">
            <SkeletonTaskCard />
            <SkeletonTaskCard />
            <SkeletonTaskCard />
          </div>
        )}

      </main>
    </div>
  );
}