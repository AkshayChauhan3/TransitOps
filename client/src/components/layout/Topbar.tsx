import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Sun, Moon, Bell, Menu, X, Check, Truck, LogOut, User, Settings, ChevronRight } from "lucide-react"
import { useTheme } from "../../context/ThemeProvider"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"

interface TopbarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

const notifications = [
  { id: 1, title: "Vehicle #4001 in Maintenance", desc: "Scheduled oil change is overdue by 2 days.", time: "5m ago", type: "warning", read: false },
  { id: 2, title: "Trip TRP-1045 Completed", desc: "Driver Emma Davis completed the ORD → DFW route.", time: "22m ago", type: "success", read: false },
  { id: 3, title: "Driver License Expiring", desc: "John Doe's license expires in 10 days.", time: "1h ago", type: "danger", read: true },
  { id: 4, title: "New Driver Registered", desc: "Sarah Smith has been added to the crew directory.", time: "3h ago", type: "info", read: true },
]

const typeColor: Record<string, string> = {
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
  info: "bg-info",
}

// ── Searchable index ─────────────────────────
const SEARCH_INDEX = [
  // Pages
  { label: "Dashboard", sub: "Overview & KPIs", href: "/", type: "page", icon: "⊞", keywords: "dashboard overview kpi" },
  { label: "Vehicles", sub: "Fleet units", href: "/vehicles", type: "page", icon: "🚛", keywords: "vehicles fleet trucks" },
  { label: "Drivers", sub: "Crew directory", href: "/drivers", type: "page", icon: "👤", keywords: "drivers crew people" },
  { label: "Trips", sub: "Active & completed trips", href: "/trips", type: "page", icon: "🗺", keywords: "trips routes journeys" },
  { label: "Maintenance", sub: "Service schedules", href: "/maintenance", type: "page", icon: "🔧", keywords: "maintenance service repair" },
  { label: "Fuel & Expenses", sub: "Cost tracking", href: "/expenses", type: "page", icon: "⛽", keywords: "fuel expenses cost" },
  { label: "Reports", sub: "Analytics & exports", href: "/reports", type: "page", icon: "📊", keywords: "reports analytics" },
  { label: "My Profile", sub: "Account details", href: "/profile", type: "page", icon: "👤", keywords: "profile account" },
  { label: "Preferences", sub: "Settings & display", href: "/preferences", type: "page", icon: "⚙", keywords: "preferences settings theme" },
  { label: "My Fleet", sub: "Assigned vehicles", href: "/my-fleet", type: "page", icon: "🚚", keywords: "my fleet assigned" },
]

export function Topbar({ collapsed, setCollapsed }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [readIds, setReadIds] = useState<number[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchCursor, setSearchCursor] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Filtered results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.sub.toLowerCase().includes(q) ||
      item.keywords.includes(q)
    ).slice(0, 8)
  }, [searchQuery])

  // Reset cursor when results change
  useEffect(() => { setSearchCursor(0) }, [searchResults])

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Arrow key / Enter navigation inside search
  const handleSearchKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSearchCursor(c => Math.min(c + 1, searchResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSearchCursor(c => Math.max(c - 1, 0))
    } else if (e.key === "Enter" && searchResults[searchCursor]) {
      navigate(searchResults[searchCursor].href)
      setSearchOpen(false)
      setSearchQuery("")
      searchInputRef.current?.blur()
    } else if (e.key === "Escape") {
      setSearchOpen(false)
      setSearchQuery("")
      searchInputRef.current?.blur()
    }
  }, [searchResults, searchCursor, navigate])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = notifications.filter(n => !n.read && !readIds.includes(n.id)).length

  const markAllRead = () => {
    setReadIds(notifications.map(n => n.id))
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "Fleet Manager"
  const displayRole = user?.role?.replace(/_/g, " ") || "Manager"

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-20">
      
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Hamburger / three-line menu toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-all"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>

        {/* Search */}
        <div className="relative group max-w-sm w-full hidden sm:block" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKey}
            placeholder="Search vehicles, drivers, trips... (Ctrl+K)"
            className="w-full bg-card hover:bg-card-hover focus:bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.length > 0 && (
            <div className="absolute left-0 top-11 w-full bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-text-muted">
                  No results for "<span className="text-text-primary font-medium">{searchQuery}</span>"
                </div>
              ) : (
                <div className="py-1.5 max-h-72 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={r.href + r.label}
                      onClick={() => { navigate(r.href); setSearchOpen(false); setSearchQuery("") }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === searchCursor ? "bg-primary/10 text-primary" : "hover:bg-background-secondary text-text-secondary"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                        r.type === "page" ? "bg-primary/10 text-primary" :
                        r.type === "vehicle" ? "bg-info/10 text-info" :
                        r.type === "driver" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                        {r.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{r.label}</p>
                        <p className="text-[10px] text-text-muted">{r.sub}</p>
                      </div>
                      <span className={cn("ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0",
                        r.type === "page" ? "bg-primary/10 text-primary" :
                        r.type === "vehicle" ? "bg-info/10 text-info" :
                        r.type === "driver" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                        {r.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-text-muted">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>Esc close</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-all"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-all relative",
              notifOpen && "bg-card border-border text-text-primary"
            )}
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-background" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-[modalIn_220ms_ease_forwards]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-text-primary">Notifications</span>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger/15 text-danger">{unread}</span>
                  )}
                </div>
                <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-hover font-medium transition-colors flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              </div>

              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {notifications.map(n => {
                  const isRead = n.read || readIds.includes(n.id)
                  return (
                    <div
                      key={n.id}
                      onClick={() => setReadIds(r => [...r, n.id])}
                      className={cn(
                        "flex gap-3 px-4 py-3 cursor-pointer transition-colors",
                        isRead ? "hover:bg-background-secondary" : "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", typeColor[n.type])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", isRead ? "text-text-secondary" : "text-text-primary")}>{n.title}</p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.desc}</p>
                        <p className="text-[10px] text-text-muted mt-1">{n.time}</p>
                      </div>
                      {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-3 border-t border-border">
                <button className="w-full text-center text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-xl border border-transparent hover:border-border hover:bg-card transition-all",
              profileOpen && "bg-card border-border"
            )}
          >
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e9e2d8`}
              alt="Profile"
              className="w-7 h-7 rounded-full border border-border"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight">{displayName}</p>
              <p className="text-[10px] text-text-muted leading-tight capitalize">{displayRole.toLowerCase()}</p>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 text-text-muted transition-transform hidden sm:block", profileOpen && "rotate-90")} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-12 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-[modalIn_220ms_ease_forwards]">
              {/* Profile header */}
              <div className="px-4 py-4 border-b border-border flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e9e2d8`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border border-border"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email || "manager@transitops.com"}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary mt-1">
                    {displayRole}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {[
                  { icon: User, label: "My Profile", sub: "View account details", path: "/profile" },
                  { icon: Truck, label: "My Fleet", sub: "Vehicles assigned to you", path: "/my-fleet" },
                  { icon: Settings, label: "Preferences", sub: "Notifications, display", path: "/preferences" },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setProfileOpen(false); navigate(item.path) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-background-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background-secondary border border-border flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-[10px] text-text-muted">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-border py-1.5">
                <button
                  onClick={() => { logout(); navigate("/login"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-danger/5 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-danger">Sign Out</p>
                    <p className="text-[10px] text-text-muted">End your session</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
