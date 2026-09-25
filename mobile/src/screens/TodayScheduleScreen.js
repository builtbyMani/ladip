/**
 * Today's Medicine Schedule & Regimen Safety Shield Screen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';

export default function TodayScheduleScreen({ navigation }) {
  const { profile, schedule, alerts, loading, takenMeds, toggleMedTaken } = usePatient();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Syncing patient safety profile...</Text>
      </View>
    );
  }

  // Determine top interaction status
  const criticalAlert = alerts.find((a) => a.severity_tier === 'CRITICAL' && !a.is_suppressed);
  const highAlert = alerts.find((a) => a.severity_tier === 'HIGH' && !a.is_suppressed);
  const activeAlert = criticalAlert || highAlert;

  const slotIcons = {
    morning: 'sunny-outline',
    afternoon: 'partly-sunny-outline',
    evening: 'moon-outline',
    bedtime: 'bed-outline',
  };

  const slotColors = {
    morning: '#EA580C',
    afternoon: '#0284C7',
    evening: '#7C3AED',
    bedtime: '#334155',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Patient Greeting & Date */}
      <View style={styles.greetingBar}>
        <View>
          <Text style={styles.welcomeText}>
            Namaste, {profile?.name ? profile.name.split(' ')[0] : 'Patient'} 🙏
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.scanQuickBtn}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
          <Text style={styles.scanQuickBtnText}>Scan Rx</Text>
        </TouchableOpacity>
      </View>

      {/* Regimen Safety Shield Card */}
      {activeAlert ? (
        <View style={styles.alertShieldCard}>
          <View style={styles.alertShieldHeader}>
            <Ionicons name="warning" size={24} color="#DC2626" />
            <Text style={styles.alertShieldTitle}>
              {activeAlert.severity_tier} SAFETY ALERT
            </Text>
          </View>
          <Text style={styles.alertComboText}>
            {activeAlert.combo_str} ➔ {activeAlert.adverse_event}
          </Text>
          <Text style={styles.alertAdviceText}>
            {activeAlert.recommendation || activeAlert.clinical_rationale}
          </Text>
          <View style={styles.alertMetaRow}>
            <Text style={styles.alertMetaTag}>PRR: {activeAlert.prr}x</Text>
            <Text style={styles.alertMetaTag}>Cases: {activeAlert.case_count}</Text>
            {activeAlert.patient_has_matching_symptom && (
              <Text style={[styles.alertMetaTag, { backgroundColor: '#FEE2E2', color: '#991B1B' }]}>
                Symptom Reported
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.safeShieldCard}>
          <View style={styles.safeShieldHeader}>
            <Ionicons name="shield-checkmark" size={22} color="#16A34A" />
            <Text style={styles.safeShieldTitle}>Regimen Safe & Stable</Text>
          </View>
          <Text style={styles.safeShieldBody}>
            No severe multi-drug interactions detected across your active prescriptions.
          </Text>
        </View>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={18} color="#0F172A" />
        <Text style={styles.sectionTitle}>Today's Dosing Schedule</Text>
      </View>

      {/* Schedule Slots */}
      {schedule && Object.keys(schedule).map((slotKey) => {
        const slot = schedule[slotKey];
        if (!slot || !slot.items || slot.items.length === 0) return null;

        return (
          <View key={slotKey} style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <View style={styles.slotHeaderLeft}>
                <Ionicons
                  name={slotIcons[slotKey] || 'time-outline'}
                  size={18}
                  color={slotColors[slotKey] || '#0284C7'}
                />
                <Text style={styles.slotTitle}>{slot.title}</Text>
              </View>
              <Text style={styles.slotCountText}>
                {slot.items.length} {slot.items.length === 1 ? 'med' : 'meds'}
              </Text>
            </View>

            {slot.items.map((med, idx) => {
              const medKey = `${slotKey}_${med.drug_name}_${idx}`;
              const isTaken = takenMeds[medKey];

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.medItem, isTaken && styles.medItemTaken]}
                  onPress={() => toggleMedTaken(medKey)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isTaken ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isTaken ? '#16A34A' : '#94A3B8'}
                  />
                  <View style={styles.medDetails}>
                    <Text style={[styles.medName, isTaken && styles.medNameTaken]}>
                      {med.drug_name}
                    </Text>
                    <Text style={styles.medInstructions}>
                      {med.dose} • {med.instructions}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={[styles.statusPillText, isTaken && { color: '#16A34A' }]}>
                      {isTaken ? 'TAKEN' : 'PENDING'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      {/* Active Diagnoses & Allergy Reminder */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="medical-outline" size={16} color="#475569" />
          <Text style={styles.infoTitle}>Your Clinical Profile</Text>
        </View>
        <Text style={styles.infoLine}>
          <Text style={{ fontWeight: '700' }}>Conditions: </Text>
          {profile?.conditions?.join(', ') || 'None recorded'}
        </Text>
        <Text style={styles.infoLine}>
          <Text style={{ fontWeight: '700' }}>Allergies: </Text>
          {profile?.allergies?.length > 0 ? profile.allergies.join(', ') : 'No Known Drug Allergies (NKDA)'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  scanQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  scanQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertShieldCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertShieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertShieldTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  alertComboText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  alertAdviceText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  alertMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertMetaTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  safeShieldCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  safeShieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  safeShieldTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  safeShieldBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  slotHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  slotCountText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  medItemTaken: {
    opacity: 0.6,
  },
  medDetails: {
    flex: 1,
    marginLeft: 10,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  medNameTaken: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  medInstructions: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  infoCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  infoLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
});
