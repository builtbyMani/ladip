/**
 * Header Component with Indian Patient Switcher Modal
 * Built for hackathon demonstrations with one-tap patient scenario switching.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';

export default function Header() {
  const { profile, patients, currentPatientId, switchPatient } = usePatient();
  const [modalVisible, setModalVisible] = useState(false);

  const scenarioDescriptions = {
    PT_BLEED_001: '🚨 Ramesh Sharma (Warfarin + Aspirin + Ibuprofen -> GI Bleed)',
    PT_STATIN_002: '🚨 Sunita Patel (Simvastatin + Amlodipine + Amiodarone -> Rhabdomyolysis)',
    PT_MTX_003: '🚨 Kavitha Reddy (Methotrexate + Bactrim + Naproxen -> Pancytopenia)',
    PT_CARDIO_005: '⚠️ Arjun Nair (Clopidogrel + Omeprazole -> Antiplatelet Failure)',
    PT_STABLE_004: '🛡️ Rajesh Varma (Stable 2yr Chronic Cohort - Anti-Fatigue Demo)',
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.appTitle}>LADIP</Text>
          <Text style={styles.appSubtitle}>Patient Safety Copilot</Text>
        </View>

        {/* Patient Switcher Button */}
        <TouchableOpacity
          style={styles.patientBadge}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.patientBadgeText} numberOfLines={1}>
            {profile?.name ? profile.name.split('(')[0].trim() : 'Select Patient'}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

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
                <Text style={styles.modalTitle}>Switch Patient Scenario</Text>
                <Text style={styles.modalSub}>Select a case study to test interactions</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
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
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? '#0284C7' : '#94A3B8'}
                      />
                      <View style={{ marginLeft: 10, flex: 1 }}>
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 200,
  },
  patientBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  patientOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientOptionActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionNameActive: {
    color: '#0284C7',
  },
  optionDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
});
