import { ActivitySquare, LogOut, User as UserIcon, LogIn, Bell } from 'lucide-react';

export default function SharedHeader({ auth, setAuth, isConnected, connectionStatus = isConnected ? 'connected' : 'disconnected', navigate, onOpenAlarm }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setAuth(null);
    if (navigate) navigate('/');
  };

  const getStatusDisplay = () => {
    if (connectionStatus === 'connected') {
      return { className: 'connected', label: 'Live Data' };
    }
    if (connectionStatus === 'connecting') {
      return { className: 'connecting', label: 'Connecting...' };
    }
    return { className: 'disconnected', label: 'Offline' };
  };

  const status = getStatusDisplay();

  return (
    <header className="header">
      <h1 onClick={() => navigate && navigate('/')} style={{ cursor: 'pointer' }}>
        <ActivitySquare size={28} color="var(--primary)" />
        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>C.A.R.E.</span>
      </h1>

      <ul className="header-nav-links">
        <li className="header-nav-link" onClick={() => navigate && navigate('/')}>Home</li>
        <li className="header-nav-link" onClick={() => navigate && navigate('/landing#about')}>About</li>
      </ul>
      
      <div className="header-right">
        {auth?.role !== 'Doctor' && (
          <button className="alarm-bell-btn" onClick={onOpenAlarm} title="Medication Reminders & Alarms">
            <Bell size={15} /> Medication Alarms
          </button>
        )}

        <div className="status-badge">
          <div className={`status-dot ${status.className}`}></div>
          {status.label}
        </div>

        {auth ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--surface-ice)', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
              <UserIcon size={15} />
              {auth.role}
            </div>
            <button className="btn-pill btn-pill-outline" onClick={handleLogout} style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <button className="btn-pill btn-pill-navy" onClick={() => navigate && navigate('/login')} style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
            <LogIn size={15} /> Login
          </button>
        )}
      </div>
    </header>
  );
}
