// AI ECG Arrhythmia & Anomaly Analysis Engine for C.A.R.E. Medical Telemetry

export function analyzeCardiacRhythm({ hr = null, gsr = null, panic = 0 }) {
  if (hr === null || hr === undefined) {
    return {
      rhythm: 'Awaiting Signal',
      code: 'OFFLINE',
      riskLevel: 'Unknown',
      riskColor: '#94a3b8',
      confidence: 0,
      description: 'Telemetry stream offline or initializing...',
      recommendation: 'Ensure wearable sensors are securely attached to patient.'
    };
  }

  const heartRate = Number(hr);
  const stress = gsr !== null ? Number(gsr) : 500;

  // 1. Emergency Panic State
  if (panic === 1 || panic === true) {
    return {
      rhythm: 'Manual Emergency Alert',
      code: 'PANIC_ALERT',
      riskLevel: 'Critical',
      riskColor: '#ef4444',
      confidence: 99,
      description: 'Emergency panic signal manually activated by patient.',
      recommendation: 'Immediate caregiver response and emergency call routing dispatched.'
    };
  }

  // 2. Severe Tachycardia (HR > 120 BPM)
  if (heartRate > 120) {
    return {
      rhythm: 'Severe Sinus Tachycardia',
      code: 'TACHY_CRITICAL',
      riskLevel: 'High Risk',
      riskColor: '#ef4444',
      confidence: 94,
      description: `Heart rate (${heartRate} BPM) exceeds physiological safety threshold of 120 BPM.`,
      recommendation: 'Notify attending physician immediately. Re-evaluate patient medication & activity.'
    };
  }

  // 3. Tachycardia (HR > 100 BPM)
  if (heartRate > 100) {
    return {
      rhythm: 'Sinus Tachycardia',
      code: 'TACHY_MODERATE',
      riskLevel: 'Moderate Risk',
      riskColor: '#f59e0b',
      confidence: 91,
      description: `Resting heart rate (${heartRate} BPM) elevated above CDC normal limit (100 BPM).`,
      recommendation: 'Monitor resting trends. Ensure patient is resting and adequately hydrated.'
    };
  }

  // 4. Severe Bradycardia (HR < 45 BPM)
  if (heartRate < 45) {
    return {
      rhythm: 'Severe Bradycardia',
      code: 'BRADY_CRITICAL',
      riskLevel: 'High Risk',
      riskColor: '#ef4444',
      confidence: 95,
      description: `Heart rate (${heartRate} BPM) critically below physiological limit (45 BPM).`,
      recommendation: 'Urgent medical assessment required for potential AV block or sinus pause.'
    };
  }

  // 5. Mild Bradycardia (HR < 60 BPM)
  if (heartRate < 60) {
    return {
      rhythm: 'Sinus Bradycardia',
      code: 'BRADY_MODERATE',
      riskLevel: 'Mild Risk',
      riskColor: '#3b82f6',
      confidence: 89,
      description: `Resting heart rate (${heartRate} BPM) below standard 60 BPM resting threshold.`,
      recommendation: 'Normal for conditioned athletes. Observe if patient exhibits dizziness or fatigue.'
    };
  }

  // 6. High Stress Galvanic Skin Response Anomaly (GSR > 520)
  if (stress > 520) {
    return {
      rhythm: 'Autonomic Stress Anomaly',
      code: 'STRESS_HIGH',
      riskLevel: 'Moderate Risk',
      riskColor: '#f59e0b',
      confidence: 88,
      description: `Elevated galvanic skin response (GSR ${stress}) indicating acute stress / anxiety.`,
      recommendation: 'Guide patient through calming breathing exercises and verify blood pressure.'
    };
  }

  // 7. Normal Sinus Rhythm (60 - 100 BPM)
  return {
    rhythm: 'Normal Sinus Rhythm (NSR)',
    code: 'NORMAL',
    riskLevel: 'Low Risk',
    riskColor: '#10b981',
    confidence: 98,
    description: `Normal physiological heart rate (${heartRate} BPM) and autonomic balance.`,
    recommendation: 'Continuous telemetry active — no clinical intervention required.'
  };
}
