/**
 * LADIP Patient Mobile App — Entry Point
 * Editorial Health-Tech Aesthetic (Bella-inspired, clean white surfaces, black pill CTAs, forest green accents)
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { PatientProvider, usePatient } from './src/context/PatientContext';
import Header from './src/components/Header';
import TodayScheduleScreen from './src/screens/TodayScheduleScreen';
import DrugCheckerScreen from './src/screens/DrugCheckerScreen';
import PrescriptionScannerScreen from './src/screens/PrescriptionScannerScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState('Schedule');
  const { alerts } = usePatient();

  const criticalCount = alerts?.filter(
    (a) => (a.severity_tier === 'CRITICAL' || a.severity_tier === 'HIGH') && !a.is_suppressed
  ).length || 0;

  const navigation = {
    navigate: (tabName) => setActiveTab(tabName),
  };

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
        return <TodayScheduleScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Header />
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
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 20) : 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
