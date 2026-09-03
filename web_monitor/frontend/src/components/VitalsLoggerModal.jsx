import { useState } from 'react';
import { Stethoscope, X, CheckCircle2 } from 'lucide-react';
import { addVitalsLog } from '../utils/dailyVitalsStore';

export default function VitalsLoggerModal({ isOpen, onClose, patientData }) {
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [spO2, setSpO2] = useState('98');
  const [temperature, setTemperature] = useState('98.6');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Feeling Well']);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const symptomOptions = [
    'Feeling Well',
    'No Chest Pain',
    'Mild Fatigue',
    'Chest Tightness',
    'Dizziness',
    'Shortness of Breath',
    'Palpitations'
  ];

  const toggleSymptom = (sym) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms.filter(s => s !== 'Feeling Well'), sym]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    addVitalsLog({
      patientId: patientData?.id || 1,
      patientName: patientData?.name || 'John Doe',
      bpSystolic,
      bpDiastolic,
      spO2,
      temperature,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['Feeling Well'],
      notes
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="alarm-manager-overlay">
      <div className="alarm-manager-card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Stethoscope size={22} color="var(--primary)" />
            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>Log Daily Vitals & Symptoms</h3>
          </div>
          <button onClick={onClose} className="alarm-close-btn"><X size={20} /></button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Daily Vitals Recorded!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your physician can view your updated vital trends.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="care-plan-form">
            <div className="care-plan-form-row">
              <div className="care-plan-field">
                <label>Blood Pressure (Systolic)</label>
                <input 
                  type="number" 
                  placeholder="120" 
                  value={bpSystolic} 
                  onChange={e => setBpSystolic(e.target.value)} 
                  required 
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div className="care-plan-field">
                <label>Blood Pressure (Diastolic)</label>
                <input 
                  type="number" 
                  placeholder="80" 
                  value={bpDiastolic} 
                  onChange={e => setBpDiastolic(e.target.value)} 
                  required 
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            </div>

            <div className="care-plan-form-row">
              <div className="care-plan-field">
                <label>Oxygen Saturation (SpO2 %)</label>
                <input 
                  type="number" 
                  placeholder="98" 
                  value={spO2} 
                  onChange={e => setSpO2(e.target.value)} 
                  required 
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div className="care-plan-field">
                <label>Body Temperature (°F)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="98.6" 
                  value={temperature} 
                  onChange={e => setTemperature(e.target.value)} 
                  required 
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            </div>

            <div className="care-plan-field">
              <label>Symptom Check-in</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {symptomOptions.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: selectedSymptoms.includes(sym) ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: selectedSymptoms.includes(sym) ? 'var(--primary)' : '#f8fafc',
                      color: selectedSymptoms.includes(sym) ? 'white' : 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="care-plan-field">
              <label>Patient Notes / Comments</label>
              <textarea 
                rows={2} 
                placeholder="Any additional notes about how you are feeling today..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" onClick={onClose} className="btn-cancel" style={{ padding: '0.5rem 1.1rem', borderRadius: '8px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-pill btn-pill-navy" style={{ padding: '0.5rem 1.25rem' }}>
                Save Vitals Record
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
