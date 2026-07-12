import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useToast } from "../context/ToastContext"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import axiosClient from "../api/axiosClient"
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts"
import {
  Truck, Route, Users, Fuel, DollarSign, AlertTriangle,
  Sparkles, Clock, MapPin, Wrench, MoreHorizontal, ArrowUpRight,
  Download, Calendar, ChevronDown, RefreshCw, ExternalLink, TrendingUp
} from "lucide-react"
import { cn } from "../lib/utils"

// ──────────────────────────────────────────────
// Animation
// ──────────────────────────────────────────────
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } } }

// ──────────────────────────────────────────────
// Chart mock data (replaced by Neon data for KPIs)
// ──────────────────────────────────────────────
const utilizationByRange: Record<string, { time: string; active: number }[]> = {
  "24h": [
    { time: "06:00", active: 45 }, { time: "08:00", active: 75 },
    { time: "10:00", active: 82 }, { time: "12:00", active: 95 },
    { time: "14:00", active: 88 }, { time: "16:00", active: 92 }, { time: "18:00", active: 65 },
  ],
  "7d": [
    { time: "Mon", active: 70 }, { time: "Tue", active: 85 }, { time: "Wed", active: 60 },
    { time: "Thu", active: 90 }, { time: "Fri", active: 78 }, { time: "Sat", active: 55 }, { time: "Sun", active: 40 },
  ],
  "30d": [
    { time: "W1", active: 72 }, { time: "W2", active: 80 }, { time: "W3", active: 68 }, { time: "W4", active: 88 },
  ],
}

const vehicleHealthData = [
  { name: "Healthy", value: 78, color: "var(--success)" },
  { name: "Maintenance Soon", value: 15, color: "var(--warning)" },
  { name: "Critical", value: 7, color: "var(--danger)" },
]

const aiInsights = [
  { title: "Route Optimization", description: "Traffic on I-10 East. Rerouting 3 trips can save ~45 min total.", type: "info" },
  { title: "Fuel Efficiency Drop", description: "Vehicle #4022 showing 12% lower MPG than fleet average this week.", type: "warning" },
  { title: "Maintenance Prediction", description: "5 vehicles projected to need brake pads within 14 days.", type: "alert" },
]

// ──────────────────────────────────────────────
// Reusable Dropdown Menu
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, trend, trendUp, colorClass }: any) => (
  <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)] hover:shadow-lg hover:border-primary/20 transition-all group cursor-default">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">{title}</span>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-background-secondary border border-border group-hover:scale-105 transition-transform", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
      <div className={cn("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md", trendUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
        <ArrowUpRight className={cn("w-3 h-3", !trendUp && "rotate-180")} />
        {trend}
      </div>
    </div>
  </motion.div>
)

// ──────────────────────────────────────────────
// Date Range Picker
// ──────────────────────────────────────────────
const DATE_RANGES = [
  { key: "24h", label: "Last 24 Hours" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "custom", label: "Custom Range" },
]

function DateRangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const label = DATE_RANGES.find(r => r.key === value)?.label || "Last 24 Hours"

  return (
    <div className={cn("relative", open ? "z-50" : "z-10")} ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-card-hover hover:border-primary/30 transition-all",
          open && "border-primary/40 bg-card-hover"
        )}
      >
        <Clock className="w-4 h-4 text-text-muted" />
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
          <div className="absolute left-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-1.5">
              {DATE_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => { onChange(r.key); if (r.key !== "custom") setOpen(false) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left",
                    value === r.key
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  {r.label}
                  {value === r.key && <span className="ml-auto text-[10px] font-bold text-primary">●</span>}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {value === "custom" && (
              <div className="px-3.5 pb-3 pt-1 border-t border-border">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">From</p>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background-secondary text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">To</p>
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background-secondary text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full btn btn-primary btn-sm"
                >Apply Range</button>
              </div>
            )}
          </div>
        )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Chart Three-Dot Menu
// ──────────────────────────────────────────────
function ChartMenu({ onExport, onRefresh, onFullscreen }: { onExport: () => void; onRefresh: () => void; onFullscreen: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div className={cn("relative", open ? "z-50" : "z-10")} ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "p-1.5 text-text-muted hover:text-text-primary hover:bg-background-secondary rounded-lg transition-colors",
          open && "bg-background-secondary text-text-primary"
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
          <div className="absolute right-0 top-9 w-44 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {[
              { label: "Export as PNG", icon: Download, action: onExport },
              { label: "Export as CSV", icon: Download, action: onExport },
              { label: "Refresh data", icon: RefreshCw, action: onRefresh },
              { label: "View fullscreen", icon: ExternalLink, action: onFullscreen },
              { label: "View trend", icon: TrendingUp, action: onFullscreen },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => { item.action(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary transition-colors text-left"
              >
                <item.icon className="w-3.5 h-3.5 text-text-muted" />
                {item.label}
              </button>
            ))}
          </div>
        )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Dashboard Page
// ──────────────────────────────────────────────
export default function Dashboard() {
  const [dateRange, setDateRange] = useState("24h")
  const fleetData = utilizationByRange[dateRange] || utilizationByRange["24h"]
  const { showToast } = useToast() || { showToast: (m: string) => alert(m) }

  // Neon: KPI stats
  const { data: kpis, refetch: refetchKpis } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: () => axiosClient.get("/dashboard").then(res => res.data),
    staleTime: 60_000,
  })

  // Neon: Recent trips
  const { data: tripData } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: () => axiosClient.get("/trips").then(res => res.data.slice(0, 5)),
    staleTime: 30_000,
  })

  const totalVehicles = kpis ? (Number(kpis.activeVehicles ?? 0) + Number(kpis.availableVehicles ?? 0) + Number(kpis.vehiclesInMaintenance ?? 0)) : null
  const activeTrips    = kpis ? Number(kpis.activeTrips ?? 0) : null
  const driversOnline  = kpis ? Number(kpis.driversOnDuty ?? 0) : null

  const generateReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Vehicles", totalVehicles],
      ["Active Trips", activeTrips],
      ["Drivers Online", driversOnline],
      ["Date Range", dateRange],
      ["Generated At", new Date().toLocaleString()],
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `transitops-report-${dateRange}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast("Report generated successfully", "success")
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 pb-12">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Overview</h1>
          <p className="text-sm text-text-muted mt-0.5">Real-time operational intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Download className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </motion.div>

      {/* ROW 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Vehicles" value={totalVehicles !== null ? totalVehicles : "–"} icon={Truck} trend="+12%" trendUp colorClass="text-primary" />
        <KpiCard title="Active Trips" value={activeTrips !== null ? activeTrips : "–"} icon={Route} trend="+5%" trendUp colorClass="text-info" />
        <KpiCard title="Drivers Online" value={driversOnline !== null ? driversOnline : "–"} icon={Users} trend="-2%" trendUp={false} colorClass="text-text-primary" />
        <KpiCard title="Fuel (Gal)" value={kpis?.totalFuel !== undefined ? kpis.totalFuel.toLocaleString() : "12,450"} icon={Fuel} trend="-8%" trendUp colorClass="text-warning" />
        <KpiCard title="Revenue" value={kpis?.totalRevenue !== undefined ? `$${(kpis.totalRevenue >= 1000 ? (kpis.totalRevenue / 1000).toFixed(1) + 'K' : kpis.totalRevenue)}` : "$42.5K"} icon={DollarSign} trend="+14%" trendUp colorClass="text-success" />
        <KpiCard title="Alerts" value={kpis?.alertsCount !== undefined ? kpis.alertsCount : "3"} icon={AlertTriangle} trend="+1" trendUp={false} colorClass="text-danger" />
      </div>

      {/* ROW 2: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Fleet Utilization */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-card border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Fleet Utilization</h2>
              <p className="text-xs text-text-muted mt-0.5">Active vs idle vehicles over time</p>
            </div>
            <ChartMenu
              onExport={() => { const s = encodeURIComponent(JSON.stringify(fleetData)); window.open(`data:text/csv;charset=utf-8,${s}`) }}
              onRefresh={() => refetchKpis()}
              onFullscreen={() => {}}
            />
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fleetData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", color: "var(--text-primary)", fontSize: 12 }} />
                <Area type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fleet Health */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-text-primary">Fleet Health</h2>
            <ChartMenu
              onExport={() => {}}
              onRefresh={() => refetchKpis()}
              onFullscreen={() => {}}
            />
          </div>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vehicleHealthData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                  {vehicleHealthData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-text-primary">78%</span>
              <span className="text-xs text-text-muted">Healthy</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {vehicleHealthData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-text-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ROW 3: Operations & AI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Trips — from Neon */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-card border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">Recent Active Trips</h2>
            <Link
              to="/trips"
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
            >
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-secondary text-[10px] uppercase text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Trip ID</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Route</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Driver</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Status</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripData && tripData.length > 0
                  ? tripData.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-background-secondary/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-text-primary">{trip.id?.slice(0, 8) || "–"}</td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          {trip.origin || "–"} → {trip.destination || "–"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">{trip.driverName || "–"}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border",
                          trip.status === "IN_PROGRESS" ? "bg-info/10 text-info border-info/20" :
                          trip.status === "COMPLETED" ? "bg-success/10 text-success border-success/20" :
                          "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {trip.status?.replace(/_/g, " ") || "–"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs">{trip.estimatedArrival ? new Date(trip.estimatedArrival).toLocaleTimeString() : "–"}</td>
                    </tr>
                  ))
                  : /* Fallback mock while Neon data loads */
                  [
                    { id: "TRP-1042", origin: "LAX", destination: "PHX", driverName: "John Doe", status: "IN_PROGRESS", eta: "2h 15m" },
                    { id: "TRP-1043", origin: "SFO", destination: "SEA", driverName: "Sarah Smith", status: "DELAYED", eta: "4h 30m" },
                    { id: "TRP-1044", origin: "JFK", destination: "BOS", driverName: "Mike Johnson", status: "COMPLETED", eta: "--" },
                    { id: "TRP-1045", origin: "ORD", destination: "DFW", driverName: "Emma Davis", status: "IN_PROGRESS", eta: "1h 45m" },
                  ].map(trip => (
                    <tr key={trip.id} className="hover:bg-background-secondary/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-text-primary">{trip.id}</td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          {trip.origin} → {trip.destination}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">{trip.driverName}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border",
                          trip.status === "IN_PROGRESS" ? "bg-info/10 text-info border-info/20" :
                          trip.status === "COMPLETED" ? "bg-success/10 text-success border-success/20" :
                          "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {trip.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs">{trip.eta}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants} className="bg-gradient-to-b from-primary/8 to-background border border-primary/15 rounded-[16px] shadow-[var(--shadow-card)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
            <Sparkles className="w-28 h-28 text-primary" />
          </div>
          <div className="p-5 border-b border-primary/10 flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">TransitOps AI</h2>
          </div>
          <div className="p-5 flex flex-col gap-3 relative z-10 flex-1">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                  insight.type === "info" ? "bg-info" : insight.type === "warning" ? "bg-warning" : "bg-danger"
                )} />
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">{insight.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ROW 4: Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">Maintenance Schedule</h2>
            <Wrench className="w-4 h-4 text-text-muted" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background-secondary border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Truck #{4000 + i}</p>
                    <p className="text-xs text-text-muted">Oil Change & Tires</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-text-primary">Tomorrow</p>
                  <p className="text-[10px] text-text-muted">08:00 AM</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">Driver Leaderboard</h2>
            <Users className="w-4 h-4 text-text-muted" />
          </div>
          <div className="space-y-3">
            {["Sarah Smith", "Mike Johnson", "Emma Davis"].map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background-secondary border border-border">
                <div className="flex items-center gap-3">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=e9e2d8`} alt={name} className="w-9 h-9 rounded-full border border-border" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{name}</p>
                    <p className="text-xs text-text-muted">{99 - i}% Safety Score</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">Fuel Analytics</h2>
            <Fuel className="w-4 h-4 text-text-muted" />
          </div>
          <div className="space-y-3">
            {[["TX-984-Z", "78%", "Good"], ["CA-332-A", "62%", "Avg"], ["NY-102-X", "45%", "Low"]].map(([reg, pct, label]) => (
              <div key={reg} className="flex items-center gap-3">
                <p className="text-xs font-mono text-text-muted w-20 shrink-0">{reg}</p>
                <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: pct }} />
                </div>
                <span className="text-xs font-semibold text-text-secondary w-12 text-right">{pct} {label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

