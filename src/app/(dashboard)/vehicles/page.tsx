import prisma from '@/lib/prisma'
import { createVehicle } from './actions'

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Vehicle Registry
      </h1>

      <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Add New Vehicle</h2>
        <form action={createVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Registration</label>
            <input name="registration" required placeholder="XYZ-1234" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Make</label>
            <input name="make" required placeholder="Ford" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Model</label>
            <input name="model" required placeholder="Transit" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Year</label>
            <input name="year" type="number" required placeholder="2023" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>ADD VEHICLE</button>
        </form>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Registration</th>
              <th style={{ padding: 'var(--space-2)' }}>Make</th>
              <th style={{ padding: 'var(--space-2)' }}>Model</th>
              <th style={{ padding: 'var(--space-2)' }}>Year</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)', fontWeight: 'bold' }}>{v.registration}</td>
                <td style={{ padding: 'var(--space-2)' }}>{v.make}</td>
                <td style={{ padding: 'var(--space-2)' }}>{v.model}</td>
                <td style={{ padding: 'var(--space-2)' }}>{v.year}</td>
                <td style={{ padding: 'var(--space-2)', color: v.status === 'AVAILABLE' ? 'var(--success)' : (v.status === 'MAINTENANCE' ? 'var(--error)' : 'var(--warning)'), fontWeight: 'bold' }}>{v.status}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
