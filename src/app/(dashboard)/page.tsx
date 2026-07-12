import prisma from '@/lib/prisma'

export default async function Dashboard() {
  const [
    activeVehiclesCount,
    availableVehiclesCount,
    maintenanceVehiclesCount,
    activeTripsCount,
    recentTrips,
    expensesAggr
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
    prisma.trip.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        driver: true,
      }
    }),
    prisma.expense.aggregate({ _sum: { amount: true } })
  ]);

  const totalExpenses = expensesAggr._sum.amount || 0;

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-4)', fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        Dashboard
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Active Vehicles</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{activeVehiclesCount}</div>
        </div>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>In Maintenance</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--error)' }}>{maintenanceVehiclesCount}</div>
        </div>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Active Trips</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{activeTripsCount}</div>
        </div>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Total Expenses</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>${totalExpenses.toFixed(0)}</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '16px', textTransform: 'uppercase' }}>Recent Activity</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>ID</th>
              <th style={{ padding: 'var(--space-2)' }}>Vehicle</th>
              <th style={{ padding: 'var(--space-2)' }}>Driver</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTrips.map((trip) => (
              <tr key={trip.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-2)' }}>{trip.id.substring(0, 8)}</td>
                <td style={{ padding: 'var(--space-2)' }}>{trip.vehicle.registration}</td>
                <td style={{ padding: 'var(--space-2)' }}>{trip.driver.firstName} {trip.driver.lastName}</td>
                <td style={{ padding: 'var(--space-2)', color: trip.status === 'IN_PROGRESS' ? 'var(--success)' : 'var(--text-default)', fontWeight: 'bold' }}>{trip.status}</td>
              </tr>
            ))}
            {recentTrips.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
