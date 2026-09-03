import { useState } from 'react';
import { Calendar, Clock, Video, UserCheck, X, CheckCircle2 } from 'lucide-react';
import { addAppointment } from '../utils/appointmentStore';

export default function AppointmentModal({ isOpen, onClose, patientData }) {
  const [date, setDate] = useState('2026-09-05');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [mode, setMode] = useState('Video Call');
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    addAppointment({
      patientId: patientData?.id || 1,
      patientName: patientData?.name || 'John Doe',
      date,
      timeSlot,
      mode,
      reason: reason || 'Routine Clinical Review & Telemetry Follow-up'
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
            <Calendar size={22} color="var(--primary)" />
            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>Book Doctor Teleconsultation</h3>
          </div>
          <button onClick={onClose} className="alarm-close-btn"><X size={20} /></button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Appointment Requested!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Dr. Sarah will review and confirm your consultation slot.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="care-plan-form">
            <div className="care-plan-field">
              <label>Select Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
                style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: 'white' }}
              />
            </div>

            <div className="care-plan-form-row">
              <div className="care-plan-field">
                <label>Time Slot</label>
                <select 
                  value={timeSlot} 
                  onChange={e => setTimeSlot(e.target.value)}
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:30 PM">05:30 PM</option>
                </select>
              </div>

              <div className="care-plan-field">
                <label>Consultation Mode</label>
                <select 
                  value={mode} 
                  onChange={e => setMode(e.target.value)}
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="Video Call">📹 Video Teleconsultation</option>
                  <option value="In-Person Visit">🏥 In-Person Hospital Visit</option>
                </select>
              </div>
            </div>

            <div className="care-plan-field">
              <label>Reason for Consultation / Medical Notes</label>
              <textarea 
                rows={3} 
                placeholder="Describe any symptoms, medication questions, or general follow-up needs..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" onClick={onClose} className="btn-cancel" style={{ padding: '0.5rem 1.1rem', borderRadius: '8px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-pill btn-pill-navy" style={{ padding: '0.5rem 1.25rem' }}>
                Confirm Appointment Slot
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
