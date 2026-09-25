/**
 * LADIP Patient Mobile App - Entry Point
 * Built with Expo React Native, Patient Safety Copilot, and Prescription Scanner.
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

  // Active critical alert badge count
  const criticalCount = alerts?.filter(
    (a) => (a.severity_tier === 'CRITICAL' || a.severity_tier === 'HIGH') && !a.is_suppressed
  ).length || 0;

  // Navigation mock object to pass to screens
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
      <StatusBar style="light" backgroundColor="#0F172A" />
      <Header />
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {/* Tab 1: Today Schedule */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Schedule')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'Schedule' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={activeTab === 'Schedule' ? '#0284C7' : '#64748B'}
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
              size={22}
              color={activeTab === 'Checker' ? '#0284C7' : '#64748B'}
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

        {/* Tab 3: Scan Prescription (Prominent Center Button) */}
        <TouchableOpacity
          style={styles.scanTabBtn}
          onPress={() => setActiveTab('Scanner')}
          activeOpacity={0.8}
        >
          <View style={styles.scanTabInner}>
            <Ionicons name="scan" size={24} color="#FFFFFF" />
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
            size={22}
            color={activeTab === 'Profile' ? '#0284C7' : '#64748B'}
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
    backgroundColor: '#0F172A',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#0284C7',
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
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
