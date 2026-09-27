/**
 * PatientContext
 * Manages:
 * 1. Supabase Authentication (@supabase/supabase-js) + expo-secure-store token persistence
 * 2. Elderly Patient 1-Tap Biometric Quick-Unlock (expo-local-authentication + expo-secure-store)
 * 3. Daily Medication Dose Time Notifications (expo-notifications + interactive dose due banner)
 * 4. Active patient profile, schedule, FAERS safety alerts, and account switching.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  fetchPatients,
  fetchPatientProfile,
  fetchSchedule,
  fetchAlerts,
} from '../api/client';
import { getPatientPersona } from '../components/PatientAvatar';
import {
  authenticateWithSupabase,
  getSavedPatientSession,
  clearSavedPatientSession,
  configureSupabaseCredentials,
  getSupabaseConfigStatus,
  getSupabaseStatus,
} from '../lib/supabase';
import {
  getBiometricHardwareStatus,
  authenticateWithBiometrics,
} from '../utils/biometricAuth';
import {
  scheduleDailyMedicationNotifications,
  triggerMedicationDueNotificationNow,
  getNextUpcomingDoseSlot,
} from '../utils/medicationNotifications';

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authSessionMeta, setAuthSessionMeta] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [biometricStatus, setBiometricStatus] = useState({
    isAvailable: true,
    biometricLabel: 'Fingerprint / Face ID',
  });
  const [supabaseStatus, setSupabaseStatus] = useState(() => {
    const fn = getSupabaseConfigStatus || getSupabaseStatus;
    return typeof fn === 'function'
      ? fn()
      : {
          isConfigured: false,
          isCloudConfigured: false,
          url: 'https://ladip-clinical-auth.supabase.co',
          mode: 'SUPABASE_SECURESTORE_HYBRID',
        };
  });

  const [patients, setPatients] = useState([]);
  const [currentPatientId, setCurrentPatientId] = useState('PT_BLEED_001'); // Default: Ramesh Sharma
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [takenMeds, setTakenMeds] = useState({});

  // Medication Notification states
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [activeDoseNotification, setActiveDoseNotification] = useState(null);

  // Check saved expo-secure-store session & biometric hardware on boot
  useEffect(() => {
    const initAuthAndBiometrics = async () => {
      try {
        const [storedSession, bioHw] = await Promise.all([
          getSavedPatientSession(),
          getBiometricHardwareStatus(),
        ]);
        if (storedSession && storedSession.patientId) {
          setSavedSession(storedSession);
          setCurrentPatientId(storedSession.patientId);
        }
        if (bioHw) {
          setBiometricStatus(bioHw);
        }
      } catch (err) {
        console.warn('Auth bootstrap check failed:', err);
      }
    };
    initAuthAndBiometrics();
    loadPatients();
  }, []);

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

  // Load active patient data & schedule medication reminders
  const loadCurrentPatient = async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const [profData, schedData, alertData] = await Promise.all([
        fetchPatientProfile(pid),
        fetchSchedule(pid),
        fetchAlerts(pid),
      ]);
      const slots = schedData.slots || {};
      setProfile(profData);
      setSchedule(slots);
      setAlerts(alertData.alerts || []);

      if (remindersEnabled) {
        const schedResult = await scheduleDailyMedicationNotifications(
          slots,
          profData?.name || 'Ramesh Sharma'
        );
        setScheduledReminders(schedResult.slots || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to LADIP server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPatientId) {
      loadCurrentPatient(currentPatientId);
    }
  }, [currentPatientId]);

  /**
   * Primary Login with Supabase Auth + expo-secure-store persistence
   */
  const login = async (username, password) => {
    const res = await authenticateWithSupabase(username, password);
    if (!res.success) {
      return res;
    }

    const persona = res.persona || getPatientPersona(res.patientId);
    setCurrentPatientId(res.patientId);
    setAuthenticatedUser(persona);
    setAuthSessionMeta(res.session);
    setSavedSession(res.session);
    setIsAuthenticated(true);
    setTakenMeds({});
    return {
      success: true,
      patientId: res.patientId,
      name: persona.shortName,
      authProvider: res.authProvider,
    };
  };

  /**
   * 1-Tap Biometric Quick-Unlock (expo-local-authentication + expo-secure-store)
   * Allows an elderly patient like Ramesh Sharma to unlock his schedule with a single fingerprint tap
   * after logging in once with ramesh / ramesh1234.
   */
  const unlockWithBiometrics = async () => {
    const targetSession = savedSession || (await getSavedPatientSession());
    if (!targetSession || !targetSession.patientId) {
      return {
        success: false,
        error:
          'No saved session found in SecureStore. Please sign in once with ramesh / ramesh1234 to enable 1-tap fingerprint unlock.',
      };
    }

    const persona = getPatientPersona(targetSession.patientId, targetSession.shortName);
    const bioRes = await authenticateWithBiometrics(persona.shortName);
    if (!bioRes.success) {
      return {
        success: false,
        error: bioRes.error || 'Biometric authentication was cancelled.',
      };
    }

    setCurrentPatientId(targetSession.patientId);
    setAuthenticatedUser(persona);
    setAuthSessionMeta({
      ...targetSession,
      unlockedVia: bioRes.method || 'expo-local-authentication',
      unlockedAt: new Date().toISOString(),
    });
    setIsAuthenticated(true);
    return {
      success: true,
      patientId: targetSession.patientId,
      name: persona.shortName,
    };
  };

  /**
   * Lock session for Biometric Quick-Unlock (retains encrypted token in expo-secure-store)
   */
  const lockSession = () => {
    setIsAuthenticated(false);
  };

  /**
   * Full Sign Out: Lock session AND optionally keep or clear SecureStore
   * By default, logging out locks the session while keeping SecureStore paired so Ramesh
   * can immediately see and test the 1-tap Fingerprint Unlock on the Login screen.
   */
  const logout = () => {
    setIsAuthenticated(false);
  };

  /**
   * Completely remove the saved SecureStore session from the device
   */
  const forgetDeviceSession = async () => {
    await clearSavedPatientSession();
    setSavedSession(null);
    setAuthenticatedUser(null);
    setAuthSessionMeta(null);
    setIsAuthenticated(false);
  };

  /**
   * Configure custom Supabase URL & Anon Key at runtime
   */
  const updateSupabaseConfig = async (url, anonKey) => {
    const status = await configureSupabaseCredentials(url, anonKey);
    setSupabaseStatus(status);
    return status;
  };

  const toggleMedTaken = (key) => {
    setTakenMeds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Mark all medications in a given schedule slot as taken (used by 1-tap notification action)
   */
  const markSlotDosesTaken = (slotKey) => {
    if (!schedule || !schedule[slotKey]?.items) return;
    const updates = {};
    schedule[slotKey].items.forEach((med, idx) => {
      updates[`${slotKey}_${med.drug_name}_${idx}`] = true;
    });
    setTakenMeds((prev) => ({
      ...prev,
      ...updates,
    }));
    setActiveDoseNotification(null);
  };

  /**
   * Toggle daily push notifications on/off
   */
  const toggleRemindersEnabled = async () => {
    const nextState = !remindersEnabled;
    setRemindersEnabled(nextState);
    if (nextState && schedule) {
      const res = await scheduleDailyMedicationNotifications(
        schedule,
        profile?.name || authenticatedUser?.shortName || 'Ramesh Sharma'
      );
      setScheduledReminders(res.slots || []);
    } else {
      setScheduledReminders([]);
    }
    return nextState;
  };

  /**
   * Trigger an immediate Medication Due notification (System Push + In-App Interactive Alert)
   */
  const sendDoseNotificationNow = async (customSlotKey = null) => {
    const nextSlot =
      customSlotKey && schedule?.[customSlotKey]
        ? {
            slotKey: customSlotKey,
            title: schedule[customSlotKey].title,
            shortTime: customSlotKey === 'morning' ? '8:00 AM' : '1:00 PM',
            items: schedule[customSlotKey].items || [],
            untakenItems: schedule[customSlotKey].items || [],
          }
        : getNextUpcomingDoseSlot(schedule, takenMeds);

    const notifPayload = await triggerMedicationDueNotificationNow(
      nextSlot,
      profile?.name || authenticatedUser?.shortName || 'Ramesh Sharma'
    );
    setActiveDoseNotification(notifPayload);
    return notifPayload;
  };

  const dismissDoseNotification = () => {
    setActiveDoseNotification(null);
  };

  const switchPatient = async (pid) => {
    const persona = getPatientPersona(pid);
    setCurrentPatientId(pid);
    setAuthenticatedUser(persona);
    setTakenMeds({});
    setActiveDoseNotification(null);
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
        authSessionMeta,
        savedSession,
        biometricStatus,
        supabaseStatus,
        login,
        unlockWithBiometrics,
        lockSession,
        logout,
        forgetDeviceSession,
        updateSupabaseConfig,
        patients,
        currentPatientId,
        profile,
        schedule,
        alerts,
        loading,
        error,
        takenMeds,
        toggleMedTaken,
        markSlotDosesTaken,
        remindersEnabled,
        scheduledReminders,
        activeDoseNotification,
        toggleRemindersEnabled,
        sendDoseNotificationNow,
        dismissDoseNotification,
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
