// Centralized Care Plan Store & Persistence for C.A.R.E. Web Monitor

const STORAGE_KEY = 'care_plans_store_v1';

const DEFAULT_CARE_PLANS = {
  // Patient 1: John Doe
  1: {
    patientId: 1,
    patientName: "John Doe",
    prescriptions: [
      {
        id: "rx-101",
        medicineName: "Paracetamol 500 mg",
        dosage: "1 tablet",
        frequency: "Twice a day",
        timing: "After breakfast & dinner",
        duration: "5 days",
        status: "Active",
        prescribedBy: "Dr. Sarah",
        prescribedDate: "02 Sep 2026",
        nextDose: "08:00 PM"
      },
      {
        id: "rx-102",
        medicineName: "Amoxicillin 250 mg",
        dosage: "1 capsule",
        frequency: "Three times a day",
        timing: "After meals",
        duration: "7 days",
        status: "Active",
        prescribedBy: "Dr. Sarah",
        prescribedDate: "01 Sep 2026",
        nextDose: "09:00 PM"
      },
      {
        id: "rx-103",
        medicineName: "Atorvastatin 10 mg",
        dosage: "1 tablet",
        frequency: "Once daily",
        timing: "At bedtime",
        duration: "30 days",
        status: "Completed",
        prescribedBy: "Dr. Sarah",
        prescribedDate: "01 Aug 2026",
        nextDose: "N/A"
      }
    ],
    dietPlan: {
      breakfast: ["Oatmeal", "Banana", "Low-fat milk"],
      lunch: ["Brown rice", "Dal", "Vegetable curry", "Salad"],
      eveningSnack: ["Fresh fruit", "Unsweetened beverage"],
      dinner: ["Chapati", "Vegetable curry", "Curd"]
    },
    doctorInstructions: [
      "Take prescribed medication according to the given schedule.",
      "Follow the recommended daily routine.",
      "Continue regular health monitoring.",
      "Maintain adequate rest and hydration.",
      "Contact your doctor/caregiver if you have concerns."
    ],
    careNotes: "Continue monitoring regularly and follow the prescribed care plan.",
    lastUpdated: "02 Sep 2026, 10:30 AM"
  },

  // Patient 2: Jane Smith
  2: {
    patientId: 2,
    patientName: "Jane Smith",
    prescriptions: [
      {
        id: "rx-201",
        medicineName: "Metformin 500 mg",
        dosage: "1 tablet",
        frequency: "Once a day",
        timing: "With breakfast",
        duration: "30 days",
        status: "Active",
        prescribedBy: "Dr. Sarah",
        prescribedDate: "28 Aug 2026",
        nextDose: "08:00 AM"
      }
    ],
    dietPlan: {
      breakfast: ["Whole wheat toast", "Boiled egg", "Green tea"],
      lunch: ["Quinoa bowl", "Grilled chicken/tofu", "Steamed broccoli"],
      eveningSnack: ["Almonds & Walnuts", "Water"],
      dinner: ["Vegetable soup", "Grilled fish/paneer", "Salad"]
    },
    doctorInstructions: [
      "Check blood sugar levels before breakfast.",
      "Walk for 30 minutes daily after meals.",
      "Avoid sugary beverages and refined carbohydrates."
    ],
    careNotes: "Glycemic response is improving. Maintain current dietary balance.",
    lastUpdated: "01 Sep 2026, 04:15 PM"
  },

  // Patient 3: Robert Johnson
  3: {
    patientId: 3,
    patientName: "Robert Johnson",
    prescriptions: [
      {
        id: "rx-301",
        medicineName: "Lisinopril 10 mg",
        dosage: "1 tablet",
        frequency: "Once daily",
        timing: "In the morning",
        duration: "14 days",
        status: "Active",
        prescribedBy: "Dr. Sarah",
        prescribedDate: "30 Aug 2026",
        nextDose: "09:00 AM"
      }
    ],
    dietPlan: {
      breakfast: ["Cornflakes with low-fat milk", "Apple slices"],
      lunch: ["Steamed rice", "Lentil soup", "Mixed greens"],
      eveningSnack: ["Roasted chana", "Herbal tea"],
      dinner: ["Multigrain Roti", "Mixed veg curry", "Warm milk"]
    },
    doctorInstructions: [
      "Monitor blood pressure every morning and evening.",
      "Limit sodium intake to under 2000mg per day.",
      "Report any unexpected dizziness or headaches."
    ],
    careNotes: "Observation phase. Keep sodium low and monitor telemetry closely.",
    lastUpdated: "31 Aug 2026, 11:00 AM"
  }
};

const listeners = new Set();

function formatCurrentTimestamp() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
}

export function getCarePlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse care plans from localStorage", e);
  }
  // Initialize with default
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARE_PLANS));
  return DEFAULT_CARE_PLANS;
}

export function getCarePlanForPatient(patientId) {
  const plans = getCarePlans();
  const numericId = Number(patientId);
  
  if (plans[numericId]) {
    return plans[numericId];
  }
  if (plans[patientId]) {
    return plans[patientId];
  }
  
  // Return template default for new patient
  return {
    patientId: patientId,
    prescriptions: [],
    dietPlan: {
      breakfast: [],
      lunch: [],
      eveningSnack: [],
      dinner: []
    },
    doctorInstructions: [],
    careNotes: "",
    lastUpdated: formatCurrentTimestamp()
  };
}

export function saveCarePlanForPatient(patientId, updatedPlan) {
  const plans = getCarePlans();
  const numericId = Number(patientId);
  const key = plans[numericId] ? numericId : patientId;
  
  const finalPlan = {
    ...updatedPlan,
    patientId: key,
    lastUpdated: formatCurrentTimestamp()
  };
  
  plans[key] = finalPlan;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error("Failed to save care plan to localStorage", e);
  }
  
  notifyListeners();
  return finalPlan;
}

export function subscribeCarePlan(listener) {
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
  window.dispatchEvent(new CustomEvent('care-plan-changed'));
}

// Window storage listener for multi-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      notifyListeners();
    }
  });
}
