/**
 * Today's Medicine Schedule & Regimen Safety Shield Screen
 * Editorial Health-Tech Aesthetic with Bklit.UI Telemetry & Motion.dev Spring Physics
 */
import React, { useState } from 'react';
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
import MotionView from '../components/MotionView';
import { BklitBarChart, BklitRingChart } from '../components/BklitChart';
import Footer from '../components/Footer';

export default function TodayScheduleScreen({ navigation }) {
  const {
    profile,
    schedule,
    alerts,
    loading,
    error,
    takenMeds,
    toggleMedTaken,
    refreshPatientData,
  } = usePatient();
  const [statusMessage, setStatusMessage] = useState(null);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B7A3D" />
        <Text style={styles.loadingText}>Syncing longitudinal safety profile...</Text>
      </View>
    );
  }

  const activeAlerts = (alerts || []).filter((a) => !a.is_suppressed);
  const criticalAlert = activeAlerts.find((a) => a.severity_tier === 'CRITICAL');
  const highAlert = activeAlerts.find((a) => a.severity_tier === 'HIGH');
  const activeAlert = criticalAlert || highAlert;

  // Compute total daily doses and adherence %
  let totalDoses = 0;
  let takenCount = 0;
  if (schedule) {
    Object.keys(schedule).forEach((slotKey) => {
      const items = schedule[slotKey]?.items || [];
      items.forEach((med, idx) => {
        totalDoses += 1;
        if (takenMeds[`${slotKey}_${med.drug_name}_${idx}`]) {
          takenCount += 1;
        }
      });
    });
  }
  const adherencePct = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 100;

  const handleToggleMed = (medKey, drugName, dose, slotTitle) => {
    const willBeTaken = !takenMeds[medKey];
    toggleMedTaken(medKey);
    if (willBeTaken) {
      setStatusMessage(`Recorded: ${drugName} (${dose}) marked as taken for ${slotTitle}.`);
    } else {
      setStatusMessage(`Updated: ${drugName} (${dose}) unmarked for ${slotTitle}.`);
    }
  };

  const slotAccentColors = {
    morning: '#E8C840',
    afternoon: '#D4A5E5',
    evening: '#1B7A3D',
    bedtime: '#6B6B6B',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled={true}
    >
      {/* Editorial Greeting & Quick Action */}
      <MotionView delay={10}>
        <View style={styles.greetingBar}>
          <View style={{ flex: 1, marginRight: 12 }}>
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
      </MotionView>

      {/* Inline Error Banner if API sync encountered an error */}
      {error && (
        <View style={styles.errorBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorBannerTitle}>SYNCHRONIZATION ERROR</Text>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={refreshPatientData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline Success Banner when doses are logged */}
      {statusMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#1B7A3D" />
          <Text style={styles.successBannerText}>{statusMessage}</Text>
        </View>
      )}

      {/* Regimen Safety Shield Card — Editorial White Card */}
      <MotionView delay={50}>
        {activeAlert ? (
          <View style={styles.alertShieldCard}>
            <View style={styles.alertShieldTop}>
              <View style={{ flex: 1, marginRight: 10 }}>
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

            <TouchableOpacity
              style={styles.inspectSafetyBtn}
              onPress={() => navigation.navigate('Checker')}
              activeOpacity={0.85}
            >
              <Text style={styles.inspectSafetyBtnText}>
                Check Safer Medication Alternatives
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.safeShieldCard}>
            <Text style={styles.safeEyebrow}>LONGITUDINAL SURVEILLANCE</Text>
            <Text style={styles.safeShieldTitle}>Regimen Safe & Stable</Text>
            <Text style={styles.safeShieldBody}>
              No uncontrolled multi-drug interactions detected across your active prescriptions.
              Low-grade background warnings are suppressed.
            </Text>
          </View>
        )}
      </MotionView>

      {/* Bklit.UI Daily Adherence & Signal Telemetry */}
      <MotionView delay={90}>
        <BklitRingChart
          title="Daily Regimen & Safety Telemetry"
          metrics={[
            {
              label: 'Doses Taken Today',
              display: `${takenCount}/${totalDoses}`,
              percent: adherencePct,
              color: '#1B7A3D',
              subtitle: `${adherencePct}% daily completion`,
            },
            {
              label: 'Peak Signal Priority',
              display: activeAlert ? `${activeAlert.alert_priority_score}` : '0.0',
              percent: activeAlert ? activeAlert.alert_priority_score : 0,
              color: activeAlert ? '#DC2626' : '#1B7A3D',
              subtitle: activeAlert ? `${activeAlert.severity_tier} tier` : 'All stable',
            },
          ]}
        />
      </MotionView>

      {activeAlerts.length > 0 && (
        <MotionView delay={120}>
          <BklitBarChart
            title="Active Regimen Disproportionality (PRR)"
            items={activeAlerts.map((a) => ({
              label: `${a.adverse_event} (${a.combo_str})`,
              value: a.prr,
              cases: a.case_count,
              tier: a.severity_tier,
            }))}
          />
        </MotionView>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>DAILY REGIMEN</Text>
          <Text style={styles.sectionTitle}>Today's Dosing Schedule</Text>
        </View>
      </View>

      {/* Schedule Slots */}
      {schedule &&
        Object.keys(schedule).map((slotKey, sIdx) => {
          const slot = schedule[slotKey];
          if (!slot || !slot.items || slot.items.length === 0) return null;
          const borderAccent = slotAccentColors[slotKey] || '#1B7A3D';

          return (
            <MotionView key={slotKey} delay={140 + sIdx * 40}>
              <View
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
                      onPress={() =>
                        handleToggleMed(medKey, med.drug_name, med.dose, slot.title)
                      }
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
            </MotionView>
          );
        })}

      {/* Clinical Summary Strip */}
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

      <Footer navigation={navigation} />
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
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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
    marginBottom: 18,
  },
  welcomeText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 24,
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
    flexShrink: 0,
  },
  scanQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  errorBannerTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#1A1A1A',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B7A3D',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  alertShieldCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
    marginBottom: 20,
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
  },
  statBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
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
    marginBottom: 14,
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
  inspectSafetyBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inspectSafetyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  safeShieldCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderLeftWidth: 3,
    borderLeftColor: '#1B7A3D',
    padding: 18,
    marginBottom: 20,
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
    marginRight: 8,
  },
  medPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexShrink: 0,
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
