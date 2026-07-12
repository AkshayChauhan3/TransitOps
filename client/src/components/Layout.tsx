import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Route, 
  Wrench, 
  Flame, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import type { UserRole } from '../types';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard',      path: '/',           icon: <LayoutDashboard size={17} strokeWidth={1.75} />, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Vehicles',       path: '/vehicles',   icon: <Truck size={17} strokeWidth={1.75} />,           roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Drivers',        path: '/drivers',    icon: <Users size={17} strokeWidth={1.75} />,           roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Trips',          path: '/trips',      icon: <Route size={17} strokeWidth={1.75} />,           roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Maintenance',    path: '/maintenance',icon: <Wrench size={17} strokeWidth={1.75} />,          roles: ['FLEET_MANAGER'] },
    { name: 'Fuel & Expenses',path: '/expenses',   icon: <Flame size={17} strokeWidth={1.75} />,           roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
    { name: 'Reports',        path: '/reports',    icon: <FileText size={17} strokeWidth={1.75} />,        roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  const formatRole = (role: string) =>
    role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun size={13} strokeWidth={2} /> },
    { value: 'dark',  label: 'Dark',  icon: <Moon size={13} strokeWidth={2} /> },
    { value: 'system',label: 'System',icon: <Monitor size={13} strokeWidth={2} /> },
  ] as const;

  const currentThemeOption = themeOptions.find(o => o.value === themePreference) ?? themeOptions[1];

  return (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-sec)', overflow: 'hidden' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
          }}
          className="lg:hidden"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          width: isCollapsed ? '68px' : '224px',
          backgroundColor: 'var(--color-sidebar)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 260ms cubic-bezier(0.16,1,0.3,1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          overflow: 'hidden',
        }}
        className={`fixed inset-y-0 left-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 16px' : '0 18px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: 8,
              backgroundColor: 'var(--color-interactive)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              letterSpacing: '0.03em', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.12)',
            }}>TO</div>
            {!isCollapsed && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-pri)', letterSpacing: '-0.02em' }}>
                TransitOps
              </span>
            )}
          </Link>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ color: 'var(--color-text-mut)', padding: 4 }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* User card */}
        {user && !isCollapsed && (
          <div style={{
            margin: '14px 12px 6px',
            padding: '10px 12px',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                backgroundColor: 'rgba(75,99,130,0.25)',
                border: '1px solid rgba(75,99,130,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--color-accent-h)',
                flexShrink: 0,
              }}>
                {getInitials(user.name)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text-pri)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-mut)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatRole(user.role)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-mut)', padding: isCollapsed ? '8px 0 8px' : '8px 10px 8px', opacity: isCollapsed ? 0 : 1, transition: 'opacity 200ms', pointerEvents: 'none' }}>
            Navigation
          </div>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.name : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: isCollapsed ? '9px' : '9px 12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  marginBottom: 2,
                  color: isActive ? 'var(--color-text-pri)' : 'var(--color-text-mut)',
                  backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--color-border)' : 'transparent'}`,
                  boxShadow: isActive ? '0 1px 4px var(--color-shadow)' : 'none',
                  transition: 'all 160ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text-sec)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text-mut)';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--color-accent-h)' : 'inherit', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex"
            style={{
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: isCollapsed ? '9px' : '9px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-mut)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 160ms, color 160ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-sec)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-mut)';
            }}
          >
            {isCollapsed ? <ChevronsRight size={16} strokeWidth={1.75} /> : <ChevronsLeft size={16} strokeWidth={1.75} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: isCollapsed ? '9px' : '9px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: '#f87171',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 160ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={16} strokeWidth={1.75} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--color-sidebar)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{ color: 'var(--color-text-mut)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>

          {/* Breadcrumb label */}
          <span className="hidden lg:block" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-mut)' }}>
            Operations
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>

            {/* Theme toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 12, fontWeight: 500,
                  color: 'var(--color-text-sec)',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {currentThemeOption.icon}
                <span className="hidden sm:inline">{currentThemeOption.label}</span>
                <ChevronDown size={11} style={{ color: 'var(--color-text-mut)', marginLeft: 2 }} />
              </button>

              {themeDropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setThemeDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    width: 130,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '6px',
                    boxShadow: '0 8px 30px var(--color-shadow)',
                    zIndex: 20,
                    animation: 'modalIn 200ms cubic-bezier(0.16,1,0.3,1) both',
                  }}>
                    {themeOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setThemePreference(opt.value); setThemeDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '7px 10px',
                          borderRadius: 8, border: 'none',
                          backgroundColor: themePreference === opt.value ? 'var(--color-interactive)' : 'transparent',
                          color: themePreference === opt.value ? '#fff' : 'var(--color-text-sec)',
                          fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          transition: 'background-color 120ms',
                        }}
                        onMouseEnter={e => { if (themePreference !== opt.value) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)'; }}
                        onMouseLeave={e => { if (themePreference !== opt.value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User pill */}
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '5px 10px 5px 6px',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  backgroundColor: 'rgba(75,99,130,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--color-accent-h)',
                  border: '1px solid rgba(75,99,130,0.25)',
                }}>
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text-pri)', lineHeight: 1.2 }}>{user.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-mut)', lineHeight: 1.2 }}>{formatRole(user.role)}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '28px 28px', height: 'calc(100vh - 56px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
