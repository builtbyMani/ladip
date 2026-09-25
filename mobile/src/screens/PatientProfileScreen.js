/**
 * Patient Health Profile & Electronic Health Record Screen
 * Editorial Health-Tech Aesthetic with Bklit.UI Telemetry, Responsive Vitals Grid, and Motion.dev Physics
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import { API_BASE_URL, setApiBaseUrl } from '../api/client';
import MotionView from '../components/MotionView';
import { BklitRingChart } from '../components/BklitChart';
import Footer from '../components/Footer';

export default function PatientProfileScreen({ navigation }) {
  const { profile, alerts, refreshPatientData } = usePatient();
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [editingServer, setEditingServer] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [serverSuccess, setServerSuccess] = useState(null);

  const handleSaveServer = () => {
    const trimmed = (serverUrl || '').trim();
    if (!trimmed || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) {
      setServerError('Invalid endpoint URL: must start with http:// or https://');
      setServerSuccess(null);
      return;
    }
    setApiBaseUrl(trimmed);
    setEditingServer(false);
    setServerError(null);
    setServerSuccess(`Backend API endpoint updated to ${trimmed} and synchronized.`);
    refreshPatientData();
  };

  const activeAlerts = (alerts || []).filter((a) => !a.is_suppressed);
  const abnormalLabs = (profile?.lab_results || []).filter((l) => l.is_abnormal);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled={true}
    >
      {/* Patient Hero Name */}
      <MotionView delay={10}>
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>ELECTRONIC HEALTH RECORD</Text>
          <Text style={styles.profileName}>{profile?.name || 'Patient Record'}</Text>
          <Text style={styles.profileMrn}>MRN: {profile?.patient_id}</Text>
        </View>
      </MotionView>

      {/* Oversized Stat Vitals Grid (Mobile-Optimized, Zero Horizontal Overflow) */}
      <MotionView delay={40}>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalStat}>
            <Text style={styles.vitalNum}>{profile?.age || '--'}</Text>
            <Text style={styles.vitalLabel}>AGE (YRS)</Text>
          </View>
          <View style={styles.vitalStat}>
            <Text style={styles.vitalNum}>{profile?.sex || '--'}</Text>
            <Text style={styles.vitalLabel}>SEX</Text>
          </View>
          <View style={styles.vitalStat}>
            <Text style={styles.vitalNum}>{profile?.weight || '--'}</Text>
            <Text style={styles.vitalLabel}>WEIGHT (KG)</Text>
          </View>
          <View style={styles.vitalStat}>
            <Text style={styles.vitalNum}>{profile?.medications?.length || 0}</Text>
            <Text style={styles.vitalLabel}>ACTIVE MEDS</Text>
          </View>
        </View>
      </MotionView>

      {/* Bklit.UI Longitudinal EHR Telemetry */}
      <MotionView delay={75}>
        <BklitRingChart
          title="Longitudinal Health Record Summary"
          metrics={[
            {
              label: 'Active Alerts',
              display: `${activeAlerts.length}`,
              percent: Math.min(100, activeAlerts.length * 35),
              color: activeAlerts.length > 0 ? '#DC2626' : '#1B7A3D',
              subtitle: activeAlerts.length > 0 ? 'Actionable risks' : 'Regimen stable',
            },
            {
              label: 'Biomarker Flags',
              display: `${abnormalLabs.length}/${profile?.lab_results?.length || 0}`,
              percent:
                profile?.lab_results?.length > 0
                  ? (abnormalLabs.length / profile.lab_results.length) * 100
                  : 0,
              color: abnormalLabs.length > 0 ? '#E8C840' : '#1B7A3D',
              subtitle: abnormalLabs.length > 0 ? 'Out-of-range labs' : 'Within normal limits',
            },
          ]}
        />
      </MotionView>

      {/* Allergies Section */}
      <MotionView delay={100}>
        <View style={styles.sectionBlock}>
          <Text style={styles.eyebrow}>DOCUMENTED DRUG ALLERGIES</Text>
          {profile?.allergies?.length > 0 ? (
            <View style={styles.badgeRow}>
              {profile.allergies.map((al, idx) => (
                <View key={idx} style={styles.allergyBadge}>
                  <Text style={styles.allergyBadgeText}>{al}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.safeText}>No known drug allergies (NKDA).</Text>
          )}
        </View>

        {/* Active Diagnoses */}
        <View style={styles.sectionBlock}>
          <Text style={styles.eyebrow}>ACTIVE CLINICAL DIAGNOSES</Text>
          {profile?.conditions?.length > 0 ? (
            profile.conditions.map((cond, idx) => (
              <View key={idx} style={styles.conditionRow}>
                <Text style={styles.conditionText}>{cond}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No active conditions logged.</Text>
          )}
        </View>
      </MotionView>

      {/* Active Medications List */}
      <MotionView delay={130}>
        <View style={styles.sectionBlock}>
          <Text style={styles.eyebrow}>ACTIVE PRESCRIPTIONS</Text>
          {profile?.medications?.map((m, idx) => (
            <View key={idx} style={styles.medicationRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.medRowName}>{m.drug_name}</Text>
                <Text style={styles.medRowSub}>
                  Generic: {m.normalized_name} • RxCUI {m.rxcui || 'N/A'}
                </Text>
                <Text style={styles.medRowDose}>
                  {m.dose} {m.dose_unit} • {m.frequency} ({m.route})
                </Text>
              </View>
              <View style={styles.medDateBlock}>
                <Text style={styles.medDateLabel}>STARTED</Text>
                <Text style={styles.medDateVal}>{m.start_date || 'Active'}</Text>
              </View>
            </View>
          ))}
        </View>
      </MotionView>

      {/* Diagnostic Lab Tests */}
      {profile?.lab_results?.length > 0 && (
        <MotionView delay={160}>
          <View style={styles.sectionBlock}>
            <Text style={styles.eyebrow}>RECENT LABORATORY BIOMARKERS</Text>
            {profile.lab_results.map((lab, idx) => (
              <View key={idx} style={styles.labRow}>
                <Text style={styles.labName}>{lab.test}</Text>
                <View style={styles.labValWrap}>
                  <Text
                    style={[
                      styles.labValue,
                      lab.is_abnormal && { color: '#DC2626', fontWeight: '700' },
                    ]}
                  >
                    {lab.value} {lab.unit}
                  </Text>
                  {lab.is_abnormal && (
                    <View style={styles.abnormalBadge}>
                      <Text style={styles.abnormalBadgeText}>ABNORMAL</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </MotionView>
      )}

      {/* Server Connection Settings */}
      <View style={styles.settingsBlock}>
        <Text style={styles.eyebrow}>BACKEND API ENDPOINT</Text>
        <Text style={styles.serverInfo}>{API_BASE_URL}</Text>

        {serverError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        )}

        {serverSuccess && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color="#1B7A3D" />
            <Text style={styles.successText}>{serverSuccess}</Text>
          </View>
        )}

        {editingServer ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://localhost:8000"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={styles.saveServerBtn} onPress={handleSaveServer}>
                <Text style={styles.saveServerBtnText}>Save Endpoint</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelServerBtn}
                onPress={() => {
                  setEditingServer(false);
                  setServerError(null);
                }}
              >
                <Text style={styles.cancelServerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.changeServerBtn}
            onPress={() => {
              setEditingServer(true);
              setServerSuccess(null);
            }}
          >
            <Text style={styles.changeServerBtnText}>Configure Backend Service URL</Text>
          </TouchableOpacity>
        )}
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
  heroBlock: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  profileName: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  profileMrn: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: '#6B6B6B',
    marginTop: 4,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E0',
    paddingVertical: 16,
    marginBottom: 22,
    rowGap: 14,
  },
  vitalStat: {
    minWidth: '46%',
    flex: 1,
  },
  vitalNum: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  allergyBadge: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  allergyBadgeText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
  },
  safeText: {
    color: '#1B7A3D',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyText: {
    color: '#6B6B6B',
    fontSize: 13,
  },
  conditionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  conditionText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  medicationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  medRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  medRowSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  medRowDose: {
    fontSize: 12,
    color: '#1B7A3D',
    fontWeight: '600',
    marginTop: 4,
  },
  medDateBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.6,
  },
  medDateVal: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: '#1A1A1A',
    marginTop: 2,
  },
  labRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    gap: 8,
  },
  labName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  labValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labValue: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: '#1A1A1A',
  },
  abnormalBadge: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  abnormalBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  settingsBlock: {
    backgroundColor: '#F5F5F0',
    padding: 16,
    marginTop: 8,
  },
  serverInfo: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: '#1A1A1A',
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1B7A3D',
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginTop: 8,
  },
  successText: {
    fontSize: 11,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
  },
  serverInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A1A1A',
  },
  saveServerBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  saveServerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelServerBtn: {
    borderWidth: 1,
    borderColor: '#E5E5E0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  cancelServerBtnText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  changeServerBtn: {
    marginTop: 8,
  },
  changeServerBtnText: {
    fontSize: 11,
    color: '#1B7A3D',
    fontWeight: '700',
  },
});
