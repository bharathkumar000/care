// Universal Medication Alarm Store & Web Audio Synthesizer
const ALARM_STORAGE_KEY = 'care_medication_alarms_v1';

const DEFAULT_ALARMS = [
  {
    id: 'alarm-101',
    medicineName: 'Paracetamol 500 mg',
    dosage: '1 tablet',
    instruction: '1-0-1 (BF) - Take Before Food',
    time: '20:00', // 08:00 PM
    timeLabel: '08:00 PM',
    enabled: true,
    patientName: 'John Doe'
  },
  {
    id: 'alarm-102',
    medicineName: 'Amoxicillin 250 mg',
    dosage: '1 capsule',
    instruction: '1-1-1 (AF) - Take After Food',
    time: '21:00', // 09:00 PM
    timeLabel: '09:00 PM',
    enabled: true,
    patientName: 'John Doe'
  },
  {
    id: 'alarm-201',
    medicineName: 'Metformin 500 mg',
    dosage: '1 tablet',
    instruction: '1-0-0 (BF) - Take Before Breakfast',
    time: '08:00', // 08:00 AM
    timeLabel: '08:00 AM',
    enabled: true,
    patientName: 'Jane Smith'
  }
];

const listeners = new Set();
let audioContext = null;
let alarmOscillatorInterval = null;

export function getAlarms() {
  try {
    const raw = localStorage.getItem(ALARM_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load alarms", e);
  }
  localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(DEFAULT_ALARMS));
  return DEFAULT_ALARMS;
}

export function saveAlarms(alarms) {
  try {
    localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));
  } catch (e) {
    console.error("Failed to save alarms", e);
  }
  notifyListeners();
}

export function addAlarm(newAlarm) {
  const alarms = getAlarms();
  const created = {
    id: `alarm-${Date.now()}`,
    enabled: true,
    patientName: newAlarm.patientName || 'Current Patient',
    instruction: newAlarm.instruction || 'Take as prescribed',
    ...newAlarm
  };
  alarms.push(created);
  saveAlarms(alarms);
  return created;
}

export function updateAlarm(alarmId, updatedFields) {
  const alarms = getAlarms();
  const updated = alarms.map(a => a.id === alarmId ? { ...a, ...updatedFields } : a);
  saveAlarms(updated);
}

export function toggleAlarmEnabled(alarmId) {
  const alarms = getAlarms();
  const updated = alarms.map(a => a.id === alarmId ? { ...a, enabled: !a.enabled } : a);
  saveAlarms(updated);
}

export function deleteAlarm(alarmId) {
  const alarms = getAlarms();
  const updated = alarms.filter(a => a.id !== alarmId);
  saveAlarms(updated);
}

export function subscribeAlarms(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
}

// Web Audio API Alarm Sound Synthesizer (Loud, pleasant medical alarm chime)
export function startAlarmSound() {
  stopAlarmSound();
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();

    const playBeep = () => {
      if (!audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1174.66, audioContext.currentTime + 0.15); // D6 note

      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + 0.3);
    };

    playBeep();
    alarmOscillatorInterval = setInterval(playBeep, 800);
  } catch (e) {
    console.error("Audio playback error", e);
  }
}

export function stopAlarmSound() {
  if (alarmOscillatorInterval) {
    clearInterval(alarmOscillatorInterval);
    alarmOscillatorInterval = null;
  }
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
}
