/**
 * Header Component with Clickable Logo, Distinct Patient Avatar Icon,
 * Animated Account Switcher Modal, and Logout Action
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import PatientAvatar, { getPatientPersona } from './PatientAvatar';

const PAGE_LABELS = {
  Schedule: "Today's Dosing Schedule",
  Checker: 'Ask Medicine / Safety Check',
  Scanner: 'Scan Prescription / OCR',
  Profile: 'Electronic Health Record',
};

const MENU_ITEMS = [
  { key: 'Schedule', label: "Today's Dosing Schedule", icon: 'calendar-outline' },
  { key: 'Checker', label: 'Ask Medicine / OTC Safety', icon: 'shield-checkmark-outline' },
  { key: 'Scanner', label: 'Scan Prescription / OCR', icon: 'scan-outline' },
  { key: 'Profile', label: 'Electronic Health Record', icon: 'person-outline' },
];

export default function Header({ navigation, activeTab = 'Schedule' }) {
  const {
    profile,
    patients,
    currentPatientId,
    switchPatient,
    alerts,
    logout,
    lockSession,
    forgetDeviceSession,
    sendDoseNotificationNow,
    activeDoseNotification,
  } = usePatient();
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [switchBanner, setSwitchBanner] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activePersona = getPatientPersona(currentPatientId, profile?.name);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 140,
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
    const persona = getPatientPersona(item.patient_id, item.name);
    switchPatient(item.patient_id);
    setModalVisible(false);
    setSwitchBanner(`Switched account to ${persona.shortName}`);
    setTimeout(() => {
      setSwitchBanner(null);
    }, 2800);
  };

  const handleTriggerNotification = async () => {
    navigation?.navigate('Schedule');
    await sendDoseNotificationNow();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {/* Clickable Brand Logo */}
        <TouchableOpacity
          style={styles.brandGroup}
          onPress={() => navigation?.navigate('Schedule')}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel="LADIP Home — Return to Today's Schedule"
        >
          <View style={styles.titleRow}>
            <Text style={styles.appTitle}>LADIP</Text>
            <View style={styles.brandDot}>
              <Text style={styles.brandDotText}>✓</Text>
            </View>
          </View>
          <Text style={styles.appSubtitle} numberOfLines={1}>
            {activePageTitle}
          </Text>
        </TouchableOpacity>

        <View style={styles.rightControls}>
          {/* Patient Switcher Pill with Distinct Custom Avatar Icon */}
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
                  {activePersona.shortName.split(' ')[0]}
                </Text>
                <Text style={styles.patientBadgeRole} numberOfLines={1}>
                  {activePersona.riskTier === 'STABLE' ? 'Stable' : activePersona.riskTier}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={13} color="#6B6B6B" />
            </TouchableOpacity>
          </Animated.View>

          {/* Medication Dose Reminder Bell Button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              activeDoseNotification && { borderColor: '#1B7A3D', backgroundColor: '#F0FDF4' },
            ]}
            onPress={handleTriggerNotification}
            activeOpacity={0.8}
            accessibilityLabel="Trigger Medication Dose Notification"
          >
            <Ionicons
              name={activeDoseNotification ? 'notifications' : 'notifications-outline'}
              size={18}
              color="#1B7A3D"
            />
          </TouchableOpacity>

          {/* Lock Screen for 1-Tap Biometric Fingerprint Unlock */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={lockSession || logout}
            activeOpacity={0.8}
            accessibilityLabel="Lock Screen for 1-Tap Fingerprint Unlock"
          >
            <Ionicons name="finger-print-outline" size={18} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Mobile Menu Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open Navigation Menu"
          >
            <Ionicons name="menu-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Switch Notification Strip */}
      {switchBanner && (
        <View style={styles.switchToast}>
          <PatientAvatar patientId={currentPatientId} size="xs" showBadge={false} />
          <Text style={styles.switchToastText}>{switchBanner}</Text>
        </View>
      )}

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
                <Text style={styles.modalEyebrow}>MOBILE NAVIGATION MENU</Text>
                <Text style={styles.modalTitle}>LADIP Clinical Copilot</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color="#1A1A1A" />
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
                      color={isCurrent ? '#1B7A3D' : '#1A1A1A'}
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

            <View style={{ marginTop: 14, gap: 10 }}>
              <TouchableOpacity
                style={styles.switchCohortCta}
                onPress={() => {
                  setMenuVisible(false);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.switchCohortCtaText}>
                  Switch Patient Account ({activePersona.shortName})
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
                <Text style={styles.logoutMenuBtnText}>Sign Out of Patient Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Patient Switcher Modal with Distinct Custom Avatars */}
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
                <Text style={styles.modalEyebrow}>PATIENT COHORT REGISTRY</Text>
                <Text style={styles.modalTitle}>Switch Patient Account</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={patients}
              keyExtractor={(item) => item.patient_id}
              renderItem={({ item }) => {
                const isSelected = item.patient_id === currentPatientId;
                const persona = getPatientPersona(item.patient_id, item.name);
                return (
                  <TouchableOpacity
                    style={[styles.patientOption, isSelected && styles.patientOptionActive]}
                    onPress={() => handleSelectPatient(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <PatientAvatar
                        patientId={item.patient_id}
                        fallbackName={item.name}
                        size="sm"
                      />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <View style={styles.optionTitleRow}>
                          <Text
                            style={[
                              styles.optionName,
                              isSelected && styles.optionNameActive,
                            ]}
                          >
                            {persona.shortName}
                          </Text>
                          {isSelected && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.optionClinicalTag}>
                          {persona.clinicalTag} • {persona.regimenShort}
                        </Text>
                        <Text style={styles.optionDetails}>
                          Age {item.age} • {item.sex} • {item.active_medications_count} Active Meds
                        </Text>
                      </View>
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  brandGroup: {
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1B7A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    gap: 6,
  },
  patientBadgeTextCol: {
    maxWidth: 90,
  },
  patientBadgeName: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 14,
  },
  patientBadgeRole: {
    color: '#6B6B6B',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchToast: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchToastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    padding: 22,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  navMenuItemActive: {
    backgroundColor: '#F5F5F0',
  },
  navMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  navMenuLabelActive: {
    fontWeight: '700',
    color: '#1B7A3D',
  },
  menuAlertPill: {
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  menuAlertPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  switchCohortCta: {
    backgroundColor: '#1A1A1A',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
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
    borderColor: '#DC2626',
    borderRadius: 9999,
    paddingVertical: 11,
  },
  logoutMenuBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  patientOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  patientOptionActive: {
    backgroundColor: '#F5F5F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  optionNameActive: {
    color: '#1B7A3D',
  },
  activePill: {
    backgroundColor: '#1B7A3D',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  optionClinicalTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  optionDetails: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
});
