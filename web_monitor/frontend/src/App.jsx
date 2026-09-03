import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SharedHeader from './components/SharedHeader';
import UserDashboard from './components/UserDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import MedicationAlarmModal from './components/MedicationAlarmModal';
import { useECGData } from './hooks/useECGData';
import './index.css';

function DashboardRouter({ auth, setAuth, onOpenAlarm }) {
  const { data, chartData, isConnected, connectionStatus, hasReceivedData } = useECGData();
  const navigate = useNavigate();

  return (
    <div className={`app-container ${data.panic === 1 && auth.role !== 'Admin' ? 'panic-mode' : ''}`}>
      <SharedHeader 
        auth={auth} 
        setAuth={setAuth} 
        isConnected={isConnected} 
        connectionStatus={connectionStatus}
        navigate={navigate} 
        onOpenAlarm={onOpenAlarm}
      />
      
      {auth.role === 'Admin' && <AdminDashboard isConnected={isConnected} />}
      {auth.role === 'Doctor' && (
        <DoctorDashboard 
          data={data} 
          chartData={chartData} 
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          hasReceivedData={hasReceivedData}
        />
      )}
      {(auth.role === 'User' || !['Admin', 'Doctor'].includes(auth.role)) && (
        <UserDashboard 
          auth={auth}
          data={data} 
          chartData={chartData} 
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          hasReceivedData={hasReceivedData}
        />
      )}
    </div>
  );
}

function MainLayout({ auth, setAuth, onOpenAlarm, children }) {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <SharedHeader auth={auth} setAuth={setAuth} navigate={navigate} onOpenAlarm={onOpenAlarm} />
      {children}
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const patientId = localStorage.getItem('patientId') ? Number(localStorage.getItem('patientId')) : 1;
    return token ? { token, role, email, patientId } : null;
  });

  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const handleOpenAlarm = () => setIsAlarmModalOpen(true);
  const handleCloseAlarm = () => setIsAlarmModalOpen(false);

  return (
    <BrowserRouter>
      <MedicationAlarmModal isOpen={isAlarmModalOpen} onClose={handleCloseAlarm} />
      
      <Routes>
        <Route path="/" element={
          auth ? <DashboardRouter auth={auth} setAuth={setAuth} onOpenAlarm={handleOpenAlarm} /> : (
            <MainLayout auth={auth} setAuth={setAuth} onOpenAlarm={handleOpenAlarm}>
              <LandingPage />
            </MainLayout>
          )
        } />
        <Route path="/landing" element={
          <MainLayout auth={auth} setAuth={setAuth} onOpenAlarm={handleOpenAlarm}>
            <LandingPage />
          </MainLayout>
        } />
        <Route path="/login" element={
          auth ? <Navigate to="/dashboard" /> : (
            <MainLayout auth={auth} setAuth={setAuth} onOpenAlarm={handleOpenAlarm}>
              <Login setAuth={setAuth} />
            </MainLayout>
          )
        } />
        <Route path="/dashboard" element={
          auth ? <DashboardRouter auth={auth} setAuth={setAuth} onOpenAlarm={handleOpenAlarm} /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
