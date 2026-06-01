import { useState, useEffect, useMemo, useCallback } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
import API from "./api";
// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["All", "Open", "In Progress", "Resolved", "Closed"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name",   label: "Customer name" },
];
const STATUS_STYLES = {
  "Open":        { dot: "bg-blue-400",    badge: "bg-blue-950 text-blue-300 ring-blue-800" },
  "In Progress": { dot: "bg-amber-400",   badge: "bg-amber-950 text-amber-300 ring-amber-800" },
  "Resolved":    { dot: "bg-emerald-400", badge: "bg-emerald-950 text-emerald-300 ring-emerald-800" },
  "Closed":      { dot: "bg-zinc-500",    badge: "bg-zinc-800 text-zinc-400 ring-zinc-700" },
};
const AVATAR_PALETTES = [
  "bg-blue-950 text-blue-300",
  "bg-violet-950 text-violet-300",
  "bg-amber-950 text-amber-300",
  "bg-emerald-950 text-emerald-300",
  "bg-rose-950 text-rose-300",
  "bg-teal-950 text-teal-300",
];
const EMPTY_FORM = { customer_name: "", customer_email: "", subject: "", description: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials  = (name) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
const palette   = (name) => AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
const fmtDate   = (iso)  => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
    strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  ticket:    "M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1 1 1 0 0 0 0 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1 1 1 0 0 0 0-2 1 1 0 0 1-1-1Z",
  users:     "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 0a4 4 0 1 0 2.83-6.83M23 21v-2a4 4 0 0 0-3-3.87",
  chart:     "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
  inbox:     "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z",
  usercheck: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 2 2 2 4-4",
  tag:       "M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2ZM7 7h.01",
  settings:  "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  search:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z",
  plus:      "M12 5v14M5 12h14",
  edit:      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  trash:     "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  headset:   "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z",
  x:         "M18 6 6 18M6 6l12 12",
  filter:    "M22 3H2l8 9.46V19l4 2v-8.54Z",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  alert:     "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01",
  check:     "M20 6 9 17l-5-5",
};

// ─── Reusable UI pieces ───────────────────────────────────────────────────────
// Singleton toast — mounts once, controlled by showing a message string
function ComingSoonToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 text-slate-200
                      text-xs font-medium px-4 py-2.5 rounded-full shadow-xl
                      animate-[fadeSlideUp_0.2s_ease-out]">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
        {message}
      </div>
    </div>
  );
}

function NavItem({ iconKey, label, badge, active, onClick, comingSoon }) {
  const handleClick = () => {
    if (comingSoon) { onClick(); return; }   // caller handles the toast
    onClick();
  };
  return (
    <button onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group
        ${active
          ? "bg-indigo-950 text-indigo-300"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
      <Icon d={ICONS[iconKey]} size={17}
        className={active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} />
      <span className="flex-1 text-left">{label}</span>
      {comingSoon && !active && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-500 font-medium tracking-wide">
          SOON
        </span>
      )}
      {badge != null && !comingSoon && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${active ? "bg-indigo-900 text-indigo-300" : "bg-slate-700 text-slate-400"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["Closed"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

// ─── Agents Page ─────────────────────────────────────────────────────────────
const DEMO_AGENTS = [
  { id: "beepasha",  name: "Beepasha Sadhwani", role: "Support Agent",    palette: "bg-violet-950 text-violet-300" },
  { id: "priya",     name: "Priya Sharma",       role: "Senior Agent",     palette: "bg-blue-950 text-blue-300"    },
  { id: "arjun",     name: "Arjun Patel",         role: "Escalation Lead",  palette: "bg-amber-950 text-amber-300"  },
];

function AgentsPage({ tickets }) {
  // Map agent name fragments → ticket counts by status
  const agentStats = useMemo(() => {
    return DEMO_AGENTS.map((agent) => {
      const firstName = agent.name.split(" ")[0].toLowerCase();
      // Match tickets whose agent field contains the agent's first name (case-insensitive)
      const assigned = tickets.filter(
        (t) => t.agent && t.agent.toLowerCase().includes(firstName)
      );
      const open       = assigned.filter((t) => t.status === "Open").length;
      const inProgress = assigned.filter((t) => t.status === "In Progress").length;
      const resolved   = assigned.filter((t) => t.status === "Resolved").length;
      const closed     = assigned.filter((t) => t.status === "Closed").length;
      const active     = open + inProgress;

      const workload =
        active >= 3 ? { label: "High",   cls: "bg-red-950 text-red-400 ring-red-800"     } :
        active >= 1 ? { label: "Medium", cls: "bg-amber-950 text-amber-300 ring-amber-800"} :
                      { label: "Low",    cls: "bg-emerald-950 text-emerald-300 ring-emerald-800" };

      return { ...agent, assigned: assigned.length, open, inProgress, resolved, closed, active, workload };
    });
  }, [tickets]);

  const totalAssigned = agentStats.reduce((s, a) => s + a.active, 0);

  return (
    <>
      {/* Topbar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 bg-slate-900/50 flex-shrink-0">
        <h1 className="text-base font-semibold text-slate-100 flex-1">Agents</h1>
        <span className="text-xs text-slate-500">{DEMO_AGENTS.length} agents · {totalAssigned} active tickets</span>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-slate-700/60 flex-shrink-0">
        <StatCard label="Total Agents"   value={DEMO_AGENTS.length}  colorClass="text-indigo-400" />
        <StatCard label="Active Tickets" value={totalAssigned}        colorClass="text-amber-400"  />
        <StatCard label="Resolved Total" value={agentStats.reduce((s, a) => s + a.resolved + a.closed, 0)} colorClass="text-emerald-400" />
      </div>

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {agentStats.map((agent) => (
          <div key={agent.id}
            className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-4 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-150">

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${agent.palette}`}>
                {initials(agent.name)}
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{agent.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{agent.role}</p>
              </div>

              {/* Workload badge */}
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ${agent.workload.cls}`}>
                {agent.workload.label}
              </span>
            </div>

            {/* Ticket breakdown */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "Open",        value: agent.open,        color: "text-blue-300"    },
                { label: "In Progress", value: agent.inProgress,  color: "text-amber-300"   },
                { label: "Resolved",    value: agent.resolved,    color: "text-emerald-300" },
                { label: "Closed",      value: agent.closed,      color: "text-zinc-400"    },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-2 text-center">
                  <p className={`text-base font-semibold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
function AnalyticsPage({ tickets }) {
  const stats = useMemo(() => {
    const total      = tickets.length;
    const open       = tickets.filter((t) => t.status === "Open").length;
    const inProgress = tickets.filter((t) => t.status === "In Progress").length;
    const resolved   = tickets.filter((t) => t.status === "Resolved").length;
    const closed     = tickets.filter((t) => t.status === "Closed").length;

    // Recent activity: tickets created in the last 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = tickets.filter((t) => new Date(t.created_at).getTime() > cutoff).length;

    // Status distribution for bar chart (% of total)
    const distribution = [
      { label: "Open",        count: open,       pct: total ? Math.round((open       / total) * 100) : 0, bar: "bg-blue-500",    text: "text-blue-300"    },
      { label: "In Progress", count: inProgress, pct: total ? Math.round((inProgress / total) * 100) : 0, bar: "bg-amber-500",   text: "text-amber-300"   },
      { label: "Resolved",    count: resolved,   pct: total ? Math.round((resolved   / total) * 100) : 0, bar: "bg-emerald-500", text: "text-emerald-300" },
      { label: "Closed",      count: closed,     pct: total ? Math.round((closed     / total) * 100) : 0, bar: "bg-zinc-500",    text: "text-zinc-400"    },
    ];

    // Unique customers
    const uniqueCustomers = new Set(tickets.map((t) => t.customer_email.toLowerCase())).size;

    return { total, open, inProgress, resolved, closed, recentCount, distribution, uniqueCustomers };
  }, [tickets]);

  return (
    <>
      {/* Topbar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 bg-slate-900/50 flex-shrink-0">
        <h1 className="text-base font-semibold text-slate-100 flex-1">Ticket Analytics</h1>
        <span className="text-xs text-slate-500">Based on {stats.total} ticket{stats.total !== 1 ? "s" : ""}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* ── 4 Stat cards ── */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Tickets"   value={stats.total}      colorClass="text-indigo-400" />
          <StatCard label="Open"            value={stats.open}       colorClass="text-blue-400"   />
          <StatCard label="Resolved"        value={stats.resolved}   colorClass="text-emerald-400"/>
          <StatCard label="Closed"          value={stats.closed}     colorClass="text-zinc-400"   />
        </div>

        {/* ── Status distribution ── */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Status Distribution</p>

          {stats.total === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">No tickets yet.</p>
          ) : (
            stats.distribution.map(({ label, count, pct, bar, text }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${text}`}>{count}</span>
                    <span className="text-xs text-slate-600 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                {/* Horizontal bar — plain div, no chart library */}
                <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Summary cards row ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">In Progress</p>
            <p className="text-2xl font-semibold text-amber-400">{stats.inProgress}</p>
            <p className="text-xs text-slate-600">currently being worked on</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Recent Activity</p>
            <p className="text-2xl font-semibold text-indigo-400">{stats.recentCount}</p>
            <p className="text-xs text-slate-600">tickets in the last 7 days</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Unique Customers</p>
            <p className="text-2xl font-semibold text-teal-400">{stats.uniqueCustomers}</p>
            <p className="text-xs text-slate-600">have submitted tickets</p>
          </div>
        </div>

        {/* ── Resolution rate ── */}
        {stats.total > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Resolution Rate</p>
              <span className="text-sm font-semibold text-emerald-400">
                {Math.round(((stats.resolved + stats.closed) / stats.total) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.round(((stats.resolved + stats.closed) / stats.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-600">
              {stats.resolved + stats.closed} out of {stats.total} tickets resolved or closed
            </p>
          </div>
        )}

      </div>
    </>
  );
}

// ─── Customers Page ───────────────────────────────────────────────────────────
function CustomersPage({ tickets }) {
  const [search, setSearch] = useState("");

  // Derive unique customers from live tickets data
  const customers = useMemo(() => {
    const map = new Map();
    tickets.forEach((t) => {
      const key = t.customer_email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name:  t.customer_name,
          email: t.customer_email,
          count: 0,
          statuses: {},
          latest: t.created_at,
        });
      }
      const c = map.get(key);
      c.count += 1;
      c.statuses[t.status] = (c.statuses[t.status] || 0) + 1;
      if (t.created_at > c.latest) c.latest = t.created_at;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tickets]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <>
      {/* Topbar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 bg-slate-900/50 flex-shrink-0">
        <h1 className="text-base font-semibold text-slate-100 flex-1">
          Customers
          <span className="ml-2 text-xs font-normal text-slate-500">{customers.length} unique</span>
        </h1>
        <div className="relative">
          <Icon d={ICONS.search} size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 w-52 transition-colors"
          />
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-slate-700/60 flex-shrink-0">
        <StatCard label="Total Customers" value={customers.length}                                          colorClass="text-indigo-400" />
        <StatCard label="Total Tickets"   value={tickets.length}                                            colorClass="text-blue-400" />
        <StatCard label="Avg per Customer" value={customers.length ? (tickets.length / customers.length).toFixed(1) : 0} colorClass="text-emerald-400" />
      </div>

      {/* Table header */}
      <div className="px-6 py-2 border-b border-slate-700/40 flex-shrink-0">
        <div className="grid grid-cols-12 gap-4 text-xs text-slate-500 uppercase tracking-wide font-medium">
          <div className="col-span-4">Customer</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2 text-center">Tickets</div>
          <div className="col-span-2">Breakdown</div>
        </div>
      </div>

      {/* Customer rows */}
      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3">
            <Icon d={ICONS.users} size={36} />
            <p className="text-sm">
              {customers.length === 0 ? "No customers yet. Tickets will populate this page." : "No customers match your search."}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const pal = palette(c.name);
            return (
              <div key={c.email}
                className="grid grid-cols-12 gap-4 items-center bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-150">

                {/* Name + avatar */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${pal}`}>
                    {initials(c.name)}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate">{c.name}</span>
                </div>

                {/* Email */}
                <div className="col-span-4 min-w-0">
                  <span className="text-sm text-slate-400 truncate block">{c.email}</span>
                </div>

                {/* Ticket count */}
                <div className="col-span-2 flex justify-center">
                  <span className="text-sm font-semibold text-indigo-300 bg-indigo-950 border border-indigo-800 px-3 py-0.5 rounded-full">
                    {c.count}
                  </span>
                </div>

                {/* Status breakdown pills */}
                <div className="col-span-2 flex flex-wrap gap-1">
                  {Object.entries(c.statuses).map(([status, n]) => {
                    const s = STATUS_STYLES[status] ?? STATUS_STYLES["Closed"];
                    return (
                      <span key={status} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${s.badge}`}>
                        {n} {status}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────
function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    const { customer_name, customer_email, subject, description } = form;
    if (!customer_name || !customer_email || !subject || !description) {
      setError("All fields are required."); return;
    }
    setSaving(true); setError("");
    try {
      const { data } = await API.post("/api/tickets", form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create ticket.");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <h2 className="text-sm font-semibold text-slate-100">New support ticket</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <Icon d={ICONS.x} size={17} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2">
              <Icon d={ICONS.alert} size={14} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Customer name</label>
              <input name="customer_name" value={form.customer_name} onChange={handle}
                placeholder="Priya Sharma" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <input name="customer_email" value={form.customer_email} onChange={handle}
                placeholder="priya@example.com" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Subject</label>
            <input name="subject" value={form.subject} onChange={handle}
              placeholder="Brief summary of the issue" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Description</label>
            <textarea name="description" value={form.description} onChange={handle}
              rows={4} placeholder="Describe the issue in detail…"
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 text-sm border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-lg py-2 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <><Icon d={ICONS.refresh} size={14} className="animate-spin" /> Saving…</> : <><Icon d={ICONS.check} size={14} /> Create ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onStatusChange, onDelete }) {
  const [status, setStatus]   = useState(ticket.status);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const pal = palette(ticket.customer_name);

  // Sync status if ticket prop changes (e.g. after inline card update)
  useEffect(() => { setStatus(ticket.status); }, [ticket.ticket_id, ticket.status]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const saveStatus = async () => {
    setSaving(true); setSuccess(false);
    await onStatusChange(ticket.ticket_id, status);
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ticket ${ticket.ticket_id}? This cannot be undone.`)) return;
    await onDelete(ticket.ticket_id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${pal}`}>
              {initials(ticket.customer_name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{ticket.customer_name}</p>
              <p className="text-xs text-slate-500">{ticket.customer_email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
            <Icon d={ICONS.x} size={17} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ticket ID",  value: ticket.ticket_id, mono: true },
              { label: "Created",    value: fmtDate(ticket.created_at) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-sm text-slate-200 font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status selector */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 mb-2">Status</p>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="ml-auto text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors"
              >
                {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Subject</p>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">{ticket.subject}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-700/60 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs border border-red-900 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <Icon d={ICONS.trash} size={13} /> Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-xs border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg py-2 font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={saveStatus}
            disabled={saving}
            className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {saving  ? <><Icon d={ICONS.refresh} size={13} className="animate-spin" /> Saving…</> :
             success ? <><Icon d={ICONS.check}   size={13} /> Saved!</> :
                       "Save status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, selected, onSelect, onDelete, onStatusChange, onOpenDetail }) {
  const pal = palette(ticket.customer_name);
  const [updating, setUpdating] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ticket ${ticket.ticket_id}?`)) return;
    onDelete(ticket.ticket_id);
  };

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    setUpdating(true);
    await onStatusChange(ticket.ticket_id, newStatus);
    setUpdating(false);
  };

  return (
    <div onClick={() => onOpenDetail(ticket)}
      className={`group rounded-xl border p-4 cursor-pointer transition-all duration-150
        ${selected
          ? "border-indigo-500/70 bg-indigo-950/30"
          : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70"}`}>

      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${pal}`}>
          {initials(ticket.customer_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{ticket.customer_name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{ticket.customer_email}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500">{fmtDate(ticket.created_at)}</span>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Subject + desc */}
      <p className="text-sm font-medium text-slate-300 truncate mb-1">{ticket.subject}</p>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{ticket.description}</p>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <span className="font-mono text-xs text-slate-600">{ticket.ticket_id}</span>

        {/* Inline status changer */}
        <select
          value={ticket.status}
          onChange={handleStatusChange}
          onClick={(e) => e.stopPropagation()}
          disabled={updating}
          className="ml-auto text-xs bg-slate-800 border border-slate-700 text-slate-400 rounded-md px-2 py-1 outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors">
          {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-800 rounded-md px-2 py-1 transition-all">
          <Icon d={ICONS.trash} size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function TicketDetail({ ticket, onClose, onStatusChange, onDelete }) {
  const [status, setStatus]   = useState(ticket.status);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const pal = palette(ticket.customer_name);

  useEffect(() => { setStatus(ticket.status); }, [ticket]);

  const saveStatus = async () => {
    setSaving(true); setSuccess(false);
    await onStatusChange(ticket.ticket_id, status);
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ticket ${ticket.ticket_id}?`)) return;
    onDelete(ticket.ticket_id);
    onClose();
  };

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-700/60 bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <span className="text-sm font-medium text-slate-200">Ticket detail</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <Icon d={ICONS.x} size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Customer */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${pal}`}>
            {initials(ticket.customer_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{ticket.customer_name}</p>
            <p className="text-xs text-slate-500">{ticket.customer_email}</p>
          </div>
        </div>

        {/* Meta rows */}
        <div className="space-y-3">
          {[
            { label: "Ticket ID", value: ticket.ticket_id, mono: true },
            { label: "Created",   value: fmtDate(ticket.created_at) },
            { label: "Updated",   value: fmtDate(ticket.updated_at) },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{label}</span>
              <span className={`text-xs text-slate-300 ${mono ? "font-mono" : ""}`}>{value}</span>
            </div>
          ))}

          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-2 py-1 outline-none focus:border-indigo-500">
              {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2 pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Subject</p>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">{ticket.subject}</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
          <p className="text-xs text-slate-400 leading-relaxed">{ticket.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700/60 flex gap-2">
        <button onClick={saveStatus} disabled={saving}
          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-1">
          {saving   ? <><Icon d={ICONS.refresh} size={13} className="animate-spin" /> Saving…</> :
           success  ? <><Icon d={ICONS.check}   size={13} /> Saved!</> :
                      "Save changes"}
        </button>
        <button onClick={handleDelete}
          className="flex-1 text-xs border border-red-900 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-lg py-2 font-medium transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [activeNav, setActiveNav]   = useState("Tickets");
  const [filter, setFilter]         = useState("All");
  const [sort, setSort]             = useState("newest");
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]           = useState("");
  const showToast = useCallback((label) => setToast(`${label} is coming soon`), []);
  const [detailTicket, setDetailTicket] = useState(null); // ticket detail modal

  // Keep detail modal in sync when tickets array updates (e.g. after PATCH)
  useEffect(() => {
    if (detailTicket) {
      const updated = tickets.find((t) => t.ticket_id === detailTicket.ticket_id);
      if (updated) setDetailTicket(updated);
    }
  }, [tickets]);

  // ── Fetch all tickets ──────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await API.get("/api/tickets");
      setTickets(data);
    } catch {
      setError("Could not reach the backend. Please try again.")
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── PATCH status ───────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (ticketId, newStatus) => {
    try {
      const { data } = await API.patch(`/api/tickets/${ticketId}`, { status: newStatus });
      setTickets((prev) => prev.map((t) => t.ticket_id === ticketId ? data : t));
    } catch {
      alert("Failed to update status. Please try again.");
    }
  }, []);

  // ── DELETE ticket ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (ticketId) => {
    try {
      await API.delete(`/api/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t.ticket_id !== ticketId));
      setSelectedId((prev) => (prev === ticketId ? null : prev));
    } catch {
      alert("Failed to delete ticket. Please try again.");
    }
  }, []);

  // ── POST new ticket ────────────────────────────────────────────────────────
  const handleCreated = useCallback((newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      tickets.length,
    open:       tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved:   tickets.filter((t) => t.status === "Resolved").length,
  }), [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (filter !== "All") list = list.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.customer_name.toLowerCase().includes(q)  ||
        t.customer_email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)        ||
        t.ticket_id.toLowerCase().includes(q)
      );
    }
    if (sort === "oldest") list = list.reverse();
    if (sort === "name")   list = [...list].sort((a, b) => a.customer_name.localeCompare(b.customer_name));
    return list;
  }, [tickets, filter, sort, search]);

  const selectedTicket = tickets.find((t) => t.ticket_id === selectedId) ?? null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

      {/* Coming soon toast */}
      {toast && <ComingSoonToast message={toast} onDone={() => setToast("")} />}

      {/* New ticket modal */}
      {showModal && (
        <NewTicketModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Ticket detail modal */}
      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700/60 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Icon d={ICONS.headset} size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100 leading-none">SupportDesk</p>
              <p className="text-xs text-slate-500 mt-0.5">CRM v1.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-xs text-slate-600 uppercase tracking-widest px-3 pb-1 pt-2">Main</p>
          {[
            { key: "Tickets",   icon: "ticket",    badge: stats.open + stats.inProgress },
            { key: "Customers", icon: "users" },
            { key: "Analytics", icon: "chart" },
          ].map(({ key, icon, badge, comingSoon }) => (
            <NavItem key={key} iconKey={icon} label={key} badge={badge}
              comingSoon={comingSoon}
              active={activeNav === key}
              onClick={() => comingSoon ? showToast(key) : setActiveNav(key)} />
          ))}

          <p className="text-xs text-slate-600 uppercase tracking-widest px-3 pb-1 pt-4">Management</p>
          {[
            { key: "Inbox",    icon: "inbox",     comingSoon: true },
            { key: "Agents",   icon: "usercheck" },
            { key: "Labels",   icon: "tag",        comingSoon: true },
            { key: "Settings", icon: "settings",   comingSoon: true },
          ].map(({ key, icon, comingSoon }) => (
            <NavItem key={key} iconKey={icon} label={key}
              comingSoon={comingSoon}
              active={activeNav === key}
              onClick={() => comingSoon ? showToast(key) : setActiveNav(key)} />
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700/60">
          <button
          onClick={() => showToast("Profile settings")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/70 transition cursor-pointer w-full text-left"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              BS
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">Beepasha Sadhwani</p>
              <p className="text-xs text-slate-600">CRM Administrator</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {activeNav === "Agents" ? (
          <AgentsPage tickets={tickets} />
        ) : activeNav === "Analytics" ? (
          <AnalyticsPage tickets={tickets} />
        ) : activeNav === "Customers" ? (
          <CustomersPage tickets={tickets} />
        ) : (<>
        <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 bg-slate-900/50 flex-shrink-0">
          <h1 className="text-base font-semibold text-slate-100 flex-1">All Tickets</h1>
          <button onClick={fetchTickets}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Refresh">
            <Icon d={ICONS.refresh} size={16} />
          </button>
          <div className="relative">
            <Icon d={ICONS.search} size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input type="text" placeholder="Search tickets…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 w-52 transition-colors" />
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors">
            <Icon d={ICONS.plus} size={16} /> New Ticket
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-slate-700/60 flex-shrink-0">
          <StatCard label="Total"       value={stats.total}      colorClass="text-indigo-400" />
          <StatCard label="Open"        value={stats.open}       colorClass="text-blue-400" />
          <StatCard label="In Progress" value={stats.inProgress} colorClass="text-amber-400" />
          <StatCard label="Resolved"    value={stats.resolved}   colorClass="text-emerald-400" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-700/60 flex-shrink-0">
          <div className="flex gap-1.5 flex-1 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium
                  ${filter === s
                    ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                    : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"}`}>
                {s}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-400 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* List + detail */}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-3">

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
                <Icon d={ICONS.refresh} size={22} className="animate-spin" />
                <span className="text-sm">Loading tickets…</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="flex items-center gap-2 bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-5 py-4 max-w-sm text-center">
                  <Icon d={ICONS.alert} size={18} className="flex-shrink-0" />
                  {error}
                </div>
                <button onClick={fetchTickets}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <Icon d={ICONS.refresh} size={13} /> Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3">
                <Icon d={ICONS.filter} size={36} />
                <p className="text-sm">
                  {tickets.length === 0 ? "No tickets yet. Create your first one!" : "No tickets match your filters."}
                </p>
              </div>
            )}

            {/* Cards */}
            {!loading && !error && filtered.map((t) => (
              <TicketCard
                key={t.ticket_id}
                ticket={t}
                selected={selectedId === t.ticket_id}
                onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onOpenDetail={setDetailTicket}
              />
            ))}
          </div>

          {/* Detail panel */}
          {selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              onClose={() => setSelectedId(null)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          )}
        </div>
        </>)}
      </main>
    </div>
  );
}
