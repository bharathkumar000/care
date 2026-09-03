'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/Login';
import SharedHeader from '../../components/SharedHeader';
import MedicationAlarmModal from '../../components/MedicationAlarmModal';

interface AuthState {
  token: string;
  role: string;
  email: string;
  patientId: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const patientId = localStorage.getItem('patientId') ? Number(localStorage.getItem('patientId')) : 1;

    if (token && role && email) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleOpenAlarm = () => setIsAlarmModalOpen(true);
  const handleCloseAlarm = () => setIsAlarmModalOpen(false);

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
        <Login setAuth={(authData: AuthState) => {
          setAuth(authData);
          router.push('/dashboard');
        }} navigate={(path: string) => router.push(path)} />
      </main>
    </div>
  );
}