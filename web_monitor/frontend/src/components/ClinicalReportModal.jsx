import { Printer, X, FileText, CheckCircle2, ShieldCheck, Heart, Activity } from 'lucide-react';
import { analyzeCardiacRhythm } from '../utils/aiECGAnalyzer';

export default function ClinicalReportModal({ isOpen, onClose, patientData, currentTelemetry, carePlan, emergencyEvents, dailyVitals }) {
  if (!isOpen) return null;

  const patientName = patientData?.name || 'John Doe';
  const age = patientData?.age || 45;
  const gender = patientData?.gender || 'Male';
  const patientId = patientData?.id || 1;

  const aiAnalysis = analyzeCardiacRhythm(currentTelemetry || { hr: 78, gsr: 490, panic: 0 });
  const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="alarm-manager-overlay report-modal-overlay">
      <div className="alarm-manager-card report-modal-card" style={{ maxWidth: '820px', width: '100%', padding: '0' }}>
        
        {/* MODAL HEADER (Hidden on print) */}
        <div className="report-modal-header no-print" style={{ padding: '1rem 1.5rem', background: 'var(--surface-ice)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', borderRadius: '14px 14px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="var(--primary)" />
            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>Clinical PDF Telemetry Report</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn-pill btn-pill-navy" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="alarm-close-btn"><X size={20} /></button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT BODY */}
        <div className="printable-report-document" style={{ padding: '2rem', background: 'white', color: '#1e293b' }}>
          
          {/* REPORT CLINICAL HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Activity size={26} color="var(--primary)" />
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>C.A.R.E. Telemetry System</h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cardiac & Acute Remote Monitoring Ecosystem • Clinical Telemetry Division</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>CONFIDENTIAL MEDICAL REPORT</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Generated: {reportDate}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Physician: Dr. Sarah (Cardiology)</div>
            </div>
          </div>

          {/* PATIENT DEMOGRAPHICS BAR */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div><span style={{ color: '#64748b' }}>Patient Name:</span> <strong style={{ color: '#0f172a' }}>{patientName}</strong></div>
            <div><span style={{ color: '#64748b' }}>Patient ID:</span> <strong style={{ color: '#0f172a' }}>P-{patientId < 10 ? '00' + patientId : patientId}</strong></div>
            <div><span style={{ color: '#64748b' }}>Age / Gender:</span> <strong style={{ color: '#0f172a' }}>{age} Yrs / {gender}</strong></div>
            <div><span style={{ color: '#64748b' }}>Telemetry Status:</span> <strong style={{ color: '#10b981' }}>Active Stream</strong></div>
          </div>

          {/* AI RHYTHM ANALYSIS ASSESSMENT */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '10px', border: `1px solid ${aiAnalysis.riskColor}`, backgroundColor: `${aiAnalysis.riskColor}10` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Rhythm Diagnosis & Risk Score
              </div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: aiAnalysis.riskColor, color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                {aiAnalysis.riskLevel} ({aiAnalysis.confidence}% Confidence)
              </span>
            </div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: aiAnalysis.riskColor, fontSize: '1.1rem' }}>{aiAnalysis.rhythm}</h3>
            <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', color: '#334155' }}>{aiAnalysis.description}</p>
            <div style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
              <strong>Clinical Action:</strong> {aiAnalysis.recommendation}
            </div>
          </div>

          {/* VITAL TELEMETRY METRICS SUMMARY */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              TELEMETRY VITAL SIGNS SUMMARY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>LIVE RESTING HEART RATE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{currentTelemetry?.hr || 78} <span style={{ fontSize: '0.8rem' }}>BPM</span></div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Normal Range: 60 - 100 BPM</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>STRESS INDEX (GSR)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{currentTelemetry?.gsr || 490} <span style={{ fontSize: '0.8rem' }}>GSR</span></div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Normal Range: &lt; 520 GSR</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>EMERGENCY PANIC LOGS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: emergencyEvents?.length > 0 ? '#ef4444' : '#10b981' }}>{emergencyEvents?.length || 0} <span style={{ fontSize: '0.8rem' }}>Events</span></div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Hardware Panic Monitors</div>
              </div>
            </div>
          </div>

          {/* ACTIVE PRESCRIPTIONS LIST */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              ACTIVE PRESCRIPTIONS & DOSAGE SCHEDULE
            </h3>
            {carePlan?.prescriptions && carePlan.prescriptions.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0' }}>Medicine Name</th>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0' }}>Dosage</th>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0' }}>Frequency</th>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0' }}>Alarm Time</th>
                  </tr>
                </thead>
                <tbody>
                  {carePlan.prescriptions.map(rx => (
                    <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{rx.medicineName || rx.name}</td>
                      <td style={{ padding: '0.6rem' }}>{rx.dosage}</td>
                      <td style={{ padding: '0.6rem' }}>{rx.frequency}</td>
                      <td style={{ padding: '0.6rem' }}>{rx.nextDose || '08:00 PM'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>No active prescriptions recorded.</div>
            )}
          </div>

          {/* DOCTOR CARE NOTES & CLINICAL SIGN-OFF */}
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>ATTENDING PHYSICIAN CARE NOTES</div>
              <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.2rem' }}>
                "{carePlan?.careNotes || 'Continue monitoring regularly and follow the prescribed care plan.'}"
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', paddingLeft: '1.5rem' }}>
              <ShieldCheck size={28} color="var(--primary)" />
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.2rem' }}>VERIFIED REPORT</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Dr. Sarah • MD</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
