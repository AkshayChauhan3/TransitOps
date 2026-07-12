import { Truck, MapPin } from "lucide-react"

const fleet = [
  { reg: "TX-984-Z", model: "Volvo FH16", type: "SEMI TRUCK", status: "AVAILABLE", region: "WEST" },
  { reg: "CA-332-A", model: "Peterbilt 389", type: "FLATBED", status: "ON TRIP", region: "NORTH" },
  { reg: "NY-102-X", model: "Freightliner M2", type: "BOX TRUCK", status: "IN SHOP", region: "EAST" },
  { reg: "FL-504-Y", model: "Ford Transit", type: "VAN", status: "AVAILABLE", region: "SOUTH" },
]

const statusClass: Record<string, string> = {
  AVAILABLE: "badge-success",
  "ON TRIP": "badge-info",
  "IN SHOP": "badge-warning",
  RETIRED: "badge-danger",
}

export default function MyFleet() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="page-title">My Fleet</h1>
        <p className="page-subtitle">Vehicles assigned to your fleet management account</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{fleet.length} Vehicles</p>
            <p className="text-xs text-text-muted">Under your management</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {fleet.map(v => (
            <div key={v.reg} className="flex items-center justify-between px-5 py-4 hover:bg-background-secondary transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-card-hover border border-border flex items-center justify-center">
                  <Truck className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{v.reg}</p>
                  <p className="text-xs text-text-muted">{v.model} · {v.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <MapPin className="w-3.5 h-3.5" /> {v.region}
                </div>
                <span className={`badge ${statusClass[v.status] || "badge-neutral"}`}>{v.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
