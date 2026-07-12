import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import axiosClient from "../api/axiosClient"
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts"
import {
  Truck, Route, Users, Fuel, DollarSign, AlertTriangle,
  Sparkles, Clock, MapPin, MoreHorizontal, ArrowUpRight,
  Download, Calendar, ChevronDown, RefreshCw, ExternalLink, TrendingUp
} from "lucide-react"
import { cn } from "../lib/utils"

// ──────────────────────────────────────────────
// Animation
// ──────────────────────────────────────────────
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } } as const
const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } } } as const


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
]

function DateRangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-2xl z-30 overflow-hidden"
          >
            <div className="p-1.5">
              {DATE_RANGES.map(r => (
                <button
                   key={r.key}
                   onClick={() => { onChange(r.key); setOpen(false) }}
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
          </motion.div>
        )}
      </AnimatePresence>
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-9 w-44 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden py-1"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────────────────────────
// Dashboard Page
// ──────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState("24h")

  // Fetch KPI statistics
  const { data: kpis, refetch: refetchKpis } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: () => axiosClient.get("/dashboard/kpis").then(res => res.data),
    staleTime: 30_000,
  })

  // Fetch Recent trips
  const { data: tripData } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: () => axiosClient.get("/dashboard/recent-trips").then(res => res.data),
    staleTime: 30_000,
  })

  // Fetch Alerts
  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: () => axiosClient.get("/dashboard/alerts").then(res => res.data),
    staleTime: 30_000,
  })

  const totalVehicles = Number(kpis?.fleet?.total ?? 0)
  const activeTrips    = Number(kpis?.trips?.active ?? 0)
  const driversOnline  = Number(kpis?.drivers?.onDuty ?? 0)
  const utilization    = kpis?.fleet?.utilizationPercentage ?? 0

  const alertsCount = (alerts?.expiringLicenses?.length || 0) + (alerts?.overdueMaintenance?.length || 0) + (alerts?.lockedAccounts?.length || 0)

  const utilizationByRange: Record<string, { time: string; active: number }[]> = {
    "24h": [
      { time: "06:00", active: Math.round(activeTrips * 0.6) }, { time: "08:00", active: Math.round(activeTrips * 0.8) },
      { time: "10:00", active: Math.round(activeTrips * 0.9) }, { time: "12:00", active: activeTrips },
      { time: "14:00", active: Math.round(activeTrips * 0.95) }, { time: "16:00", active: Math.round(activeTrips * 0.85) }, { time: "18:00", active: Math.round(activeTrips * 0.7) },
    ],
    "7d": [
      { time: "Mon", active: Math.round(activeTrips * 0.8) }, { time: "Tue", active: Math.round(activeTrips * 0.85) }, { time: "Wed", active: Math.round(activeTrips * 0.75) },
      { time: "Thu", active: activeTrips }, { time: "Fri", active: Math.round(activeTrips * 0.9) }, { time: "Sat", active: Math.round(activeTrips * 0.5) }, { time: "Sun", active: Math.round(activeTrips * 0.4) },
    ],
    "30d": [
      { time: "W1", active: Math.round(activeTrips * 0.82) }, { time: "W2", active: Math.round(activeTrips * 0.88) }, { time: "W3", active: Math.round(activeTrips * 0.78) }, { time: "W4", active: activeTrips },
    ],
  }
  const fleetData = utilizationByRange[dateRange] || utilizationByRange["24h"]

  const vehicleHealthData = [
    { name: "Active / On Trip", value: kpis?.fleet?.active || 0, color: "var(--success)" },
    { name: "In Maintenance", value: kpis?.fleet?.inMaintenance || 0, color: "var(--warning)" },
    { name: "Available / Idle", value: Math.max(0, totalVehicles - (kpis?.fleet?.active || 0) - (kpis?.fleet?.inMaintenance || 0)), color: "var(--primary)" },
  ]

  const generateReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Vehicles", totalVehicles],
      ["Active Trips", activeTrips],
      ["Drivers Online", driversOnline],
      ["Fleet Utilization %", utilization],
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
        <KpiCard title="Total Vehicles" value={totalVehicles || "0"} icon={Truck} trend="+4%" trendUp colorClass="text-primary" />
        <KpiCard title="Active Trips" value={activeTrips || "0"} icon={Route} trend="+12%" trendUp colorClass="text-info" />
        <KpiCard title="Drivers Online" value={driversOnline || "0"} icon={Users} trend="+8%" trendUp colorClass="text-text-primary" />
        <KpiCard title="Utilization" value={`${utilization}%`} icon={Fuel} trend="+2%" trendUp colorClass="text-warning" />
        <KpiCard title="General Revenue" value="$42.5K" icon={DollarSign} trend="+14%" trendUp colorClass="text-success" />
        <KpiCard title="Active Alerts" value={alertsCount} icon={AlertTriangle} trend={`${alertsCount > 0 ? '+' + alertsCount : '0'}`} trendUp={alertsCount > 0} colorClass="text-danger" />
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

        {/* Fleet Status breakdown */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-text-primary">Fleet Distribution</h2>
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
              <span className="text-2xl font-bold text-text-primary">{utilization}%</span>
              <span className="text-xs text-text-muted">Utilized</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {vehicleHealthData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-text-muted">{item.name} ({item.value})</span>
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
            <button
              onClick={() => navigate("/trips")}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
            >
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-secondary text-[10px] uppercase text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Trip ID</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Route</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Driver</th>
                  <th className="px-5 py-3.5 font-bold tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripData && tripData.length > 0 ? (
                  tripData.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-background-secondary/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-text-primary">#{trip.tripNumber || trip.id}</td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          {trip.source || "–"} → {trip.destination || "–"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">{trip.driver?.name || "–"}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border",
                          trip.status === "DISPATCHED" ? "bg-info/10 text-info border-info/20" :
                          trip.status === "COMPLETED" ? "bg-success/10 text-success border-success/20" :
                          "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {trip.status?.replace(/_/g, " ") || "–"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-text-muted text-xs">No recent active trips log found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI & Operations Insights */}
        <motion.div variants={itemVariants} className="bg-gradient-to-b from-primary/8 to-background border border-primary/15 rounded-[16px] shadow-[var(--shadow-card)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
            <Sparkles className="w-28 h-28 text-primary" />
          </div>
          <div className="p-5 border-b border-primary/10 flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">System Insights</h2>
          </div>
          <div className="p-5 flex flex-col gap-3 relative z-10 flex-1 overflow-y-auto max-h-[300px]">
            {alerts?.expiringLicenses?.map((lic: any) => (
              <div key={lic.id} className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-warning" />
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">License Expiring Soon</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    Driver {lic.name}'s license expires on {new Date(lic.licenseExpiryDate).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            ))}
            {alerts?.overdueMaintenance?.map((log: any) => (
              <div key={log.id} className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-danger" />
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Overdue Maintenance</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    Vehicle {log.vehicle?.registrationNumber || 'Unknown'} has been in repair since {new Date(log.startedAt).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            ))}
            {(!alerts?.expiringLicenses?.length && !alerts?.overdueMaintenance?.length) && (
              <div className="p-4 rounded-xl bg-card border border-dashed border-border shadow-sm text-center text-xs text-text-muted">
                No active operational alerts. Everything looks good!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
