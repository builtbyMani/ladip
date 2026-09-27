/**
 * Distinct Patient Cohort Avatar & Persona Metadata for LADIP Mobile App
 * Matches the Next.js Web UI's PatientCohortAvatar color worlds, icons, and clinical tags.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PATIENT_PERSONA_META = {
  PT_BLEED_001: {
    patientId: 'PT_BLEED_001',
    username: 'ramesh',
    password: 'ramesh1234',
    shortName: 'Ramesh Sharma',
    ageSex: '68y • Male',
    clinicalTag: 'Anticoagulation • GI Bleed',
    regimenShort: 'Warfarin + Aspirin + Ibuprofen',
    riskTier: 'CRITICAL',
    avatarBg: '#FEE2E2',
    avatarAccent: '#DC2626',
    ringColor: '#FECACA',
    iconName: 'person',
    badgeIcon: 'water',
  },
  PT_STATIN_002: {
    patientId: 'PT_STATIN_002',
    username: 'sunita',
    password: 'sunita1234',
    shortName: 'Sunita Patel',
    ageSex: '62y • Female',
    clinicalTag: 'Statin Myopathy • CYP3A4',
    regimenShort: 'Simvastatin + Amiodarone + Amlodipine',
    riskTier: 'CRITICAL',
    avatarBg: '#FEF3C7',
    avatarAccent: '#D97706',
    ringColor: '#FDE68A',
    iconName: 'woman',
    badgeIcon: 'pulse',
  },
  PT_MTX_003: {
    patientId: 'PT_MTX_003',
    username: 'kavitha',
    password: 'kavitha1234',
    shortName: 'Kavitha Reddy',
    ageSex: '54y • Female',
    clinicalTag: 'Rheumatology • Pancytopenia',
    regimenShort: 'Methotrexate + Bactrim + Naproxen',
    riskTier: 'CRITICAL',
    avatarBg: '#F3E8FF',
    avatarAccent: '#7C3AED',
    ringColor: '#E9D5FF',
    iconName: 'flower',
    badgeIcon: 'medkit',
  },
  PT_CARDIO_005: {
    patientId: 'PT_CARDIO_005',
    username: 'arjun',
    password: 'arjun1234',
    shortName: 'Arjun Nair',
    ageSex: '52y • Male',
    clinicalTag: 'Post-PCI Stent • CYP2C19',
    regimenShort: 'Clopidogrel + Omeprazole',
    riskTier: 'HIGH',
    avatarBg: '#CCFBF1',
    avatarAccent: '#0D9488',
    ringColor: '#99F6E4',
    iconName: 'heart-circle',
    badgeIcon: 'heart',
  },
  PT_STABLE_004: {
    patientId: 'PT_STABLE_004',
    username: 'rajesh',
    password: 'rajesh1234',
    shortName: 'Rajesh Varma',
    ageSex: '58y • Male',
    clinicalTag: 'Stable Regimen • >6m Safe',
    regimenShort: 'Metformin + Lisinopril + Atorvastatin',
    riskTier: 'STABLE',
    avatarBg: '#DCFCE7',
    avatarAccent: '#1B7A3D',
    ringColor: '#BBF7D0',
    iconName: 'shield-checkmark',
    badgeIcon: 'checkmark-circle',
  },
};

export function getPatientPersona(patientId, fallbackName) {
  if (patientId && PATIENT_PERSONA_META[patientId]) {
    return PATIENT_PERSONA_META[patientId];
  }
  const cleanName = fallbackName ? fallbackName.split('(')[0].trim() : 'Patient Cohort';
  return {
    patientId: patientId || 'PT_CUSTOM',
    username: 'patient',
    password: '',
    shortName: cleanName,
    ageSex: 'Adult Cohort',
    clinicalTag: 'Extracted Clinical Timeline',
    regimenShort: 'Custom Longitudinal Record',
    riskTier: 'HIGH',
    avatarBg: '#EAF2FA',
    avatarAccent: '#3B6EA8',
    ringColor: '#BFDBFE',
    iconName: 'person-circle',
    badgeIcon: 'medical',
  };
}

const SIZE_MAP = {
  xs: { box: 26, radius: 13, icon: 14, badgeBox: 12, badgeIcon: 8 },
  sm: { box: 34, radius: 17, icon: 18, badgeBox: 14, badgeIcon: 9 },
  md: { box: 44, radius: 22, icon: 22, badgeBox: 16, badgeIcon: 10 },
  lg: { box: 56, radius: 28, icon: 28, badgeBox: 20, badgeIcon: 12 },
};

export default function PatientAvatar({
  patientId,
  fallbackName,
  size = 'sm',
  showBadge = true,
}) {
  const persona = getPatientPersona(patientId, fallbackName);
  const dim = SIZE_MAP[size] || SIZE_MAP.sm;

  return (
    <View
      style={[
        styles.avatarOuter,
        {
          width: dim.box,
          height: dim.box,
          borderRadius: dim.radius,
          backgroundColor: persona.avatarBg,
          borderColor: persona.ringColor,
        },
      ]}
    >
      <Ionicons name={persona.iconName} size={dim.icon} color={persona.avatarAccent} />

      {showBadge && (
        <View
          style={[
            styles.specialtyBadge,
            {
              width: dim.badgeBox,
              height: dim.badgeBox,
              borderRadius: dim.badgeBox / 2,
              backgroundColor: persona.avatarAccent,
            },
          ]}
        >
          <Ionicons name={persona.badgeIcon} size={dim.badgeIcon} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  specialtyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
