/**
 * Prescription & Medical Report Scanner Screen
 * Editorial Health-Tech Aesthetic
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
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePatient } from '../context/PatientContext';
import { uploadPrescriptionBase64 } from '../api/client';

export default function PrescriptionScannerScreen({ navigation }) {
  const { currentPatientId, refreshPatientData } = usePatient();
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan prescriptions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setScanResult(null);
        setError(null);
      }
    } catch (err) {
      console.warn('Camera launch error:', err);
      setError('Could not open camera');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to select prescriptions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setScanResult(null);
        setError(null);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      setError('Could not select image');
    }
  };

  const handleScanUpload = async () => {
    if (!selectedImage || !selectedImage.base64) {
      Alert.alert('No Image', 'Please capture or select an image first.');
      return;
    }

    setScanning(true);
    setError(null);
    try {
      const data = await uploadPrescriptionBase64(currentPatientId, selectedImage.base64);
      setScanResult(data);
      refreshPatientData();
    } catch (err) {
      setError(err.message || 'Failed to analyze prescription');
    } finally {
      setScanning(false);
    }
  };

  const handleSimulateDemo = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/patients/${currentPatientId}/scan-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `raw_text=${encodeURIComponent(
          'Prescription Order:\n1. Ibuprofen 600mg TID oral for 5 days\n2. Pantoprazole 40mg QD oral before breakfast'
        )}`,
      });
      const data = await res.json();
      setScanResult(data);
      refreshPatientData();
    } catch (err) {
      setError(err.message || 'Simulation error');
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>OPTICAL INGESTION</Text>
        <Text style={styles.headerTitle}>Scan Prescription / Chart</Text>
      </View>
      <Text style={styles.headerSub}>
        Capture a clear photo of your prescription or hospital discharge summary. LADIP extracts medications and immediately checks for multi-drug interactions.
      </Text>

      {/* Action Buttons */}
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

      {/* Quick Benchmark Simulator */}
      <TouchableOpacity style={styles.demoBtn} onPress={handleSimulateDemo} activeOpacity={0.85}>
        <Text style={styles.demoBtnText}>Simulate New Prescription (Hackathon Demo)</Text>
      </TouchableOpacity>

      {/* Image Preview Box */}
      {selectedImage && (
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
      )}

      {/* Scanning Loader */}
      {scanning && (
        <View style={styles.scanningBox}>
          <ActivityIndicator size="large" color="#1B7A3D" />
          <Text style={styles.scanningText}>Extracting clinical text with OCR...</Text>
          <Text style={styles.scanningSub}>Cross-referencing with active regimen & allergies</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Scan Results Card */}
      {scanResult && (
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
                    Adverse Risk: <Text style={{ fontWeight: '700' }}>{al.adverse_event}</Text> ({al.tier} Tier)
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  captureBtn: {
    flex: 1,
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
  demoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F0',
    paddingVertical: 10,
    borderRadius: 9999,
    marginBottom: 20,
  },
  demoBtnText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
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
