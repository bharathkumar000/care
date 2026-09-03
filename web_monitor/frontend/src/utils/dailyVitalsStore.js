// Centralized Daily Vitals & Symptom Logger Store for C.A.R.E.

const STORAGE_KEY = 'care_daily_vitals_v1';

const DEFAULT_VITALS = [
  {
    id: 'vital-101',
    patientId: 1,
    patientName: 'John Doe',
    date: '03 Sep 2026',
    time: '09:30 AM',
    bpSystolic: 120,
    bpDiastolic: 80,
    bpDisplay: '120/80 mmHg',
    spO2: 98,
    temperature: 98.6,
    symptoms: ['Feeling Well', 'No Chest Pain'],
    notes: 'Morning routine check-in. Feeling good after morning walk.',
    timestamp: '2026-09-03T09:30:00'
  },
  {
    id: 'vital-102',
    patientId: 1,
    patientName: 'John Doe',
    date: '02 Sep 2026',
    time: '08:15 PM',
    bpSystolic: 124,
    bpDiastolic: 82,
    bpDisplay: '124/82 mmHg',
    spO2: 97,
    temperature: 98.4,
    symptoms: ['Mild Fatigue'],
    notes: 'Slight tiredness in the evening after work.',
    timestamp: '2026-09-02T20:15:00'
  },
  {
    id: 'vital-201',
    patientId: 2,
    patientName: 'Jane Smith',
    date: '03 Sep 2026',
    time: '10:00 AM',
    bpSystolic: 118,
    bpDiastolic: 76,
    bpDisplay: '118/76 mmHg',
    spO2: 99,
    temperature: 98.2,
    symptoms: ['Feeling Well'],
    notes: 'Vitals stable. Took morning medications on schedule.',
    timestamp: '2026-09-03T10:00:00'
  }
];

const listeners = new Set();

export function getVitalsLogs(patientId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let logs = raw ? JSON.parse(raw) : null;
    if (!logs) {
      logs = DEFAULT_VITALS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    let filtered = logs;
    if (patientId !== null && patientId !== undefined) {
      const numericId = Number(patientId);
      filtered = logs.filter(v => Number(v.patientId) === numericId || v.patientId === patientId);
    }

    // Sort most recent first
    return [...filtered].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  } catch (err) {
    console.error("Failed to load daily vitals", err);
    return DEFAULT_VITALS;
  }
}

export function addVitalsLog(newLog) {
  const allLogs = getVitalsLogs();
  const now = new Date();
  
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const entry = {
    id: `vital-${Date.now()}`,
    patientId: Number(newLog.patientId || 1),
    patientName: newLog.patientName || 'John Doe',
    date: formattedDate,
    time: formattedTime,
    bpSystolic: Number(newLog.bpSystolic) || 120,
    bpDiastolic: Number(newLog.bpDiastolic) || 80,
    bpDisplay: `${newLog.bpSystolic || 120}/${newLog.bpDiastolic || 80} mmHg`,
    spO2: Number(newLog.spO2) || 98,
    temperature: Number(newLog.temperature) || 98.6,
    symptoms: Array.isArray(newLog.symptoms) && newLog.symptoms.length > 0 ? newLog.symptoms : ['Feeling Well'],
    notes: newLog.notes || '',
    timestamp: now.toISOString()
  };

  const updated = [entry, ...allLogs];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save daily vital log", e);
  }

  notifyListeners();
  return entry;
}

export function subscribeVitalsLogs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
}
