/**
 * Patient Health Profile & Electronic Health Record Screen
 * Editorial Health-Tech Aesthetic
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { usePatient } from '../context/PatientContext';
import { API_BASE_URL, setApiBaseUrl } from '../api/client';

export default function PatientProfileScreen() {
  const { profile, refreshPatientData } = usePatient();
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [editingServer, setEditingServer] = useState(false);

  const handleSaveServer = () => {
    setApiBaseUrl(serverUrl.trim());
    setEditingServer(false);
    refreshPatientData();
    Alert.alert('Server Updated', `Backend API URL set to: ${serverUrl.trim()}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Patient Hero Name */}
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>ELECTRONIC HEALTH RECORD</Text>
        <Text style={styles.profileName}>{profile?.name || 'Patient Record'}</Text>
        <Text style={styles.profileMrn}>MRN: {profile?.patient_id}</Text>
      </View>

      {/* Oversized Stat Vitals Row */}
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

      {/* Allergies Section */}
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

      {/* Active Medications List */}
      <View style={styles.sectionBlock}>
        <Text style={styles.eyebrow}>ACTIVE PRESCRIPTIONS</Text>
        {profile?.medications?.map((m, idx) => (
          <View key={idx} style={styles.medicationRow}>
            <View style={{ flex: 1 }}>
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

      {/* Diagnostic Lab Tests */}
      {profile?.lab_results?.length > 0 && (
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
      )}

      {/* Server Connection Settings */}
      <View style={styles.settingsBlock}>
        <Text style={styles.eyebrow}>BACKEND API ENDPOINT</Text>
        <Text style={styles.serverInfo}>{API_BASE_URL}</Text>
        {editingServer ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.XX:8000"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={styles.saveServerBtn} onPress={handleSaveServer}>
                <Text style={styles.saveServerBtnText}>Save Endpoint</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelServerBtn}
                onPress={() => setEditingServer(false)}
              >
                <Text style={styles.cancelServerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.changeServerBtn}
            onPress={() => setEditingServer(true)}
          >
            <Text style={styles.changeServerBtnText}>Configure Host IP for Expo Go</Text>
          </TouchableOpacity>
        )}
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
  heroBlock: {
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  profileMrn: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B6B6B',
    marginTop: 4,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E0',
    paddingVertical: 18,
    marginBottom: 28,
  },
  vitalStat: {
    flex: 1,
  },
  vitalNum: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 28,
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
    marginBottom: 28,
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
  },
  medDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.6,
  },
  medDateVal: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#1A1A1A',
    marginTop: 2,
  },
  labRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  labName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  labValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labValue: {
    fontSize: 13,
    fontFamily: 'monospace',
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
    fontFamily: 'monospace',
    color: '#1A1A1A',
    marginTop: 2,
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
