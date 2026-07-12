import prisma from '@/lib/prisma'
import { createDriver } from './actions'

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Driver Management
      </h1>

      <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Add New Driver</h2>
        <form action={createDriver} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>First Name</label>
            <input name="firstName" required placeholder="Alex" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Last Name</label>
            <input name="lastName" required placeholder="Mercer" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>License Number</label>
            <input name="licenseNum" required placeholder="DL-12345678" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>ADD DRIVER</button>
        </form>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Name</th>
              <th style={{ padding: 'var(--space-2)' }}>License</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)', fontWeight: 'bold' }}>{d.firstName} {d.lastName}</td>
                <td style={{ padding: 'var(--space-2)' }}>{d.licenseNum}</td>
                <td style={{ padding: 'var(--space-2)', color: d.status === 'AVAILABLE' ? 'var(--success)' : (d.status === 'OFF_DUTY' ? 'var(--text-muted)' : 'var(--warning)'), fontWeight: 'bold' }}>{d.status}</td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
