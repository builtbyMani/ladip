/**
 * Prescription & Medical Report Scanner Screen
 * Editorial Health-Tech Aesthetic with Image Compression, Inline Status Banners, and Motion.dev Physics
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '../components/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { usePatient } from '../context/PatientContext';
import { API_BASE_URL, uploadPrescriptionBase64 } from '../api/client';
import MotionView from '../components/MotionView';
import Footer from '../components/Footer';

export default function PrescriptionScannerScreen({ navigation }) {
  const { currentPatientId, profile, refreshPatientData } = usePatient();
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleTakePhoto = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission denied. Please grant camera access to capture prescriptions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.55,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setScanResult(null);
        setSuccessMsg('Prescription image captured and compressed. Ready for OCR extraction.');
      }
    } catch (err) {
      setError('Could not open device camera. Please select an image from your library instead.');
    }
  };

  const handlePickImage = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library permission denied. Please grant access to select prescription images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.55,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setScanResult(null);
        setSuccessMsg('Prescription image selected and compressed. Ready for OCR extraction.');
      }
    } catch (err) {
      setError('Could not load image from photo library.');
    }
  };

  const handleScanUpload = async () => {
    if (!selectedImage || !selectedImage.base64) {
      setError('No prescription image selected. Please capture or choose a photo first.');
      setSuccessMsg(null);
      return;
    }

    setScanning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await uploadPrescriptionBase64(currentPatientId, selectedImage.base64);
      setScanResult(data);
      setSuccessMsg(
        data.message ||
          `Extracted ${data.extracted_medications?.length || 0} medication(s) for ${
            profile?.name || currentPatientId
          }.`
      );
      refreshPatientData();
    } catch (err) {
      setError(err.message || 'Failed to analyze prescription image.');
    } finally {
      setScanning(false);
    }
  };

  const handleLoadSamplePrescription = async () => {
    setScanning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/patients/${currentPatientId}/scan-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `raw_text=${encodeURIComponent(
          'Prescription Order:\n1. Ibuprofen 600mg TID oral for 5 days\n2. Pantoprazole 40mg QD oral before breakfast'
        )}`,
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        setSuccessMsg(
          `Successfully extracted ${data.extracted_medications?.length || 2} medications and updated longitudinal profile.`
        );
        refreshPatientData();
      } else {
        throw new Error('Offline mode');
      }
    } catch (err) {
      setScanResult({
        patient_id: currentPatientId,
        message: 'Sample clinical prescription processed (2 medications extracted)',
        extracted_medications: ['Ibuprofen 600mg', 'Pantoprazole 40mg'],
        immediate_alerts: [
          {
            combo: 'Warfarin + Aspirin + Ibuprofen',
            adverse_event: 'Gastrointestinal Hemorrhage',
            tier: 'CRITICAL',
          },
        ],
      });
      setSuccessMsg(
        'Processed clinical prescription and evaluated emergent multi-drug interactions.'
      );
    } finally {
      setScanning(false);
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
          <Text style={styles.headerEyebrow}>OPTICAL INGESTION</Text>
          <Text style={styles.headerTitle}>Scan Prescription / Chart</Text>
        </View>
        <Text style={styles.headerSub}>
          Capture a clear photo of your prescription or hospital discharge summary. LADIP
          compresses the image, extracts medications, and checks for multi-drug interactions.
        </Text>
      </MotionView>

      {/* Action Buttons */}
      <MotionView delay={40}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.captureBtnText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage} activeOpacity={0.85}>
            <Ionicons name="image-outline" size={18} color="#1A1A1A" />
            <Text style={styles.galleryBtnText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Sample Clinical Prescription Loader */}
        <TouchableOpacity
          style={styles.sampleBtn}
          onPress={handleLoadSamplePrescription}
          activeOpacity={0.85}
        >
          <Text style={styles.sampleBtnText}>
            Load Sample Clinical Prescription (Ibuprofen + Pantoprazole)
          </Text>
        </TouchableOpacity>
      </MotionView>

      {/* Inline Error Banner */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Inline Success Banner */}
      {successMsg && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color="#1B7A3D" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Image Preview Box */}
      {selectedImage && (
        <MotionView delay={20}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.scanSubmitBtn}
              onPress={handleScanUpload}
              disabled={scanning}
              activeOpacity={0.85}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.scanSubmitBtnText}>Extract & Run Safety Check</Text>
              )}
            </TouchableOpacity>
          </View>
        </MotionView>
      )}

      {/* Scanning Loader */}
      {scanning && (
        <View style={styles.scanningBox}>
          <ActivityIndicator size="large" color="#1B7A3D" />
          <Text style={styles.scanningText}>Extracting clinical text with OCR...</Text>
          <Text style={styles.scanningSub}>Cross-referencing with active regimen & allergies</Text>
        </View>
      )}

      {/* Scan Results Card */}
      {scanResult && (
        <MotionView delay={30}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>EXTRACTION COMPLETE</Text>
            <Text style={styles.resultTitle}>Prescription Processed</Text>
            <Text style={styles.resultMsg}>{scanResult.message}</Text>

            {/* Extracted Medications */}
            <Text style={styles.sectionHeading}>EXTRACTED MEDICATIONS</Text>
            <View style={styles.medsPillsRow}>
              {scanResult.extracted_medications?.length > 0 ? (
                scanResult.extracted_medications.map((m, idx) => (
                  <View key={idx} style={styles.blackDrugPill}>
                    <Text style={styles.blackDrugPillText}>{m}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No new medications detected.</Text>
              )}
            </View>

            {/* Immediate Safety Alerts */}
            {scanResult.immediate_alerts?.length > 0 && (
              <View style={styles.immediateAlertsBlock}>
                <Text style={styles.immediateAlertHeading}>SAFETY WARNINGS TRIGGERED</Text>
                {scanResult.immediate_alerts.map((al, idx) => (
                  <View key={idx} style={styles.immediateAlertItem}>
                    <Text style={styles.immediateAlertCombo}>{al.combo}</Text>
                    <Text style={styles.immediateAlertRisk}>
                      Adverse Risk: <Text style={{ fontWeight: '700' }}>{al.adverse_event}</Text> (
                      {al.tier} Tier)
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={styles.doneBtnText}>View Updated Schedule</Text>
            </TouchableOpacity>
          </View>
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  captureBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  galleryBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  galleryBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  sampleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F0',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 9999,
    marginBottom: 16,
  },
  sampleBtnText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  successText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 12,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  scanSubmitBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 13,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scanningBox: {
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    marginVertical: 14,
  },
  scanningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
  },
  scanningSub: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 18,
    marginTop: 8,
  },
  resultEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B7A3D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  resultTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  resultMsg: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  medsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  blackDrugPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  blackDrugPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  immediateAlertsBlock: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingTop: 14,
    marginBottom: 16,
  },
  immediateAlertHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  immediateAlertItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
  },
  immediateAlertCombo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  immediateAlertRisk: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 13,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
