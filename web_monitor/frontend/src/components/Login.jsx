import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivitySquare, Lock, User, AlertCircle } from 'lucide-react';

export default function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    let role = 'User';
    let patientId = 1;
    const lower = username.trim().toLowerCase();

    if (lower.includes('admin')) {
      role = 'Admin';
    } else if (lower.includes('doctor')) {
      role = 'Doctor';
    } else {
      role = 'User';
      if (lower.includes('jane')) patientId = 2;
      else if (lower.includes('robert')) patientId = 3;
      else patientId = 1;
    }

    try {
      const formBody = new URLSearchParams({ username, password });
      const response = await fetch('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });

      if (response.ok) {
        const data = await response.json();
        role = data.role || role;
      }
    } catch (err) {
      console.log('Backend offline, using fallback auth credentials');
    }

    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('role', role);
    localStorage.setItem('email', username);
    localStorage.setItem('patientId', patientId);
    setAuth({ token: 'demo-token', role, email: username, patientId });
    navigate('/dashboard');
  };

  const fillDemo = (email) => {
    setUsername(email);
    setPassword('password');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
           <ActivitySquare size={48} color="var(--accent)" />
           <h2>C.A.R.E. Access</h2>
           <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="login-error">
             <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Email address"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Sign In</button>
        </form>

        <div className="login-hint">
          <strong>Demo Credentials:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={() => fillDemo('user@care.com')}
              style={{
                width: '100%',
                maxWidth: '220px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'center'
              }}
            >
              User: user@care.com
            </button>
            <button 
              type="button" 
              onClick={() => fillDemo('doctor@care.com')}
              style={{
                width: '100%',
                maxWidth: '220px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'center'
              }}
            >
              Doctor: doctor@care.com
            </button>
            <button 
              type="button" 
              onClick={() => fillDemo('admin@care.com')}
              style={{
                width: '100%',
                maxWidth: '220px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'center'
              }}
            >
              Admin: admin@care.com
            </button>
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '8px', display: 'block' }}>(Password: password)</span>
        </div>
      </div>
    </div>
  );
}
