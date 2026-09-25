/**
 * LADIP Mobile API Client
 * Connects Expo app to the FastAPI backend service.
 */
import { Platform } from 'react-native';

// Default host: localhost on iOS simulator/web, 10.0.2.2 on Android emulator.
// In Expo Go on physical device, set this to your computer's local Wi-Fi IP (e.g. http://192.168.1.5:8000)
export let API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  default: 'http://localhost:8000',
});

export function setApiBaseUrl(url) {
  API_BASE_URL = url;
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`);
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error:', err);
    return null;
  }
}

export async function fetchPatients() {
  const res = await fetch(`${API_BASE_URL}/api/v1/patients`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchPatientProfile(patientId) {
  const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchSchedule(patientId) {
  const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/schedule`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchAlerts(patientId, includeSuppressed = false) {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/patients/${patientId}/alerts?include_suppressed=${includeSuppressed}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function checkNewDrug(patientId, drugName, dose = 0, doseUnit = 'mg') {
  const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/check-drug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      drug_name: drugName,
      dose: parseFloat(dose) || 0,
      dose_unit: doseUnit,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function uploadPrescriptionBase64(patientId, base64Image) {
  const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/scan-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: base64Image,
      file_type: 'image',
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
