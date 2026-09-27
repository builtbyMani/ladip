/**
 * LADIP Mobile Header Component — Website-Matched UI
 * Displays the authenticated patient's identity badge (no unauthenticated account switching
 * from the homepage — changing accounts requires signing out to LoginScreen and authenticating).
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import PatientAvatar, {
  HormnLogoMark,
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
    currentPatientId,
    alerts,
    logout,
    sendDoseNotificationNow,
    activeDoseNotification,
  } = usePatient();

  const [menuVisible, setMenuVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activePersona = getPatientPersona(currentPatientId, profile?.name);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
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

  const handleTriggerNotification = async () => {
    navigation?.navigate('Schedule');
    await sendDoseNotificationNow();
  };

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
            <Text style={styles.slateMetricText}>Supabase Auth</Text>
          </View>
        </View>
      </View>

      {/* 2. Website Utility Sub-Bar (India Clinical Cohort left, Dose Reminder & Sign Out right) */}
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
            onPress={logout}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={13} color="#DC2626" />
            <Text style={styles.utilitySignOutText}>Sign Out</Text>
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
          {/* Authenticated Patient Profile Pill (Navigates to Profile tab — no account switching on homepage) */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.patientBadge}
              onPress={() => navigation?.navigate('Profile')}
              activeOpacity={0.85}
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
              <Ionicons name="shield-checkmark" size={13} color="#1B7A3D" />
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

            {/* Active Authenticated Patient Summary Card */}
            <View style={styles.activeUserCard}>
              <PatientAvatar patientId={currentPatientId} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeUserEyebrow}>AUTHENTICATED PATIENT SESSION</Text>
                <Text style={styles.activeUserName}>{activePersona.shortName}</Text>
                <Text style={styles.activeUserMeta}>{activePersona.clinicalTag}</Text>
              </View>
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

            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
                style={styles.logoutMenuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                <Text style={styles.logoutMenuBtnText}>
                  Sign Out of {activePersona.shortName.split(' ')[0]}'s Account
                </Text>
              </TouchableOpacity>
            </View>
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
  utilitySignOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    maxWidth: 125,
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
  activeUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  activeUserEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.8,
  },
  activeUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  activeUserMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  logoutMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 9999,
    paddingVertical: 12,
  },
  logoutMenuBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
