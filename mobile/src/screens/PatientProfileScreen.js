/**
 * Patient Health Profile & Electronic Health Record Screen
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      {/* Patient Demographic Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={28} color="#0284C7" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'Patient Record'}</Text>
          <Text style={styles.profileSub}>
            MRN: {profile?.patient_id} • Age: {profile?.age}y • {profile?.sex}
          </Text>
          <Text style={styles.profileWeight}>Weight: {profile?.weight} kg</Text>
        </View>
      </View>

      {/* Allergies Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning-outline" size={18} color="#DC2626" />
          <Text style={styles.sectionTitle}>Documented Drug Allergies</Text>
        </View>
        {profile?.allergies?.length > 0 ? (
          <View style={styles.badgeRow}>
            {profile.allergies.map((al, idx) => (
              <View key={idx} style={styles.allergyBadge}>
                <Text style={styles.allergyBadgeText}>⚠️ {al}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No known drug allergies (NKDA).</Text>
        )}
      </View>

      {/* Active Diagnoses */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="fitness-outline" size={18} color="#0284C7" />
          <Text style={styles.sectionTitle}>Active Clinical Diagnoses</Text>
        </View>
        {profile?.conditions?.length > 0 ? (
          profile.conditions.map((cond, idx) => (
            <View key={idx} style={styles.conditionItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.conditionText}>{cond}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active conditions logged.</Text>
        )}
      </View>

      {/* Active Medications List */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit-outline" size={18} color="#16A34A" />
          <Text style={styles.sectionTitle}>Active Prescriptions ({profile?.medications?.length || 0})</Text>
        </View>
        {profile?.medications?.map((m, idx) => (
          <View key={idx} style={styles.medicationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.medRowName}>{m.drug_name}</Text>
              <Text style={styles.medRowSub}>
                Generic: {m.normalized_name} (RxCUI: {m.rxcui || 'N/A'})
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
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask-outline" size={18} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Recent Laboratory Biomarkers</Text>
          </View>
          {profile.lab_results.map((lab, idx) => (
            <View key={idx} style={styles.labRow}>
              <Text style={styles.labName}>{lab.test}</Text>
              <View style={styles.labValWrap}>
                <Text style={[styles.labValue, lab.is_abnormal && { color: '#DC2626', fontWeight: '800' }]}>
                  {lab.value} {lab.unit}
                </Text>
                {lab.is_abnormal && <Text style={styles.abnormalBadge}>ABNORMAL</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Server Connection Settings (Helpful for Hackathon testing on real phones) */}
      <View style={styles.settingsCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={16} color="#64748B" />
          <Text style={styles.settingsTitle}>Backend Server Connection</Text>
        </View>
        <Text style={styles.serverInfo}>
          Current API Base: <Text style={{ fontWeight: '700' }}>{API_BASE_URL}</Text>
        </Text>
        {editingServer ? (
          <View style={{ marginTop: 8 }}>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.XX:8000"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={styles.saveServerBtn} onPress={handleSaveServer}>
                <Text style={styles.saveServerBtnText}>Save</Text>
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
            <Text style={styles.changeServerBtnText}>Change Host IP (For Physical Expo Go)</Text>
          </TouchableOpacity>
        )}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileWeight: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  allergyBadgeText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletDot: {
    color: '#0284C7',
    fontSize: 16,
    marginRight: 8,
  },
  conditionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  medicationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  medRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medRowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  medRowDose: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  medDateBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  medDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  medDateVal: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  labRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  labName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  labValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#0F172A',
  },
  abnormalBadge: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  settingsCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  settingsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  serverInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  serverInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  saveServerBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveServerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelServerBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelServerBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  changeServerBtn: {
    marginTop: 6,
  },
  changeServerBtnText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
});
