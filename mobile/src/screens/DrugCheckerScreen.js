/**
 * Prospective Drug Safety Checker Screen ("Ask Medicine")
 * Allows patient to verify over-the-counter or new medicines before buying or consuming.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import { checkNewDrug } from '../api/client';

export default function DrugCheckerScreen() {
  const { profile, currentPatientId } = usePatient();
  const [drugInput, setDrugInput] = useState('');
  const [doseInput, setDoseInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quickSamples = [
    { name: 'Ibuprofen', dose: '400', label: 'Ibuprofen (Pain)' },
    { name: 'Paracetamol', dose: '500', label: 'Paracetamol (Fever)' },
    { name: 'Amiodarone', dose: '200', label: 'Amiodarone (Heart)' },
    { name: 'Bactrim', dose: '800', label: 'Bactrim (Sulfa/UTI)' },
    { name: 'Pantoprazole', dose: '40', label: 'Pantoprazole (Antacid)' },
  ];

  const handleCheck = async (nameToCheck = drugInput, doseToCheck = doseInput) => {
    const trimmed = (nameToCheck || '').trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await checkNewDrug(currentPatientId, trimmed, doseToCheck || 0);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to check drug safety');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CRITICAL_CONTRAINDICATION':
        return {
          bg: '#FEF2F2',
          border: '#F87171',
          text: '#DC2626',
          icon: 'close-circle',
          title: 'DO NOT TAKE (CONTRAINDICATED)',
        };
      case 'HIGH_RISK':
        return {
          bg: '#FFF7ED',
          border: '#FB923C',
          text: '#EA580C',
          icon: 'alert-circle',
          title: 'HIGH RISK INTERACTION',
        };
      case 'MODERATE_RISK':
        return {
          bg: '#FFFBEB',
          border: '#FCD34D',
          text: '#D97706',
          icon: 'warning',
          title: 'CAUTION REQUIRED',
        };
      default:
        return {
          bg: '#F0FDF4',
          border: '#86EFAC',
          text: '#16A34A',
          icon: 'checkmark-circle',
          title: 'COMPATIBLE WITH REGIMEN',
        };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Title */}
      <View style={styles.header}>
        <Ionicons name="shield-search" size={24} color="#0284C7" />
        <Text style={styles.headerTitle}>Ask Medicine / OTC Safety</Text>
      </View>
      <Text style={styles.headerSub}>
        Check any tablet, painkiller, or syrup before buying to prevent dangerous interactions with your current prescriptions.
      </Text>

      {/* Input Box */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Enter Medicine Name</Text>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Ibuprofen, Combiflam, Crocin..."
            placeholderTextColor="#94A3B8"
            value={drugInput}
            onChangeText={setDrugInput}
            returnKeyType="search"
            onSubmitEditing={() => handleCheck()}
          />
        </View>

        {/* Quick Test Chips */}
        <Text style={styles.chipsLabel}>Quick Hackathon Test:</Text>
        <View style={styles.chipsRow}>
          {quickSamples.map((sample, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => {
                setDrugInput(sample.name);
                setDoseInput(sample.dose);
                handleCheck(sample.name, sample.dose);
              }}
            >
              <Text style={styles.chipText}>{sample.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.checkBtn, !drugInput.trim() && styles.checkBtnDisabled]}
          disabled={!drugInput.trim() || loading}
          onPress={() => handleCheck()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
              <Text style={styles.checkBtnText}>Check Compatibility</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Result Display */}
      {result && (
        <View style={styles.resultContainer}>
          {(() => {
            const statusStyle = getStatusStyle(result.safety_status);
            return (
              <View
                style={[
                  styles.verdictCard,
                  { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                ]}
              >
                <View style={styles.verdictTop}>
                  <Ionicons name={statusStyle.icon} size={26} color={statusStyle.text} />
                  <Text style={[styles.verdictTitle, { color: statusStyle.text }]}>
                    {statusStyle.title}
                  </Text>
                </View>

                <Text style={styles.verdictDrug}>
                  Tested: <Text style={{ fontWeight: '800' }}>{result.new_drug}</Text>{' '}
                  (Generic: {result.normalized_ingredient})
                </Text>

                <Text style={styles.verdictRec}>{result.recommendation}</Text>

                {/* Allergy Warnings */}
                {result.allergy_warnings?.length > 0 && (
                  <View style={styles.alertDetailBlock}>
                    <Text style={styles.alertDetailHeading}>Allergy Warning:</Text>
                    {result.allergy_warnings.map((al, i) => (
                      <Text key={i} style={styles.alertDetailText}>
                        • {al}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Flagged Interactions */}
                {result.flagged_interactions?.length > 0 && (
                  <View style={styles.alertDetailBlock}>
                    <Text style={styles.alertDetailHeading}>Formed Multi-Drug Interactions:</Text>
                    {result.flagged_interactions.map((combo, i) => (
                      <View key={i} style={styles.interactionItem}>
                        <Text style={styles.comboName}>{combo.combo}</Text>
                        <Text style={styles.comboDetail}>
                          Adverse Risk: <Text style={{ fontWeight: '700' }}>{combo.reaction}</Text> • PRR: {combo.prr}x ({combo.cases} cases in FAERS)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputCard: {
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  checkBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  resultContainer: {
    marginTop: 4,
  },
  verdictCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
  },
  verdictTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  verdictTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  verdictDrug: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 8,
  },
  verdictRec: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertDetailBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertDetailHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  alertDetailText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 2,
  },
  interactionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 6,
  },
  comboName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  comboDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
