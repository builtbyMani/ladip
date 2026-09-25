/**
 * PatientContext
 * Manages active patient state, patient switching for demo, alerts, and live refresh.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  fetchPatients,
  fetchPatientProfile,
  fetchSchedule,
  fetchAlerts,
} from '../api/client';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [currentPatientId, setCurrentPatientId] = useState('PT_BLEED_001'); // Default: Ramesh Sharma
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [takenMeds, setTakenMeds] = useState({}); // Tracking taken doses

  // Load all patients list
  const loadPatients = async () => {
    try {
      const data = await fetchPatients();
      if (data && data.patients) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.warn('Could not load patient list from API:', err);
    }
  };

  // Load active patient data
  const loadCurrentPatient = async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const [profData, schedData, alertData] = await Promise.all([
        fetchPatientProfile(pid),
        fetchSchedule(pid),
        fetchAlerts(pid),
      ]);
      setProfile(profData);
      setSchedule(schedData.slots || {});
      setAlerts(alertData.alerts || []);
    } catch (err) {
      setError(err.message || 'Failed to connect to LADIP server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (currentPatientId) {
      loadCurrentPatient(currentPatientId);
    }
  }, [currentPatientId]);

  const toggleMedTaken = (key) => {
    setTakenMeds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const switchPatient = (pid) => {
    setCurrentPatientId(pid);
    setTakenMeds({});
  };

  const refreshPatientData = () => {
    if (currentPatientId) {
      loadCurrentPatient(currentPatientId);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        currentPatientId,
        profile,
        schedule,
        alerts,
        loading,
        error,
        takenMeds,
        toggleMedTaken,
        switchPatient,
        refreshPatientData,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  return useContext(PatientContext);
}
