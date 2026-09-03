// Centralized Emergency Event Store for C.A.R.E. Web Monitor

const STORAGE_KEY = 'care_emergency_events_v1';

const DEFAULT_EMERGENCY_EVENTS = [
  {
    id: "EVT-101",
    patientId: 1,
    patientName: "John Doe",
    timestamp: "2026-09-02T10:42:00",
    displayTime: "02 Sep 2026 • 10:42 AM",
    eventType: "Panic Button",
    heartRate: 108,
    stressValue: 535,
    status: "Resolved",
    description: "Emergency panic button activated by patient. Caregiver alerted."
  },
  {
    id: "EVT-102",
    patientId: 1,
    patientName: "John Doe",
    timestamp: "2026-09-02T14:15:00",
    displayTime: "02 Sep 2026 • 02:15 PM",
    eventType: "High Stress",
    heartRate: 98,
    stressValue: 580,
    status: "Acknowledged",
    description: "Elevated galvanic skin response (GSR > 520) recorded."
  },
  {
    id: "EVT-201",
    patientId: 2,
    patientName: "Jane Smith",
    timestamp: "2026-09-01T09:30:00",
    displayTime: "01 Sep 2026 • 09:30 AM",
    eventType: "Panic Button",
    heartRate: 112,
    stressValue: 490,
    status: "Resolved",
    description: "Patient triggered manual emergency alert from wearable transmitter."
  },
  {
    id: "EVT-301",
    patientId: 3,
    patientName: "Robert Johnson",
    timestamp: "2026-08-31T16:20:00",
    displayTime: "31 Aug 2026 • 04:20 PM",
    eventType: "Abnormal Heart Rate",
    heartRate: 124,
    stressValue: 510,
    status: "Resolved",
    description: "Heart rate exceeded 120 BPM upper physiological threshold."
  }
];

const listeners = new Set();

function formatDisplayTimestamp(date = new Date()) {
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} • ${timeStr}`;
}

export function getEmergencyEvents(patientId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let events = raw ? JSON.parse(raw) : null;
    if (!events) {
      events = DEFAULT_EMERGENCY_EVENTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
    
    if (patientId !== null && patientId !== undefined) {
      const numericId = Number(patientId);
      return events.filter(e => Number(e.patientId) === numericId || e.patientId === patientId);
    }
    return events;
  } catch (err) {
    console.error("Failed to load emergency events", err);
    return DEFAULT_EMERGENCY_EVENTS;
  }
}

export function recordPanicEvent({ patientId = 1, patientName = "John Doe", heartRate = 85, stressValue = 500, eventType = "Panic Button" }) {
  const events = getEmergencyEvents();
  const now = new Date();
  
  const newEvent = {
    id: `EVT-${Date.now().toString().slice(-4)}`,
    patientId: Number(patientId),
    patientName,
    timestamp: now.toISOString(),
    displayTime: formatDisplayTimestamp(now),
    eventType,
    heartRate: heartRate || 85,
    stressValue: stressValue || 500,
    status: "Active",
    description: eventType === "Panic Button" 
      ? "Emergency panic button activated by patient." 
      : `${eventType} telemetry warning recorded.`
  };
  
  const updated = [newEvent, ...events];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save emergency event", e);
  }
  
  notifyListeners();
  return newEvent;
}

export function updateEventStatus(eventId, newStatus) {
  const events = getEmergencyEvents();
  const updated = events.map(evt => {
    if (evt.id === eventId) {
      return { ...evt, status: newStatus };
    }
    return evt;
  });
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update event status", e);
  }
  
  notifyListeners();
  return updated.find(e => e.id === eventId);
}

export function subscribeEmergencyEvents(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('emergency-events-changed'));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      notifyListeners();
    }
  });
}
