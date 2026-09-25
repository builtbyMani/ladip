/**
 * Prescription & Medical Report Scanner Screen
 * Uses Camera / Photo Gallery to scan prescriptions and run automated OCR/Gemini extraction.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePatient } from '../context/PatientContext';
import { uploadPrescriptionBase64 } from '../api/client';

export default function PrescriptionScannerScreen({ navigation }) {
  const { currentPatientId, profile, refreshPatientData } = usePatient();
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  // Take photo with camera
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

  // Pick from gallery
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

  // Upload and process with backend OCR
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
      refreshPatientData(); // Sync updated meds with context
    } catch (err) {
      setError(err.message || 'Failed to analyze prescription');
    } finally {
      setScanning(false);
    }
  };

  // Quick simulated prescription for hackathon presentation
  const handleSimulateDemo = async () => {
    setScanning(true);
    setError(null);
    try {
      // Send a sample discharge summary text to the backend
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
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="scan-circle" size={24} color="#0284C7" />
        <Text style={styles.headerTitle}>Scan Prescription / Medical Report</Text>
      </View>
      <Text style={styles.headerSub}>
        Take a clear photo of your doctor's prescription or hospital discharge paper. LADIP automatically extracts the medicines and verifies interaction safety.
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={styles.captureBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage} activeOpacity={0.8}>
          <Ionicons name="image-outline" size={20} color="#0284C7" />
          <Text style={styles.galleryBtnText}>Choose Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Simulation button for hackathon judges */}
      <TouchableOpacity style={styles.demoBtn} onPress={handleSimulateDemo} activeOpacity={0.8}>
        <Ionicons name="bulb-outline" size={16} color="#475569" />
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
            activeOpacity={0.8}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
                <Text style={styles.scanSubmitBtnText}>Extract & Check Safety</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Scanning Loader */}
      {scanning && (
        <View style={styles.scanningBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.scanningText}>Analyzing prescription with OCR & Gemini AI...</Text>
          <Text style={styles.scanningSub}>Cross-referencing with your active medications & allergies</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Scan Results Card */}
      {scanResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-done-circle" size={24} color="#16A34A" />
            <Text style={styles.resultTitle}>Prescription Processed</Text>
          </View>

          <Text style={styles.resultMsg}>{scanResult.message}</Text>

          {/* Extracted Medications */}
          <Text style={styles.sectionHeading}>Extracted Medications:</Text>
          <View style={styles.medsPillsRow}>
            {scanResult.extracted_medications?.length > 0 ? (
              scanResult.extracted_medications.map((m, idx) => (
                <View key={idx} style={styles.medPill}>
                  <Text style={styles.medPillText}>💊 {m}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No new medications detected.</Text>
            )}
          </View>

          {/* Immediate Safety Alerts */}
          {scanResult.immediate_alerts?.length > 0 && (
            <View style={styles.immediateAlertsBlock}>
              <Text style={styles.immediateAlertHeading}>⚠️ Safety Warnings Triggered:</Text>
              {scanResult.immediate_alerts.map((al, idx) => (
                <View key={idx} style={styles.immediateAlertItem}>
                  <Text style={styles.immediateAlertCombo}>{al.combo}</Text>
                  <Text style={styles.immediateAlertRisk}>
                    Risk: <Text style={{ fontWeight: '700' }}>{al.adverse_event}</Text> ({al.tier} Tier)
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  captureBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  galleryBtnText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  demoBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  scanSubmitBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scanningBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  scanningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  scanningSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  resultMsg: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  medsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  medPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  medPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  immediateAlertsBlock: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 14,
  },
  immediateAlertHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 6,
  },
  immediateAlertItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    paddingVertical: 6,
  },
  immediateAlertCombo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  immediateAlertRisk: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
