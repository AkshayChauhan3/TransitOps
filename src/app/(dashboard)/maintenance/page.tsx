import prisma from '@/lib/prisma'
import { setVehicleMaintenance } from './actions'

export default async function MaintenancePage() {
  const maintenanceVehicles = await prisma.vehicle.findMany({
    where: { status: 'MAINTENANCE' },
    orderBy: { createdAt: 'desc' },
  })

  // Can only send AVAILABLE vehicles to maintenance
  const availableVehicles = await prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { registration: 'asc' }
  })

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Maintenance Log
      </h1>

      <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Log Vehicle for Maintenance</h2>
        <form action={setVehicleMaintenance} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Select Vehicle</label>
            <select name="vehicleId" required style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="">-- Choose an Available Vehicle --</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration} ({v.type})</option>
              ))}
            </select>
          </div>
          <input type="hidden" name="isMaintenance" value="true" />
          <button type="submit" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>LOG MAINTENANCE</button>
        </form>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Vehicles Currently in Maintenance</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Registration</th>
              <th style={{ padding: 'var(--space-2)' }}>Type</th>
              <th style={{ padding: 'var(--space-2)' }}>Capacity</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceVehicles.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)', fontWeight: 'bold' }}>{v.registration}</td>
                <td style={{ padding: 'var(--space-2)' }}>{v.type}</td>
                <td style={{ padding: 'var(--space-2)' }}>{v.capacity}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                  <form action={setVehicleMaintenance} style={{ display: 'inline' }}>
                    <input type="hidden" name="vehicleId" value={v.id} />
                    <input type="hidden" name="isMaintenance" value="false" />
                    <button type="submit" style={{ backgroundColor: 'transparent', color: 'var(--success)', border: '1px solid var(--success)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' }}>Release to Available</button>
                  </form>
                </td>
              </tr>
            ))}
            {maintenanceVehicles.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles in maintenance.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
