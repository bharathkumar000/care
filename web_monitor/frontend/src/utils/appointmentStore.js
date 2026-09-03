// Centralized Doctor Teleconsultation & Appointment Scheduling Store for C.A.R.E.

const STORAGE_KEY = 'care_appointments_v1';

const DEFAULT_APPOINTMENTS = [
  {
    id: 'apt-101',
    patientId: 1,
    patientName: 'John Doe',
    date: '2026-09-05',
    displayDate: '05 Sep 2026',
    timeSlot: '10:00 AM',
    mode: 'Video Call',
    doctorName: 'Dr. Sarah',
    reason: 'Routine ECG Telemetry Review & Medication Adjustment',
    status: 'Confirmed',
    createdAt: '2026-09-03T10:00:00'
  },
  {
    id: 'apt-201',
    patientId: 2,
    patientName: 'Jane Smith',
    date: '2026-09-06',
    displayDate: '06 Sep 2026',
    timeSlot: '02:30 PM',
    mode: 'In-Person Visit',
    doctorName: 'Dr. Sarah',
    reason: 'Follow-up Stress Index & Blood Pressure Evaluation',
    status: 'Pending',
    createdAt: '2026-09-03T11:15:00'
  }
];

const listeners = new Set();

export function getAppointments(patientId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : null;
    if (!list) {
      list = DEFAULT_APPOINTMENTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    let filtered = list;
    if (patientId !== null && patientId !== undefined) {
      const numericId = Number(patientId);
      filtered = list.filter(a => Number(a.patientId) === numericId || a.patientId === patientId);
    }

    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (e) {
    console.error("Failed to load appointments", e);
    return DEFAULT_APPOINTMENTS;
  }
}

export function addAppointment(newApt) {
  const all = getAppointments();
  
  const formattedDisplayDate = newApt.date ? new Date(newApt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upcoming Date';

  const created = {
    id: `apt-${Date.now()}`,
    patientId: Number(newApt.patientId || 1),
    patientName: newApt.patientName || 'John Doe',
    date: newApt.date || '2026-09-05',
    displayDate: formattedDisplayDate,
    timeSlot: newApt.timeSlot || '10:00 AM',
    mode: newApt.mode || 'Video Call',
    doctorName: 'Dr. Sarah',
    reason: newApt.reason || 'General Medical Consultation',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  const updated = [...all, created];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save appointment", e);
  }

  notifyListeners();
  return created;
}

export function updateAppointmentStatus(aptId, newStatus) {
  const all = getAppointments();
  const updated = all.map(a => a.id === aptId ? { ...a, status: newStatus } : a);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update appointment status", e);
  }
  notifyListeners();
}

export function subscribeAppointments(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
}
