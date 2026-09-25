/**
 * Prospective Drug Safety Checker Screen ("Ask Medicine")
 * Editorial Health-Tech Aesthetic with Bklit.UI Charts & Motion.dev Spring Physics
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
import MotionView from '../components/MotionView';
import { BklitBarChart } from '../components/BklitChart';
import Footer from '../components/Footer';

export default function DrugCheckerScreen({ navigation }) {
  const { currentPatientId, profile } = usePatient();
  const [drugInput, setDrugInput] = useState('');
  const [doseInput, setDoseInput] = useState('400');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const quickSamples = [
    { name: 'Ibuprofen', dose: '400', label: 'Ibuprofen 400mg' },
    { name: 'Paracetamol', dose: '500', label: 'Paracetamol 500mg' },
    { name: 'Amiodarone', dose: '200', label: 'Amiodarone 200mg' },
    { name: 'Bactrim', dose: '800', label: 'Bactrim 800mg' },
    { name: 'Pantoprazole', dose: '40', label: 'Pantoprazole 40mg' },
  ];

  const handleCheck = async (nameToCheck = drugInput, doseToCheck = doseInput) => {
    const trimmed = (nameToCheck || '').trim();
    if (!trimmed || !/[a-zA-Z]/.test(trimmed)) {
      setError('Please enter a valid medication name (letters required) before running a safety check.');
      setSuccessMsg(null);
      setResult(null);
      return;
    }

    const numericDose = parseFloat(doseToCheck);
    if (doseToCheck === '' || Number.isNaN(numericDose) || numericDose <= 0) {
      setError('Invalid dosage amount: please enter a dose greater than 0 mg to evaluate prospective safety.');
      setSuccessMsg(null);
      setResult(null);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setResult(null);

    try {
      const data = await checkNewDrug(currentPatientId, trimmed, numericDose);
      setResult(data);
      const patientLabel = profile?.name || currentPatientId;
      if (
        data.safety_status === 'CRITICAL_CONTRAINDICATION' ||
        data.safety_status === 'HIGH_RISK'
      ) {
        setError(
          `${
            data.safety_status === 'CRITICAL_CONTRAINDICATION'
              ? 'CRITICAL CONTRAINDICATION'
              : 'HIGH INTERACTION RISK'
          }: Prescribing ${trimmed} (${numericDose} mg) to ${patientLabel} triggers high-severity pharmacovigilance warnings.`
        );
      } else {
        setSuccessMsg(
          `Prospective safety verification passed: ${trimmed} (${numericDose} mg) evaluated against ${patientLabel}'s active regimen.`
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate medication safety. Please verify network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDrugInput('');
    setDoseInput('');
    setResult(null);
    setError(null);
    setSuccessMsg(null);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled={true}
    >
      {/* Editorial Header */}
      <MotionView delay={10}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>PROSPECTIVE CHECK</Text>
          <Text style={styles.headerTitle}>Ask Medicine / OTC Safety</Text>
        </View>
        <Text style={styles.headerSub}>
          Verify any tablet, painkiller, or syrup before purchasing to detect hidden multi-drug
          interactions with your active regimen.
        </Text>
      </MotionView>

      {/* Input Form */}
      <MotionView delay={45}>
        <View style={styles.inputCard}>
          <View style={styles.formFieldsRow}>
            <View style={{ flex: 2, minWidth: 160 }}>
              <Text style={styles.inputLabel}>Candidate Medication</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter medication name"
                  placeholderTextColor="#6B6B6B"
                  value={drugInput}
                  onChangeText={setDrugInput}
                  returnKeyType="search"
                  onSubmitEditing={() => handleCheck()}
                />
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 90 }}>
              <Text style={styles.inputLabel}>Dose (mg)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="400"
                  placeholderTextColor="#6B6B6B"
                  value={doseInput}
                  onChangeText={setDoseInput}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Quick Test Chips */}
          <Text style={styles.chipsLabel}>Clinical Test Candidates</Text>
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

          {/* Action Buttons Row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.checkBtn}
              disabled={loading}
              onPress={() => handleCheck()}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.checkBtnText}>Run Safety Check</Text>
              )}
            </TouchableOpacity>

            {(drugInput || result || error) && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </MotionView>

      {/* Error Message Banner */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Success Message Banner */}
      {successMsg && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color="#1B7A3D" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Result Display */}
      {result && (
        <MotionView delay={30} style={styles.resultContainer}>
          {(() => {
            const statusInfo = getStatusColor(result.safety_status);
            return (
              <View
                style={[
                  styles.verdictCard,
                  { borderLeftColor: statusInfo.text, borderLeftWidth: 3 },
                ]}
              >
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

                {/* Patient Organ Vulnerability Warnings */}
                {result.vulnerability_warnings?.length > 0 && (
                  <View style={styles.alertDetailBlock}>
                    <Text style={styles.alertDetailHeading}>Patient Organ Vulnerabilities</Text>
                    {result.vulnerability_warnings.map((vw, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.alertDetailText,
                          { color: '#1A1A1A', borderLeftWidth: 2, borderLeftColor: '#E8C840', paddingLeft: 8 },
                        ]}
                      >
                        {vw}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Flagged Interactions + Bklit.UI Chart */}
                {result.flagged_interactions?.length > 0 && (
                  <View style={styles.alertDetailBlock}>
                    <BklitBarChart
                      title="Emergent Multi-Drug PRR Comparison"
                      items={result.flagged_interactions.map((c) => ({
                        label: `${c.reaction} (${c.combo})`,
                        value: c.prr,
                        cases: c.cases,
                        tier: c.tier,
                      }))}
                    />
                    <Text style={styles.alertDetailHeading}>Emergent FAERS Interactions</Text>
                    {result.flagged_interactions.map((combo, i) => (
                      <View key={i} style={styles.interactionItem}>
                        <View style={styles.interactionTopRow}>
                          <Text style={styles.comboName}>{combo.combo}</Text>
                          <Text style={styles.comboPRR}>{combo.prr}x PRR</Text>
                        </View>
                        <Text style={styles.comboDetail}>
                          Adverse Risk:{' '}
                          <Text style={{ fontWeight: '700', color: '#DC2626' }}>
                            {combo.reaction}
                          </Text>{' '}
                          ({combo.cases} cases reported)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </MotionView>
      )}

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
    marginBottom: 16,
  },
  formFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 6,
    marginBottom: 14,
  },
  textInput: {
    fontSize: 15,
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
    marginBottom: 18,
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
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  checkBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 13,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#E5E5E0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  clearBtnText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1B7A3D',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  successText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
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
  interactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  comboName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  comboPRR: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#1A1A1A',
    flexShrink: 0,
  },
  comboDetail: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
});
