import { useNavigate } from "react-router-dom"
import { User, Mail, Shield, Calendar, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const info = [
    { icon: User, label: "Full Name", value: user?.name || "Fleet Manager" },
    { icon: Mail, label: "Email", value: user?.email || "manager@transitops.com" },
    { icon: Shield, label: "Role", value: user?.role?.replace(/_/g, " ") || "FLEET MANAGER" },
    { icon: Calendar, label: "Member Since", value: "July 2025" },
  ]

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Account information and session details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card p-8 flex flex-col items-center gap-4">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}&backgroundColor=e9e2d8`}
            alt="Avatar"
            className="w-24 h-24 rounded-full border-2 border-border"
          />
          <div className="text-center">
            <p className="text-text-primary font-bold text-lg">{user?.name || "Fleet Manager"}</p>
            <p className="text-text-muted text-sm">{user?.email}</p>
            <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {user?.role?.replace(/_/g, " ")}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm mt-2 w-full"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Info */}
        <div className="lg:col-span-2 card p-6 flex flex-col gap-4">
          <h2 className="text-text-primary font-semibold text-base border-b border-border pb-3">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-background-secondary border border-border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
