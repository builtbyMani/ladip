/**
 * LADIP Mobile Header Component — Replicates the Next.js Website Header:
 * 1. Top Slate Announcement Bar (#87909A): "Why LADIP? • 180K+ FDA FAERS Reports • 5 Indian Cohorts"
 * 2. Utility Sub-Bar: "India Clinical Cohort" left + "Dose Reminder" & "Supabase Sign In" right
 * 3. Main Header Row: HormnLogoMark (`[ (H) ] L A D I P`), Illustrated Patient Cohort Pill with spring physics,
 *    Supabase Auth + 1-Tap Biometric Quick-Unlock Modal, and Navigation Drawer.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import PatientAvatar, {
  HormnLogoMark,
  PATIENT_PERSONA_META,
  getPatientPersona,
} from './PatientAvatar';

const PAGE_LABELS = {
  Schedule: "Today's Dosing Schedule",
  Checker: 'Prospective Safety Check',
  Scanner: 'EHR & OCR Report Parser',
  Profile: 'Electronic Health Record',
};

const MENU_ITEMS = [
  { key: 'Schedule', label: 'Interaction Discovery & Schedule', icon: 'calendar-outline' },
  { key: 'Checker', label: 'Prospective Drug Safety Check', icon: 'shield-checkmark-outline' },
  { key: 'Scanner', label: 'Scan Prescription / OCR Parser', icon: 'scan-outline' },
  { key: 'Profile', label: 'Electronic Health Record', icon: 'person-outline' },
];

export default function Header({ navigation, activeTab = 'Schedule' }) {
  const {
    profile,
    patients,
    currentPatientId,
    switchPatient,
    alerts,
    login,
    unlockWithBiometrics,
    savedSession,
    biometricStatus,
    forgetDeviceSession,
    logout,
    sendDoseNotificationNow,
    activeDoseNotification,
  } = usePatient();

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [switchBanner, setSwitchBanner] = useState(null);

  // Supabase Auth Modal form states (password NEVER pre-filled or displayed)
  const [authUsername, setAuthUsername] = useState('ramesh');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPass, setShowAuthPass] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activePersona = getPatientPersona(currentPatientId, profile?.name);
  const savedPersona = savedSession
    ? getPatientPersona(savedSession.patientId, savedSession.shortName)
    : null;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 85,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPatientId, scaleAnim]);

  const criticalCount =
    alerts?.filter(
      (a) => (a.severity_tier === 'CRITICAL' || a.severity_tier === 'HIGH') && !a.is_suppressed
    ).length || 0;

  const activePageTitle = PAGE_LABELS[activeTab] || '404 — Route Not Found';

  const handleSelectPatient = (item) => {
    const pid = item.patient_id || item.patientId;
    const persona = getPatientPersona(pid, item.name || item.shortName);
    switchPatient(pid);
    setModalVisible(false);
    setSwitchBanner(`Switched active cohort to ${persona.shortName} (${persona.clinicalTag})`);
    setTimeout(() => {
      setSwitchBanner(null);
    }, 3000);
  };

  const handleTriggerNotification = async () => {
    navigation?.navigate('Schedule');
    await sendDoseNotificationNow();
  };

  const handleSupabaseModalSignIn = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await login(authUsername, authPassword);
      if (!res.success) {
        setAuthError(res.error);
        return;
      }
      setAuthPassword('');
      setAuthModalVisible(false);
      setSwitchBanner(
        `Signed in via Supabase Auth as ${res.name} — 1-Tap Biometric Unlock paired.`
      );
      setTimeout(() => setSwitchBanner(null), 3500);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleBiometricModalUnlock = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        setAuthError(res.error);
        return;
      }
      setAuthModalVisible(false);
      setSwitchBanner(`1-Tap Biometric Quick-Unlock verified for ${res.name}.`);
      setTimeout(() => setSwitchBanner(null), 3500);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const cohortList =
    patients && patients.length > 0
      ? patients
      : Object.values(PATIENT_PERSONA_META).map((p) => ({
          patient_id: p.patientId,
          name: p.shortName,
        }));

  return (
    <View style={styles.headerWrapper}>
      {/* 1. Website Top Slate Announcement Bar (#87909A) */}
      <View style={styles.slateAnnouncementBar}>
        <Text style={styles.slateLeftTitle}>Why LADIP?</Text>
        <View style={styles.slateRightRow}>
          <View style={styles.slateMetricItem}>
            <Ionicons name="chatbubble-ellipses" size={11} color="rgba(255,255,255,0.88)" />
            <Text style={styles.slateMetricText}>180K+ FDA FAERS</Text>
          </View>
          <View style={styles.slateMetricItem}>
            <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.88)" />
            <Text style={styles.slateMetricText}>5 Indian Cohorts</Text>
          </View>
        </View>
      </View>

      {/* 2. Website Utility Sub-Bar (India Clinical Cohort left, Dose Reminder & Supabase Auth right) */}
      <View style={styles.utilitySubBar}>
        <View style={styles.utilityLeft}>
          <View style={styles.indiaDotOuter}>
            <View style={styles.indiaDotInner} />
          </View>
          <Text style={styles.utilityRegionText}>India Clinical Cohort</Text>
        </View>

        <View style={styles.utilityRight}>
          <TouchableOpacity
            style={styles.utilityLinkBtn}
            onPress={handleTriggerNotification}
            activeOpacity={0.75}
          >
            <Ionicons
              name={activeDoseNotification ? 'notifications' : 'notifications-outline'}
              size={12}
              color="#1B7A3D"
            />
            <Text style={styles.utilityDoseText}>Dose Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityLinkBtn}
            onPress={() => {
              setAuthUsername(activePersona.username || 'ramesh');
              setAuthPassword('');
              setAuthError(null);
              setAuthModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="finger-print" size={13} color="#1B7A3D" />
            <Text style={styles.utilityAuthText}>
              {savedPersona
                ? `${savedPersona.shortName.split(' ')[0]} (Supabase)`
                : 'Patient Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Website Main Navigation Header Row */}
      <View style={styles.mainHeaderRow}>
        {/* Clickable HORMN-style Capsule Logo Mark (`[ (H) ] L A D I P`) */}
        <TouchableOpacity
          style={styles.brandGroup}
          onPress={() => navigation?.navigate('Schedule')}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel="LADIP Home"
        >
          <HormnLogoMark size="sm" />
          <Text style={styles.appSubtitle} numberOfLines={1}>
            {activePageTitle}
          </Text>
        </TouchableOpacity>

        <View style={styles.rightControls}>
          {/* Animated Patient Cohort Switcher Pill with Illustrated Avatar */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.patientBadge}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <PatientAvatar
                patientId={currentPatientId}
                fallbackName={profile?.name}
                size="xs"
              />
              <View style={styles.patientBadgeTextCol}>
                <Text style={styles.patientBadgeName} numberOfLines={1}>
                  {activePersona.shortName}
                </Text>
                <Text style={styles.patientBadgeRole} numberOfLines={1}>
                  {activePersona.clinicalTag}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </TouchableOpacity>
          </Animated.View>

          {/* Mobile Menu Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open Navigation Menu"
          >
            <Ionicons name="menu-outline" size={19} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Patient Switch / Supabase Auth Toast Strip */}
      {switchBanner && (
        <View style={styles.switchToast}>
          <PatientAvatar patientId={currentPatientId} size="xs" showBadge={false} />
          <Text style={styles.switchToastText} numberOfLines={2}>
            {switchBanner}
          </Text>
          <TouchableOpacity onPress={() => setSwitchBanner(null)}>
            <Ionicons name="close" size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* =========================================================================
          SUPABASE AUTH + 1-TAP BIOMETRIC QUICK-UNLOCK MODAL (Identical to Web UI)
         ========================================================================= */}
      <Modal
        visible={authModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlayCenter}>
          <View style={styles.authModalCard}>
            <View style={styles.authModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.authModalEyebrowRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#1B7A3D" />
                  <Text style={styles.authModalEyebrow}>
                    SUPABASE AUTHENTICATION + BIOMETRIC PAIRING
                  </Text>
                </View>
                <Text style={styles.authModalTitle}>Patient Portal Sign In</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAuthModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1-Tap Elderly Biometric Quick-Unlock Card when session is saved in SecureStore */}
              {savedPersona && (
                <View style={styles.bioQuickCard}>
                  <View style={styles.bioQuickTopRow}>
                    <View style={styles.bioQuickPill}>
                      <Ionicons name="finger-print" size={11} color="#FFFFFF" />
                      <Text style={styles.bioQuickPillText}>
                        1-TAP ELDERLY BIOMETRIC UNLOCK
                      </Text>
                    </View>
                    <TouchableOpacity onPress={forgetDeviceSession}>
                      <Text style={styles.resetTokenText}>Reset Token</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bioQuickProfileRow}>
                    <PatientAvatar patientId={savedPersona.patientId} size="md" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bioQuickWelcome}>
                        Welcome back, {savedPersona.shortName}
                      </Text>
                      <Text style={styles.bioQuickEmail}>
                        {savedSession?.email || `${savedPersona.username}@ladip.health`} • Paired
                        with SecureStore
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.bioQuickBtn}
                    onPress={handleBiometricModalUnlock}
                    disabled={authSubmitting}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="finger-print" size={16} color="#FFFFFF" />
                    <Text style={styles.bioQuickBtnText}>
                      Unlock with {biometricStatus?.biometricLabel || '1-Tap Fingerprint'} (
                      {savedPersona.shortName.split(' ')[0]})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Username & Password Form (Password never pre-filled or displayed) */}
              <View style={styles.authFieldGroup}>
                <Text style={styles.authFieldLabel}>USERNAME OR SUPABASE EMAIL</Text>
                <TextInput
                  style={styles.authInput}
                  value={authUsername}
                  onChangeText={(val) => {
                    setAuthUsername(val);
                    setAuthError(null);
                  }}
                  placeholder="ramesh or ramesh@ladip.health"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.authFieldGroup}>
                <Text style={styles.authFieldLabel}>PASSWORD</Text>
                <View style={styles.authPasswordWrap}>
                  <TextInput
                    style={styles.authPasswordInput}
                    value={authPassword}
                    onChangeText={(val) => {
                      setAuthPassword(val);
                      setAuthError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showAuthPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowAuthPass(!showAuthPass)}>
                    <Ionicons
                      name={showAuthPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {authError && (
                <View style={styles.authErrorBox}>
                  <Text style={styles.authErrorText}>{authError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.authSubmitBtn}
                onPress={handleSupabaseModalSignIn}
                disabled={authSubmitting}
                activeOpacity={0.85}
              >
                {authSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                    <Text style={styles.authSubmitBtnText}>
                      Sign In with Supabase & Pair Fingerprint
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Select Patient Cohort Account (No passwords shown!) */}
              <View style={styles.cohortChipsBlock}>
                <Text style={styles.cohortChipsHeading}>SELECT PATIENT COHORT ACCOUNT</Text>
                <View style={styles.cohortChipsWrap}>
                  {Object.values(PATIENT_PERSONA_META).map((p) => {
                    const isSelected =
                      (authUsername || '').trim().toLowerCase() === p.username;
                    return (
                      <TouchableOpacity
                        key={p.patientId}
                        style={[
                          styles.cohortAccountChip,
                          isSelected && styles.cohortAccountChipActive,
                        ]}
                        onPress={() => {
                          setAuthUsername(p.username);
                          setAuthError(null);
                        }}
                      >
                        <PatientAvatar
                          patientId={p.patientId}
                          size="xs"
                          showBadge={false}
                        />
                        <Text
                          style={[
                            styles.cohortAccountChipName,
                            isSelected && { color: '#FFFFFF' },
                          ]}
                        >
                          {p.shortName}
                        </Text>
                        <Text
                          style={[
                            styles.cohortAccountChipUser,
                            isSelected && { color: '#CBD5E1' },
                          ]}
                        >
                          @{p.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Full Sign Out to Login Screen */}
              <TouchableOpacity
                style={styles.fullSignOutBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={15} color="#DC2626" />
                <Text style={styles.fullSignOutText}>
                  Lock Session & Return to Full Login Screen
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Mobile Navigation Drawer Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>CLINICAL WORKFLOWS</Text>
                <Text style={styles.modalTitle}>LADIP Navigation</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {MENU_ITEMS.map((item) => {
              const isCurrent = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navMenuItem, isCurrent && styles.navMenuItemActive]}
                  onPress={() => {
                    navigation?.navigate(item.key);
                    setMenuVisible(false);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isCurrent ? '#FFFFFF' : '#111827'}
                    />
                    <Text
                      style={[
                        styles.navMenuLabel,
                        isCurrent && styles.navMenuLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.key === 'Checker' && criticalCount > 0 && (
                    <View style={styles.menuAlertPill}>
                      <Text style={styles.menuAlertPillText}>{criticalCount} ALERT</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={{ marginTop: 14, gap: 8 }}>
              <TouchableOpacity
                style={styles.switchCohortCta}
                onPress={() => {
                  setMenuVisible(false);
                  setAuthModalVisible(true);
                }}
              >
                <Ionicons name="finger-print" size={15} color="#FFFFFF" />
                <Text style={styles.switchCohortCtaText}>
                  Supabase Auth & 1-Tap Biometric Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutMenuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                <Text style={styles.logoutMenuBtnText}>Sign Out to Login Screen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Website-Style Patient Cohort Switcher Popover Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>SWITCH ACTIVE PATIENT COHORT</Text>
                <Text style={styles.modalTitle}>5 Indian Clinical Profiles</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={cohortList}
              keyExtractor={(item) => item.patient_id || item.patientId}
              renderItem={({ item }) => {
                const pid = item.patient_id || item.patientId;
                const isSelected = pid === currentPatientId;
                const persona = getPatientPersona(pid, item.name);
                return (
                  <TouchableOpacity
                    style={[
                      styles.patientOption,
                      isSelected && styles.patientOptionActive,
                    ]}
                    onPress={() => handleSelectPatient(item)}
                    activeOpacity={0.85}
                  >
                    <PatientAvatar
                      patientId={pid}
                      fallbackName={item.name}
                      size="md"
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <View style={styles.optionTitleRow}>
                        <Text
                          style={[
                            styles.optionName,
                            isSelected && styles.optionNameActive,
                          ]}
                        >
                          {persona.shortName}
                        </Text>
                        <View
                          style={[
                            styles.riskBadgePill,
                            isSelected && styles.riskBadgePillSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskBadgeText,
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {persona.riskLabel}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.optionClinicalTag,
                          isSelected && { color: '#CBD5E1' },
                        ]}
                      >
                        {persona.clinicalTag}
                      </Text>
                      <Text
                        style={[
                          styles.optionRegimen,
                          isSelected && { color: '#7DD3FC' },
                        ]}
                      >
                        {persona.regimenShort}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
  },
  slateAnnouncementBar: {
    backgroundColor: '#87909A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slateLeftTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  slateRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slateMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slateMetricText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10.5,
    fontWeight: '500',
  },
  utilitySubBar: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indiaDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indiaDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  utilityRegionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  utilityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  utilityLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  utilityDoseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B7A3D',
  },
  utilityAuthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  mainHeaderRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandGroup: {
    flexShrink: 1,
  },
  appSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 7,
  },
  patientBadgeTextCol: {
    maxWidth: 120,
  },
  patientBadgeName: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 11.5,
    lineHeight: 14,
  },
  patientBadgeRole: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '500',
    lineHeight: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchToast: {
    backgroundColor: '#111827',
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchToastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  authModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    maxHeight: '88%',
  },
  authModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  authModalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authModalEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.9,
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  bioQuickCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(27, 122, 61, 0.35)',
    padding: 14,
    marginBottom: 14,
  },
  bioQuickTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bioQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B7A3D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bioQuickPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  resetTokenText: {
    fontSize: 11,
    color: '#64748B',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  bioQuickProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  bioQuickWelcome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  bioQuickEmail: {
    fontSize: 11,
    color: '#1B7A3D',
    fontWeight: '600',
    marginTop: 2,
  },
  bioQuickBtn: {
    backgroundColor: '#1B7A3D',
    borderRadius: 999,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bioQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  authFieldGroup: {
    marginBottom: 12,
  },
  authFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  authInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  authPasswordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  authPasswordInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  authErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  authErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  authSubmitBtn: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  authSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cohortChipsBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cohortChipsHeading: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cohortChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cohortAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  cohortAccountChipActive: {
    backgroundColor: '#111827',
  },
  cohortAccountChipName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  cohortAccountChipUser: {
    fontSize: 10,
    color: '#64748B',
  },
  fullSignOutBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fullSignOutText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '84%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  navMenuItemActive: {
    backgroundColor: '#111827',
  },
  navMenuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  navMenuLabelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuAlertPill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  menuAlertPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  switchCohortCta: {
    backgroundColor: '#111827',
    borderRadius: 9999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  switchCohortCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 9999,
    paddingVertical: 11,
  },
  logoutMenuBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  patientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  patientOptionActive: {
    backgroundColor: '#111827',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  optionName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  optionNameActive: {
    color: '#FFFFFF',
  },
  riskBadgePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  riskBadgePillSelected: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  riskBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
  },
  optionClinicalTag: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  optionRegimen: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#3B6EA8',
    marginTop: 2,
  },
});
