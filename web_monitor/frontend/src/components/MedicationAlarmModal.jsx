import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, Volume2, VolumeX, Plus, X, AlertCircle, Play, Pencil, Save } from 'lucide-react';
import { 
  getAlarms, saveAlarms, addAlarm, updateAlarm, toggleAlarmEnabled, deleteAlarm, 
  subscribeAlarms, startAlarmSound, stopAlarmSound 
} from '../utils/medicationAlarmStore';

export default function MedicationAlarmModal({ isOpen, onClose, auth }) {
  const [alarms, setAlarms] = useState(getAlarms());
  const [triggeredAlarm, setTriggeredAlarm] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const isDoctorOrAdmin = auth?.role === 'Doctor' || auth?.role === 'Admin';
  
  // Edit Alarm State
  const [editingAlarmId, setEditingAlarmId] = useState(null);
  const [editForm, setEditForm] = useState({
    medicineName: '',
    dosage: '',
    instruction: '',
    time: '20:00',
    patientName: ''
  });

  // New Alarm Form State
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('1 tablet');
  const [newInstruction, setNewInstruction] = useState('1-0-1 (BF)');
  const [newTime, setNewTime] = useState('20:00');
  const [newPatient, setNewPatient] = useState('John Doe');

  useEffect(() => {
    const unsub = subscribeAlarms(() => {
      setAlarms(getAlarms());
    });
    return () => unsub();
  }, []);

  // Background Clock Interval to trigger matching alarms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      
      const activeAlarms = getAlarms();
      const match = activeAlarms.find(a => a.enabled && a.time === currentHHMM);
      
      if (match && (!triggeredAlarm || triggeredAlarm.id !== match.id)) {
        triggerAlarmEvent(match);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [triggeredAlarm]);

  const triggerAlarmEvent = (alarm) => {
    setTriggeredAlarm(alarm);
    if (!isMuted) {
      startAlarmSound();
    }
  };

  const handleTestAlarm = () => {
    const testAlarm = alarms[0] || {
      id: 'test-1',
      medicineName: 'Paracetamol 500 mg',
      dosage: '1 tablet',
      instruction: '1-0-1 (BF) - Take Before Food',
      timeLabel: 'Right Now',
      patientName: 'Test Patient'
    };
    triggerAlarmEvent(testAlarm);
  };

  const handleAcknowledge = () => {
    stopAlarmSound();
    setTriggeredAlarm(null);
  };

  const handleSnooze = () => {
    stopAlarmSound();
    // Snooze for 5 minutes
    if (triggeredAlarm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const snoozedHHMM = now.toTimeString().slice(0, 5);
      const updated = alarms.map(a => a.id === triggeredAlarm.id ? { ...a, time: snoozedHHMM } : a);
      saveAlarms(updated);
    }
    setTriggeredAlarm(null);
  };

  const formatTimeLabel = (time24) => {
    if (!time24) return '--:--';
    const [hh, mm] = time24.split(':');
    const hourNum = parseInt(hh, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour < 10 ? '0' + formattedHour : formattedHour}:${mm} ${ampm}`;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newMedName || !newTime) return;

    addAlarm({
      medicineName: newMedName,
      dosage: newDosage,
      instruction: newInstruction,
      time: newTime,
      timeLabel: formatTimeLabel(newTime),
      patientName: newPatient
    });

    setNewMedName('');
    setShowAddForm(false);
  };

  const handleStartEdit = (alarm) => {
    setEditingAlarmId(alarm.id);
    setEditForm({
      medicineName: alarm.medicineName || '',
      dosage: alarm.dosage || '1 tablet',
      instruction: alarm.instruction || '1-0-1 (BF)',
      time: alarm.time || '20:00',
      patientName: alarm.patientName || 'John Doe'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingAlarmId) return;

    updateAlarm(editingAlarmId, {
      medicineName: editForm.medicineName,
      dosage: editForm.dosage,
      instruction: editForm.instruction,
      time: editForm.time,
      timeLabel: formatTimeLabel(editForm.time),
      patientName: editForm.patientName
    });

    setEditingAlarmId(null);
  };

  return (
    <>
      {/* 1. ACTIVE TRIGGERED ALARM MODAL (HIGH PRIORITY OVERLAY) */}
      {triggeredAlarm && (
        <div className="alarm-trigger-overlay">
          <div className="alarm-trigger-card">
            <div className="alarm-trigger-header">
              <Bell className="alarm-bell-icon pulse" size={36} />
              <div>
                <h2>Medication Reminder Alert</h2>
                <p>Time for patient: <strong>{triggeredAlarm.patientName || 'Patient'}</strong></p>
              </div>
            </div>

            <div className="alarm-trigger-body">
              <div className="alarm-med-title">{triggeredAlarm.medicineName}</div>
              <div className="alarm-med-detail">
                <span><strong>Dosage:</strong> {triggeredAlarm.dosage}</span>
                <span className="alarm-instruction-tag">{triggeredAlarm.instruction || '1-0-1 (BF)'}</span>
              </div>
              <div className="alarm-time-tag">
                <Clock size={16} /> Scheduled Time: {triggeredAlarm.timeLabel || triggeredAlarm.time}
              </div>
            </div>

            <div className="alarm-trigger-actions">
              <button onClick={handleAcknowledge} className="btn-pill btn-pill-navy" style={{ flex: 1 }}>
                <CheckCircle2 size={18} /> Mark Taken
              </button>
              <button onClick={handleSnooze} className="btn-pill btn-pill-outline" style={{ flex: 1 }}>
                Snooze 5 Min
              </button>
              <button onClick={handleAcknowledge} className="btn-pill btn-pill-white-outline" style={{ background: '#64748b', color: 'white', flex: 0.8 }}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALARM MANAGER MODAL */}
      {isOpen && (
        <div className="alarm-manager-overlay">
          <div className="alarm-manager-card">
            <div className="alarm-manager-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={24} color="var(--primary)" />
                <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>Medication Alarms & Reminders</h3>
              </div>
              <button onClick={onClose} className="alarm-close-btn"><X size={20} /></button>
            </div>

            <div className="alarm-manager-controls">
              <button onClick={handleTestAlarm} className="btn-pill btn-pill-navy" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                <Play size={14} /> Test Alarm Sound
              </button>
              {isDoctorOrAdmin && (
                <button 
                  onClick={() => { setShowAddForm(!showAddForm); setEditingAlarmId(null); }} 
                  className="btn-pill btn-pill-outline" 
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                >
                  <Plus size={14} /> {showAddForm ? 'Cancel' : 'Set New Alarm'}
                </button>
              )}
            </div>

            {/* Add New Alarm Form */}
            {showAddForm && (
              <form onSubmit={handleAddSubmit} className="alarm-add-form">
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', margin: 0 }}>Add Custom Medication Alarm</h4>
                <div className="alarm-form-row">
                  <input 
                    type="text" 
                    placeholder="Medicine Name (e.g. Paracetamol 500mg)" 
                    value={newMedName}
                    onChange={e => setNewMedName(e.target.value)}
                    required
                  />
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    required
                  />
                </div>
                <div className="alarm-form-row">
                  <select 
                    value={newDosage}
                    onChange={e => setNewDosage(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'white' }}
                  >
                    <option value="1 tablet">1 tablet</option>
                    <option value="2 tablets">2 tablets</option>
                    <option value="3 tablets">3 tablets</option>
                    <option value="4 tablets">4 tablets</option>
                    <option value="1 capsule">1 capsule</option>
                    <option value="2 capsules">2 capsules</option>
                    <option value="3 capsules">3 capsules</option>
                    <option value="4 capsules">4 capsules</option>
                    <option value="1 tsp (5 ml)">1 tsp (5 ml)</option>
                    <option value="2 tsp (10 ml)">2 tsp (10 ml)</option>
                    <option value="1 puff / spray">1 puff / spray</option>
                  </select>
                  <select 
                    value={newInstruction} 
                    onChange={e => setNewInstruction(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                  >
                    <option value="1-0-1 (BF)">1-0-1 (BF) - Twice Daily Before Food</option>
                    <option value="1-0-1 (AF)">1-0-1 (AF) - Twice Daily After Food</option>
                    <option value="1-0-0 (BF)">1-0-0 (BF) - Morning Before Food</option>
                    <option value="1-0-0 (AF)">1-0-0 (AF) - Morning After Food</option>
                    <option value="0-0-1 (AF)">0-0-1 (AF) - Night After Food</option>
                    <option value="1-1-1 (AF)">1-1-1 (AF) - Thrice Daily</option>
                  </select>
                </div>
                <button type="submit" className="btn-pill btn-pill-navy" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                  Save Medication Alarm
                </button>
              </form>
            )}

            {/* Active Alarms List */}
            <div className="alarm-list">
              {alarms.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active medication alarms set.
                </div>
              ) : (
                alarms.map(alarm => (
                  <div key={alarm.id} className={`alarm-item ${alarm.enabled ? 'enabled' : 'disabled'}`}>
                    {editingAlarmId === alarm.id ? (
                      /* Inline Edit Form */
                      <form onSubmit={handleSaveEdit} className="alarm-edit-inline-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            value={editForm.medicineName} 
                            onChange={e => setEditForm({ ...editForm, medicineName: e.target.value })}
                            placeholder="Medicine Name"
                            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                            required
                          />
                          <input 
                            type="time" 
                            value={editForm.time} 
                            onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select 
                            value={editForm.dosage || '1 tablet'} 
                            onChange={e => setEditForm({ ...editForm, dosage: e.target.value })}
                            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', backgroundColor: 'white' }}
                          >
                            <option value="1 tablet">1 tablet</option>
                            <option value="2 tablets">2 tablets</option>
                            <option value="3 tablets">3 tablets</option>
                            <option value="4 tablets">4 tablets</option>
                            <option value="1 capsule">1 capsule</option>
                            <option value="2 capsules">2 capsules</option>
                            <option value="3 capsules">3 capsules</option>
                            <option value="4 capsules">4 capsules</option>
                            <option value="1 tsp (5 ml)">1 tsp (5 ml)</option>
                            <option value="2 tsp (10 ml)">2 tsp (10 ml)</option>
                            <option value="1 puff / spray">1 puff / spray</option>
                          </select>
                          <select 
                            value={editForm.instruction} 
                            onChange={e => setEditForm({ ...editForm, instruction: e.target.value })}
                            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                          >
                            <option value="1-0-1 (BF)">1-0-1 (BF) - Twice Daily</option>
                            <option value="1-0-1 (AF)">1-0-1 (AF) - Twice Daily</option>
                            <option value="1-0-0 (BF)">1-0-0 (BF) - Morning</option>
                            <option value="1-0-0 (AF)">1-0-0 (AF) - Morning</option>
                            <option value="0-0-1 (AF)">0-0-1 (AF) - Night</option>
                            <option value="1-1-1 (AF)">1-1-1 (AF) - Thrice Daily</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                          <button type="submit" className="btn-pill btn-pill-navy" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}>
                            <Save size={14} /> Save
                          </button>
                          <button type="button" onClick={() => setEditingAlarmId(null)} className="btn-pill btn-pill-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Normal Display Row */
                      <>
                        <div className="alarm-item-left">
                          <div className="alarm-item-time">{alarm.timeLabel || alarm.time}</div>
                          <div>
                            <div className="alarm-item-name">{alarm.medicineName} ({alarm.dosage})</div>
                            <div className="alarm-item-sub">{alarm.instruction} • {alarm.patientName}</div>
                          </div>
                        </div>

                        <div className="alarm-item-right">
                          <button 
                            type="button" 
                            onClick={() => toggleAlarmEnabled(alarm.id)} 
                            className={`alarm-toggle-btn ${alarm.enabled ? 'active' : ''}`}
                          >
                            {alarm.enabled ? 'ON' : 'OFF'}
                          </button>
                          {isDoctorOrAdmin && (
                            <>
                              <button 
                                type="button" 
                                onClick={() => handleStartEdit(alarm)} 
                                className="alarm-edit-btn"
                                title="Edit Medication Alarm"
                              >
                                <Pencil size={15} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => deleteAlarm(alarm.id)} 
                                className="alarm-delete-btn"
                                title="Delete Alarm"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
