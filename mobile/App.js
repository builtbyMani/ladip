/**
 * LADIP Patient Mobile App — Entry Point
 * Editorial Health-Tech Aesthetic (Bella-inspired, clean white surfaces, black pill CTAs, forest green accents)
 * Includes dynamic page titles, meta descriptions, custom 404 screen, and mobile overflow protection.
 */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from './src/components/Ionicons';

import { PatientProvider, usePatient } from './src/context/PatientContext';
import Header from './src/components/Header';
import LoginScreen from './src/screens/LoginScreen';
import TodayScheduleScreen from './src/screens/TodayScheduleScreen';
import DrugCheckerScreen from './src/screens/DrugCheckerScreen';
import PrescriptionScannerScreen from './src/screens/PrescriptionScannerScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';

const SCREEN_META = {
  Schedule: {
    title: "Today's Dosing Schedule | LADIP — Patient Safety Copilot",
    description:
      'Daily medication regimen schedule and longitudinal multi-drug interaction shield powered by FDA FAERS.',
  },
  Checker: {
    title: 'Ask Medicine / OTC Safety Check | LADIP — Patient Safety Copilot',
    description:
      'Prospective medication and OTC safety checker evaluating candidate drugs against your active prescriptions.',
  },
  Scanner: {
    title: 'Scan Prescription / OCR | LADIP — Patient Safety Copilot',
    description:
      'Optical prescription and clinical chart scanner with automated multi-drug interaction detection.',
  },
  Profile: {
    title: 'Electronic Health Record | LADIP — Patient Safety Copilot',
    description:
      'Longitudinal patient health profile, active prescriptions, allergies, and laboratory biomarkers.',
  },
  NotFound: {
    title: '404 Screen Not Found | LADIP — Patient Safety Copilot',
    description: 'The requested clinical screen could not be found in the LADIP application.',
  },
};

const VALID_TABS = {
  schedule: 'Schedule',
  discovery: 'Schedule',
  checker: 'Checker',
  safety: 'Checker',
  scanner: 'Scanner',
  ocr: 'Scanner',
  profile: 'Profile',
  ehr: 'Profile',
};

function resolveInitialWebTab() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const rawParam = (params.get('tab') || params.get('workflow') || '').trim();
      if (rawParam) {
        return VALID_TABS[rawParam.toLowerCase()] || rawParam;
      }
      const pathSlug = (window.location.pathname || '/').replace(/^\/+|\/+$/g, '');
      if (pathSlug && pathSlug !== 'index.html') {
        return VALID_TABS[pathSlug.toLowerCase()] || pathSlug;
      }
    } catch (_) {}
  }
  return 'Schedule';
}

function MainAppContent() {
  const [activeTab, setActiveTab] = useState(resolveInitialWebTab);
  const { isAuthenticated, alerts, profile } = usePatient();

  const criticalCount =
    alerts?.filter(
      (a) => (a.severity_tier === 'CRITICAL' || a.severity_tier === 'HIGH') && !a.is_suppressed
    ).length || 0;

  const navigation = {
    navigate: (tabName) => {
      setActiveTab(tabName);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', tabName);
          window.history.replaceState({}, '', url.toString());
        } catch (_) {}
      }
    },
  };

  // Sync page title & meta description on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const meta = SCREEN_META[activeTab] || SCREEN_META.NotFound;
      const patientSuffix = profile?.name ? ` (${profile.name})` : '';
      document.title = `${meta.title}${patientSuffix}`;

      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.setAttribute('name', 'description');
        document.head.appendChild(descTag);
      }
      descTag.setAttribute('content', meta.description);
    }
  }, [activeTab, profile?.name]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Schedule':
        return <TodayScheduleScreen navigation={navigation} />;
      case 'Checker':
        return <DrugCheckerScreen navigation={navigation} />;
      case 'Scanner':
        return <PrescriptionScannerScreen navigation={navigation} />;
      case 'Profile':
        return <PatientProfileScreen navigation={navigation} />;
      default:
        return <NotFoundScreen navigation={navigation} requestedRoute={activeTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Header navigation={navigation} activeTab={activeTab} />
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Editorial Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {/* Tab 1: Today Schedule */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Schedule')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Schedule' ? 'calendar' : 'calendar-outline'}
            size={21}
            color={activeTab === 'Schedule' ? '#1A1A1A' : '#6B6B6B'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Schedule' && styles.tabLabelActive]}>
            Schedule
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Ask Medicine / Drug Checker */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Checker')}
          activeOpacity={0.7}
        >
          <View>
            <Ionicons
              name={activeTab === 'Checker' ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={21}
              color={activeTab === 'Checker' ? '#1A1A1A' : '#6B6B6B'}
            />
            {criticalCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{criticalCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Checker' && styles.tabLabelActive]}>
            Ask Med
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Scan Prescription (Black Pill Center Button) */}
        <TouchableOpacity
          style={styles.scanTabBtn}
          onPress={() => setActiveTab('Scanner')}
          activeOpacity={0.85}
        >
          <View style={styles.scanTabInner}>
            <Ionicons name="scan" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Scanner' && styles.tabLabelActive]}>
            Scan Rx
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Health Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Profile' ? 'person' : 'person-outline'}
            size={21}
            color={activeTab === 'Profile' ? '#1A1A1A' : '#6B6B6B'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PatientProvider>
        <MainAppContent />
      </PatientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 20 : 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B6B6B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#1A1A1A',
    fontWeight: '800',
  },
  scanTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanTabInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
