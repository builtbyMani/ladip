/**
 * Today's Medicine Schedule & Regimen Safety Shield Screen — Website-Matched UI
 * Ordered by clinical priority:
 * 1) ADR / Clinical Interaction Card
 * 2) Today's Dosing Schedule (with red dot + "Interacts — see alert above" on interacting meds)
 * 3) Clinical Context (Conditions & Allergies)
 * 4) Clinical Workflow Bento Cards, Telemetry Charts, Medication Reminders, and Footer
 */
import React, { useState } from 'react';
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
import MotionView from '../components/MotionView';
import PatientAvatar, {
  BlueVialsIllustration,
  SandInjectorsIllustration,
  LavenderTabletsIllustration,
  MintBottleIllustration,
  getPatientPersona,
} from '../components/PatientAvatar';
import { BklitBarChart, BklitRingChart } from '../components/BklitChart';
import Footer from '../components/Footer';

export default function TodayScheduleScreen({ navigation }) {
  const {
    currentPatientId,
    profile,
    schedule,
    alerts,
    loading,
    error,
    takenMeds,
    toggleMedTaken,
    markSlotDosesTaken,
    remindersEnabled,
    scheduledReminders,
    activeDoseNotification,
    toggleRemindersEnabled,
    sendDoseNotificationNow,
    dismissDoseNotification,
    lockSession,
    refreshPatientData,
  } = usePatient();
  const [statusMessage, setStatusMessage] = useState(null);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B6EA8" />
        <Text style={styles.loadingText}>Syncing longitudinal safety profile...</Text>
      </View>
    );
  }

  const persona = getPatientPersona(currentPatientId || profile?.patient_id, profile?.name);
  const activeAlerts = (alerts || []).filter((a) => !a.is_suppressed);
  const criticalAlert = activeAlerts.find((a) => a.severity_tier === 'CRITICAL');
  const highAlert = activeAlerts.find((a) => a.severity_tier === 'HIGH');
  const activeAlert = criticalAlert || highAlert;

  // Build normalized set of interacting medication names from activeAlerts
  const interactingDrugSet = new Set();
  activeAlerts.forEach((alert) => {
    if (Array.isArray(alert.drug_combo)) {
      alert.drug_combo.forEach((d) => {
        if (d) interactingDrugSet.add(String(d).trim().toLowerCase());
      });
    }
    if (alert.combo_str) {
      alert.combo_str.split('+').forEach((d) => {
        if (d) interactingDrugSet.add(String(d).trim().toLowerCase());
      });
    }
  });

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

  const handleMarkNotificationTaken = () => {
    if (!activeDoseNotification) return;
    markSlotDosesTaken(activeDoseNotification.slotKey);
    setStatusMessage(
      `All medications for ${activeDoseNotification.slotTitle} marked as taken.`
    );
  };

  const handleSnoozeNotification = () => {
    if (!activeDoseNotification) return;
    const slotTitle = activeDoseNotification.slotTitle;
    dismissDoseNotification();
    setStatusMessage(`Snoozed ${slotTitle} medication reminder for 15 minutes.`);
  };

  const handleSendTestReminder = async () => {
    const notif = await sendDoseNotificationNow();
    if (notif) {
      setStatusMessage(`Sent medication due notification for ${notif.slotTitle}.`);
    }
  };

  const slotPastelThemes = {
    morning: { bg: '#EAF2FA', accent: '#3B6EA8', pillBg: '#DCEBFA' },
    afternoon: { bg: '#F5F2EB', accent: '#8C6239', pillBg: '#EDE6D8' },
    evening: { bg: '#EAF5F0', accent: '#1B7A3D', pillBg: '#D1FAE5' },
    bedtime: { bg: '#F0EDF8', accent: '#5E4FA2', pillBg: '#EDE9FE' },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled={true}
    >
      {/* Website-Matched Hero Eyebrow & Greeting */}
      <MotionView delay={10}>
        <View style={styles.topEyebrowRow}>
          <View style={styles.engineBadge}>
            <Ionicons name="sparkles" size={11} color="#3B6EA8" />
            <Text style={styles.engineBadgeText}>LONGITUDINAL PHARMACOVIGILANCE</Text>
          </View>
          <Text style={styles.signalRatioText}>
            {activeAlerts.length} Active Alerts
          </Text>
        </View>

        <View style={styles.greetingBar}>
          <View style={styles.greetingLeft}>
            <PatientAvatar
              patientId={currentPatientId || profile?.patient_id}
              fallbackName={profile?.name}
              size="lg"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>
                Namaste, {profile?.name ? profile.name.split(' ')[0] : 'Ramesh'}
              </Text>
              <Text style={styles.personaMetaText}>{persona.clinicalTag}</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
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

      {/* ACTIVE MEDICATION DOSE TIME NOTIFICATION BANNER (Only appears when triggered/due) */}
      {activeDoseNotification && (
        <MotionView delay={18}>
          <View style={styles.doseDueNotificationCard}>
            <View style={styles.doseDueTopRow}>
              <View style={styles.doseDueBadge}>
                <Ionicons name="notifications" size={12} color="#FFFFFF" />
                <Text style={styles.doseDueBadgeText}>
                  TIME TO TAKE MEDICATION • {activeDoseNotification.shortTime}
                </Text>
              </View>
              <TouchableOpacity onPress={dismissDoseNotification}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.doseDueTitle}>{activeDoseNotification.title}</Text>
            <Text style={styles.doseDueBody}>{activeDoseNotification.body}</Text>

            <View style={styles.doseDueActionRow}>
              <TouchableOpacity
                style={styles.doseDueConfirmBtn}
                onPress={handleMarkNotificationTaken}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.doseDueConfirmText}>Mark Dose as Taken</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doseDueSnoozeBtn}
                onPress={handleSnoozeNotification}
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={15} color="#111827" />
                <Text style={styles.doseDueSnoozeText}>Snooze 15m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </MotionView>
      )}

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

      {/* =========================================================================
          1) FIRST: ADR / CLINICAL INTERACTION CARD
         ========================================================================= */}
      <MotionView delay={25}>
        {activeAlert ? (
          <View style={styles.alertShieldCard}>
            <View style={styles.alertShieldTop}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={styles.criticalPillBadge}>
                  <Ionicons name="warning" size={11} color="#DC2626" />
                  <Text style={styles.criticalPillBadgeText}>
                    {activeAlert.severity_tier} INTERACTION DETECTED
                  </Text>
                </View>
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
                <View style={styles.symptomBadge}>
                  <Text style={styles.symptomBadgeText}>Symptom Correlated</Text>
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

      {/* =========================================================================
          2) SECOND: TODAY'S DOSING SCHEDULE (Marks Interacting Drugs with Red Dot)
         ========================================================================= */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>DAILY REGIMEN</Text>
        <Text style={styles.sectionTitle}>Today's Dosing Schedule</Text>
      </View>

      {schedule &&
        Object.keys(schedule).map((slotKey, sIdx) => {
          const slot = schedule[slotKey];
          if (!slot || !slot.items || slot.items.length === 0) return null;
          const theme = slotPastelThemes[slotKey] || slotPastelThemes.morning;

          return (
            <MotionView key={slotKey} delay={45 + sIdx * 30}>
              <View style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[styles.slotAccentDot, { backgroundColor: theme.accent }]}
                    />
                    <Text style={styles.slotTitle}>{slot.title}</Text>
                  </View>
                  <View style={[styles.slotCountBadge, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.slotCountText, { color: theme.accent }]}>
                      {slot.items.length} {slot.items.length === 1 ? 'DOSE' : 'DOSES'}
                    </Text>
                  </View>
                </View>

                {slot.items.map((med, idx) => {
                  const medKey = `${slotKey}_${med.drug_name}_${idx}`;
                  const isTaken = takenMeds[medKey];
                  const normalizedDrugName = String(med.drug_name || '')
                    .trim()
                    .toLowerCase();
                  const isInteractingDrug =
                    Boolean(activeAlert) && interactingDrugSet.has(normalizedDrugName);

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
                        color={isTaken ? '#1B7A3D' : '#94A3B8'}
                      />
                      <View style={styles.medDetails}>
                        <View style={styles.medPillRow}>
                          {isInteractingDrug && (
                            <View style={styles.interactingRedDot} />
                          )}
                          <View style={styles.blackDrugPill}>
                            <Text style={styles.blackDrugPillText}>
                              {med.drug_name} · {med.dose}
                            </Text>
                          </View>
                        </View>
                        {isInteractingDrug ? (
                          <Text style={styles.interactsWarningText}>
                            Interacts — see alert above
                          </Text>
                        ) : null}
                        <Text style={styles.medInstructions}>
                          {med.dose} • {med.instructions}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusActionPill,
                          isTaken && styles.statusActionPillTaken,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusLabel,
                            isTaken && styles.statusLabelTaken,
                          ]}
                        >
                          {isTaken ? 'TAKEN' : 'MARK'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </MotionView>
          );
        })}

      {/* =========================================================================
          3) THIRD: CLINICAL CONTEXT (Conditions & Allergies)
         ========================================================================= */}
      <MotionView delay={110}>
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
      </MotionView>

      {/* =========================================================================
          4) REMAINING SECTIONS: WORKFLOW CARDS, TELEMETRY, ALARMS & FOOTER
         ========================================================================= */}
      <MotionView delay={135}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>CLINICAL WORKFLOWS</Text>
          <Text style={styles.sectionTitle}>Safety & Diagnostic Tools</Text>
        </View>

        <View style={styles.workflowGrid}>
          {/* Card 1: Interaction Discovery (#EAF2FA + Blue Vials) */}
          <TouchableOpacity
            style={[styles.workflowCard, { backgroundColor: '#EAF2FA' }]}
            onPress={() => navigation.navigate('Schedule')}
            activeOpacity={0.88}
          >
            <View style={styles.workflowCardTop}>
              <Text style={[styles.workflowCardTitle, { color: '#3B6EA8' }]}>
                Interaction{'\n'}Discovery
              </Text>
              <View style={styles.workflowDarkArrow}>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.workflowCardSub}>Longitudinal FAERS & Naranjo</Text>
            <View style={styles.workflowIllusHolder}>
              <BlueVialsIllustration scale={0.95} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Prospective Safety (#F5F2EB + Sand Injectors) */}
          <TouchableOpacity
            style={[styles.workflowCard, { backgroundColor: '#F5F2EB' }]}
            onPress={() => navigation.navigate('Checker')}
            activeOpacity={0.88}
          >
            <View style={styles.workflowCardTop}>
              <Text style={[styles.workflowCardTitle, { color: '#8C6239' }]}>
                Prospective{'\n'}Safety
              </Text>
              <View style={styles.workflowDarkArrow}>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.workflowCardSub}>OTC & Brand Strip Scanner</Text>
            <View style={styles.workflowIllusHolder}>
              <SandInjectorsIllustration scale={0.95} />
            </View>
          </TouchableOpacity>

          {/* Card 3: EHR & OCR Parser (#F0EDF8 + Lavender Tablets) */}
          <TouchableOpacity
            style={[styles.workflowCard, { backgroundColor: '#F0EDF8' }]}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.88}
          >
            <View style={styles.workflowCardTop}>
              <Text style={[styles.workflowCardTitle, { color: '#5E4FA2' }]}>
                EHR & OCR{'\n'}Parser
              </Text>
              <View style={styles.workflowDarkArrow}>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.workflowCardSub}>Scan Rx & Lab Timeline</Text>
            <View style={styles.workflowIllusHolder}>
              <LavenderTabletsIllustration scale={0.95} />
            </View>
          </TouchableOpacity>

          {/* Card 4: Health Profile (#EAF5F0 + Mint Bottle) */}
          <TouchableOpacity
            style={[styles.workflowCard, { backgroundColor: '#EAF5F0' }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.88}
          >
            <View style={styles.workflowCardTop}>
              <Text style={[styles.workflowCardTitle, { color: '#1B7A3D' }]}>
                Patient{'\n'}Health Record
              </Text>
              <View style={styles.workflowDarkArrow}>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.workflowCardSub}>Vitals, Labs & Allergies</Text>
            <View style={styles.workflowIllusHolder}>
              <MintBottleIllustration scale={0.95} />
            </View>
          </TouchableOpacity>
        </View>
      </MotionView>

      {/* Daily Adherence & Signal Telemetry */}
      <MotionView delay={155}>
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
        <MotionView delay={170}>
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

      {/* Medication Reminders / Daily Dose Alarms */}
      <MotionView delay={185}>
        <View style={styles.reminderControlCard}>
          <View style={styles.reminderHeaderRow}>
            <View style={styles.reminderTitleColumn}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons
                  name={remindersEnabled ? 'alarm-outline' : 'notifications-off-outline'}
                  size={14}
                  color="#1B7A3D"
                />
                <Text style={styles.reminderEyebrow}>MEDICATION REMINDERS</Text>
              </View>
              <Text style={styles.reminderMainHeading}>
                Daily Dose Alarms ({scheduledReminders.length || 3} Slots)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.reminderTogglePill,
                !remindersEnabled && styles.reminderTogglePillPaused,
              ]}
              onPress={toggleRemindersEnabled}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.reminderStatusDot,
                  !remindersEnabled && { backgroundColor: '#94A3B8' },
                ]}
              />
              <Text
                style={[
                  styles.reminderToggleText,
                  !remindersEnabled && { color: '#475569' },
                ]}
              >
                {remindersEnabled ? 'ALARMS ON' : 'PAUSED'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.alarmPillsRow}>
            {(scheduledReminders.length > 0
              ? scheduledReminders
              : [
                  { slotKey: 'morning', shortTime: '8:00 AM', medCount: 3 },
                  { slotKey: 'afternoon', shortTime: '1:00 PM', medCount: 1 },
                  { slotKey: 'evening', shortTime: '7:00 PM', medCount: 1 },
                ]
            ).map((alarm) => (
              <TouchableOpacity
                key={alarm.slotKey}
                style={styles.alarmSlotChip}
                onPress={() => sendDoseNotificationNow(alarm.slotKey)}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={12} color="#1B7A3D" />
                <Text style={styles.alarmSlotChipText}>
                  {alarm.shortTime} ({alarm.medCount} {alarm.medCount === 1 ? 'med' : 'meds'})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.reminderBtnRow}>
            <TouchableOpacity
              style={styles.triggerReminderBtn}
              onPress={handleSendTestReminder}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications" size={14} color="#FFFFFF" />
              <Text style={styles.triggerReminderBtnText}>Notify Dose Due Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lockBiometricBtn}
              onPress={lockSession}
              activeOpacity={0.85}
            >
              <Ionicons name="finger-print" size={14} color="#111827" />
              <Text style={styles.lockBiometricBtnText}>1-Tap Lock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </MotionView>

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
    padding: 16,
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
    color: '#64748B',
  },
  topEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  engineBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#3B6EA8',
    letterSpacing: 0.8,
  },
  signalRatioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B6EA8',
  },
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  personaMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#3B6EA8',
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scanQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 9999,
    gap: 6,
    flexShrink: 0,
  },
  scanQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  workflowCard: {
    width: '48.5%',
    borderRadius: 22,
    padding: 14,
    minHeight: 146,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  workflowCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workflowCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  workflowDarkArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowCardSub: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
    marginTop: 4,
  },
  workflowIllusHolder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    gap: 10,
  },
  errorBannerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#111827',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#111827',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(27, 122, 61, 0.3)',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    gap: 8,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  alertShieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
  },
  alertShieldTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  criticalPillBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  criticalPillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  alertComboText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },
  statBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  statHeroNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 30,
  },
  statHeroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  alertAdviceText: {
    fontSize: 13,
    color: '#475569',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  outlinedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  symptomBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  symptomBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  inspectSafetyBtn: {
    backgroundColor: '#111827',
    borderRadius: 9999,
    paddingVertical: 11,
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
    backgroundColor: '#EAF5F0',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 18,
    marginBottom: 20,
  },
  safeEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  safeShieldTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  safeShieldBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 6,
  },
  slotAccentDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  slotTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  slotCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  slotCountText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 4,
  },
  interactingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  blackDrugPill: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  blackDrugPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  interactsWarningText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  medInstructions: {
    fontSize: 12,
    color: '#64748B',
  },
  statusActionPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusActionPillTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#475569',
  },
  statusLabelTaken: {
    color: '#1B7A3D',
  },
  infoStrip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  infoLine: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    marginTop: 4,
  },
  infoLabel: {
    fontWeight: '700',
    color: '#111827',
  },
  doseDueNotificationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(27, 122, 61, 0.45)',
    padding: 16,
    marginBottom: 16,
  },
  doseDueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  doseDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1B7A3D',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  doseDueBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  doseDueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  doseDueBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  doseDueActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doseDueConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B7A3D',
    paddingVertical: 11,
    borderRadius: 9999,
  },
  doseDueConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  doseDueSnoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  doseDueSnoozeText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  reminderControlCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 8,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  reminderTitleColumn: {
    flex: 1,
    paddingRight: 8,
  },
  reminderEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1B7A3D',
    letterSpacing: 0.8,
  },
  reminderMainHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  reminderTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1B7A3D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    flexShrink: 0,
  },
  reminderTogglePillPaused: {
    backgroundColor: '#E2E8F0',
  },
  reminderStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  reminderToggleText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  alarmPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  alarmSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  alarmSlotChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  reminderBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerReminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingVertical: 11,
    borderRadius: 9999,
  },
  triggerReminderBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  lockBiometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  lockBiometricBtnText: {
    color: '#111827',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
