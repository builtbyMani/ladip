/**
 * LADIP Mobile Patient Portal Login Screen — Website-Matched UI
 * Implements:
 * 1. Supabase Authentication (@supabase/supabase-js) + expo-secure-store token encryption
 * 2. Elderly Patient 1-Tap Biometric Quick-Unlock (expo-secure-store + expo-local-authentication)
 * 3. Illustrated Indian Patient Cohort Portraits & HORMN-style Capsule Logo Mark (`[ (H) ] L A D I P`)
 * 4. Zero password exposure in UI (no pre-filled passwords, no password hints in cards or errors).
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
import PatientAvatar, {
  HormnLogoMark,
  PATIENT_PERSONA_META,
  getPatientPersona,
} from '../components/PatientAvatar';
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
  const [password, setPassword] = useState('');
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

  const handleSelectPersona = (persona) => {
    setErrorMsg(null);
    setUsername(persona.username);
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
      {/* Top Slate Value Bar matching Website */}
      <View style={styles.slateTopBar}>
        <Text style={styles.slateTitle}>Why LADIP?</Text>
        <Text style={styles.slateRight}>180K+ FDA FAERS • 5 Indian Cohorts</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionView delay={10}>
          {/* Brand Logo Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandTopRow}>
              <HormnLogoMark size="md" />
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
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={customSupaUrl}
                onChangeText={setCustomSupaUrl}
              />
              <TextInput
                style={styles.supaInput}
                placeholder="Supabase Anon Public Key (eyJhbGci...)"
                placeholderTextColor="#94A3B8"
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
            <View style={styles.eyebrowPill}>
              <Ionicons name="sparkles" size={11} color="#3B6EA8" />
              <Text style={styles.eyebrowPillText}>PATIENT SAFETY PORTAL</Text>
            </View>
            <Text style={styles.heroTitle}>Sign in to your medication timeline</Text>
            <Text style={styles.heroSubtitle}>
              Access your personalised daily regimen, multi-drug FAERS safety alerts, and optical
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
                  <Ionicons name="finger-print" size={12} color="#FFFFFF" />
                  <Text style={styles.biometricPillText}>
                    1-TAP ELDERLY BIOMETRIC UNLOCK
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
                    {savedSession.email || `${savedPersona.username}@ladip.health`} • Paired with{' '}
                    <Text style={styles.monoBold}>SecureStore</Text>
                  </Text>
                  <Text style={styles.biometricSubnote}>
                    Tap once below to unlock your medicine schedule with your fingerprint.
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
                    <Ionicons name="finger-print" size={20} color="#FFFFFF" />
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
                cohortPersonas.find(
                  (p) =>
                    p.username === cleanUser ||
                    p.shortName.toLowerCase().startsWith(cleanUser)
                ) || PATIENT_PERSONA_META.PT_BLEED_001;
              return (
                <View
                  style={[
                    styles.selectedPreviewStrip,
                    { backgroundColor: matched.cardSoftBg || '#EAF2FA' },
                  ]}
                >
                  <PatientAvatar patientId={matched.patientId} size="md" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewEyebrow}>
                      SUPABASE AUTHENTICATION + BIOMETRIC PAIRING
                    </Text>
                    <Text style={styles.previewName}>{matched.shortName}</Text>
                    <Text style={styles.previewMeta}>
                      {matched.clinicalTag} • {matched.regimenShort}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>USERNAME OR SUPABASE EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="ramesh or ramesh@ladip.health"
                  placeholderTextColor="#94A3B8"
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
                <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
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
                    color="#64748B"
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
                  <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
                  <Text style={styles.signInBtnText}>
                    Sign In with Supabase & Pair Fingerprint
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </MotionView>

        {/* Patient Cohort Account Selector with Illustrated Icons (No Passwords Shown) */}
        <MotionView delay={65}>
          <View style={styles.cohortSection}>
            <Text style={styles.cohortEyebrow}>SELECT PATIENT COHORT ACCOUNT</Text>
            <Text style={styles.cohortSub}>
              Tap a patient profile below to select their account:
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
                    onPress={() => handleSelectPersona(persona)}
                    activeOpacity={0.85}
                  >
                    <PatientAvatar patientId={persona.patientId} size="md" />
                    <View style={{ flex: 1 }}>
                      <View style={styles.cohortTopRow}>
                        <Text
                          style={[
                            styles.cohortName,
                            isCurrent && { color: '#FFFFFF' },
                          ]}
                        >
                          {persona.shortName}
                        </Text>
                        <View
                          style={[
                            styles.cohortUserBadge,
                            isCurrent && { backgroundColor: 'rgba(255,255,255,0.16)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cohortUserBadgeText,
                              isCurrent && { color: '#FFFFFF' },
                            ]}
                          >
                            @{persona.username}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.cohortTag,
                          isCurrent && { color: '#CBD5E1' },
                        ]}
                        numberOfLines={1}
                      >
                        {persona.clinicalTag}
                      </Text>
                      <Text
                        style={[
                          styles.cohortRegimen,
                          isCurrent && { color: '#7DD3FC' },
                        ]}
                        numberOfLines={1}
                      >
                        {persona.regimenShort}
                      </Text>
                    </View>
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
  slateTopBar: {
    backgroundColor: '#87909A',
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slateTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  slateRight: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10.5,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 44,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  brandHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  supaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(27, 122, 61, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  supaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.6,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 6,
  },
  supaConfigCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  supaConfigEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  supaConfigDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  supaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
    marginBottom: 8,
  },
  supaSaveBtn: {
    backgroundColor: '#111827',
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
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  eyebrowPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#3B6EA8',
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 31,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  biometricCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(27, 122, 61, 0.38)',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  biometricPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  forgetLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  biometricProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  biometricWelcome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  biometricMeta: {
    fontSize: 11,
    color: '#1B7A3D',
    fontWeight: '600',
    marginTop: 2,
  },
  biometricSubnote: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginTop: 3,
  },
  biometricUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B7A3D',
    paddingVertical: 13,
    borderRadius: 9999,
  },
  biometricUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
  },
  selectedPreviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  previewEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.8,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  previewMeta: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
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
    backgroundColor: '#111827',
    paddingVertical: 13,
    borderRadius: 9999,
    marginTop: 4,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  monoBold: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#111827',
  },
  cohortSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  cohortEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  cohortSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  cohortList: {
    gap: 8,
  },
  cohortCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  cohortCardActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  cohortTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cohortName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  cohortUserBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cohortUserBadgeText: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#334155',
  },
  cohortTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cohortRegimen: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#3B6EA8',
    marginTop: 2,
  },
});
