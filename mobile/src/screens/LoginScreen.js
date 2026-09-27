/**
 * LADIP Mobile Patient Portal Login Screen
 * Implements:
 * 1. Supabase Authentication (@supabase/supabase-js) with ramesh / ramesh1234 (ramesh@ladip.health)
 * 2. Elderly Patient 1-Tap Biometric Quick-Unlock (expo-secure-store + expo-local-authentication)
 *    So Ramesh logs in with ramesh / ramesh1234 once, and every time after that can unlock his
 *    medicine schedule with a single fingerprint tap.
 * 3. Distinct custom avatar icons for all 5 Indian patient cohort accounts.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import PatientAvatar, { PATIENT_PERSONA_META, getPatientPersona } from '../components/PatientAvatar';
import MotionView from '../components/MotionView';

export default function LoginScreen() {
  const {
    login,
    unlockWithBiometrics,
    savedSession,
    biometricStatus,
    supabaseStatus,
    forgetDeviceSession,
    updateSupabaseConfig,
  } = usePatient();

  const [username, setUsername] = useState('ramesh');
  const [password, setPassword] = useState('ramesh1234');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bioUnlocking, setBioUnlocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Optional Supabase Project URL & Anon Key drawer
  const [showSupaConfig, setShowSupaConfig] = useState(false);
  const [customSupaUrl, setCustomSupaUrl] = useState(supabaseStatus?.url || '');
  const [customSupaKey, setCustomSupaKey] = useState('');
  const [configMsg, setConfigMsg] = useState(null);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricQuickUnlock = async () => {
    setErrorMsg(null);
    setBioUnlocking(true);
    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } finally {
      setBioUnlocking(false);
    }
  };

  const handleQuickSelectPersona = async (persona, autoLogin = false) => {
    setErrorMsg(null);
    setUsername(persona.username);
    setPassword(persona.password);
    if (autoLogin) {
      setSubmitting(true);
      try {
        await login(persona.username, persona.password);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSaveSupabaseConfig = async () => {
    const status = await updateSupabaseConfig(customSupaUrl, customSupaKey);
    setConfigMsg(
      status.isCloudConfigured
        ? 'Connected to live Supabase Cloud Auth project.'
        : 'Using Supabase Hybrid Cohort Auth + Expo SecureStore.'
    );
  };

  const cohortPersonas = Object.values(PATIENT_PERSONA_META);
  const savedPersona = savedSession
    ? getPatientPersona(savedSession.patientId, savedSession.shortName)
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionView delay={10}>
          {/* Brand Logo Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandTopRow}>
              <View style={styles.logoRow}>
                <Text style={styles.logoText}>LADIP</Text>
                <View style={styles.logoDot}>
                  <Text style={styles.logoDotCheck}>✓</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.supaBadge}
                onPress={() => setShowSupaConfig(!showSupaConfig)}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={12} color="#1B7A3D" />
                <Text style={styles.supaBadgeText}>
                  {supabaseStatus?.isCloudConfigured
                    ? 'SUPABASE CLOUD AUTH'
                    : 'SUPABASE + SECURESTORE'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.brandSub}>
              LONGITUDINAL ADVERSE DRUG INTERACTION PREDICTOR
            </Text>
          </View>

          {/* Collapsible Supabase Project Settings Drawer */}
          {showSupaConfig && (
            <View style={styles.supaConfigCard}>
              <Text style={styles.supaConfigEyebrow}>SUPABASE AUTHENTICATION ENGINE</Text>
              <Text style={styles.supaConfigDesc}>
                Sessions are encrypted on-device with <Text style={styles.monoBold}>expo-secure-store</Text>{' '}
                and paired with <Text style={styles.monoBold}>@supabase/supabase-js</Text>. Optionally enter
                your Supabase Project URL & Anon Key below:
              </Text>
              <TextInput
                style={styles.supaInput}
                placeholder="https://your-project.supabase.co"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={customSupaUrl}
                onChangeText={setCustomSupaUrl}
              />
              <TextInput
                style={styles.supaInput}
                placeholder="Supabase Anon Public Key (eyJhbGci...)"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={customSupaKey}
                onChangeText={setCustomSupaKey}
              />
              <TouchableOpacity
                style={styles.supaSaveBtn}
                onPress={handleSaveSupabaseConfig}
              >
                <Text style={styles.supaSaveBtnText}>Save Supabase Auth Config</Text>
              </TouchableOpacity>
              {configMsg && <Text style={styles.supaSavedNotice}>{configMsg}</Text>}
            </View>
          )}

          {/* Editorial Title */}
          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>PATIENT SAFETY PORTAL</Text>
            <Text style={styles.heroTitle}>Sign in to your medication timeline</Text>
            <Text style={styles.heroSubtitle}>
              Access your personalised daily regimen, scheduled medication reminders, and optical
              medicine scanner.
            </Text>
          </View>
        </MotionView>

        {/* ELDERLY PATIENT 1-TAP BIOMETRIC QUICK-UNLOCK CARD (expo-secure-store + expo-local-authentication) */}
        {savedPersona && (
          <MotionView delay={25}>
            <View style={styles.biometricCard}>
              <View style={styles.biometricHeaderRow}>
                <View style={styles.biometricPill}>
                  <Ionicons name="finger-print" size={13} color="#FFFFFF" />
                  <Text style={styles.biometricPillText}>
                    1-TAP ELDERLY BIOMETRIC UNLOCK READY
                  </Text>
                </View>
                <TouchableOpacity onPress={forgetDeviceSession}>
                  <Text style={styles.forgetLinkText}>Reset Token</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.biometricProfileRow}>
                <PatientAvatar patientId={savedPersona.patientId} size="lg" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricWelcome}>
                    Welcome back, {savedPersona.shortName}
                  </Text>
                  <Text style={styles.biometricMeta}>
                    {savedSession.email || `${savedPersona.username}@ladip.health`} • Saved in{' '}
                    <Text style={styles.monoBold}>expo-secure-store</Text>
                  </Text>
                  <Text style={styles.biometricSubnote}>
                    No need to type your password again — tap once below to unlock your medicine
                    schedule.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.biometricUnlockBtn}
                onPress={handleBiometricQuickUnlock}
                disabled={bioUnlocking}
                activeOpacity={0.85}
              >
                {bioUnlocking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="finger-print" size={22} color="#FFFFFF" />
                    <Text style={styles.biometricUnlockBtnText}>
                      Unlock with {biometricStatus?.biometricLabel || 'Fingerprint / Face ID'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </MotionView>
        )}

        {/* Password / Supabase Login Form Card */}
        <MotionView delay={40}>
          <View style={styles.loginCard}>
            {/* Active Selected Preview Banner */}
            {(() => {
              const cleanUser = (username || '').trim().toLowerCase().split('@')[0];
              const matched =
                cohortPersonas.find((p) => p.username === cleanUser) ||
                PATIENT_PERSONA_META.PT_BLEED_001;
              return (
                <View style={styles.selectedPreviewStrip}>
                  <PatientAvatar patientId={matched.patientId} size="md" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewEyebrow}>
                      SUPABASE AUTH + EXPO-SECURE-STORE
                    </Text>
                    <Text style={styles.previewName}>{matched.shortName}</Text>
                    <Text style={styles.previewMeta}>
                      {matched.ageSex} • {matched.clinicalTag}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>USERNAME OR SUPABASE EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={16} color="#6B6B6B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="ramesh or ramesh@ladip.health"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#6B6B6B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="ramesh1234"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg(null);
                  }}
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#6B6B6B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleSignIn}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signInBtnText}>
                    Sign In & Pair Fingerprint Unlock
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.proTipBox}>
              <Ionicons name="finger-print-outline" size={16} color="#1B7A3D" />
              <Text style={styles.proTipText}>
                <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>
                  Elderly Biometric Pairing:{' '}
                </Text>
                Sign in once with <Text style={styles.monoBold}>ramesh</Text> /{' '}
                <Text style={styles.monoBold}>ramesh1234</Text>. Your Supabase session is saved in{' '}
                <Text style={styles.monoBold}>expo-secure-store</Text> so every time after that you
                can unlock your schedule with a single fingerprint tap via{' '}
                <Text style={styles.monoBold}>expo-local-authentication</Text>.
              </Text>
            </View>
          </View>
        </MotionView>

        {/* Patient Cohort Quick Selector with Distinct Icons */}
        <MotionView delay={65}>
          <View style={styles.cohortSection}>
            <Text style={styles.cohortEyebrow}>PATIENT COHORT ACCOUNTS</Text>
            <Text style={styles.cohortSub}>
              Tap any patient profile below to auto-fill credentials or sign in:
            </Text>

            <View style={styles.cohortList}>
              {cohortPersonas.map((persona) => {
                const isCurrent =
                  (username || '').trim().toLowerCase().split('@')[0] === persona.username;
                return (
                  <TouchableOpacity
                    key={persona.patientId}
                    style={[
                      styles.cohortCard,
                      isCurrent && styles.cohortCardActive,
                    ]}
                    onPress={() => handleQuickSelectPersona(persona, false)}
                    activeOpacity={0.8}
                  >
                    <PatientAvatar patientId={persona.patientId} size="sm" />
                    <View style={{ flex: 1 }}>
                      <View style={styles.cohortTopRow}>
                        <Text style={styles.cohortName}>{persona.shortName}</Text>
                        <Text style={styles.cohortCredPill}>
                          {persona.username} / {persona.password}
                        </Text>
                      </View>
                      <Text style={styles.cohortTag} numberOfLines={1}>
                        {persona.clinicalTag} • {persona.regimenShort}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.instantLoginPill}
                      onPress={() => handleQuickSelectPersona(persona, true)}
                    >
                      <Text style={styles.instantLoginText}>Login</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </MotionView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 44,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  brandHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingBottom: 14,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.6,
  },
  logoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1B7A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDotCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  supaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  supaBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.6,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 1,
    marginTop: 4,
  },
  supaConfigCard: {
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 14,
    marginBottom: 16,
  },
  supaConfigEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  supaConfigDesc: {
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 16,
    marginBottom: 10,
  },
  supaInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  supaSaveBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 9,
    borderRadius: 9999,
    alignItems: 'center',
  },
  supaSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  supaSavedNotice: {
    fontSize: 11,
    color: '#1B7A3D',
    fontWeight: '600',
    marginTop: 8,
  },
  heroBlock: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 32,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
  },
  biometricCard: {
    backgroundColor: '#F5F5F0',
    borderWidth: 1.5,
    borderColor: '#1B7A3D',
    padding: 16,
    marginBottom: 18,
  },
  biometricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  biometricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1B7A3D',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  biometricPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  forgetLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B6B6B',
    textDecorationLine: 'underline',
  },
  biometricProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  biometricWelcome: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  biometricMeta: {
    fontSize: 11,
    color: '#1B7A3D',
    fontWeight: '600',
    marginTop: 2,
  },
  biometricSubnote: {
    fontSize: 12,
    color: '#6B6B6B',
    lineHeight: 17,
    marginTop: 4,
  },
  biometricUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1B7A3D',
    paddingVertical: 15,
    borderRadius: 9999,
  },
  biometricUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
    marginBottom: 22,
  },
  selectedPreviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 12,
    marginBottom: 16,
  },
  previewEyebrow: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.8,
  },
  previewName: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  previewMeta: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: 4,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 10,
    marginTop: 14,
  },
  proTipText: {
    flex: 1,
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 16,
  },
  monoBold: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cohortSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingTop: 16,
  },
  cohortEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  cohortSub: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  cohortList: {
    gap: 8,
  },
  cohortCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 10,
  },
  cohortCardActive: {
    backgroundColor: '#F5F5F0',
    borderColor: '#1A1A1A',
  },
  cohortTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  cohortName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cohortCredPill: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: '#6B6B6B',
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cohortTag: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  instantLoginPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  instantLoginText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
