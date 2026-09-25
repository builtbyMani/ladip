/**
 * Today's Medicine Schedule & Regimen Safety Shield Screen
 * Editorial Health-Tech Aesthetic
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';

export default function TodayScheduleScreen({ navigation }) {
  const { profile, schedule, alerts, loading, takenMeds, toggleMedTaken } = usePatient();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B7A3D" />
        <Text style={styles.loadingText}>Syncing longitudinal safety profile...</Text>
      </View>
    );
  }

  const criticalAlert = alerts.find((a) => a.severity_tier === 'CRITICAL' && !a.is_suppressed);
  const highAlert = alerts.find((a) => a.severity_tier === 'HIGH' && !a.is_suppressed);
  const activeAlert = criticalAlert || highAlert;

  const slotAccentColors = {
    morning: '#E8C840',
    afternoon: '#D4A5E5',
    evening: '#1B7A3D',
    bedtime: '#6B6B6B',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Editorial Greeting & Quick Action */}
      <View style={styles.greetingBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>
            Namaste, {profile?.name ? profile.name.split(' ')[0] : 'Patient'}
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
          activeOpacity={0.85}
        >
          <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
          <Text style={styles.scanQuickBtnText}>Scan Rx</Text>
        </TouchableOpacity>
      </View>

      {/* Regimen Safety Shield Card — Editorial White Card */}
      {activeAlert ? (
        <View style={styles.alertShieldCard}>
          <View style={styles.alertShieldTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertEyebrow}>
                {activeAlert.severity_tier} INTERACTION DETECTED
              </Text>
              <Text style={styles.alertComboText}>
                {activeAlert.combo_str} → {activeAlert.adverse_event}
              </Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statHeroNum}>{activeAlert.prr}x</Text>
              <Text style={styles.statHeroLabel}>PRR RATIO</Text>
            </View>
          </View>

          <Text style={styles.alertAdviceText}>
            {activeAlert.recommendation || activeAlert.clinical_rationale}
          </Text>

          <View style={styles.alertMetaRow}>
            <View style={styles.outlinedBadge}>
              <Text style={styles.outlinedBadgeText}>
                FAERS Co-Reports: {activeAlert.case_count}
              </Text>
            </View>
            {activeAlert.patient_has_matching_symptom && (
              <View style={[styles.outlinedBadge, { borderColor: '#DC2626' }]}>
                <Text style={[styles.outlinedBadgeText, { color: '#DC2626' }]}>
                  Symptom Correlated
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.safeShieldCard}>
          <Text style={styles.safeEyebrow}>LONGITUDINAL SURVEILLANCE</Text>
          <Text style={styles.safeShieldTitle}>Regimen Safe & Stable</Text>
          <Text style={styles.safeShieldBody}>
            No uncontrolled multi-drug interactions detected across your active prescriptions. Low-grade background warnings are suppressed.
          </Text>
        </View>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>DAILY REGIMEN</Text>
        <Text style={styles.sectionTitle}>Today's Dosing Schedule</Text>
      </View>

      {/* Schedule Slots */}
      {schedule &&
        Object.keys(schedule).map((slotKey) => {
          const slot = schedule[slotKey];
          if (!slot || !slot.items || slot.items.length === 0) return null;
          const borderAccent = slotAccentColors[slotKey] || '#1B7A3D';

          return (
            <View
              key={slotKey}
              style={[styles.slotCard, { borderLeftColor: borderAccent, borderLeftWidth: 3 }]}
            >
              <View style={styles.slotHeader}>
                <Text style={styles.slotTitle}>{slot.title}</Text>
                <Text style={styles.slotCountText}>
                  {slot.items.length} {slot.items.length === 1 ? 'DOSE' : 'DOSES'}
                </Text>
              </View>

              {slot.items.map((med, idx) => {
                const medKey = `${slotKey}_${med.drug_name}_${idx}`;
                const isTaken = takenMeds[medKey];

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.medItem,
                      idx === slot.items.length - 1 && { borderBottomWidth: 0 },
                      isTaken && styles.medItemTaken,
                    ]}
                    onPress={() => toggleMedTaken(medKey)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isTaken ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isTaken ? '#1B7A3D' : '#6B6B6B'}
                    />
                    <View style={styles.medDetails}>
                      <View style={styles.medPillRow}>
                        <View style={styles.blackDrugPill}>
                          <Text style={styles.blackDrugPillText}>{med.drug_name}</Text>
                        </View>
                      </View>
                      <Text style={styles.medInstructions}>
                        {med.dose} • {med.instructions}
                      </Text>
                    </View>
                    <Text style={[styles.statusLabel, isTaken && styles.statusLabelTaken]}>
                      {isTaken ? 'TAKEN' : 'MARK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

      {/* Clinical Summary Footer */}
      <View style={styles.infoStrip}>
        <Text style={styles.sectionEyebrow}>CLINICAL CONTEXT</Text>
        <Text style={styles.infoLine}>
          <Text style={styles.infoLabel}>Conditions: </Text>
          {profile?.conditions?.join(', ') || 'None recorded'}
        </Text>
        <Text style={styles.infoLine}>
          <Text style={styles.infoLabel}>Allergies: </Text>
          {profile?.allergies?.length > 0
            ? profile.allergies.join(', ')
            : 'No Known Drug Allergies (NKDA)'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 44,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B6B6B',
  },
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 25,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  scanQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 9999,
    gap: 6,
  },
  scanQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  alertShieldCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
    marginBottom: 28,
  },
  alertShieldTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  alertEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  alertComboText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 22,
    paddingRight: 10,
  },
  statBlock: {
    alignItems: 'flex-end',
  },
  statHeroNum: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 32,
  },
  statHeroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  alertAdviceText: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
    marginBottom: 14,
  },
  alertMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outlinedBadge: {
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  outlinedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  safeShieldCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderLeftWidth: 3,
    borderLeftColor: '#1B7A3D',
    padding: 18,
    marginBottom: 28,
  },
  safeEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  safeShieldTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  safeShieldBody: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 16,
    marginBottom: 16,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingBottom: 10,
    marginBottom: 6,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  slotCountText: {
    fontSize: 10,
    color: '#6B6B6B',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
  },
  medItemTaken: {
    opacity: 0.55,
  },
  medDetails: {
    flex: 1,
    marginLeft: 12,
  },
  medPillRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  blackDrugPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  blackDrugPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  medInstructions: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#6B6B6B',
  },
  statusLabelTaken: {
    color: '#1B7A3D',
  },
  infoStrip: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingTop: 20,
    marginTop: 12,
  },
  infoLine: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 20,
    marginTop: 4,
  },
  infoLabel: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
