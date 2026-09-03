import { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  ActivitySquare, 
  CheckCircle2, 
  AlertCircle, 
  WifiOff, 
  Pill, 
  Utensils, 
  FileText, 
  Clock, 
  Coffee, 
  Sun, 
  Sunset, 
  Moon, 
  Info,
  UserCheck,
  Sparkles,
  Calendar,
  Stethoscope,
  Printer,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCarePlanForPatient, subscribeCarePlan } from '../utils/carePlanStore';
import { getEmergencyEvents, subscribeEmergencyEvents } from '../utils/emergencyEventStore';
import { analyzeCardiacRhythm } from '../utils/aiECGAnalyzer';
import { getVitalsLogs, subscribeVitalsLogs } from '../utils/dailyVitalsStore';
import { getAppointments, subscribeAppointments } from '../utils/appointmentStore';
import ClinicalReportModal from './ClinicalReportModal';
import AppointmentModal from './AppointmentModal';
import VitalsLoggerModal from './VitalsLoggerModal';

// --- REUSABLE CARE COMPONENTS ---
function PrescriptionCard({ rx }) {
  const isActive = rx.status === 'Active';
  const name = rx.medicineName || rx.name || 'Medication';
  return (
    <div className="rx-card">
      <div className="rx-card-header">
        <span className="rx-name">{name}</span>
        <span className={`rx-status-badge ${isActive ? 'active' : 'completed'}`}>
          {rx.status || 'Active'}
        </span>
      </div>
      <div className="rx-details">
        <div className="rx-detail-item">
          <span className="rx-label">Dosage</span>
          <span className="rx-value">{rx.dosage || '--'}</span>
        </div>
        <div className="rx-detail-item">
          <span className="rx-label">Frequency</span>
          <span className="rx-value">{rx.frequency || '--'}</span>
        </div>
        <div className="rx-detail-item">
          <span className="rx-label">Duration</span>
          <span className="rx-value">{rx.duration || '--'}</span>
        </div>
      </div>
      <div className="rx-footer">
        <span className="rx-prescribed-by">Prescribed by Dr. Sarah</span>
        <span className="rx-next-dose">Next: {rx.nextDose || '08:00 PM'}</span>
      </div>
    </div>
  );
}

function DietPlan({ dietPlan = {}, lastUpdated }) {
  const renderMealList = (val, defaultMsg) => {
    let list = [];
    if (Array.isArray(val)) {
      // If array elements themselves contain merged string, split or keep
      list = val.flatMap(item => {
        const str = String(item).trim();
        // If string has camelCase or concatenated words, handle camelCase or comma/newline
        if (str.includes(',')) return str.split(',').map(s => s.trim());
        if (str.includes('\n')) return str.split('\n').map(s => s.trim());
        return str;
      }).filter(Boolean);
    } else if (typeof val === 'string' && val.trim()) {
      if (val.includes(',')) {
        list = val.split(',').map(s => s.trim()).filter(Boolean);
      } else if (val.includes('\n')) {
        list = val.split('\n').map(s => s.trim()).filter(Boolean);
      } else {
        list = [val.trim()];
      }
    }

    if (list.length === 0) {
      return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{defaultMsg}</div>;
    }

    return (
      <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {list.map((item, idx) => (
          <li key={idx} style={{ fontWeight: 500, lineHeight: 1.4 }}>{item}</li>
        ))}
      </ul>
    );
  };

  const snackVal = dietPlan.snacks || dietPlan.eveningSnack;

  return (
    <section className="care-section-card">
      <div className="care-section-header">
        <div className="care-section-title-group">
          <Utensils size={22} color="var(--primary)" />
          <h3>MY DIET & NUTRITION PLAN</h3>
        </div>
        <span className="care-section-badge">
          Updated: {lastUpdated || 'Recently'}
        </span>
      </div>
      <div className="diet-grid">
        <div className="diet-meal-card">
          <div className="diet-meal-header">
            <Coffee size={18} color="var(--primary)" />
            <span>BREAKFAST</span>
          </div>
          {renderMealList(dietPlan.breakfast, 'Oatmeal, fresh berries, green tea')}
        </div>
        <div className="diet-meal-card">
          <div className="diet-meal-header">
            <Sun size={18} color="var(--primary)" />
            <span>LUNCH</span>
          </div>
          {renderMealList(dietPlan.lunch, 'Grilled chicken salad, olive oil')}
        </div>
        <div className="diet-meal-card">
          <div className="diet-meal-header">
            <Sunset size={18} color="var(--primary)" />
            <span>SNACKS</span>
          </div>
          {renderMealList(snackVal, 'Handful of almonds, apple slices')}
        </div>
        <div className="diet-meal-card">
          <div className="diet-meal-header">
            <Moon size={18} color="var(--primary)" />
            <span>DINNER</span>
          </div>
          {renderMealList(dietPlan.dinner, 'Steamed salmon, quinoa, vegetables')}
        </div>
      </div>
    </section>
  );
}

function DoctorInstructions({ instructions = [], careNotes, lastUpdated }) {
  return (
    <section className="care-section-card">
      <div className="care-section-header">
        <div className="care-section-title-group">
          <FileText size={22} color="var(--primary)" />
          <h3>DOCTOR'S INSTRUCTIONS & CARE NOTES</h3>
        </div>
        <span className="care-section-badge">
          Last updated: {lastUpdated || 'Recently'}
        </span>
      </div>
      <div className="instructions-container">
        <div className="instructions-list-wrapper">
          <h4>DOCTOR'S INSTRUCTIONS</h4>
          {instructions.length > 0 ? (
            <ul className="instructions-list">
              {instructions.map((inst, index) => (
                <li key={index} className="instruction-item">
                  <CheckCircle2 size={18} className="instruction-icon" />
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No general instructions listed at this time.
            </p>
          )}
        </div>
        <div className="care-notes-card">
          <div>
            <div className="care-notes-header">
              <Info size={18} color="var(--primary)" />
              <span>CARE NOTES</span>
            </div>
            <p className="care-notes-content">
              {careNotes ? `"${careNotes}"` : 'No additional care notes recorded.'}
            </p>
          </div>
          <div className="care-notes-footer">
            <span>Prescribed by: <strong>Dr. Sarah</strong></span>
            <span>Read-Only Patient View</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmergencyHistory({ events = [] }) {
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  return (
    <section className="care-section-card">
      <div className="care-section-header">
        <div className="care-section-title-group">
          <AlertTriangle size={22} color="var(--alert)" />
          <h3>EMERGENCY HISTORY</h3>
        </div>
        <span className="care-section-badge">
          Read-Only • Patient History Log
        </span>
      </div>
      {sortedEvents.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sortedEvents.map((evt) => {
            const isResolved = evt.status === 'Resolved';
            const isAck = evt.status === 'Acknowledged';
            return (
              <div 
                key={evt.id} 
                style={{
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface-ice)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                        🚨 {evt.eventType}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {evt.displayTime || evt.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      "{evt.description || 'Emergency telemetry alert recorded.'}"
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <div>Heart Rate: <strong>{evt.heartRate || '--'} BPM</strong></div>
                    <div>Stress GSR: <strong>{evt.stressValue || '--'}</strong></div>
                  </div>
                  <span style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    backgroundColor: isResolved ? '#d1fae5' : isAck ? '#fef3c7' : '#fee2e2',
                    color: isResolved ? '#065f46' : isAck ? '#92400e' : '#991b1b'
                  }}>
                    {evt.status || 'Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.75rem 0' }}>
          No emergency events recorded.
        </div>
      )}
    </section>
  );
}

export default function UserDashboard({ 
  auth = null,
  data = { hr: null, gsr: null, panic: 0 }, 
  chartData = [], 
  isConnected = false,
  connectionStatus = 'disconnected',
  hasReceivedData = false
}) {
  const getLoggedPatientId = (authObj) => {
    if (authObj && authObj.patientId) return Number(authObj.patientId);
    const storedId = localStorage.getItem('patientId');
    if (storedId) return Number(storedId);
    const email = (authObj?.email || localStorage.getItem('email') || '').toLowerCase();
    if (email.includes('jane')) return 2;
    if (email.includes('robert')) return 3;
    return 1;
  };

  const loggedPatientId = getLoggedPatientId(auth);
  const [carePlan, setCarePlan] = useState(() => getCarePlanForPatient(loggedPatientId));
  const [emergencyEvents, setEmergencyEvents] = useState(() => getEmergencyEvents(loggedPatientId));
  const [vitalsLogs, setVitalsLogs] = useState(() => getVitalsLogs(loggedPatientId));
  const [appointments, setAppointments] = useState(() => getAppointments(loggedPatientId));

  // Modal States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAptOpen, setIsAptOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);

  const isPanic = data.panic === 1 || data.panic === true;
  const isLive = isConnected && hasReceivedData && data.hr !== null;

  // AI Rhythm Analysis
  const aiAnalysis = analyzeCardiacRhythm(data);

  // Sync care plan and emergency events when logged patient ID changes or store updates
  useEffect(() => {
    setCarePlan(getCarePlanForPatient(loggedPatientId));
    setEmergencyEvents(getEmergencyEvents(loggedPatientId));
    setVitalsLogs(getVitalsLogs(loggedPatientId));
    setAppointments(getAppointments(loggedPatientId));
  }, [loggedPatientId]);

  useEffect(() => {
    const unsubCare = subscribeCarePlan(() => {
      setCarePlan(getCarePlanForPatient(loggedPatientId));
    });
    const unsubEmg = subscribeEmergencyEvents(() => {
      setEmergencyEvents(getEmergencyEvents(loggedPatientId));
    });
    const unsubVit = subscribeVitalsLogs(() => {
      setVitalsLogs(getVitalsLogs(loggedPatientId));
    });
    const unsubApt = subscribeAppointments(() => {
      setAppointments(getAppointments(loggedPatientId));
    });

    return () => {
      unsubCare();
      unsubEmg();
      unsubVit();
      unsubApt();
    };
  }, [loggedPatientId]);

  // Determine current monitoring status
  const getMonitoringStatus = () => {
    if (isPanic) {
      return {
        level: 'emergency',
        title: 'EMERGENCY',
        description: 'Panic signal detected — immediate caregiver attention required',
        icon: <AlertTriangle size={24} className="status-icon emergency" />
      };
    }
    if (!isLive) {
      return {
        level: 'offline',
        title: 'OFFLINE / AWAITING DATA',
        description: 'Waiting for live telemetry stream from C.A.R.E. edge gateway...',
        icon: <WifiOff size={24} className="status-icon offline" />
      };
    }
    // Physiological indicator based on CDC/AHA standards (HR > 100 Tachycardia or HR < 60 Bradycardia)
    if (data.hr > 100 || data.hr < 60) {
      return {
        level: 'attention',
        title: 'ATTENTION',
        description: 'Elevated or irregular heart rate reading detected',
        icon: <AlertCircle size={24} className="status-icon attention" />
      };
    }
    return {
      level: 'stable',
      title: 'STABLE',
      description: 'Continuous monitoring active — telemetry within expected range',
      icon: <CheckCircle2 size={24} className="status-icon stable" />
    };
  };

  const currentStatus = getMonitoringStatus();

  // Helper for GSR qualitative indicator
  const getStressDescriptor = (gsr) => {
    if (gsr === null || !isLive) return 'Waiting for data';
    if (gsr > 520) return 'Elevated stress response';
    if (gsr < 480) return 'Resting / Low stress';
    return 'Moderate stress response';
  };

  return (
    <main className="dashboard user-dashboard">
      {/* MODALS */}
      <ClinicalReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        patientData={{ id: loggedPatientId, name: carePlan.patientName || 'John Doe', age: 45, gender: 'Male' }}
        currentTelemetry={data}
        carePlan={carePlan}
        emergencyEvents={emergencyEvents}
        dailyVitals={vitalsLogs}
      />

      <AppointmentModal 
        isOpen={isAptOpen} 
        onClose={() => setIsAptOpen(false)} 
        patientData={{ id: loggedPatientId, name: carePlan.patientName || 'John Doe' }}
      />

      <VitalsLoggerModal 
        isOpen={isVitalsOpen} 
        onClose={() => setIsVitalsOpen(false)} 
        patientData={{ id: loggedPatientId, name: carePlan.patientName || 'John Doe' }}
      />

      {/* PERSONALIZED PATIENT PROFILE HEADER + FEATURE ACTION TOOLBAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: 'var(--surface-card)',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, color: 'var(--primary)' }}>
          <UserCheck size={20} />
          <span>Patient Account: {carePlan.patientName || `Patient #${loggedPatientId}`} (PAT-00{loggedPatientId})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsVitalsOpen(true)} 
            className="btn-pill btn-pill-outline" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            <Stethoscope size={15} /> Log Daily Vitals
          </button>
          <button 
            onClick={() => setIsAptOpen(true)} 
            className="btn-pill btn-pill-outline" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            <Calendar size={15} /> Book Teleconsultation
          </button>
          <button 
            onClick={() => setIsReportOpen(true)} 
            className="btn-pill btn-pill-navy" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
          >
            <Printer size={15} /> Export Clinical PDF
          </button>
        </div>
      </div>

      {/* FEATURE 1 — AI-POWERED ARRHYTHMIA & ANOMALY DIAGNOSTIC BADGE */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '1.1rem 1.35rem', 
        border: `1px solid ${aiAnalysis.riskColor}`, 
        borderLeft: `5px solid ${aiAnalysis.riskColor}`,
        boxShadow: 'var(--shadow-card)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>
            <Sparkles size={18} color={aiAnalysis.riskColor} />
            <span>AI CARDIAC RHYTHM DIAGNOSIS ENGINE</span>
          </div>
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            backgroundColor: aiAnalysis.riskColor, 
            color: 'white', 
            fontWeight: 700, 
            fontSize: '0.78rem' 
          }}>
            {aiAnalysis.riskLevel} • {aiAnalysis.confidence}% AI Confidence
          </span>
        </div>
        <h3 style={{ margin: '0 0 0.25rem 0', color: aiAnalysis.riskColor, fontSize: '1.2rem', fontWeight: 700 }}>{aiAnalysis.rhythm}</h3>
        <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', color: 'var(--text-main)' }}>{aiAnalysis.description}</p>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <strong>Clinical Recommendation:</strong> {aiAnalysis.recommendation}
        </div>
      </div>

      {/* EMERGENCY / PANIC ALERT BANNER */}
      {isPanic && (
        <section className="panic-banner" role="alert" aria-live="assertive">
          <div className="panic-banner-content">
            <AlertTriangle size={36} className="panic-icon" />
            <div>
              <div className="panic-title">EMERGENCY ALERT</div>
              <div className="panic-subtitle">
                Panic signal detected. Immediate caregiver attention required.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CURRENT HEALTH STATUS */}
      <section className={`health-status-card status-${currentStatus.level}`}>
        <div className="health-status-header">
          <div className="status-title-group">
            {currentStatus.icon}
            <div>
              <span className="health-status-label">CURRENT STATUS</span>
              <h2 className="health-status-value">{currentStatus.title}</h2>
            </div>
          </div>
          <span className="monitoring-tag">Monitoring Status • Non-Diagnostic</span>
        </div>
        <p className="health-status-description">{currentStatus.description}</p>
      </section>

      {/* METRICS GRID: HEART RATE & STRESS INDEX */}
      <section className="stats-grid">
        <div className={`stat-card ${isPanic ? 'card-panic' : ''}`}>
          <div className={`stat-icon ${isPanic ? 'alert' : ''}`}>
            <Heart size={32} className={isLive ? 'pulse-heart' : ''} />
          </div>
          <div className="stat-info">
            <span className="stat-label">HEART RATE</span>
            <div className="stat-value-container">
              {isLive ? (
                <span className="stat-value">
                  {data.hr} <span className="stat-unit">BPM</span>
                </span>
              ) : (
                <span className="stat-value stat-muted">
                  -- <span className="stat-unit">BPM</span>
                </span>
              )}
            </div>
            <span className="stat-subtext">
              {isLive ? 'Live telemetry' : 'Waiting for live data'}
            </span>
          </div>
        </div>

        <div className={`stat-card ${isPanic ? 'card-panic' : ''}`}>
          <div className={`stat-icon ${isPanic ? 'alert' : ''}`}>
            <Activity size={32} />
          </div>
          <div className="stat-info">
            <span className="stat-label">STRESS INDEX</span>
            <div className="stat-value-container">
              {isLive ? (
                <span className="stat-value">{data.gsr}</span>
              ) : (
                <span className="stat-value stat-muted">--</span>
              )}
            </div>
            <span className="stat-subtext">
              {getStressDescriptor(data.gsr)}
            </span>
          </div>
        </div>
      </section>

      {/* LIVE ECG WAVEFORM */}
      <section className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <ActivitySquare 
              size={22} 
              color={isPanic ? '#E11D48' : '#0EA5E9'} 
            />
            <span>Live ECG Waveform</span>
          </div>
          <div className="chart-badge">
            <div className={`status-dot ${isLive ? 'connected' : 'disconnected'}`}></div>
            <span>{isLive ? 'Real-time Signal' : 'Awaiting Signal'}</span>
          </div>
        </div>

        <div className="chart-wrapper">
          {chartData.length > 0 && isLive ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="time" hide={true} />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke="var(--text-muted)" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="ecg" 
                  stroke={isPanic ? '#E11D48' : '#0EA5E9'} 
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder">
              <ActivitySquare size={48} className="placeholder-icon" />
              <p className="placeholder-title">Waiting for live ECG data...</p>
              <span className="placeholder-hint">
                Ensure C.A.R.E. wearable and gateway are powered and transmitting.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* FEATURE 3 — DAILY VITALS & SYMPTOM LOG HISTORY */}
      <section className="care-section-card">
        <div className="care-section-header">
          <div className="care-section-title-group">
            <Stethoscope size={22} color="var(--primary)" />
            <h3>DAILY VITALS & SYMPTOMS LOG HISTORY</h3>
          </div>
          <button onClick={() => setIsVitalsOpen(true)} className="btn-pill btn-pill-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
            <Plus size={14} /> Log Today's Vitals
          </button>
        </div>
        {vitalsLogs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {vitalsLogs.map(log => (
              <div key={log.id} style={{ backgroundColor: 'var(--surface-ice)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>📅 {log.date} • {log.time}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.bpDisplay}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.4rem' }}>
                  <span>SpO2: <strong>{log.spO2}%</strong></span>
                  <span>Temp: <strong>{log.temperature}°F</strong></span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {log.symptoms?.map((s, i) => (
                    <span key={i} style={{ fontSize: '0.72rem', backgroundColor: 'white', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No daily vitals logged yet. Click "+ Log Today's Vitals" to record your blood pressure and symptoms.
          </div>
        )}
      </section>

      {/* FEATURE 4 — DOCTOR TELECONSULTATION APPOINTMENTS */}
      <section className="care-section-card">
        <div className="care-section-header">
          <div className="care-section-title-group">
            <Calendar size={22} color="var(--primary)" />
            <h3>MY DOCTOR TELECONSULTATIONS</h3>
          </div>
          <button onClick={() => setIsAptOpen(true)} className="btn-pill btn-pill-navy" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
            <Plus size={14} /> Book Consultation
          </button>
        </div>
        {appointments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {appointments.map(apt => (
              <div key={apt.id} style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    <span>{apt.mode === 'Video Call' ? '📹 Video Call' : '🏥 In-Person'} with {apt.doctorName}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• {apt.displayDate || apt.date} at {apt.timeSlot}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    Reason: {apt.reason}
                  </div>
                </div>
                <span style={{ padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: apt.status === 'Confirmed' ? '#d1fae5' : '#fef3c7', color: apt.status === 'Confirmed' ? '#065f46' : '#92400e' }}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No upcoming teleconsultations. Click "+ Book Consultation" to schedule a slot with Dr. Sarah.
          </div>
        )}
      </section>

      {/* EMERGENCY HISTORY */}
      <EmergencyHistory events={emergencyEvents} />

      {/* MY PRESCRIPTIONS */}
      <section className="care-section-card">
        <div className="care-section-header">
          <div className="care-section-title-group">
            <Pill size={22} color="var(--primary)" />
            <h3>MY PRESCRIPTIONS</h3>
          </div>
          <span className="care-section-badge">
            Read-Only • Prescribed by Dr. Sarah
          </span>
        </div>
        {carePlan.prescriptions && carePlan.prescriptions.length > 0 ? (
          <div className="prescriptions-grid">
            {carePlan.prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No active prescriptions on file.
          </p>
        )}
      </section>

      {/* MY DIET PLAN */}
      <DietPlan dietPlan={carePlan.dietPlan} lastUpdated={carePlan.lastUpdated} />

      {/* DOCTOR'S INSTRUCTIONS & CARE NOTES */}
      <DoctorInstructions 
        instructions={carePlan.doctorInstructions} 
        careNotes={carePlan.careNotes} 
        lastUpdated={carePlan.lastUpdated} 
      />
    </main>
  );
}
