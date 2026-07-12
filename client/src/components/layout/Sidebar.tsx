import { useState } from "react"
import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, Truck, Users, Route, 
  Wrench, Fuel, BarChart3
} from "lucide-react"
import { cn } from "../../lib/utils"

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const navSections = [
  {
    label: "Operations",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: Truck, label: "Vehicles", href: "/vehicles" },
      { icon: Users, label: "Drivers", href: "/drivers" },
      { icon: Route, label: "Trips", href: "/trips" },
      { icon: Wrench, label: "Maintenance", href: "/maintenance" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: Fuel, label: "Fuel & Expenses", href: "/expenses" },
      { icon: BarChart3, label: "Reports", href: "/reports" },
    ],
  },
]

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen bg-sidebar border-r border-border flex flex-col justify-between shrink-0 overflow-hidden sticky top-0"
    >
      {/* Logo */}
      <div>
        <div className="h-16 flex items-center px-5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Truck className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-base text-text-primary tracking-tight whitespace-nowrap"
            >
              TransitOps
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-5 px-3 mt-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/"}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:bg-card hover:text-text-primary"
                      )
                    }
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    {!collapsed && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom — just version badge, no toggle arrow */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-border">
          <p className="text-[10px] text-text-muted">TransitOps v1.0</p>
          <p className="text-[10px] text-text-muted mt-0.5">Fleet Intelligence Platform</p>
        </div>
      )}
    </motion.aside>
  )
}
