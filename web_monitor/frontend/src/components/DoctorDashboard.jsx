import { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  ActivitySquare, 
  Users, 
  FileText, 
  Settings, 
  User as UserIcon, 
  CheckCircle, 
  Plus, 
  Minus, 
  X, 
  Sliders, 
  History, 
  Info, 
  Clock, 
  Wifi, 
  WifiOff,
  Pill,
  Utensils,
  Edit3,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCarePlanForPatient, saveCarePlanForPatient, subscribeCarePlan } from '../utils/carePlanStore';
import { getEmergencyEvents, recordPanicEvent, updateEventStatus, subscribeEmergencyEvents } from '../utils/emergencyEventStore';

export default function DoctorDashboard({ 
  data = { hr: null, gsr: null, panic: 0 }, 
  chartData = [], 
  isConnected = false, 
  connectionStatus = 'disconnected',
  hasReceivedData = false 
}) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [toast, setToast] = useState(null);

  // Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // Care Plan Modals State
  const [showRxModal, setShowRxModal] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [rxForm, setRxForm] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    timing: '',
    duration: '',
    status: 'Active'
  });

  const [showDietModal, setShowDietModal] = useState(false);
  const [dietForm, setDietForm] = useState({
    breakfast: '',
    lunch: '',
    eveningSnack: '',
    dinner: ''
  });

  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [editingInstIndex, setEditingInstIndex] = useState(-1);
  const [instText, setInstText] = useState('');

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Panic Acknowledgment State
  const [acknowledgedPanic, setAcknowledgedPanic] = useState(false);

  // Alert Thresholds State (Session Persisted)
  const [thresholds, setThresholds] = useState({
    hrMin: 50,
    hrMax: 100,
    stressMax: 520,
    panicAlertEnabled: true
  });

  const [tempThresholds, setTempThresholds] = useState({ ...thresholds });
  const [sessionLogs, setSessionLogs] = useState([]);

  // Shared Care Plan & Emergency Events State for Selected Patient
  const [carePlan, setCarePlan] = useState(() => getCarePlanForPatient(selectedPatient || 1));
  const [emergencyEvents, setEmergencyEvents] = useState(() => getEmergencyEvents(selectedPatient || 1));

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setCarePlan(getCarePlanForPatient(selectedPatient));
      setEmergencyEvents(getEmergencyEvents(selectedPatient));
    }
  }, [selectedPatient]);

  useEffect(() => {
    const unsubCare = subscribeCarePlan(() => {
      if (selectedPatient) {
        setCarePlan(getCarePlanForPatient(selectedPatient));
      }
    });
    const unsubEmg = subscribeEmergencyEvents(() => {
      if (selectedPatient) {
        setEmergencyEvents(getEmergencyEvents(selectedPatient));
      }
    });
    return () => {
      unsubCare();
      unsubEmg();
    };
  }, [selectedPatient]);

  // Reset panic acknowledgment when panic signal resolves
  useEffect(() => {
    if (data.panic === 0 && acknowledgedPanic) {
      setAcknowledgedPanic(false);
    }
  }, [data.panic, acknowledgedPanic]);

  // Update session history log when telemetry arrives
  useEffect(() => {
    if (data && data.hr !== null) {
      const now = new Date().toLocaleTimeString();
      setSessionLogs((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.hr !== data.hr || last.gsr !== data.gsr || last.panic !== data.panic) {
          const isAlert = data.panic === 1 || data.hr < thresholds.hrMin || data.hr > thresholds.hrMax || data.gsr > thresholds.stressMax;
          const statusText = data.panic === 1 ? 'Panic Alert' : (isAlert ? 'Threshold Exceeded' : 'Normal');
          return [...prev.slice(-19), { timestamp: now, hr: data.hr, gsr: data.gsr, panic: data.panic, status: statusText }];
        }
        return prev;
      });
    }
  }, [data, thresholds]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        let fetchedPatients = await response.json();
        setPatients(fetchedPatients);
        if (fetchedPatients.length > 0 && !selectedPatient) {
          setSelectedPatient(fetchedPatients[0].id);
        }
      } else {
        const mockPatients = [
          { id: 1, name: "John Doe", status: "Stable", room: "101" },
          { id: 2, name: "Jane Smith", status: "Stable", room: "102" },
          { id: 3, name: "Robert Johnson", status: "Observation", room: "204" }
        ];
        setPatients(mockPatients);
        if (!selectedPatient) setSelectedPatient(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newName || !newRoom) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName, room: newRoom, status: 'Observation' })
      });
      if (response.ok) {
        const newPatient = await response.json();
        setPatients([...patients, newPatient]);
        setSelectedPatient(newPatient.id);
        setIsAdding(false);
        setNewName('');
        setNewRoom('');
        showToast("Patient added successfully.");
      }
    } catch (e) {
      console.error(e);
      const newPatient = { id: Date.now(), name: newName, room: newRoom, status: 'Observation' };
      setPatients([...patients, newPatient]);
      setSelectedPatient(newPatient.id);
      setIsAdding(false);
      setNewName('');
      setNewRoom('');
      showToast("Patient added (offline mode).");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAcknowledgeAlert = () => {
    setAcknowledgedPanic(true);
    showToast("Panic alert acknowledged.");
  };

  // --- EMERGENCY EVENT HANDLERS ---
  const handleAcknowledgeEvent = (eventId) => {
    updateEventStatus(eventId, 'Acknowledged');
    showToast("Emergency event acknowledged.");
    if (selectedEventDetails && selectedEventDetails.id === eventId) {
      setSelectedEventDetails(prev => ({ ...prev, status: 'Acknowledged' }));
    }
  };

  const handleResolveEvent = (eventId) => {
    updateEventStatus(eventId, 'Resolved');
    showToast("Emergency event resolved.");
    if (selectedEventDetails && selectedEventDetails.id === eventId) {
      setSelectedEventDetails(prev => ({ ...prev, status: 'Resolved' }));
    }
  };

  const handleTriggerMockPanic = () => {
    const patientName = selectedPatientData ? selectedPatientData.name : 'John Doe';
    recordPanicEvent({
      patientId: selectedPatient || 1,
      patientName,
      heartRate: data.hr || Math.floor(Math.random() * 30) + 100,
      stressValue: data.gsr || Math.floor(Math.random() * 80) + 520,
      eventType: "Panic Button"
    });
    showToast(`Panic event simulated for ${patientName}.`);
  };

  // --- CARE PLAN HANDLERS ---
  const handleOpenAddRx = () => {
    setEditingRx(null);
    setRxForm({
      medicineName: '',
      dosage: '',
      frequency: '',
      timing: '',
      duration: '',
      status: 'Active'
    });
    setShowRxModal(true);
  };

  const handleOpenEditRx = (rx) => {
    setEditingRx(rx);
    setRxForm({
      medicineName: rx.medicineName || rx.name || '',
      dosage: rx.dosage || '',
      frequency: rx.frequency || '',
      timing: rx.timing || '',
      duration: rx.duration || '',
      status: rx.status || 'Active'
    });
    setShowRxModal(true);
  };

  const handleSaveRx = (e) => {
    e.preventDefault();
    if (!rxForm.medicineName) return;

    const existingRxs = carePlan.prescriptions || [];
    let updatedRxs = [];

    if (editingRx) {
      updatedRxs = existingRxs.map(rx => 
        rx.id === editingRx.id ? { ...rx, ...rxForm } : rx
      );
    } else {
      const newRx = {
        id: `rx-${Date.now()}`,
        ...rxForm,
        prescribedBy: 'Dr. Sarah',
        prescribedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        nextDose: '08:00 PM'
      };
      updatedRxs = [...existingRxs, newRx];
    }

    const updatedPlan = { ...carePlan, prescriptions: updatedRxs };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    setShowRxModal(false);
    showToast(editingRx ? "Prescription updated." : "New prescription added.");
  };

  const handleRemoveRx = (rxId) => {
    const existingRxs = carePlan.prescriptions || [];
    const updatedRxs = existingRxs.filter(rx => rx.id !== rxId);
    const updatedPlan = { ...carePlan, prescriptions: updatedRxs };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    showToast("Prescription removed.");
  };

  const handleOpenEditDiet = () => {
    const dp = carePlan.dietPlan || {};
    setDietForm({
      breakfast: (dp.breakfast || []).join(', '),
      lunch: (dp.lunch || []).join(', '),
      eveningSnack: (dp.eveningSnack || []).join(', '),
      dinner: (dp.dinner || []).join(', ')
    });
    setShowDietModal(true);
  };

  const handleSaveDiet = (e) => {
    e.preventDefault();
    const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

    const updatedDiet = {
      breakfast: parseList(dietForm.breakfast),
      lunch: parseList(dietForm.lunch),
      eveningSnack: parseList(dietForm.eveningSnack),
      dinner: parseList(dietForm.dinner)
    };

    const updatedPlan = { ...carePlan, dietPlan: updatedDiet };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    setShowDietModal(false);
    showToast("Diet plan updated.");
  };

  const handleOpenAddInstruction = () => {
    setEditingInstIndex(-1);
    setInstText('');
    setShowInstructionModal(true);
  };

  const handleOpenEditInstruction = (index, currentText) => {
    setEditingInstIndex(index);
    setInstText(currentText);
    setShowInstructionModal(true);
  };

  const handleSaveInstruction = (e) => {
    e.preventDefault();
    if (!instText.trim()) return;

    const currentInsts = carePlan.doctorInstructions || [];
    let updatedInsts = [...currentInsts];

    if (editingInstIndex >= 0) {
      updatedInsts[editingInstIndex] = instText.trim();
    } else {
      updatedInsts.push(instText.trim());
    }

    const updatedPlan = { ...carePlan, doctorInstructions: updatedInsts };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    setShowInstructionModal(false);
    showToast("Instruction saved.");
  };

  const handleRemoveInstruction = (index) => {
    const currentInsts = carePlan.doctorInstructions || [];
    const updatedInsts = currentInsts.filter((_, i) => i !== index);
    const updatedPlan = { ...carePlan, doctorInstructions: updatedInsts };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    showToast("Instruction removed.");
  };

  const handleOpenEditNotes = () => {
    setNotesText(carePlan.careNotes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    const updatedPlan = { ...carePlan, careNotes: notesText.trim() };
    saveCarePlanForPatient(selectedPatient, updatedPlan);
    setShowNotesModal(false);
    showToast("Care notes updated.");
  };

  const isLiveSignal = isConnected && hasReceivedData;
  const isPanic = data.panic === 1;
  const isHrAlert = isLiveSignal && data.hr !== null && (data.hr < thresholds.hrMin || data.hr > thresholds.hrMax);
  const isStressAlert = isLiveSignal && data.gsr !== null && data.gsr > thresholds.stressMax;
  const isSelectedAlert = (isPanic && thresholds.panicAlertEnabled) || isHrAlert || isStressAlert;

  const displayPatients = patients.map(p => {
    if (p.id === selectedPatient && isSelectedAlert) {
      return { ...p, status: "Critical" };
    }
    return p;
  });

  const selectedPatientData = displayPatients.find(p => p.id === selectedPatient);

  const handleOpenThresholds = () => {
    setTempThresholds({ ...thresholds });
    setShowThresholdsModal(true);
  };

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    setThresholds({ ...tempThresholds });
    setShowThresholdsModal(false);
    showToast(`Threshold settings updated for ${selectedPatientData ? selectedPatientData.name : 'patient'}.`);
  };

  return (
    <div className="doctor-layout">
      <aside className="clinical-sidebar">
        <h3 className="sidebar-title"><Users size={18} style={{marginRight: '8px'}} /> My Patients</h3>
        <ul className="patient-list">
          {displayPatients.map(p => (
            <li 
              key={p.id} 
              className={`patient-item ${selectedPatient === p.id ? 'active' : ''} ${p.id === selectedPatient && isPanic && !acknowledgedPanic ? 'panic-active' : ''}`}
              onClick={() => setSelectedPatient(p.id)}
            >
              <div className="patient-name">{p.name} <span className="patient-room">Rm {p.room}</span></div>
              <div className="patient-card-row">
                <span className={`patient-status ${p.status.toLowerCase()}`}>● {p.status}</span>
                <span className={`sidebar-telemetry-tag ${isLiveSignal ? 'live' : 'offline'}`}>
                  {isLiveSignal ? '● Live' : '⚠ No Signal'}
                </span>
              </div>

              {p.id === selectedPatient && isPanic && !acknowledgedPanic && (
                <div className="sidebar-panic-indicator">
                  🚨 PANIC ALERT
                </div>
              )}
            </li>
          ))}
        </ul>

        {!isAdding ? (
          <button className="add-patient-btn" onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add Patient
          </button>
        ) : (
          <form className="add-patient-form" onSubmit={handleAddPatient}>
            <input 
              type="text" 
              placeholder="Patient Name" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              autoFocus 
            />
            <input 
              type="text" 
              placeholder="Room Number" 
              value={newRoom} 
              onChange={e => setNewRoom(e.target.value)} 
            />
            <div className="btn-row">
              <button type="submit" className="btn-save">Save</button>
              <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        )}
      </aside>

      <main className="dashboard clinical-main">
        {toast && (
          <div className="toast-notification">
            <CheckCircle size={18} /> {toast}
          </div>
        )}
        
        {selectedPatientData ? (
          <>
            <div className="clinical-header">
              <div>
                <h2>Patient: {selectedPatientData.name}</h2>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`telemetry-status-tag ${isLiveSignal ? 'live' : 'offline'}`}>
                    {isLiveSignal ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isLiveSignal ? '● Device Connected • Live Telemetry' : '⚠ Device / Signal Lost • No Live Telemetry'}
                  </span>
                </div>
              </div>
              <div className="clinical-actions">
                <button className="clinical-btn" onClick={() => setShowHistoryModal(true)}>
                  <FileText size={16} /> View History
                </button>
                <button className="clinical-btn" onClick={handleOpenThresholds}>
                  <Settings size={16} /> Adjust Thresholds
                </button>
              </div>
            </div>

            {/* PANIC ALERT BANNER */}
            {isPanic && !acknowledgedPanic && (
              <div className="doctor-panic-alert-card" role="alert" aria-live="assertive">
                <div className="doctor-panic-alert-header">
                  <AlertTriangle size={36} className="panic-icon" />
                  <div>
                    <div className="doctor-panic-title">🚨 PANIC ALERT</div>
                    <div className="doctor-panic-details">
                      Patient: {selectedPatientData.name} &nbsp;|&nbsp; Room: {selectedPatientData.room}
                    </div>
                  </div>
                </div>
                <div className="doctor-panic-message">
                  Panic button activated. Immediate attention required.
                </div>
                <button className="acknowledge-btn" onClick={handleAcknowledgeAlert}>
                  [ ACKNOWLEDGE ALERT ]
                </button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className={`stat-icon ${selectedPatientData.status === "Critical" ? 'alert' : ''}`}>
                  <Heart size={32} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Heart Rate ({isLiveSignal ? 'Live' : 'No Signal'})</span>
                  <span className="stat-value">
                    {isLiveSignal && data.hr !== null ? data.hr : '--'} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>BPM</span>
                  </span>
                  <span className="stat-subtext" style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                    Alert Range: {thresholds.hrMin}–{thresholds.hrMax} BPM
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className={`stat-icon ${selectedPatientData.status === "Critical" ? 'alert' : ''}`}>
                  <Activity size={32} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Stress Index ({isLiveSignal ? 'Live' : 'No Signal'})</span>
                  <span className="stat-value">
                    {isLiveSignal && data.gsr !== null ? data.gsr : '--'}
                  </span>
                  <span className="stat-subtext" style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                    Alert Threshold: &gt; {thresholds.stressMax}
                  </span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <div className="chart-title">
                  <ActivitySquare size={20} className={selectedPatientData.status === "Critical" ? 'text-alert' : 'text-accent'} color={selectedPatientData.status === "Critical" ? '#E11D48' : '#0EA5E9'} />
                  <span>Real-time ECG Telemetry Waveform</span>
                </div>
                <span className="monitoring-tag">Telemetry Stream</span>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="time" hide={true} />
                    <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <Line 
                      type="monotone" 
                      dataKey="ecg" 
                      stroke={selectedPatientData.status === "Critical" ? '#E11D48' : '#0EA5E9'} 
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EMERGENCY EVENTS CARD */}
            <section className="care-section-card">
              <div className="care-section-header">
                <div className="care-section-title-group">
                  <AlertTriangle size={22} color="var(--alert)" />
                  <h3>Emergency Events ({selectedPatientData ? selectedPatientData.name : 'Patient'})</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="doc-btn-sm danger" onClick={handleTriggerMockPanic} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Plus size={14} /> Simulate Panic Event
                  </button>
                  <span className="care-section-badge">
                    Patient-Specific Log
                  </span>
                </div>
              </div>

              {emergencyEvents && emergencyEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {emergencyEvents.map((evt) => {
                    const isActive = evt.status === 'Active';
                    const isAck = evt.status === 'Acknowledged';
                    const isRes = evt.status === 'Resolved';

                    return (
                      <div 
                        key={evt.id} 
                        style={{
                          backgroundColor: isActive ? 'rgba(225, 29, 72, 0.05)' : 'var(--bg-page)',
                          border: isActive ? '1px solid rgba(225, 29, 72, 0.4)' : '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '1.1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          boxShadow: isActive ? '0 4px 12px rgba(225, 29, 72, 0.1)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                          <div style={{
                            width: '2.75rem',
                            height: '2.75rem',
                            borderRadius: '50%',
                            backgroundColor: isActive ? 'rgba(225, 29, 72, 0.15)' : (isAck ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface-ice)'),
                            color: isActive ? 'var(--alert)' : (isAck ? '#d97706' : 'var(--primary)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <AlertTriangle size={22} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                                {evt.patientName || selectedPatientData?.name}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--alert)' }}>
                                • {evt.eventType}
                              </span>
                              <span style={{
                                borderRadius: '9999px',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.6rem',
                                backgroundColor: isActive ? 'rgba(225, 29, 72, 0.15)' : (isAck ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                                color: isActive ? 'var(--alert)' : (isAck ? '#d97706' : '#059669'),
                                border: isActive ? '1px solid rgba(225, 29, 72, 0.3)' : (isAck ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
                              }}>
                                STATUS: {evt.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {evt.displayTime || evt.timestamp} &nbsp;|&nbsp; Event ID: {evt.id}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.35rem', fontWeight: 500 }}>
                              "{evt.description}"
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span>Heart Rate: <strong>{evt.heartRate || '--'} BPM</strong></span>
                              <span>Stress Index: <strong>{evt.stressValue || '--'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <button 
                            className="doc-btn-sm edit" 
                            onClick={() => setSelectedEventDetails(evt)}
                          >
                            Details
                          </button>
                          {isActive && (
                            <button 
                              className="save-notes-btn" 
                              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', backgroundColor: '#f59e0b' }} 
                              onClick={() => handleAcknowledgeEvent(evt.id)}
                            >
                              Acknowledge
                            </button>
                          )}
                          {isAck && (
                            <button 
                              className="save-notes-btn" 
                              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', backgroundColor: '#10b981' }} 
                              onClick={() => handleResolveEvent(evt.id)}
                            >
                              Resolve
                            </button>
                          )}
                          {isRes && (
                            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, padding: '0.4rem' }}>
                              ✓ Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="care-plan-empty">No emergency events for this patient.</div>
              )}
            </section>

            {/* A. PRESCRIPTIONS CARD */}
            <section className="care-section-card">
              <div className="care-section-header">
                <div className="care-section-title-group">
                  <Pill size={22} color="var(--primary)" />
                  <h3>Prescriptions</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="care-section-badge">Last Updated: {carePlan.lastUpdated || 'Recently'}</span>
                  <button className="care-plan-action-btn primary" onClick={handleOpenAddRx}>
                    <Plus size={16} /> Add Prescription
                  </button>
                </div>
              </div>
              {carePlan.prescriptions && carePlan.prescriptions.length > 0 ? (
                <div className="doc-rx-grid">
                  {carePlan.prescriptions.map((rx) => (
                    <div key={rx.id} className="doc-rx-card">
                      <div className="doc-rx-title-row">
                        <span className="doc-rx-name">{rx.medicineName || rx.name}</span>
                        <span className={`doc-rx-badge ${rx.status === 'Active' ? 'active' : 'completed'}`}>
                          {rx.status || 'Active'}
                        </span>
                      </div>
                      <div className="doc-rx-body">
                        <div><strong>Dosage:</strong> {rx.dosage || '--'}</div>
                        <div><strong>Frequency:</strong> {rx.frequency || '--'}</div>
                        <div><strong>Timing:</strong> {rx.timing || '--'}</div>
                        <div><strong>Duration:</strong> {rx.duration || '--'}</div>
                      </div>
                      <div className="doc-rx-actions">
                        <button className="doc-btn-sm edit" onClick={() => handleOpenEditRx(rx)}>Edit</button>
                        <button className="doc-btn-sm danger" onClick={() => handleRemoveRx(rx.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="care-plan-empty">No active prescriptions for this patient. Click "+ Add Prescription" to prescribe medication.</div>
              )}
            </section>

            {/* B. DIET PLAN CARD */}
            <section className="care-section-card">
              <div className="care-section-header">
                <div className="care-section-title-group">
                  <Utensils size={22} color="var(--primary)" />
                  <h3>Daily Diet Plan</h3>
                </div>
                <button className="care-plan-action-btn" onClick={handleOpenEditDiet}>
                  <Edit3 size={16} /> Edit Diet Plan
                </button>
              </div>
              <div className="doc-diet-grid">
                <div className="doc-diet-col">
                  <h5>Breakfast</h5>
                  <ul>
                    {carePlan.dietPlan?.breakfast?.length > 0 ? (
                      carePlan.dietPlan.breakfast.map((item, i) => <li key={i}>{item}</li>)
                    ) : <li style={{ fontStyle: 'italic', opacity: 0.6 }}>None specified</li>}
                  </ul>
                </div>
                <div className="doc-diet-col">
                  <h5>Lunch</h5>
                  <ul>
                    {carePlan.dietPlan?.lunch?.length > 0 ? (
                      carePlan.dietPlan.lunch.map((item, i) => <li key={i}>{item}</li>)
                    ) : <li style={{ fontStyle: 'italic', opacity: 0.6 }}>None specified</li>}
                  </ul>
                </div>
                <div className="doc-diet-col">
                  <h5>Evening Snack</h5>
                  <ul>
                    {carePlan.dietPlan?.eveningSnack?.length > 0 ? (
                      carePlan.dietPlan.eveningSnack.map((item, i) => <li key={i}>{item}</li>)
                    ) : <li style={{ fontStyle: 'italic', opacity: 0.6 }}>None specified</li>}
                  </ul>
                </div>
                <div className="doc-diet-col">
                  <h5>Dinner</h5>
                  <ul>
                    {carePlan.dietPlan?.dinner?.length > 0 ? (
                      carePlan.dietPlan.dinner.map((item, i) => <li key={i}>{item}</li>)
                    ) : <li style={{ fontStyle: 'italic', opacity: 0.6 }}>None specified</li>}
                  </ul>
                </div>
              </div>
            </section>

            {/* C. DOCTOR'S INSTRUCTIONS CARD */}
            <section className="care-section-card">
              <div className="care-section-header">
                <div className="care-section-title-group">
                  <FileText size={22} color="var(--primary)" />
                  <h3>Doctor's Instructions</h3>
                </div>
                <button className="care-plan-action-btn primary" onClick={handleOpenAddInstruction}>
                  <Plus size={16} /> Add Instruction
                </button>
              </div>
              {carePlan.doctorInstructions && carePlan.doctorInstructions.length > 0 ? (
                <ul className="doc-instructions-list">
                  {carePlan.doctorInstructions.map((inst, index) => (
                    <li key={index} className="doc-instruction-item">
                      <span>• {inst}</span>
                      <div className="doc-rx-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <button className="doc-btn-sm edit" onClick={() => handleOpenEditInstruction(index, inst)}>Edit</button>
                        <button className="doc-btn-sm danger" onClick={() => handleRemoveInstruction(index)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="care-plan-empty">No instructions added yet.</div>
              )}
            </section>

            {/* D. CARE NOTES CARD */}
            <section className="care-section-card">
              <div className="care-section-header">
                <div className="care-section-title-group">
                  <Info size={22} color="var(--primary)" />
                  <h3>Care Notes</h3>
                </div>
                <button className="care-plan-action-btn" onClick={handleOpenEditNotes}>
                  <Edit3 size={16} /> Edit Care Notes
                </button>
              </div>
              <div className="doc-notes-box">
                {carePlan.careNotes ? `"${carePlan.careNotes}"` : <em>No care notes entered.</em>}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <UserIcon size={64} style={{color: 'var(--surface-light)', margin: '0 auto 1rem auto'}} />
            <h2>No Patient Selected</h2>
            <p>Select a patient from the sidebar or add a new one.</p>
          </div>
        )}
      </main>

      {/* EMERGENCY EVENT DETAILS MODAL */}
      {selectedEventDetails && (
        <div className="modal-overlay" onClick={() => setSelectedEventDetails(null)}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} color="var(--alert)" />
                <h3 style={{ margin: 0 }}>Emergency Event Details</h3>
              </div>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedEventDetails(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Patient Name:</strong> {selectedEventDetails.patientName}</div>
              <div><strong>Event ID:</strong> {selectedEventDetails.id}</div>
              <div><strong>Event Type:</strong> {selectedEventDetails.eventType}</div>
              <div><strong>Date & Time:</strong> {selectedEventDetails.displayTime || selectedEventDetails.timestamp}</div>
              <div><strong>Heart Rate at Event:</strong> {selectedEventDetails.heartRate ? `${selectedEventDetails.heartRate} BPM` : '--'}</div>
              <div><strong>Stress Index at Event:</strong> {selectedEventDetails.stressValue || '--'}</div>
              <div>
                <strong>Current Status:</strong>{' '}
                <span style={{ 
                  fontWeight: 700, 
                  color: selectedEventDetails.status === 'Active' ? 'var(--alert)' : (selectedEventDetails.status === 'Acknowledged' ? '#d97706' : '#059669') 
                }}>
                  {selectedEventDetails.status}
                </span>
              </div>
              <div style={{ backgroundColor: 'var(--bg-page)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <strong>Description:</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-main)' }}>{selectedEventDetails.description}</p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn-cancel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setSelectedEventDetails(null)}>
                Close
              </button>
              {selectedEventDetails.status === 'Active' && (
                <button 
                  className="save-notes-btn" 
                  style={{ backgroundColor: '#f59e0b' }} 
                  onClick={() => handleAcknowledgeEvent(selectedEventDetails.id)}
                >
                  Acknowledge Event
                </button>
              )}
              {selectedEventDetails.status === 'Acknowledged' && (
                <button 
                  className="save-notes-btn" 
                  style={{ backgroundColor: '#10b981' }} 
                  onClick={() => handleResolveEvent(selectedEventDetails.id)}
                >
                  Resolve Event
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRESCRIPTION MODAL */}
      {showRxModal && (
        <div className="modal-overlay" onClick={() => setShowRxModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingRx ? 'Edit Prescription' : 'Add Prescription'}</h3>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowRxModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveRx} className="care-plan-form">
              <div className="care-plan-field">
                <label>Medicine Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Paracetamol 500 mg" 
                  value={rxForm.medicineName}
                  onChange={e => setRxForm({ ...rxForm, medicineName: e.target.value })}
                  required
                />
              </div>
              <div className="care-plan-form-row">
                <div className="care-plan-field">
                  <label>Dosage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1 tablet" 
                    value={rxForm.dosage}
                    onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })}
                    required
                  />
                </div>
                <div className="care-plan-field">
                  <label>Frequency</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Twice a day" 
                    value={rxForm.frequency}
                    onChange={e => setRxForm({ ...rxForm, frequency: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="care-plan-form-row">
                <div className="care-plan-field">
                  <label>Timing</label>
                  <input 
                    type="text" 
                    placeholder="e.g. After breakfast & dinner" 
                    value={rxForm.timing}
                    onChange={e => setRxForm({ ...rxForm, timing: e.target.value })}
                    required
                  />
                </div>
                <div className="care-plan-field">
                  <label>Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5 days" 
                    value={rxForm.duration}
                    onChange={e => setRxForm({ ...rxForm, duration: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="care-plan-field">
                <label>Status</label>
                <select 
                  value={rxForm.status}
                  onChange={e => setRxForm({ ...rxForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setShowRxModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-notes-btn">
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIET PLAN MODAL */}
      {showDietModal && (
        <div className="modal-overlay" onClick={() => setShowDietModal(false)}>
          <div className="modal-card" style={{ maxWidth: '550px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Edit Diet Plan</h3>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowDietModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveDiet} className="care-plan-form">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Enter food items separated by commas for each meal.
              </p>
              <div className="care-plan-field">
                <label>Breakfast Items</label>
                <input 
                  type="text" 
                  placeholder="e.g. Oatmeal, Banana, Low-fat milk" 
                  value={dietForm.breakfast}
                  onChange={e => setDietForm({ ...dietForm, breakfast: e.target.value })}
                />
              </div>
              <div className="care-plan-field">
                <label>Lunch Items</label>
                <input 
                  type="text" 
                  placeholder="e.g. Brown rice, Dal, Vegetable curry, Salad" 
                  value={dietForm.lunch}
                  onChange={e => setDietForm({ ...dietForm, lunch: e.target.value })}
                />
              </div>
              <div className="care-plan-field">
                <label>Evening Snack Items</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fresh fruit, Unsweetened beverage" 
                  value={dietForm.eveningSnack}
                  onChange={e => setDietForm({ ...dietForm, eveningSnack: e.target.value })}
                />
              </div>
              <div className="care-plan-field">
                <label>Dinner Items</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chapati, Vegetable curry, Curd" 
                  value={dietForm.dinner}
                  onChange={e => setDietForm({ ...dietForm, dinner: e.target.value })}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setShowDietModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-notes-btn">
                  Save Diet Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT INSTRUCTION MODAL */}
      {showInstructionModal && (
        <div className="modal-overlay" onClick={() => setShowInstructionModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingInstIndex >= 0 ? 'Edit Instruction' : 'Add Instruction'}</h3>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowInstructionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveInstruction} className="care-plan-form">
              <div className="care-plan-field">
                <label>Instruction Text</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Take prescribed medication according to the given schedule." 
                  value={instText}
                  onChange={e => setInstText(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setShowInstructionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-notes-btn">
                  Save Instruction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CARE NOTES MODAL */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Edit Care Notes</h3>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowNotesModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveNotes} className="care-plan-form">
              <div className="care-plan-field">
                <label>Doctor's Care Notes</label>
                <textarea 
                  rows={4}
                  placeholder="e.g. Continue monitoring regularly and follow the prescribed care plan." 
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setShowNotesModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-notes-btn">
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW HISTORY MODAL */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-container large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <History size={22} color="var(--accent)" />
                <span>Session Telemetry & Monitoring History</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {selectedPatientData && (
                <div className="history-patient-badge">
                  <div>
                    <strong>Patient:</strong> {selectedPatientData.name} (Room {selectedPatientData.room})
                  </div>
                  <div className={`patient-status ${selectedPatientData.status.toLowerCase()}`}>
                    Status: {selectedPatientData.status}
                  </div>
                </div>
              )}

              <div className="history-summary-grid">
                <div className="history-summary-card">
                  <div className="history-card-label">Current HR</div>
                  <div className="history-card-value">{isLiveSignal && data.hr ? `${data.hr} BPM` : '--'}</div>
                </div>
                <div className="history-summary-card">
                  <div className="history-card-label">Current Stress</div>
                  <div className="history-card-value">{isLiveSignal && data.gsr !== null ? data.gsr : '--'}</div>
                </div>
                <div className="history-summary-card">
                  <div className="history-card-label">ECG Samples</div>
                  <div className="history-card-value">{chartData.length} pts</div>
                </div>
                <div className="history-summary-card">
                  <div className="history-card-label">Panic Alert</div>
                  <div className="history-card-value" style={{ color: isPanic ? 'var(--alert)' : 'var(--success)' }}>
                    {isPanic ? 'ACTIVE' : 'Normal'}
                  </div>
                </div>
              </div>

              <div className="history-section-title">
                <ActivitySquare size={18} color="var(--accent)" />
                Session ECG Waveform Trend
              </div>
              <div className="history-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="time" hide={true} />
                    <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <Line type="monotone" dataKey="ecg" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="history-section-title">
                <Clock size={18} color="var(--accent)" />
                Telemetry Event Log
              </div>
              <div className="history-log-table-container">
                <table className="history-log-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Heart Rate</th>
                      <th>Stress Index</th>
                      <th>Panic Signal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionLogs.length > 0 ? (
                      sessionLogs.slice().reverse().map((log, idx) => (
                        <tr key={idx} className={log.panic ? 'panic-row' : ''}>
                          <td>{log.timestamp}</td>
                          <td>{log.hr} BPM</td>
                          <td>{log.gsr}</td>
                          <td>{log.panic ? '🚨 YES' : 'NO'}</td>
                          <td>
                            <span className={`log-tag ${log.panic ? 'panic' : (log.status === 'Normal' ? 'normal' : 'alert')}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ fontStyle: 'italic', textAlign: 'center', opacity: 0.7 }}>
                          Waiting for incoming telemetry packets...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST THRESHOLDS MODAL */}
      {showThresholdsModal && (
        <div className="modal-overlay" onClick={() => setShowThresholdsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sliders size={22} color="#0ea5e9" />
                <span>Adjust Physiological Alert Thresholds</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowThresholdsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveThresholds}>
              <div className="modal-body">
                <p className="modal-description">
                  Customize real-time telemetry trigger limits for <strong>{selectedPatientData ? selectedPatientData.name : 'Patient'}</strong>. Readings outside these parameters will generate caregiver warnings.
                </p>

                {/* HR MIN THRESHOLD */}
                <div className="threshold-card">
                  <div className="threshold-card-header">
                    <label>Heart Rate Min Threshold</label>
                    <span className="threshold-value-badge">{tempThresholds.hrMin} BPM</span>
                  </div>
                  <div className="threshold-input-wrapper">
                    <input 
                      type="range" 
                      className="threshold-range-slider" 
                      value={tempThresholds.hrMin} 
                      onChange={(e) => setTempThresholds({ ...tempThresholds, hrMin: Number(e.target.value) })}
                      min="30" 
                      max="100" 
                    />
                    <div className="custom-stepper">
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, hrMin: Math.max(30, tempThresholds.hrMin - 1) })}
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="number" 
                        className="threshold-number-input" 
                        value={tempThresholds.hrMin} 
                        onChange={(e) => setTempThresholds({ ...tempThresholds, hrMin: Number(e.target.value) })}
                        min="30" 
                        max="100" 
                        required 
                      />
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, hrMin: Math.min(100, tempThresholds.hrMin + 1) })}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="threshold-bounds-hint">
                    <span>Range: 30 - 100 BPM</span>
                    <span>Default: 50 BPM</span>
                  </div>
                </div>

                {/* HR MAX THRESHOLD */}
                <div className="threshold-card">
                  <div className="threshold-card-header">
                    <label>Heart Rate Max Threshold</label>
                    <span className="threshold-value-badge">{tempThresholds.hrMax} BPM</span>
                  </div>
                  <div className="threshold-input-wrapper">
                    <input 
                      type="range" 
                      className="threshold-range-slider" 
                      value={tempThresholds.hrMax} 
                      onChange={(e) => setTempThresholds({ ...tempThresholds, hrMax: Number(e.target.value) })}
                      min="80" 
                      max="200" 
                    />
                    <div className="custom-stepper">
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, hrMax: Math.max(80, tempThresholds.hrMax - 1) })}
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="number" 
                        className="threshold-number-input" 
                        value={tempThresholds.hrMax} 
                        onChange={(e) => setTempThresholds({ ...tempThresholds, hrMax: Number(e.target.value) })}
                        min="80" 
                        max="200" 
                        required 
                      />
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, hrMax: Math.min(200, tempThresholds.hrMax + 1) })}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="threshold-bounds-hint">
                    <span>Range: 80 - 200 BPM</span>
                    <span>Default: 100 BPM</span>
                  </div>
                </div>

                {/* STRESS INDEX THRESHOLD */}
                <div className="threshold-card">
                  <div className="threshold-card-header">
                    <label>Stress Index Max Threshold (GSR)</label>
                    <span className="threshold-value-badge">{tempThresholds.stressMax} GSR</span>
                  </div>
                  <div className="threshold-input-wrapper">
                    <input 
                      type="range" 
                      className="threshold-range-slider" 
                      value={tempThresholds.stressMax} 
                      onChange={(e) => setTempThresholds({ ...tempThresholds, stressMax: Number(e.target.value) })}
                      min="200" 
                      max="1000" 
                    />
                    <div className="custom-stepper">
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, stressMax: Math.max(200, tempThresholds.stressMax - 5) })}
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="number" 
                        className="threshold-number-input" 
                        value={tempThresholds.stressMax} 
                        onChange={(e) => setTempThresholds({ ...tempThresholds, stressMax: Number(e.target.value) })}
                        min="200" 
                        max="1000" 
                        required 
                      />
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setTempThresholds({ ...tempThresholds, stressMax: Math.min(1000, tempThresholds.stressMax + 5) })}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="threshold-bounds-hint">
                    <span>Range: 200 - 1000 GSR</span>
                    <span>Default: 520</span>
                  </div>
                </div>

                {/* PANIC ALERT TOGGLE */}
                <div className="threshold-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>Hardware Panic Alerts</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Enable banner warnings on physical panic button triggers</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.6rem' }}>
                    <input 
                      type="checkbox" 
                      checked={tempThresholds.panicAlertEnabled} 
                      onChange={(e) => setTempThresholds({ ...tempThresholds, panicAlertEnabled: e.target.checked })} 
                      style={{ width: '18px', height: '18px', accentColor: '#0ea5e9', cursor: 'pointer' }}
                    />
                    <span className="threshold-value-badge" style={{ background: tempThresholds.panicAlertEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: tempThresholds.panicAlertEnabled ? '#10b981' : '#94a3b8', border: tempThresholds.panicAlertEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)' }}>
                      {tempThresholds.panicAlertEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                {/* CLINICAL NOTICE */}
                <div className="threshold-disclaimer">
                  <Info size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Clinical Notice:</strong> Monitoring thresholds act as visual & telemetry triggers for observation and non-diagnostic caregiver alerts.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-btn-secondary" onClick={() => setShowThresholdsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-primary">
                  <CheckCircle size={17} /> Save Thresholds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


