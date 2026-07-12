import prisma from '@/lib/prisma'
import { createTrip, updateTripStatus } from './actions'

export default async function TripsPage() {
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: true,
      driver: true,
    }
  })

  // We only want to dispatch with AVAILABLE vehicles and drivers
  const availableVehicles = await prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' }
  })
  
  const availableDrivers = await prisma.driver.findMany({
    where: { status: 'AVAILABLE' }
  })

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Trip Dispatcher
      </h1>

      <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Dispatch New Trip</h2>
        <form action={createTrip} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Vehicle</label>
            <select name="vehicleId" required style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="">-- Select Vehicle --</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration} ({v.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Driver</label>
            <select name="driverId" required style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="">-- Select Driver --</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Origin</label>
            <input name="origin" required placeholder="Warehouse A" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Destination</label>
            <input name="destination" required placeholder="Port B" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>DISPATCH</button>
        </form>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Active & Past Trips</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>ID</th>
              <th style={{ padding: 'var(--space-2)' }}>Route</th>
              <th style={{ padding: 'var(--space-2)' }}>Vehicle</th>
              <th style={{ padding: 'var(--space-2)' }}>Driver</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)', fontSize: '12px' }}>{t.id.substring(0, 8)}</td>
                <td style={{ padding: 'var(--space-2)' }}>{t.origin} &rarr; {t.destination}</td>
                <td style={{ padding: 'var(--space-2)' }}>{t.vehicle.registration}</td>
                <td style={{ padding: 'var(--space-2)' }}>{t.driver.firstName} {t.driver.lastName}</td>
                <td style={{ padding: 'var(--space-2)', color: t.status === 'IN_PROGRESS' ? 'var(--success)' : (t.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--warning)'), fontWeight: 'bold' }}>{t.status}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                  {t.status === 'DRAFT' && (
                    <form action={updateTripStatus} style={{ display: 'inline' }}>
                      <input type="hidden" name="tripId" value={t.id} />
                      <input type="hidden" name="status" value="IN_PROGRESS" />
                      <button type="submit" style={{ backgroundColor: 'transparent', color: 'var(--success)', border: '1px solid var(--success)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' }}>Start</button>
                    </form>
                  )}
                  {t.status === 'IN_PROGRESS' && (
                    <form action={updateTripStatus} style={{ display: 'inline' }}>
                      <input type="hidden" name="tripId" value={t.id} />
                      <input type="hidden" name="status" value="COMPLETED" />
                      <button type="submit" style={{ backgroundColor: 'transparent', color: 'var(--text-default)', border: '1px solid var(--border-default)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' }}>Complete</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No trips dispatched yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
