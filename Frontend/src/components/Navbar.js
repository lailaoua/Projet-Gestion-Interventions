import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const homePath = user?.role === 'Admin'
    ? '/admin'
    : user?.role === 'Technician'
      ? '/technician'
      : user?.role === 'Client'
        ? '/client'
        : '/login';

  const profilePath = user?.role === 'Admin'
    ? '/admin/profile'
    : user?.role === 'Technician'
      ? '/technician/profile'
      : user?.role === 'Client'
        ? '/client/profile'
        : '/login';

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('theme-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('theme-dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const navItems = user?.role === 'Admin'
    ? [
        { to: '/admin', label: '📊 Dashboard' },
        { to: '/admin/clients', label: '👥 Clients' },
        { to: '/admin/equipements', label: '⚙️ Équipements' },
        { to: '/admin/interventions', label: '🔧 Interventions' },
        { to: '/admin/rapports', label: '📄 Rapports' },
        { to: '/admin/statistiques', label: '📈 Statistiques' },
        { to: '/admin/users', label: '🔐 Utilisateurs' }
      ]
    : user?.role === 'Technician'
      ? [
          { to: '/technician', label: '📊 Dashboard' },
          { to: '/technician/interventions', label: '🔧 Interventions' },
          { to: '/technician/rapports', label: '📄 Rapports' },
          { to: '/technician/statistiques', label: '📈 Statistiques' },
          { to: '/technician/contact', label: '✉️ Contact' }
        ]
      : user?.role === 'Client'
        ? [
            { to: '/client', label: '📊 Dashboard' },
            { to: '/client/equipements', label: '📦 Équipements' },
            { to: '/client/interventions', label: '🛠️ Interventions' }
          ]
        : [];

  return (
    <>
      <aside className={`left-sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-inner">
          <nav className="sidebar-nav d-flex flex-column gap-2 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            {user?.role === 'Admin' && (
              <NavLink to="/admin/contact" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                ✉️ Contact
              </NavLink>
            )}
            {user?.role === 'Client' && (
              <NavLink to="/client/contact" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                ✉️ Contact
              </NavLink>
            )}

            <button
              title="Toggle theme"
              className="sidebar-link"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {dark ? '☀️ Mode clair' : '🌙 Mode sombre'}
            </button>

            {user?.role === 'Admin' && (
              <NavLink to="/admin/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                👤 Profil
              </NavLink>
            )}
            {user?.role === 'Technician' && (
              <NavLink to="/technician/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                👤 Profil
              </NavLink>
            )}
            {user?.role === 'Client' && (
              <NavLink to="/client/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                👤 Profil
              </NavLink>
            )}
          </nav>

          <div className="sidebar-bottom mt-3 d-flex flex-column gap-2">

            {user ? (
              <button className="sidebar-link" onClick={logout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                🚪 Déconnexion
              </button>
            ) : (
              <Link className="sidebar-link" to="/login" style={{ textDecoration: 'none' }}>🔑 Connexion</Link>
            )}
          </div>
        </div>
      </aside>

      <nav className="navbar navbar-expand-lg app-navbar">
        <div className="container-fluid">
          <button
            className="navbar-toggler d-lg-none me-2"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <Link className="navbar-brand" to={homePath} style={{ marginLeft: '2rem' }}>
            <img src="/logo.svg" alt="nidal info" className="navbar-logo" style={{ height: '100px', width: 'auto' }} />
          </Link>

          <div className="ms-auto d-flex align-items-center gap-2">
            {user && (
              <Link to={profilePath} className="user-info d-flex align-items-center gap-2" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="user-avatar">
                  {(user.fullName || user.FullName || user.name || user.Name || 'Utilisateur').charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
