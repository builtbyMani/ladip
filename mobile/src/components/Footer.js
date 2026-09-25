/**
 * Editorial Footer Component for LADIP Mobile & Web
 * Includes internal navigation links, verified external clinical reference links,
 * clickable brand mark, and dynamic copyright year.
 */
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Footer({ navigation }) {
  const currentYear = new Date().getFullYear();

  const openExternal = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.brandRow}
        onPress={() => navigation?.navigate('Schedule')}
        activeOpacity={0.75}
      >
        <Text style={styles.brandTitle}>LADIP</Text>
        <View style={styles.brandDot}>
          <Text style={styles.brandDotText}>✓</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.tagline}>
        Longitudinal Adverse Drug Interaction Predictor • Patient Safety Copilot
      </Text>

      {/* Internal Navigation Links */}
      <Text style={styles.sectionEyebrow}>WORKSPACE MODULES</Text>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => navigation?.navigate('Schedule')}>
          <Text style={styles.linkText}>Today's Schedule</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Checker')}>
          <Text style={styles.linkText}>Ask Medicine</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Scanner')}>
          <Text style={styles.linkText}>Scan Rx</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Profile')}>
          <Text style={styles.linkText}>Health Record</Text>
        </TouchableOpacity>
      </View>

      {/* External Clinical Reference Links */}
      <Text style={[styles.sectionEyebrow, { marginTop: 12 }]}>CLINICAL STANDARDS</Text>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => openExternal('https://open.fda.gov/apis/drug/event/')}>
          <Text style={styles.linkText}>FDA FAERS</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => openExternal('https://lhncbc.nlm.nih.gov/RxNav/')}>
          <Text style={styles.linkText}>NIH RxNorm</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => openExternal('https://www.meddra.org/')}>
          <Text style={styles.linkText}>MedDRA</Text>
        </TouchableOpacity>
        <Text style={styles.dotSep}>•</Text>
        <TouchableOpacity onPress={() => openExternal('https://www.ncbi.nlm.nih.gov/books/NBK548069/')}>
          <Text style={styles.linkText}>Naranjo Scale</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>
        © {currentYear} LADIP — Longitudinal Adverse Drug Interaction Predictor. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingTop: 22,
    marginTop: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  brandDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#D4A5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 4,
    marginBottom: 14,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    textDecorationLine: 'underline',
  },
  dotSep: {
    fontSize: 11,
    color: '#6B6B6B',
  },
  copyright: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 16,
  },
});
