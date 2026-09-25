/**
 * Header Component with Clickable Logo, Mobile Hamburger Menu, and Patient Switcher Modal
 * Editorial Health-Tech Aesthetic with Serif Brand and Clean White Surfaces
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';

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
  const { profile, patients, currentPatientId, switchPatient, alerts } = usePatient();
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const criticalCount =
    alerts?.filter(
      (a) => (a.severity_tier === 'CRITICAL' || a.severity_tier === 'HIGH') && !a.is_suppressed
    ).length || 0;

  const scenarioDescriptions = {
    PT_BLEED_001: 'Ramesh Sharma — Warfarin + Aspirin + Ibuprofen',
    PT_STATIN_002: 'Sunita Patel — Simvastatin + Amlodipine + Amiodarone',
    PT_MTX_003: 'Kavitha Reddy — Methotrexate + Bactrim + Naproxen',
    PT_CARDIO_005: 'Arjun Nair — Clopidogrel + Omeprazole',
    PT_STABLE_004: 'Rajesh Varma — Stable 2yr Chronic Cohort (Suppressed)',
  };

  const activePageTitle = PAGE_LABELS[activeTab] || '404 — Route Not Found';

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
          {/* Patient Switcher Pill */}
          <TouchableOpacity
            style={styles.patientBadge}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.patientBadgeText} numberOfLines={1}>
              {profile?.name ? profile.name.split(' ')[0] : 'Patient'}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#6B6B6B" />
          </TouchableOpacity>

          {/* Mobile Menu Button */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open Navigation Menu"
          >
            <Ionicons name="menu-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

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

            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
                style={styles.switchCohortCta}
                onPress={() => {
                  setMenuVisible(false);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.switchCohortCtaText}>
                  Switch Patient Cohort ({profile?.name || currentPatientId})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Patient Switcher Modal */}
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
                <Text style={styles.modalTitle}>Select Clinical Scenario</Text>
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
                const label = scenarioDescriptions[item.patient_id] || item.name;
                return (
                  <TouchableOpacity
                    style={[styles.patientOption, isSelected && styles.patientOptionActive]}
                    onPress={() => {
                      switchPatient(item.patient_id);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                          {label}
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
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
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
    backgroundColor: '#D4A5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '800',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    gap: 4,
    maxWidth: 130,
  },
  patientBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingBottom: 14,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F5F5F0',
    borderRadius: 9999,
  },
  navMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
  },
  navMenuItemActive: {
    backgroundColor: '#F5F5F0',
  },
  navMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  navMenuLabelActive: {
    fontWeight: '800',
    color: '#1B7A3D',
  },
  menuAlertPill: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuAlertPillText: {
    fontSize: 9,
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
  patientOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
    backgroundColor: '#FFFFFF',
  },
  patientOptionActive: {
    backgroundColor: '#F5F5F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E5E5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#1A1A1A',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 18,
  },
  optionNameActive: {
    fontWeight: '700',
  },
  optionDetails: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 3,
  },
});
