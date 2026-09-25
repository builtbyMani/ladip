/**
 * Prospective Drug Safety Checker Screen ("Ask Medicine")
 * Editorial Health-Tech Aesthetic
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../context/PatientContext';
import { checkNewDrug } from '../api/client';

export default function DrugCheckerScreen() {
  const { currentPatientId } = usePatient();
  const [drugInput, setDrugInput] = useState('');
  const [doseInput, setDoseInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quickSamples = [
    { name: 'Ibuprofen', dose: '400', label: 'Ibuprofen 400mg' },
    { name: 'Paracetamol', dose: '500', label: 'Paracetamol 500mg' },
    { name: 'Amiodarone', dose: '200', label: 'Amiodarone 200mg' },
    { name: 'Bactrim', dose: '800', label: 'Bactrim 800mg' },
    { name: 'Pantoprazole', dose: '40', label: 'Pantoprazole 40mg' },
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL_CONTRAINDICATION':
        return { text: '#DC2626', title: 'CONTRAINDICATED' };
      case 'HIGH_RISK':
        return { text: '#B48A00', title: 'HIGH INTERACTION RISK' };
      case 'MODERATE_RISK':
        return { text: '#6B6B6B', title: 'MODERATE CAUTION' };
      default:
        return { text: '#1B7A3D', title: 'COMPATIBLE WITH REGIMEN' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PROSPECTIVE CHECK</Text>
        <Text style={styles.headerTitle}>Ask Medicine / OTC Safety</Text>
      </View>
      <Text style={styles.headerSub}>
        Verify any tablet, painkiller, or syrup before purchasing to detect hidden multi-drug interactions with your active regimen.
      </Text>

      {/* Input Form */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Candidate Medication</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Ibuprofen, Paracetamol, Bactrim..."
            placeholderTextColor="#94A3B8"
            value={drugInput}
            onChangeText={setDrugInput}
            returnKeyType="search"
            onSubmitEditing={() => handleCheck()}
          />
        </View>

        {/* Quick Test Chips */}
        <Text style={styles.chipsLabel}>Quick Case Testing</Text>
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

        {/* Black Pill CTA Button */}
        <TouchableOpacity
          style={[styles.checkBtn, !drugInput.trim() && styles.checkBtnDisabled]}
          disabled={!drugInput.trim() || loading}
          onPress={() => handleCheck()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.checkBtnText}>Run Safety Check</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Result Display */}
      {result && (
        <View style={styles.resultContainer}>
          {(() => {
            const statusInfo = getStatusColor(result.safety_status);
            return (
              <View style={[styles.verdictCard, { borderLeftColor: statusInfo.text, borderLeftWidth: 3 }]}>
                <Text style={[styles.verdictEyebrow, { color: statusInfo.text }]}>
                  {statusInfo.title}
                </Text>
                <Text style={styles.verdictDrug}>
                  {result.new_drug} (Generic: {result.normalized_ingredient})
                </Text>

                <Text style={styles.verdictRec}>{result.recommendation}</Text>

                {/* Allergy Warnings */}
                {result.allergy_warnings?.length > 0 && (
                  <View style={styles.alertDetailBlock}>
                    <Text style={styles.alertDetailHeading}>Allergy Warning</Text>
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
                    <Text style={styles.alertDetailHeading}>Emergent FAERS Interactions</Text>
                    {result.flagged_interactions.map((combo, i) => (
                      <View key={i} style={styles.interactionItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Text style={styles.comboName}>{combo.combo}</Text>
                          <Text style={styles.comboPRR}>{combo.prr}x PRR</Text>
                        </View>
                        <Text style={styles.comboDetail}>
                          Adverse Risk: <Text style={{ fontWeight: '700', color: '#DC2626' }}>{combo.reaction}</Text> ({combo.cases} cases reported)
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 44,
  },
  header: {
    marginBottom: 4,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSub: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 8,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  chipsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  checkBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 13,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.4,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#DC2626',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 4,
  },
  verdictCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
  },
  verdictEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  verdictDrug: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  verdictRec: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 14,
  },
  alertDetailBlock: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingTop: 12,
    marginTop: 10,
  },
  alertDetailHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  alertDetailText: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 18,
    marginBottom: 3,
  },
  interactionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
    paddingVertical: 8,
  },
  comboName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  comboPRR: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  comboDetail: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
});
