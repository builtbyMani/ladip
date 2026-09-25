/**
 * MotionView — Smooth Spring Animation Wrapper (motion.dev physics for React Native & Web)
 * Applies spring physics (stiffness: 120, damping: 18, mass: 0.9) with staggered entrance delays
 * and zero horizontal layout shift.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

export default function MotionView({
  children,
  delay = 0,
  initialY = 12,
  style,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          stiffness: 120,
          damping: 18,
          mass: 0.9,
          useNativeDriver: useNative,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          stiffness: 120,
          damping: 18,
          mass: 0.9,
          useNativeDriver: useNative,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, initialY, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
