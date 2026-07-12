import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/login/actions";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">TransitOps</div>
        <nav>
          <Link href="/" className="nav-item">Dashboard</Link>
          <Link href="/vehicles" className="nav-item">Vehicle Registry</Link>
          <Link href="/drivers" className="nav-item">Driver Management</Link>
          <Link href="/trips" className="nav-item">Trip Dispatcher</Link>
          <Link href="/maintenance" className="nav-item">Maintenance</Link>
          <Link href="/expenses" className="nav-item">Fuel & Expenses</Link>
          <Link href="#" className="nav-item">Reports & Analytics</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-bar">
          <div style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Welcome, Fleet Manager</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="btn-primary">Logout</button>
            </form>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
