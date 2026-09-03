import { useState, useEffect } from 'react';
import { Server, Users, ShieldAlert, Activity, CheckCircle, X, User as UserIcon, ActivitySquare } from 'lucide-react';

export default function AdminDashboard({ isConnected }) {
  const [users, setUsers] = useState([
    { id: 1, email: "user@care.com", role: "User", lastLogin: "2 mins ago", status: "Online" },
    { id: 2, email: "admin@care.com", role: "Admin", lastLogin: "Just now", status: "Online" },
    { id: 3, email: "doctor@care.com", role: "Doctor", lastLogin: "1 hr ago", status: "Offline" },
    { id: 4, email: "j.doe@care.com", role: "User", lastLogin: "Yesterday", status: "Offline" }
  ]);

  const [toast, setToast] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'unavailable'

  // Modal State for Editing User
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('User');
  const [editStatus, setEditStatus] = useState('Online');

  const currentAdminEmail = localStorage.getItem('email') || 'admin@care.com';

  // Check real backend status
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/api-status');
        if (response.ok) {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('unavailable');
        }
      } catch (e) {
        setBackendStatus('unavailable');
      }
    };
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleDisable = (id, email, currentStatus) => {
    if (email === currentAdminEmail && currentStatus !== 'Disabled') {
      showToast("You cannot disable your own administrator account.");
      return;
    }

    if (currentStatus === 'Disabled') {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'Offline' } : u));
      showToast(`Account ${email} enabled.`);
    } else {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'Disabled' } : u));
      showToast(`Account ${email} disabled.`);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editRole, status: editStatus } : u));
    setEditingUser(null);
    showToast("User updated successfully.");
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <main className="dashboard admin-main">
      {toast && (
        <div className="toast-notification">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="admin-header-section">
        <h2><ShieldAlert size={24} style={{verticalAlign: 'middle', marginRight: '8px'}}/> System Administration</h2>
        <p>Manage users, view system health, and configure global settings.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className={`stat-icon ${backendStatus !== 'healthy' ? 'alert' : ''}`}>
            <Server size={32} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Backend Status</span>
            <span className="stat-value" style={{ color: backendStatus === 'healthy' ? 'var(--success)' : 'var(--alert)', fontSize: '1.4rem' }}>
              {backendStatus === 'healthy' ? '● Healthy' : '⚠ Unavailable'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${!isConnected ? 'alert' : ''}`}>
            <Activity size={32} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Telemetry Connection</span>
            <span className="stat-value" style={{ color: isConnected ? 'var(--success)' : 'var(--text-muted)', fontSize: '1.4rem' }}>
              {isConnected ? '● Connected' : '⚠ Offline'}
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <ActivitySquare size={32} />
          </div>
          <div className="stat-info">
            <span className="stat-label">System Status</span>
            <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>
              ● Operational
            </span>
          </div>
        </div>
      </div>

      <div className="admin-panel user-management">
        <h3><Users size={18} style={{verticalAlign: 'middle', marginRight: '8px'}}/> User Management</h3>
        
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td>{u.lastLogin}</td>
                  <td>
                    <span className={`status-indicator ${u.status === 'Online' ? 'online' : u.status === 'Disabled' ? 'disabled' : 'offline'}`}></span>
                    {u.status}
                  </td>
                  <td>
                    <button 
                      className="table-btn" 
                      onClick={() => handleOpenEdit(u)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`table-btn ${u.status === 'Disabled' ? 'success' : 'danger'}`} 
                      onClick={() => handleToggleDisable(u.id, u.email, u.status)}
                    >
                      {u.status === 'Disabled' ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <UserIcon size={20} color="var(--accent)" />
                <span>Edit User</span>
              </div>
              <button className="modal-close-btn" onClick={handleCancelEdit}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body threshold-form">
              <div className="threshold-group">
                <label className="threshold-label">Email Address</label>
                <input 
                  type="text" 
                  className="threshold-input" 
                  value={editingUser.email} 
                  disabled 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="threshold-group">
                <label className="threshold-label">Role</label>
                <select 
                  className="threshold-input"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="User">User</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="threshold-group">
                <label className="threshold-label">Account Status</label>
                <select 
                  className="threshold-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Online">Online / Enabled</option>
                  <option value="Offline">Offline / Enabled</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="modal-footer" style={{ padding: 0, border: 'none', backgroundColor: 'transparent', marginTop: '0.5rem' }}>
                <button type="button" className="btn-cancel" style={{ padding: '0.6rem 1.25rem' }} onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" style={{ padding: '0.6rem 1.25rem', borderRadius: '6px' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

