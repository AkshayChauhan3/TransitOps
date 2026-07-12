import { useState } from "react"
import { Bell, Monitor, Shield, Save } from "lucide-react"
import { useTheme } from "../context/ThemeProvider"

export default function Preferences() {
  const { theme, setTheme } = useTheme()
  const [notifs, setNotifs] = useState({ email: true, browser: true, maintenance: true, trips: false })
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Preferences</h1>
          <p className="page-subtitle">Customize your workspace and notification settings</p>
        </div>
        <button onClick={save} className="btn btn-primary btn-md">
          <Save size={14} /> {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Theme */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Monitor className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">Appearance</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["light", "dark"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                theme === t ? "border-primary bg-primary/5" : "border-border hover:border-text-muted"
              }`}
            >
              <div className={`w-full h-12 rounded-lg mb-3 border border-border ${t === "dark" ? "bg-black" : "bg-gray-50"}`} />
              <p className="text-sm font-semibold text-text-primary capitalize">{t} Mode</p>
              <p className="text-xs text-text-muted mt-0.5">{t === "dark" ? "Pure black background" : "Clean white background"}</p>
              {theme === t && <span className="mt-2 inline-block text-[10px] font-bold text-primary">● ACTIVE</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">Notifications</h2>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "browser", label: "Browser Notifications", desc: "In-app alerts and banners" },
            { key: "maintenance", label: "Maintenance Alerts", desc: "Get notified about overdue services" },
            { key: "trips", label: "Trip Updates", desc: "Notify when trips complete or are delayed" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifs[key as keyof typeof notifs] ? "bg-primary" : "bg-border"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[key as keyof typeof notifs] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">Security</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary border border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Password</p>
            <p className="text-xs text-text-muted">Last changed 30 days ago</p>
          </div>
          <button className="btn btn-ghost btn-sm">Change Password</button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary border border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
            <p className="text-xs text-text-muted">Add an extra layer of security</p>
          </div>
          <button className="btn btn-primary btn-sm">Enable 2FA</button>
        </div>
      </div>
    </div>
  )
}
