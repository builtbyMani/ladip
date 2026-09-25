/**
 * Custom 404 Not Found Screen for LADIP Mobile & Web
 * Editorial Health-Tech Aesthetic
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MotionView from '../components/MotionView';
import Footer from '../components/Footer';

export default function NotFoundScreen({ navigation, requestedRoute }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled={true}
    >
      <MotionView delay={20}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>HTTP 404 — ROUTE NOT FOUND</Text>
          <Text style={styles.bigNum}>404</Text>
          <Text style={styles.title}>Clinical Screen Not Found</Text>
          <Text style={styles.body}>
            The requested screen{requestedRoute ? ` "${requestedRoute}"` : ''} does not exist in the
            LADIP Patient Safety Copilot. Use the button below to return to your active dosing schedule.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation?.navigate('Schedule')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Return to Today's Schedule</Text>
          </TouchableOpacity>
        </View>
      </MotionView>
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
  card: {
    borderTopWidth: 2,
    borderTopColor: '#DC2626',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingVertical: 28,
    marginVertical: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bigNum: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 56,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 60,
    marginBottom: 8,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
