'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '../components/LandingPage';
import SharedHeader from '../components/SharedHeader';
import MedicationAlarmModal from '../components/MedicationAlarmModal';

interface AuthState {
  token: string;
  role: string;
  email: string;
  patientId: number;
}

export default function Home() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const patientId = localStorage.getItem('patientId') ? Number(localStorage.getItem('patientId')) : 1;

    if (token && role && email) {
      const authData = { token, role, email, patientId };
      setAuth(authData);
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleOpenAlarm = () => setIsAlarmModalOpen(true);
  const handleCloseAlarm = () => setIsAlarmModalOpen(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading C.A.R.E. Portal...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <MedicationAlarmModal isOpen={isAlarmModalOpen} onClose={handleCloseAlarm} auth={auth} />
      <SharedHeader 
        auth={auth} 
        setAuth={setAuth} 
        isConnected={false} 
        connectionStatus="disconnected"
        navigate={(path: string) => router.push(path)} 
        onOpenAlarm={handleOpenAlarm}
      />
      <main style={{ flex: 1 }}>
        <LandingPage navigate={(path: string) => router.push(path)} />
      </main>
    </div>
  );
}