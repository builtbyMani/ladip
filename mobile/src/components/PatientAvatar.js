/**
 * LADIP Mobile Illustrated Patient Portraits, HORMN Capsule Logo Mark & Clinical Illustrations
 * Replicates the exact Next.js Web UI (`web/src/components/HormnIllustrations.tsx`)
 * using pure React Native vector-layered Views so it runs natively on iOS, Android, and Web.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PATIENT_PERSONA_META = {
  PT_BLEED_001: {
    patientId: 'PT_BLEED_001',
    username: 'ramesh',
    password: 'ramesh1234',
    shortName: 'Ramesh Sharma',
    ageSex: '68M • AFib & Osteoarthritis',
    clinicalTag: '68M • AFib & Osteoarthritis',
    regimenShort: 'Warfarin + Aspirin + Ibuprofen',
    riskTier: 'CRITICAL',
    riskLabel: 'Critical Bleed Synergy',
    avatarBg: '#DCEBFA',
    cardSoftBg: '#EAF2FA',
    avatarAccent: '#3B6EA8',
    badgeColor: '#DC2626',
    ringColor: '#BFDBFE',
  },
  PT_STATIN_002: {
    patientId: 'PT_STATIN_002',
    username: 'sunita',
    password: 'sunita1234',
    shortName: 'Sunita Patel',
    ageSex: '62F • Dyslipidemia & Arrhythmia',
    clinicalTag: '62F • Dyslipidemia & Arrhythmia',
    regimenShort: 'Simvastatin + Amlodipine + Amiodarone',
    riskTier: 'CRITICAL',
    riskLabel: 'CYP3A4 Myopathy Risk',
    avatarBg: '#F5EBE1',
    cardSoftBg: '#F5F2EB',
    avatarAccent: '#8C6239',
    badgeColor: '#F59E0B',
    ringColor: '#FDE68A',
  },
  PT_MTX_003: {
    patientId: 'PT_MTX_003',
    username: 'kavitha',
    password: 'kavitha1234',
    shortName: 'Kavitha Reddy',
    ageSex: '54F • Rheumatoid Arthritis',
    clinicalTag: '54F • Rheumatoid Arthritis',
    regimenShort: 'Methotrexate + Bactrim + Naproxen',
    riskTier: 'CRITICAL',
    riskLabel: 'Renal Clearance Block',
    avatarBg: '#EDE9FE',
    cardSoftBg: '#F0EDF8',
    avatarAccent: '#5E4FA2',
    badgeColor: '#5E4FA2',
    ringColor: '#DDD6FE',
  },
  PT_CARDIO_005: {
    patientId: 'PT_CARDIO_005',
    username: 'arjun',
    password: 'arjun1234',
    shortName: 'Arjun Nair',
    ageSex: '59M • Post-PCI Coronary Stent',
    clinicalTag: '59M • Post-PCI Coronary Stent',
    regimenShort: 'Clopidogrel + Omeprazole + Atorvastatin',
    riskTier: 'HIGH',
    riskLabel: 'CYP2C19 Inhibition',
    avatarBg: '#FFE4E6',
    cardSoftBg: '#FFF1F2',
    avatarAccent: '#BE123C',
    badgeColor: '#DC2626',
    ringColor: '#FECDD3',
  },
  PT_STABLE_004: {
    patientId: 'PT_STABLE_004',
    username: 'rajesh',
    password: 'rajesh1234',
    shortName: 'Rajesh Varma',
    ageSex: '71M • 2-Yr Stable Hypertension',
    clinicalTag: '71M • 2-Yr Stable Hypertension',
    regimenShort: 'Lisinopril + Metformin + Atorvastatin',
    riskTier: 'STABLE',
    riskLabel: '100% Noise Suppressed',
    avatarBg: '#D1FAE5',
    cardSoftBg: '#EAF5F0',
    avatarAccent: '#1B7A3D',
    badgeColor: '#00B67A',
    ringColor: '#A7F3D0',
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
    ageSex: 'Custom Parsed EHR Cohort',
    clinicalTag: 'Custom Parsed EHR Cohort',
    regimenShort: 'OCR Reconstructed Regimen',
    riskTier: 'HIGH',
    riskLabel: 'Live Timeline Active',
    avatarBg: '#DCEBFA',
    cardSoftBg: '#EAF2FA',
    avatarAccent: '#3B6EA8',
    badgeColor: '#3B6EA8',
    ringColor: '#BFDBFE',
  };
}

/**
 * HORMN-inspired capsule mark + wide-tracked geometric wordmark (`[ (H) ] L A D I P`)
 * Exact match to web/src/components/HormnIllustrations.tsx
 */
export function HormnLogoMark({ size = 'md' }) {
  const pillW = size === 'sm' ? 30 : size === 'lg' ? 42 : 35;
  const pillH = size === 'sm' ? 19 : size === 'lg' ? 26 : 22;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <View style={styles.logoWrap}>
      <View
        style={[
          styles.logoCapsulePill,
          { width: pillW, height: pillH, borderRadius: pillH / 2 },
        ]}
      >
        {/* Left & Right white capsule arcs + H-bridge matching the Web SVG */}
        <View style={styles.logoInnerRow}>
          <View style={styles.logoArcLeft} />
          <View style={styles.logoBridge} />
          <View style={styles.logoArcRight} />
        </View>
      </View>
      <Text style={[styles.logoWordmark, { fontSize }]}>LADIP</Text>
    </View>
  );
}

/**
 * Card 1 Illustration: Dual frosted cerulean clinical glass vials (exact match to Web UI)
 */
export function BlueVialsIllustration({ scale = 1 }) {
  return (
    <View style={[styles.illusBox, { transform: [{ scale }] }]}>
      {/* Secondary Rear Vial (Right, tilted +8deg) */}
      <View style={[styles.vialRear, { transform: [{ rotate: '8deg' }] }]}>
        <View style={styles.vialCapBlue} />
        <View style={styles.vialNeckBlue} />
        <View style={styles.vialBodyBlue}>
          <View style={styles.vialLiquidBlue}>
            <View style={styles.vialLabelBand}>
              <Text style={styles.vialLabelTextSmall}>LADIP</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Primary Foreground Vial (Left, tilted -10deg) */}
      <View style={[styles.vialFront, { transform: [{ rotate: '-10deg' }] }]}>
        <View style={[styles.vialCapBlue, { width: 26, height: 8 }]} />
        <View style={[styles.vialNeckBlue, { width: 18, height: 5 }]} />
        <View style={[styles.vialBodyBlue, { width: 34, height: 54 }]}>
          <View style={[styles.vialLiquidBlue, { height: 38 }]}>
            <View style={styles.vialEmblemDot} />
            <View style={[styles.vialLabelBand, { height: 15 }]}>
              <Text style={styles.vialLabelText}>LADIP</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Card 2 Illustration: Dual warm-sand clinical autoinjector pens (exact match to Web UI)
 */
export function SandInjectorsIllustration({ scale = 1 }) {
  return (
    <View style={[styles.illusBox, { transform: [{ scale }] }]}>
      <View style={[styles.penWrap, { left: 10, top: 8, transform: [{ rotate: '-26deg' }] }]}>
        <View style={styles.penCapBronze} />
        <View style={styles.penWindowDark} />
        <View style={styles.penBodyCream}>
          <Text style={styles.penLabelText}>Rx</Text>
        </View>
        <View style={styles.penBaseBronze} />
      </View>
      <View style={[styles.penWrap, { right: 12, top: 2, transform: [{ rotate: '-10deg' }] }]}>
        <View style={styles.penCapBronze} />
        <View style={styles.penWindowDark} />
        <View style={styles.penBodyCream}>
          <Text style={styles.penLabelText}>LADIP</Text>
        </View>
        <View style={styles.penBaseBronze} />
      </View>
    </View>
  );
}

/**
 * Card 3 Illustration: Three embossed 3D lavender clinical tablets (exact match to Web UI)
 */
export function LavenderTabletsIllustration({ scale = 1 }) {
  return (
    <View style={[styles.illusBox, { transform: [{ scale }] }]}>
      <View style={[styles.lavenderTablet, { width: 30, height: 30, right: 6, top: 2 }]}>
        <Text style={styles.tabletEmbossText}>H</Text>
      </View>
      <View style={[styles.lavenderTablet, { width: 36, height: 36, left: 6, top: 10, backgroundColor: '#9F93CA' }]}>
        <Text style={[styles.tabletEmbossText, { fontSize: 12 }]}>H</Text>
      </View>
      <View style={[styles.lavenderTablet, { width: 32, height: 32, right: 16, bottom: 2, backgroundColor: '#8E81BA' }]}>
        <Text style={styles.tabletEmbossText}>H</Text>
      </View>
    </View>
  );
}

/**
 * Card 4 Illustration: Frosted mint clinical capsule bottle (exact match to Web UI)
 */
export function MintBottleIllustration({ scale = 1 }) {
  return (
    <View style={[styles.illusBox, { transform: [{ scale }] }]}>
      <View style={[styles.mintBottleWrap, { transform: [{ rotate: '12deg' }] }]}>
        <View style={styles.mintBottleCap} />
        <View style={styles.mintBottleBody}>
          <View style={styles.mintPillRow}>
            <View style={styles.mintMiniPill} />
            <View style={styles.mintMiniPill} />
          </View>
          <View style={styles.mintBottleLabel}>
            <Text style={styles.mintBottleText}>LADIP</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const SIZE_MAP = {
  xs: 26,
  sm: 34,
  md: 44,
  lg: 56,
};

/**
 * Bespoke Illustrated Indian Patient Portrait Avatar matching Web UI's PatientCohortAvatar
 */
export default function PatientAvatar({
  patientId,
  fallbackName,
  size = 'sm',
  showBadge = true,
}) {
  const persona = getPatientPersona(patientId, fallbackName);
  const box = SIZE_MAP[size] || SIZE_MAP.sm;
  const s = box / 44; // Normalized scale relative to 44px base

  const dotSize = Math.max(Math.round(11 * s), 8);
  const pid = persona.patientId;

  return (
    <View style={{ width: box, height: box, position: 'relative' }}>
      {/* Circular Portrait Canvas */}
      <View
        style={[
          styles.portraitCircle,
          {
            width: box,
            height: box,
            borderRadius: box / 2,
            backgroundColor: persona.avatarBg,
          },
        ]}
      >
        {pid === 'PT_BLEED_001' ? (
          /* Ramesh Sharma: 68M Senior Gentleman with Silver Hair, Glasses, Mustache & Navy Collar */
          <>
            {/* Navy Suit Shoulders */}
            <View
              style={{
                position: 'absolute',
                bottom: -4 * s,
                width: 30 * s,
                height: 18 * s,
                borderTopLeftRadius: 15 * s,
                borderTopRightRadius: 15 * s,
                backgroundColor: '#1E3A8A',
                alignItems: 'center',
              }}
            >
              {/* White V-Collar */}
              <View
                style={{
                  width: 8 * s,
                  height: 8 * s,
                  backgroundColor: '#FFFFFF',
                  transform: [{ rotate: '45deg' }],
                  marginTop: -4 * s,
                }}
              />
            </View>
            {/* Head */}
            <View
              style={{
                position: 'absolute',
                top: 8 * s,
                width: 17 * s,
                height: 18 * s,
                borderRadius: 9 * s,
                backgroundColor: '#D9A17C',
                alignItems: 'center',
              }}
            >
              {/* Silver Hair Cap */}
              <View
                style={{
                  position: 'absolute',
                  top: -2 * s,
                  width: 18 * s,
                  height: 7 * s,
                  borderTopLeftRadius: 9 * s,
                  borderTopRightRadius: 9 * s,
                  backgroundColor: '#E2E8F0',
                }}
              />
              {/* Eyeglasses */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6.5 * s,
                  gap: 1.5 * s,
                }}
              >
                <View
                  style={{
                    width: 5.5 * s,
                    height: 3.8 * s,
                    borderRadius: 1 * s,
                    borderWidth: Math.max(1, 1.1 * s),
                    borderColor: '#1E293B',
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  }}
                />
                <View
                  style={{
                    width: 5.5 * s,
                    height: 3.8 * s,
                    borderRadius: 1 * s,
                    borderWidth: Math.max(1, 1.1 * s),
                    borderColor: '#1E293B',
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  }}
                />
              </View>
              {/* Silver Mustache */}
              <View
                style={{
                  marginTop: 2 * s,
                  width: 7 * s,
                  height: 2 * s,
                  borderRadius: 1 * s,
                  backgroundColor: '#94A3B8',
                }}
              />
            </View>
          </>
        ) : pid === 'PT_STATIN_002' ? (
          /* Sunita Patel: 62F Indian Woman with Dark Bun, Red Bindi & Warm Amber Saree Drape */
          <>
            {/* Top Hair Bun */}
            <View
              style={{
                position: 'absolute',
                top: 4 * s,
                width: 9 * s,
                height: 9 * s,
                borderRadius: 4.5 * s,
                backgroundColor: '#1E293B',
              }}
            />
            {/* Amber Saree Shoulders */}
            <View
              style={{
                position: 'absolute',
                bottom: -4 * s,
                width: 30 * s,
                height: 18 * s,
                borderTopLeftRadius: 15 * s,
                borderTopRightRadius: 15 * s,
                backgroundColor: '#9A6B3B',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: 18 * s,
                  height: 18 * s,
                  backgroundColor: '#D97706',
                  opacity: 0.5,
                  transform: [{ rotate: '-25deg' }],
                }}
              />
            </View>
            {/* Head */}
            <View
              style={{
                position: 'absolute',
                top: 9 * s,
                width: 16.5 * s,
                height: 17.5 * s,
                borderRadius: 8.5 * s,
                backgroundColor: '#DCA682',
                alignItems: 'center',
              }}
            >
              {/* Dark Parted Hair */}
              <View
                style={{
                  position: 'absolute',
                  top: -1.5 * s,
                  width: 17.5 * s,
                  height: 6.5 * s,
                  borderTopLeftRadius: 9 * s,
                  borderTopRightRadius: 9 * s,
                  backgroundColor: '#1E293B',
                }}
              />
              {/* Red Bindi */}
              <View
                style={{
                  marginTop: 5 * s,
                  width: Math.max(2.5, 2.6 * s),
                  height: Math.max(2.5, 2.6 * s),
                  borderRadius: 2 * s,
                  backgroundColor: '#DC2626',
                }}
              />
              {/* Eyes */}
              <View style={{ flexDirection: 'row', gap: 4.5 * s, marginTop: 1 * s }}>
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#1E293B',
                  }}
                />
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#1E293B',
                  }}
                />
              </View>
            </View>
          </>
        ) : pid === 'PT_MTX_003' ? (
          /* Kavitha Reddy: 54F Woman with Wavy Hair, Round Spectacles & Lavender Attire */
          <>
            {/* Wavy Hair Backdrop */}
            <View
              style={{
                position: 'absolute',
                top: 10 * s,
                width: 22 * s,
                height: 19 * s,
                borderRadius: 9 * s,
                backgroundColor: '#1E1B4B',
              }}
            />
            {/* Lavender Shoulders */}
            <View
              style={{
                position: 'absolute',
                bottom: -4 * s,
                width: 30 * s,
                height: 18 * s,
                borderTopLeftRadius: 15 * s,
                borderTopRightRadius: 15 * s,
                backgroundColor: '#5E4FA2',
              }}
            />
            {/* Head */}
            <View
              style={{
                position: 'absolute',
                top: 9 * s,
                width: 16.5 * s,
                height: 17.5 * s,
                borderRadius: 8.5 * s,
                backgroundColor: '#C98E6B',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -1.5 * s,
                  width: 17.5 * s,
                  height: 6 * s,
                  borderTopLeftRadius: 9 * s,
                  borderTopRightRadius: 9 * s,
                  backgroundColor: '#1E1B4B',
                }}
              />
              {/* Round Glasses */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6.5 * s,
                  gap: 1.5 * s,
                }}
              >
                <View
                  style={{
                    width: 5 * s,
                    height: 5 * s,
                    borderRadius: 2.5 * s,
                    borderWidth: Math.max(1, 1.1 * s),
                    borderColor: '#312E81',
                    backgroundColor: 'rgba(255,255,255,0.28)',
                  }}
                />
                <View
                  style={{
                    width: 5 * s,
                    height: 5 * s,
                    borderRadius: 2.5 * s,
                    borderWidth: Math.max(1, 1.1 * s),
                    borderColor: '#312E81',
                    backgroundColor: 'rgba(255,255,255,0.28)',
                  }}
                />
              </View>
            </View>
          </>
        ) : pid === 'PT_CARDIO_005' ? (
          /* Arjun Nair: 59M Man with Neat Beard & Charcoal Collar with Crimson Tie */
          <>
            <View
              style={{
                position: 'absolute',
                bottom: -4 * s,
                width: 30 * s,
                height: 18 * s,
                borderTopLeftRadius: 15 * s,
                borderTopRightRadius: 15 * s,
                backgroundColor: '#1F2937',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 7 * s,
                  height: 9 * s,
                  backgroundColor: '#BE123C',
                  transform: [{ rotate: '45deg' }],
                  marginTop: -4 * s,
                }}
              />
            </View>
            {/* Head */}
            <View
              style={{
                position: 'absolute',
                top: 8 * s,
                width: 17 * s,
                height: 18 * s,
                borderRadius: 8.5 * s,
                backgroundColor: '#C48764',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: 18 * s,
                  height: 6 * s,
                  backgroundColor: '#111827',
                }}
              />
              <View style={{ flexDirection: 'row', gap: 4.5 * s, marginTop: 2.5 * s }}>
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#111827',
                  }}
                />
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#111827',
                  }}
                />
              </View>
              {/* Neat Beard */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 16 * s,
                  height: 5.5 * s,
                  backgroundColor: '#1F2937',
                  borderTopLeftRadius: 3 * s,
                  borderTopRightRadius: 3 * s,
                }}
              />
            </View>
          </>
        ) : (
          /* Rajesh Varma (PT_STABLE_004): 71M Smiling Senior in Forest Green */
          <>
            <View
              style={{
                position: 'absolute',
                bottom: -4 * s,
                width: 30 * s,
                height: 18 * s,
                borderTopLeftRadius: 15 * s,
                borderTopRightRadius: 15 * s,
                backgroundColor: '#1B7A3D',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 8 * s,
                width: 17 * s,
                height: 18 * s,
                borderRadius: 8.5 * s,
                backgroundColor: '#D59B76',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -1.5 * s,
                  width: 17.5 * s,
                  height: 6 * s,
                  borderTopLeftRadius: 9 * s,
                  borderTopRightRadius: 9 * s,
                  backgroundColor: '#F1F5F9',
                }}
              />
              <View style={{ flexDirection: 'row', gap: 4.5 * s, marginTop: 7 * s }}>
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#0F172A',
                  }}
                />
                <View
                  style={{
                    width: 2 * s,
                    height: 2 * s,
                    borderRadius: 1 * s,
                    backgroundColor: '#0F172A',
                  }}
                />
              </View>
              <View
                style={{
                  marginTop: 2.2 * s,
                  width: 6 * s,
                  height: 2 * s,
                  borderRadius: 1 * s,
                  backgroundColor: '#064E3B',
                }}
              />
            </View>
          </>
        )}
      </View>

      {/* Status Dot matching Web UI's PatientCohortAvatar */}
      {showBadge && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: persona.badgeColor,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  portraitCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCapsulePill: {
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  logoInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArcLeft: {
    width: 6,
    height: 11,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  logoBridge: {
    width: 5,
    height: 3,
    backgroundColor: '#111827',
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderColor: '#FFFFFF',
  },
  logoArcRight: {
    width: 6,
    height: 11,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  logoWordmark: {
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 3.2,
  },
  illusBox: {
    width: 78,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vialRear: {
    position: 'absolute',
    right: 8,
    top: 8,
    alignItems: 'center',
  },
  vialFront: {
    position: 'absolute',
    left: 10,
    top: 4,
    alignItems: 'center',
  },
  vialCapBlue: {
    width: 20,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#5D92D1',
  },
  vialNeckBlue: {
    width: 14,
    height: 4,
    backgroundColor: '#BFD9F5',
  },
  vialBodyBlue: {
    width: 26,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#DCEBFA',
    borderWidth: 1,
    borderColor: '#8BB5E5',
    justifyContent: 'flex-end',
    padding: 2,
  },
  vialLiquidBlue: {
    width: '100%',
    height: 30,
    borderRadius: 4,
    backgroundColor: '#6D9FD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vialEmblemDot: {
    width: 7,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  vialLabelBand: {
    width: '100%',
    height: 12,
    backgroundColor: '#E8F2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vialLabelText: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#244B7A',
    letterSpacing: 0.8,
  },
  vialLabelTextSmall: {
    fontSize: 4.5,
    fontWeight: '800',
    color: '#2B5486',
    letterSpacing: 0.6,
  },
  penWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  penCapBronze: {
    width: 11,
    height: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#7A634E',
  },
  penWindowDark: {
    width: 5,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#2A2018',
    marginTop: -4,
  },
  penBodyCream: {
    width: 12,
    height: 32,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#D6CFC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  penLabelText: {
    fontSize: 4.5,
    fontWeight: '800',
    color: '#2D241E',
  },
  penBaseBronze: {
    width: 12,
    height: 6,
    backgroundColor: '#5C4938',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  lavenderTablet: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#B5A8DF',
    borderWidth: 1.5,
    borderColor: '#7E70B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletEmbossText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4E417B',
  },
  mintBottleWrap: {
    alignItems: 'center',
  },
  mintBottleCap: {
    width: 28,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#6AA78F',
  },
  mintBottleBody: {
    width: 38,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#B8DFCF',
    borderWidth: 1,
    borderColor: '#8EC6B0',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  mintPillRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  mintMiniPill: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAF5F0',
  },
  mintBottleLabel: {
    width: '90%',
    height: 16,
    borderRadius: 3,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintBottleText: {
    fontSize: 6,
    fontWeight: '800',
    color: '#1F5C46',
    letterSpacing: 0.8,
  },
});
