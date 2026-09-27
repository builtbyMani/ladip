/**
 * PatientContext
 * Manages patient authentication (e.g., ramesh / ramesh1234), active patient state,
 * patient switching, alerts, and live refresh.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  fetchPatients,
  fetchPatientProfile,
  fetchSchedule,
  fetchAlerts,
} from '../api/client';
import { PATIENT_PERSONA_META, getPatientPersona } from '../components/PatientAvatar';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [currentPatientId, setCurrentPatientId] = useState('PT_BLEED_001'); // Default: Ramesh Sharma
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [takenMeds, setTakenMeds] = useState({});

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

  const login = (username, password) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        error: 'Please enter both username and password (e.g., ramesh / ramesh1234).',
      };
    }

    const matchedPersona = Object.values(PATIENT_PERSONA_META).find(
      (p) => p.username.toLowerCase() === cleanUser && p.password === cleanPass
    );

    if (!matchedPersona) {
      return {
        success: false,
        error:
          'Invalid credentials. For Ramesh Sharma, use username "ramesh" and password "ramesh1234".',
      };
    }

    setCurrentPatientId(matchedPersona.patientId);
    setAuthenticatedUser(matchedPersona);
    setIsAuthenticated(true);
    setTakenMeds({});
    return {
      success: true,
      patientId: matchedPersona.patientId,
      name: matchedPersona.shortName,
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthenticatedUser(null);
  };

  const toggleMedTaken = (key) => {
    setTakenMeds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const switchPatient = (pid) => {
    setCurrentPatientId(pid);
    setAuthenticatedUser(getPatientPersona(pid));
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
        isAuthenticated,
        authenticatedUser,
        login,
        logout,
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
