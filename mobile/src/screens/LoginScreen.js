/**
 * LADIP Mobile Patient Portal Login Screen
 * Supports Ramesh Sharma (ramesh / ramesh1234) and all 5 Indian patient cohort accounts
 * with distinct custom patient avatar icons.
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import PatientAvatar, { PATIENT_PERSONA_META } from '../components/PatientAvatar';
import MotionView from '../components/MotionView';

export default function LoginScreen() {
  const { login } = usePatient();
  const [username, setUsername] = useState('ramesh');
  const [password, setPassword] = useState('ramesh1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignIn = () => {
    setErrorMsg(null);
    const res = login(username, password);
    if (!res.success) {
      setErrorMsg(res.error);
    }
  };

  const handleQuickSelectPersona = (persona, autoLogin = false) => {
    setErrorMsg(null);
    setUsername(persona.username);
    setPassword(persona.password);
    if (autoLogin) {
      login(persona.username, persona.password);
    }
  };

  const cohortPersonas = Object.values(PATIENT_PERSONA_META);

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
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>LADIP</Text>
              <View style={styles.logoDot}>
                <Text style={styles.logoDotCheck}>✓</Text>
              </View>
            </View>
            <Text style={styles.brandSub}>
              LONGITUDINAL ADVERSE DRUG INTERACTION PREDICTOR
            </Text>
          </View>

          {/* Editorial Title */}
          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>PATIENT SAFETY PORTAL</Text>
            <Text style={styles.heroTitle}>Sign in to your medication timeline</Text>
            <Text style={styles.heroSubtitle}>
              Access your personalised daily regimen, multi-drug FAERS safety alerts, and optical
              medicine scanner.
            </Text>
          </View>
        </MotionView>

        {/* Login Form Card */}
        <MotionView delay={35}>
          <View style={styles.loginCard}>
            {/* Active Selected Preview Banner */}
            {(() => {
              const cleanUser = (username || '').trim().toLowerCase();
              const matched =
                cohortPersonas.find((p) => p.username === cleanUser) ||
                PATIENT_PERSONA_META.PT_BLEED_001;
              return (
                <View style={styles.selectedPreviewStrip}>
                  <PatientAvatar patientId={matched.patientId} size="md" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewEyebrow}>RECOGNIZED PATIENT PROFILE</Text>
                    <Text style={styles.previewName}>{matched.shortName}</Text>
                    <Text style={styles.previewMeta}>
                      {matched.ageSex} • {matched.clinicalTag}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={16} color="#6B6B6B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="ramesh"
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
              activeOpacity={0.85}
            >
              <Text style={styles.signInBtnText}>Sign In to Patient Portal</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.credentialHint}>
              Default Credentials: Username <Text style={styles.monoBold}>ramesh</Text> • Password{' '}
              <Text style={styles.monoBold}>ramesh1234</Text>
            </Text>
          </View>
        </MotionView>

        {/* Patient Cohort Quick Selector with Distinct Icons */}
        <MotionView delay={65}>
          <View style={styles.cohortSection}>
            <Text style={styles.cohortEyebrow}>PATIENT COHORT ACCOUNTS</Text>
            <Text style={styles.cohortSub}>
              Tap any patient profile below to auto-fill credentials or switch account:
            </Text>

            <View style={styles.cohortList}>
              {cohortPersonas.map((persona) => {
                const isCurrent =
                  (username || '').trim().toLowerCase() === persona.username;
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
    paddingTop: 28,
    paddingBottom: 44,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  brandHeader: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingBottom: 14,
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
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 1,
    marginTop: 4,
  },
  heroBlock: {
    marginBottom: 18,
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
  credentialHint: {
    fontSize: 11,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 12,
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
