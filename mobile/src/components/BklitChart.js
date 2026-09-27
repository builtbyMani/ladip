/**
 * Bklit.UI Composable Chart Suite for LADIP Mobile & Web
 * Provides BklitBarChart, BklitRingChart, and BklitTimelineChart with interactive
 * ChartTooltip selection and motion.dev spring animations.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BKLIT_COLORS = {
  ink: '#1A1A1A',
  muted: '#6B6B6B',
  border: '#E5E5E0',
  surfaceMuted: '#F5F5F0',
  green: '#1B7A3D',
  lavender: '#D4A5E5',
  gold: '#E8C840',
  coral: '#DC2626',
};

function AnimatedBarFill({ ratio, color, delay = 0 }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = Math.max(6, Math.min(100, ratio * 100));
    const timer = setTimeout(() => {
      Animated.spring(animWidth, {
        toValue: target,
        stiffness: 120,
        damping: 18,
        mass: 0.9,
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [ratio, delay, animWidth]);

  const widthInterpolated = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width: widthInterpolated,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

/**
 * Composable Bklit.UI Horizontal PRR & Risk Bar Chart
 */
export function BklitBarChart({
  title = 'FAERS Disproportionality (PRR)',
  eyebrow = 'CLINICAL TELEMETRY',
  subtitle = 'Tap any bar to inspect 2x2 disproportionality metrics.',
  items = [],
  threshold = 2.0,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!items || items.length === 0) {
    return null;
  }

  const maxVal = Math.max(
    ...items.map((i) => Number(i.value || 0)),
    threshold * 1.5,
    1
  );

  const tierColorMap = {
    CRITICAL: BKLIT_COLORS.coral,
    HIGH: BKLIT_COLORS.gold,
    MODERATE: BKLIT_COLORS.lavender,
    LOW: BKLIT_COLORS.green,
  };

  const activeItem = items[selectedIdx] || items[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {items.map((item, idx) => {
        const val = Number(item.value || 0);
        const ratio = val / maxVal;
        const color = tierColorMap[item.tier] || BKLIT_COLORS.lavender;
        const isSelected = idx === selectedIdx;

        return (
          <TouchableOpacity
            key={idx}
            style={[styles.barRow, isSelected && styles.barRowSelected]}
            onPress={() => setSelectedIdx(idx)}
            activeOpacity={0.8}
          >
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barValueMono}>{val.toFixed(2)}x PRR</Text>
            </View>
            <AnimatedBarFill ratio={ratio} color={color} delay={idx * 60} />
          </TouchableOpacity>
        );
      })}

      {/* Composable ChartTooltip Inspector */}
      {activeItem && (
        <View style={styles.tooltipBox}>
          <Text style={styles.ttEyebrow}>SIGNAL INSPECTOR</Text>
          <Text style={styles.ttTitle}>{activeItem.label}</Text>
          <View style={styles.ttRow}>
            <Text style={styles.ttKey}>Reporting Ratio (PRR)</Text>
            <Text style={styles.ttVal}>{Number(activeItem.value || 0).toFixed(2)}x</Text>
          </View>
          {activeItem.cases !== undefined && (
            <View style={styles.ttRow}>
              <Text style={styles.ttKey}>FAERS Co-Reports</Text>
              <Text style={styles.ttVal}>{activeItem.cases}</Text>
            </View>
          )}
          <View style={styles.ttRow}>
            <Text style={styles.ttKey}>Evans Threshold</Text>
            <Text style={styles.ttVal}>≥ {threshold.toFixed(1)}x</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Composable Radial / Progress Telemetry Card
 */
export function BklitRingChart({
  title = 'Daily Adherence & Safety Telemetry',
  eyebrow = 'CLINICAL TELEMETRY',
  metrics = [],
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!metrics || metrics.length === 0) return null;

  const activeMetric = metrics[selectedIdx] || metrics[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.ringGrid}>
        {metrics.map((m, idx) => {
          const pct = Math.max(0, Math.min(100, Number(m.percent || 0)));
          const isSelected = idx === selectedIdx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.ringCell,
                isSelected && { borderColor: BKLIT_COLORS.ink },
              ]}
              onPress={() => setSelectedIdx(idx)}
              activeOpacity={0.85}
            >
              <Text style={[styles.ringHeroVal, m.color ? { color: m.color } : null]}>
                {m.display}
              </Text>
              <Text style={styles.ringLabel}>{m.label}</Text>
              <View style={{ width: '100%', marginTop: 8 }}>
                <AnimatedBarFill
                  ratio={pct / 100}
                  color={m.color || BKLIT_COLORS.ink}
                  delay={idx * 70}
                />
              </View>
              {m.subtitle ? <Text style={styles.ringSub}>{m.subtitle}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {activeMetric && (
        <View style={styles.tooltipBox}>
          <Text style={styles.ttEyebrow}>TELEMETRY INSPECTOR</Text>
          <Text style={styles.ttTitle}>{activeMetric.label}</Text>
          <View style={styles.ttRow}>
            <Text style={styles.ttKey}>Current Reading</Text>
            <Text style={styles.ttVal}>{activeMetric.display}</Text>
          </View>
          <View style={styles.ttRow}>
            <Text style={styles.ttKey}>Normalized Index</Text>
            <Text style={styles.ttVal}>
              {Math.max(0, Math.min(100, Number(activeMetric.percent || 0))).toFixed(0)}%
            </Text>
          </View>
          {activeMetric.subtitle ? (
            <View style={styles.ttRow}>
              <Text style={styles.ttKey}>Clinical Context</Text>
              <Text style={styles.ttVal}>{activeMetric.subtitle}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  barRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  barRowSelected: {
    backgroundColor: '#F5F5F0',
    borderColor: '#E5E5E0',
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  barValueMono: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#F5F5F0',
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  barFill: {
    height: '100%',
    borderRadius: 9999,
  },
  tooltipBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  ttEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#6B6B6B',
    marginBottom: 2,
  },
  ttTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  ttRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F0',
  },
  ttKey: {
    fontSize: 11,
    color: '#6B6B6B',
  },
  ttVal: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ringCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F0',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    padding: 12,
  },
  ringHeroVal: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  ringSub: {
    fontSize: 10,
    color: '#6B6B6B',
    marginTop: 5,
  },
});
