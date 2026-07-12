import prisma from '@/lib/prisma'
import { logExpense } from './actions'

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: {
      vehicle: true,
      trip: true,
    }
  })

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { registration: 'asc' }
  })
  
  const activeTrips = await prisma.trip.findMany({
    where: { status: 'IN_PROGRESS' },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate quick stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const fuelExpenses = expenses.filter(e => e.type === 'FUEL').reduce((sum, e) => sum + e.amount, 0)
  const maintenanceExpenses = expenses.filter(e => e.type === 'MAINTENANCE').reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Fuel & Expenses
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Total Expenses</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</div>
        </div>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Fuel Costs</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>${fuelExpenses.toFixed(2)}</div>
        </div>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Maintenance Costs</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--error)' }}>${maintenanceExpenses.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Log New Expense</h2>
        <form action={logExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Type</label>
            <select name="type" required style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="FUEL">Fuel</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Amount ($)</label>
            <input type="number" step="0.01" name="amount" required placeholder="0.00" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Description</label>
            <input name="description" placeholder="Optional details..." style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Vehicle (Opt)</label>
            <select name="vehicleId" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="">-- None --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Active Trip (Opt)</label>
            <select name="tripId" style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-default)', color: 'var(--text-default)' }}>
              <option value="">-- None --</option>
              {activeTrips.map(t => (
                <option key={t.id} value={t.id}>{t.id.substring(0,8)}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>LOG</button>
        </form>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Expense History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Date</th>
              <th style={{ padding: 'var(--space-2)' }}>Type</th>
              <th style={{ padding: 'var(--space-2)' }}>Description</th>
              <th style={{ padding: 'var(--space-2)' }}>Vehicle</th>
              <th style={{ padding: 'var(--space-2)' }}>Trip</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)' }}>{new Date(e.date).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-2)', fontWeight: 'bold' }}>{e.type}</td>
                <td style={{ padding: 'var(--space-2)' }}>{e.description || '-'}</td>
                <td style={{ padding: 'var(--space-2)' }}>{e.vehicle?.registration || '-'}</td>
                <td style={{ padding: 'var(--space-2)', fontSize: '12px' }}>{e.tripId ? e.tripId.substring(0,8) : '-'}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 'bold' }}>${e.amount.toFixed(2)}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses logged.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
