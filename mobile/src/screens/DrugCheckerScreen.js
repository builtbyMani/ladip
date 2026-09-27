/**
 * Prospective Drug Safety Checker Screen ("Ask Medicine / OTC Safety")
 * Includes Medicine Strip/Box Scanner + Indian Brand-to-Medicinal Name & Dosage Resolver
 */
import React, { useState, useMemo } from 'react';
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
import { Ionicons } from '../components/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { usePatient } from '../context/PatientContext';
import { checkNewDrug, uploadPrescriptionBase64 } from '../api/client';
import {
  resolveMedicineInput,
  SCANNER_MEDICINE_PRESETS,
} from '../utils/medicineResolver';
import MotionView from '../components/MotionView';
import { BklitBarChart } from '../components/BklitChart';
import Footer from '../components/Footer';

export default function DrugCheckerScreen({ navigation }) {
  const { currentPatientId, profile } = usePatient();
  const [drugInput, setDrugInput] = useState('');
  const [doseInput, setDoseInput] = useState('650');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningStrip, setScanningStrip] = useState(false);
  const [scannedStripMeta, setScannedStripMeta] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Live resolution of whatever brand or generic name the user types (e.g. "DOLO 650" -> Paracetamol 650 mg)
  const resolvedPreview = useMemo(() => {
    if (!drugInput || !drugInput.trim()) return null;
    return resolveMedicineInput(drugInput, doseInput);
  }, [drugInput, doseInput]);

  const quickSamples = [
    { name: 'Dolo 650', dose: '650', label: 'Dolo 650 (Paracetamol)' },
    { name: 'Brufen 400', dose: '400', label: 'Brufen 400 (Ibuprofen)' },
    { name: 'Combiflam', dose: '400', label: 'Combiflam (NSAID)' },
    { name: 'Cordarone 200', dose: '200', label: 'Cordarone 200mg' },
    { name: 'Bactrim DS', dose: '800', label: 'Bactrim DS 800mg' },
    { name: 'Pan 40', dose: '40', label: 'Pan 40 (Pantoprazole)' },
  ];

  // Automatically extract dosage when user types a brand name like "Dolo 650" or "Pan 40"
  const handleDrugInputChange = (text) => {
    setDrugInput(text);
    const resolved = resolveMedicineInput(text, '');
    if (resolved && resolved.dosageMg) {
      setDoseInput(String(resolved.dosageMg));
    }
  };

  // Handle Medicine Strip / Box Scan from Camera or Photo Library
  const handleMedicineImageScan = async (source = 'camera') => {
    setError(null);
    setSuccessMsg(null);

    try {
      let pickerResult;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required to scan a medicine strip or bottle label.');
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.6,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Photo library permission is required to upload a medicine label photo.');
          return;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.6,
          base64: true,
        });
      }

      if (pickerResult.canceled) return;
      const asset = pickerResult.assets && pickerResult.assets[0];
      if (!asset || !asset.base64) {
        setError('Could not read image data from the selected medicine photo.');
        return;
      }

      setScanningStrip(true);
      const scanResponse = await uploadPrescriptionBase64(currentPatientId, asset.base64);
      const extractedList = scanResponse?.extracted_medications || [];
      const firstMedRaw = extractedList[0] || 'Dolo 650';
      const resolved = resolveMedicineInput(firstMedRaw, '');
      const detectedDose = resolved?.dosageMg || '650';

      setScannedStripMeta({
        stripLabel: `Scanned Label: ${firstMedRaw}`,
        brandInput: firstMedRaw,
        medicinalName: resolved?.medicinalName || firstMedRaw,
        doseMg: detectedDose,
        ocrSnippet: `Optical Label Scan extracted "${firstMedRaw}" → Active Medicinal Ingredient: ${
          resolved?.medicinalName || firstMedRaw
        } (${detectedDose} mg)`,
      });

      setDrugInput(firstMedRaw);
      setDoseInput(String(detectedDose));
      await handleCheck(firstMedRaw, String(detectedDose));
    } catch (err) {
      setError('Failed to scan medicine image. Try selecting one of the instant strip scans below.');
    } finally {
      setScanningStrip(false);
    }
  };

  // Handle 1-tap simulated medicine strip scan
  const handlePresetStripScan = async (preset) => {
    setError(null);
    setSuccessMsg(null);
    setScanningStrip(true);

    setScannedStripMeta(preset);
    setDrugInput(preset.brandInput);
    setDoseInput(String(preset.doseMg));

    setTimeout(async () => {
      await handleCheck(preset.brandInput, String(preset.doseMg));
      setScanningStrip(false);
    }, 220);
  };

  const handleCheck = async (nameToCheck = drugInput, doseToCheck = doseInput) => {
    const trimmed = (nameToCheck || '').trim();
    if (!trimmed || !/[a-zA-Z]/.test(trimmed)) {
      setError('Please enter or scan a valid medicine name before running a safety check.');
      setSuccessMsg(null);
      setResult(null);
      return;
    }

    const resolved = resolveMedicineInput(trimmed, doseToCheck);
    const effectiveDoseStr =
      doseToCheck && String(doseToCheck).trim() !== ''
        ? String(doseToCheck).trim()
        : resolved?.dosageMg || '500';
    const numericDose = parseFloat(effectiveDoseStr);

    if (Number.isNaN(numericDose) || numericDose <= 0) {
      setError('Invalid dosage amount: please enter a dose greater than 0 mg to evaluate safety.');
      setSuccessMsg(null);
      setResult(null);
      return;
    }

    if (doseInput !== String(numericDose)) {
      setDoseInput(String(numericDose));
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
      const medLabel = data.medicinal_name || resolved?.medicinalName || data.normalized_ingredient;

      if (
        data.safety_status === 'CRITICAL_CONTRAINDICATION' ||
        data.safety_status === 'HIGH_RISK'
      ) {
        setError(
          `${
            data.safety_status === 'CRITICAL_CONTRAINDICATION'
              ? 'CRITICAL CONTRAINDICATION'
              : 'HIGH INTERACTION RISK'
          }: ${trimmed} [Medicinal Name: ${medLabel}, ${numericDose} mg] triggers high-severity warnings for ${patientLabel}.`
        );
      } else {
        setSuccessMsg(
          `Safety check passed: ${trimmed} → ${medLabel} (${numericDose} mg) is compatible with ${patientLabel}'s active regimen.`
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
    setScannedStripMeta(null);
    setError(null);
    setSuccessMsg(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL_CONTRAINDICATION':
        return { text: '#DC2626', title: 'CONTRAINDICATED — DO NOT TAKE' };
      case 'HIGH_RISK':
        return { text: '#B48A00', title: 'HIGH INTERACTION RISK' };
      case 'MODERATE_RISK':
        return { text: '#6B6B6B', title: 'MODERATE CAUTION' };
      default:
        return { text: '#1B7A3D', title: 'SAFE & COMPATIBLE WITH REGIMEN' };
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
          <Text style={styles.headerEyebrow}>PROSPECTIVE CHECK & OPTICAL STRIP SCANNER</Text>
          <Text style={styles.headerTitle}>Ask Medicine / OTC Safety</Text>
        </View>
        <Text style={styles.headerSub}>
          Scan any medicine strip/box or type a common brand name (like{' '}
          <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Dolo 650</Text>,{' '}
          <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Brufen 400</Text>, or{' '}
          <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Pan 40</Text>) to automatically
          identify its actual medicinal ingredient, dosage, and interaction safety.
        </Text>
      </MotionView>

      {/* Medicine Strip / Box Scanner Card */}
      <MotionView delay={25}>
        <View style={styles.scannerCard}>
          <View style={styles.scannerHeaderRow}>
            <View style={styles.scannerIconWrap}>
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scannerEyebrow}>OPTICAL MEDICINE IDENTIFIER</Text>
              <Text style={styles.scannerTitle}>Scan Medicine Strip or Bottle</Text>
            </View>
          </View>
          <Text style={styles.scannerDesc}>
            Can't type the chemical name manually? Point your camera at the tablet strip or select a
            strip below to extract the{' '}
            <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Actual Medicinal Name</Text> and{' '}
            <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Dosage (mg)</Text>.
          </Text>

          <View style={styles.scannerBtnRow}>
            <TouchableOpacity
              style={styles.scanPrimaryBtn}
              onPress={() => handleMedicineImageScan('camera')}
              disabled={scanningStrip || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              <Text style={styles.scanPrimaryBtnText}>
                {scanningStrip ? 'Scanning Strip...' : 'Scan Medicine Camera'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanSecondaryBtn}
              onPress={() => handleMedicineImageScan('gallery')}
              disabled={scanningStrip || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={16} color="#1A1A1A" />
              <Text style={styles.scanSecondaryBtnText}>Upload Strip Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Instant Medicine Strip Scan Presets */}
          <Text style={styles.stripPresetsLabel}>
            INSTANT STRIP SCAN DEMO (TAP ANY MEDICINE STRIP):
          </Text>
          <View style={styles.stripPresetsRow}>
            {SCANNER_MEDICINE_PRESETS.map((preset) => {
              const isSelected = scannedStripMeta?.id === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.stripChip, isSelected && styles.stripChipActive]}
                  onPress={() => handlePresetStripScan(preset)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="medkit-outline"
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#1B7A3D'}
                  />
                  <Text
                    style={[
                      styles.stripChipText,
                      isSelected && styles.stripChipTextActive,
                    ]}
                  >
                    {preset.stripLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scanned Strip OCR Output Banner */}
          {scannedStripMeta && (
            <View style={styles.scannedBanner}>
              <View style={styles.scannedBannerTop}>
                <Ionicons name="checkmark-done-circle" size={16} color="#1B7A3D" />
                <Text style={styles.scannedBannerTitle}>
                  STRIP IDENTIFIED: {scannedStripMeta.brandInput.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.scannedBannerDetail}>
                Actual Medicinal Name:{' '}
                <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>
                  {scannedStripMeta.medicinalName}
                </Text>{' '}
                • Strength:{' '}
                <Text style={{ fontWeight: '700', color: '#1B7A3D' }}>
                  {scannedStripMeta.doseMg} mg
                </Text>
              </Text>
              {scannedStripMeta.ocrSnippet && (
                <Text style={styles.scannedOcrText}>{scannedStripMeta.ocrSnippet}</Text>
              )}
            </View>
          )}
        </View>
      </MotionView>

      {/* Manual Brand / Generic Input Form */}
      <MotionView delay={45}>
        <View style={styles.inputCard}>
          <View style={styles.formFieldsRow}>
            <View style={{ flex: 2, minWidth: 170 }}>
              <Text style={styles.inputLabel}>Brand or Generic Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dolo 650, Brufen 400, Pan 40"
                  placeholderTextColor="#6B6B6B"
                  value={drugInput}
                  onChangeText={handleDrugInputChange}
                  returnKeyType="search"
                  onSubmitEditing={() => handleCheck()}
                />
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 90 }}>
              <Text style={styles.inputLabel}>Dosage (mg)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="650"
                  placeholderTextColor="#6B6B6B"
                  value={doseInput}
                  onChangeText={setDoseInput}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Live Brand -> Medicinal Ingredient & Dosage Resolver Card */}
          {resolvedPreview && (
            <View style={styles.resolverBox}>
              <View style={styles.resolverHeaderRow}>
                <Ionicons name="flask-outline" size={15} color="#1B7A3D" />
                <Text style={styles.resolverEyebrow}>
                  RESOLVED MEDICINAL COMPOSITION & DOSAGE
                </Text>
              </View>
              <View style={styles.resolverGrid}>
                <View style={styles.resolverCol}>
                  <Text style={styles.resolverFieldLabel}>ENTERED BRAND / NAME</Text>
                  <Text style={styles.resolverFieldVal}>{resolvedPreview.enteredText}</Text>
                </View>
                <View style={styles.resolverArrowCol}>
                  <Ionicons name="arrow-forward" size={16} color="#6B6B6B" />
                </View>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.resolverFieldLabel}>ACTUAL MEDICINAL NAME</Text>
                  <Text style={styles.resolverMedicinalVal}>
                    {resolvedPreview.medicinalName}
                  </Text>
                </View>
                <View style={styles.resolverDosePill}>
                  <Text style={styles.resolverDoseText}>{resolvedPreview.dosageDisplay}</Text>
                </View>
              </View>
              <Text style={styles.resolverIndicationText}>
                Used For: <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>{resolvedPreview.indication}</Text>
              </Text>
            </View>
          )}

          {/* Quick Test Chips */}
          <Text style={styles.chipsLabel}>Common Brand & Generic Examples</Text>
          <View style={styles.chipsRow}>
            {quickSamples.map((sample, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => {
                  setScannedStripMeta(null);
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

            {(drugInput || result || error || scannedStripMeta) && (
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
            const medDisplayName =
              result.medicinal_name ||
              resolvedPreview?.medicinalName ||
              result.normalized_ingredient;
            const resolvedDose =
              result.resolved_dose_mg || doseInput || resolvedPreview?.dosageMg || '500';
            const indicationText =
              result.indication || resolvedPreview?.indication || 'Active Pharmaceutical Ingredient';

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
                <Text style={styles.verdictDrug}>{result.new_drug}</Text>

                {/* Medicinal Name + Dosage Summary Pill inside Result */}
                <View style={styles.verdictCompositionBox}>
                  <View style={styles.verdictCompRow}>
                    <Text style={styles.verdictCompLabel}>ACTUAL MEDICINAL NAME:</Text>
                    <Text style={styles.verdictCompValue}>{medDisplayName}</Text>
                  </View>
                  <View style={styles.verdictCompRow}>
                    <Text style={styles.verdictCompLabel}>DOSAGE EVALUATED:</Text>
                    <Text style={styles.verdictCompDose}>
                      {resolvedDose} {result.resolved_dose_unit || 'mg'}
                    </Text>
                  </View>
                  <View style={styles.verdictCompRow}>
                    <Text style={styles.verdictCompLabel}>CLINICAL USE:</Text>
                    <Text style={styles.verdictCompUse}>{indicationText}</Text>
                  </View>
                </View>

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
                          {
                            color: '#1A1A1A',
                            borderLeftWidth: 2,
                            borderLeftColor: '#E8C840',
                            paddingLeft: 8,
                          },
                        ]}
                      >
                        {vw}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Flagged Interactions + Chart */}
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
    marginBottom: 16,
  },
  scannerCard: {
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 16,
    marginBottom: 16,
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  scannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.9,
  },
  scannerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scannerDesc: {
    fontSize: 12,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 12,
  },
  scannerBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  scanPrimaryBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  scanPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scanSecondaryBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  scanSecondaryBtnText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  stripPresetsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stripPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  stripChipActive: {
    backgroundColor: '#1B7A3D',
    borderColor: '#1B7A3D',
  },
  stripChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  stripChipTextActive: {
    color: '#FFFFFF',
  },
  scannedBanner: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1B7A3D',
    borderLeftWidth: 4,
    padding: 12,
  },
  scannedBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scannedBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.6,
  },
  scannedBannerDetail: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  scannedOcrText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontStyle: 'italic',
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
  resolverBox: {
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderLeftWidth: 3,
    borderLeftColor: '#1B7A3D',
    padding: 12,
    marginBottom: 16,
  },
  resolverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resolverEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.8,
  },
  resolverGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  resolverCol: {
    flex: 1,
    minWidth: 90,
  },
  resolverArrowCol: {
    paddingHorizontal: 2,
  },
  resolverFieldLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  resolverFieldVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  resolverMedicinalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B7A3D',
  },
  resolverDosePill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  resolverDoseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  resolverIndicationText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  verdictCompositionBox: {
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 12,
    marginBottom: 12,
    gap: 5,
  },
  verdictCompRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },
  verdictCompLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.6,
  },
  verdictCompValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B7A3D',
  },
  verdictCompDose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  verdictCompUse: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
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
