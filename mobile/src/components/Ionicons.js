/**
 * Pure React Native Geometric Vector Icon Set (Drop-in replacement for @expo/vector-icons Ionicons)
 * Renders 100% natively via React Native <View> / <Text> primitives so icons NEVER fail to load
 * or appear blank in standalone Android release APKs, iOS builds, Expo Go, or Web.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Ionicons({ name = '', size = 18, color = '#111827', style }) {
  const s = Number(size) || 18;
  const stroke = Math.max(1.5, Math.round(s * 0.1));
  const n = String(name || '').toLowerCase();

  // 1. Hamburger Menu (menu / menu-outline)
  if (n.startsWith('menu')) {
    const barW = Math.round(s * 0.78);
    const gap = Math.max(2, Math.round(s * 0.16));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View style={{ width: barW, height: stroke, backgroundColor: color, borderRadius: stroke, marginBottom: gap }} />
        <View style={{ width: barW, height: stroke, backgroundColor: color, borderRadius: stroke, marginBottom: gap }} />
        <View style={{ width: barW, height: stroke, backgroundColor: color, borderRadius: stroke }} />
      </View>
    );
  }

  // 2. Close (close / close-outline)
  if (n.startsWith('close')) {
    const barW = Math.round(s * 0.78);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            position: 'absolute',
            width: barW,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: barW,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
    );
  }

  // 3. Scanner Viewfinder Brackets (scan / scan-outline)
  if (n.startsWith('scan')) {
    const box = Math.round(s * 0.82);
    const corner = Math.max(4, Math.round(box * 0.3));
    const r = Math.max(2, Math.round(s * 0.12));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View style={{ width: box, height: box, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {/* Top-Left */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: corner,
              height: corner,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: r,
            }}
          />
          {/* Top-Right */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: corner,
              height: corner,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              borderTopRightRadius: r,
            }}
          />
          {/* Bottom-Left */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: corner,
              height: corner,
              borderBottomWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              borderBottomLeftRadius: r,
            }}
          />
          {/* Bottom-Right */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: corner,
              height: corner,
              borderBottomWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              borderBottomRightRadius: r,
            }}
          />
          {/* Center Laser Line */}
          <View
            style={{
              width: Math.round(box * 0.65),
              height: Math.max(1.5, stroke * 0.85),
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        </View>
      </View>
    );
  }

  // 4. Calendar (calendar / calendar-outline)
  if (n.startsWith('calendar')) {
    const isFilled = n === 'calendar';
    const box = Math.round(s * 0.82);
    const dotSize = Math.max(2, Math.round(s * 0.11));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        {/* Top pegs */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: Math.round(box * 0.55), marginBottom: -1, zIndex: 2 }}>
          <View style={{ width: stroke, height: Math.max(3, Math.round(s * 0.16)), backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: stroke, height: Math.max(3, Math.round(s * 0.16)), backgroundColor: color, borderRadius: 1 }} />
        </View>
        {/* Body */}
        <View
          style={{
            width: box,
            height: Math.round(box * 0.88),
            borderWidth: stroke,
            borderColor: color,
            borderRadius: Math.max(3, Math.round(s * 0.16)),
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: Math.max(2, Math.round(s * 0.1)),
          }}
        >
          <View
            style={{
              width: '100%',
              height: Math.max(3, Math.round(box * 0.28)),
              backgroundColor: color,
              opacity: isFilled ? 1 : 0.85,
            }}
          />
          <View style={{ flexDirection: 'row', gap: Math.max(3, Math.round(s * 0.14)) }}>
            <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize, backgroundColor: color }} />
            <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 5. Shield Checkmark (shield-checkmark / shield-checkmark-outline)
  if (n.startsWith('shield')) {
    const isOutline = n.includes('outline');
    const w = Math.round(s * 0.78);
    const h = Math.round(s * 0.88);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: w,
            height: h,
            borderWidth: stroke,
            borderColor: color,
            backgroundColor: isOutline ? 'transparent' : color,
            borderTopLeftRadius: Math.max(3, Math.round(w * 0.22)),
            borderTopRightRadius: Math.max(3, Math.round(w * 0.22)),
            borderBottomLeftRadius: Math.round(w * 0.5),
            borderBottomRightRadius: Math.round(w * 0.5),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: Math.max(4, Math.round(w * 0.42)),
              height: Math.max(3, Math.round(w * 0.24)),
              borderLeftWidth: Math.max(1.5, stroke * 0.9),
              borderBottomWidth: Math.max(1.5, stroke * 0.9),
              borderColor: isOutline ? color : '#FFFFFF',
              transform: [{ rotate: '-45deg' }, { translateY: -1 }],
            }}
          />
        </View>
      </View>
    );
  }

  // 6. Person / Profile (person / person-outline)
  if (n.startsWith('person')) {
    const isFilled = n === 'person';
    const head = Math.round(s * 0.36);
    const bodyW = Math.round(s * 0.72);
    const bodyH = Math.round(s * 0.34);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: head,
            height: head,
            borderRadius: head,
            borderWidth: stroke,
            borderColor: color,
            backgroundColor: isFilled ? color : 'transparent',
            marginBottom: Math.max(1, Math.round(s * 0.06)),
          }}
        />
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderTopLeftRadius: bodyW,
            borderTopRightRadius: bodyW,
            borderWidth: stroke,
            borderColor: color,
            backgroundColor: isFilled ? color : 'transparent',
          }}
        />
      </View>
    );
  }

  // 7. Unchecked Circle (ellipse-outline)
  if (n.startsWith('ellipse')) {
    const d = Math.round(s * 0.84);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: d,
            height: d,
            borderRadius: d,
            borderWidth: Math.max(1.8, stroke),
            borderColor: color,
          }}
        />
      </View>
    );
  }

  // 8. Checkmark Circle (checkmark-circle / checkmark-done-circle)
  if (n.startsWith('checkmark')) {
    const d = Math.round(s * 0.86);
    const checkColor = color.toUpperCase() === '#FFFFFF' ? '#1B7A3D' : '#FFFFFF';
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: d,
            height: d,
            borderRadius: d,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: Math.max(5, Math.round(d * 0.44)),
              height: Math.max(3, Math.round(d * 0.25)),
              borderLeftWidth: Math.max(1.6, stroke),
              borderBottomWidth: Math.max(1.6, stroke),
              borderColor: checkColor,
              transform: [{ rotate: '-45deg' }, { translateY: -1 }],
            }}
          />
        </View>
      </View>
    );
  }

  // 9. Warning / Alert Circle (warning / alert-circle)
  if (n.startsWith('warning') || n.startsWith('alert')) {
    const d = Math.round(s * 0.88);
    const fg = color.toUpperCase() === '#FFFFFF' ? '#DC2626' : '#FFFFFF';
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: d,
            height: d,
            borderRadius: n.startsWith('warning') ? Math.max(3, Math.round(d * 0.25)) : d,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: fg,
              fontSize: Math.max(9, Math.round(d * 0.68)),
              fontWeight: '900',
              lineHeight: Math.max(10, Math.round(d * 0.76)),
              includeFontPadding: false,
            }}
          >
            !
          </Text>
        </View>
      </View>
    );
  }

  // 10. Arrow Forward (arrow-forward)
  if (n.startsWith('arrow-forward')) {
    const shaftW = Math.round(s * 0.66);
    const head = Math.max(4, Math.round(s * 0.36));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View style={{ width: shaftW, height: stroke, backgroundColor: color, borderRadius: stroke }} />
        <View
          style={{
            position: 'absolute',
            right: Math.round(s * 0.14),
            width: head,
            height: head,
            borderTopWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }

  // 11. Notifications Bell (notifications / notifications-outline / notifications-off-outline)
  if (n.startsWith('notifications')) {
    const isFilled = n === 'notifications';
    const bellW = Math.round(s * 0.62);
    const bellH = Math.round(s * 0.56);
    const rimW = Math.round(s * 0.78);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: bellW,
            height: bellH,
            borderTopLeftRadius: bellW,
            borderTopRightRadius: bellW,
            borderWidth: stroke,
            borderColor: color,
            backgroundColor: isFilled ? color : 'transparent',
          }}
        />
        <View
          style={{
            width: rimW,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke,
            marginTop: -1,
          }}
        />
        <View
          style={{
            width: Math.max(3, Math.round(s * 0.2)),
            height: Math.max(2, Math.round(s * 0.14)),
            borderBottomLeftRadius: s,
            borderBottomRightRadius: s,
            backgroundColor: color,
            marginTop: 1,
          }}
        />
      </View>
    );
  }

  // 12. Log Out (log-out-outline)
  if (n.startsWith('log-out')) {
    const h = Math.round(s * 0.76);
    const w = Math.round(s * 0.42);
    const head = Math.max(4, Math.round(s * 0.3));
    return (
      <View style={[styles.center, { width: s, height: s, flexDirection: 'row' }, style]}>
        <View
          style={{
            width: w,
            height: h,
            borderTopWidth: stroke,
            borderBottomWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: 3,
            borderBottomLeftRadius: 3,
          }}
        />
        <View style={{ width: Math.round(s * 0.42), height: stroke, backgroundColor: color, marginLeft: -2 }} />
        <View
          style={{
            width: head,
            height: head,
            borderTopWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
            marginLeft: -head * 0.7,
          }}
        />
      </View>
    );
  }

  // 13. Lock (lock-closed / lock-closed-outline)
  if (n.startsWith('lock')) {
    const isFilled = n === 'lock-closed';
    const shackleW = Math.round(s * 0.44);
    const shackleH = Math.round(s * 0.28);
    const bodyW = Math.round(s * 0.68);
    const bodyH = Math.round(s * 0.48);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: shackleW,
            height: shackleH,
            borderTopLeftRadius: shackleW,
            borderTopRightRadius: shackleW,
            borderWidth: stroke,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderRadius: Math.max(2, Math.round(s * 0.14)),
            borderWidth: stroke,
            borderColor: color,
            backgroundColor: isFilled ? color : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: Math.max(2, stroke),
              height: Math.max(3, Math.round(bodyH * 0.36)),
              borderRadius: 2,
              backgroundColor: isFilled ? '#FFFFFF' : color,
            }}
          />
        </View>
      </View>
    );
  }

  // 14. Fingerprint (finger-print)
  if (n.startsWith('finger-print')) {
    const outer = Math.round(s * 0.82);
    const mid = Math.round(s * 0.54);
    const inner = Math.round(s * 0.26);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: outer,
            height: outer,
            borderRadius: outer,
            borderWidth: Math.max(1.4, stroke * 0.85),
            borderColor: color,
            borderBottomColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: mid,
              height: mid,
              borderRadius: mid,
              borderWidth: Math.max(1.4, stroke * 0.85),
              borderColor: color,
              borderTopColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: inner,
                height: Math.round(inner * 1.4),
                borderRadius: inner,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // 15. Camera (camera / camera-outline)
  if (n.startsWith('camera')) {
    const bodyW = Math.round(s * 0.82);
    const bodyH = Math.round(s * 0.6);
    const lens = Math.round(s * 0.32);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: Math.round(bodyW * 0.38),
            height: Math.max(2, Math.round(s * 0.12)),
            backgroundColor: color,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        />
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderRadius: Math.max(3, Math.round(s * 0.14)),
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: lens,
              height: lens,
              borderRadius: lens,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // 16. Image / Gallery (image / image-outline)
  if (n.startsWith('image')) {
    const box = Math.round(s * 0.78);
    const dot = Math.max(2.5, Math.round(s * 0.16));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: box,
            height: box,
            borderRadius: Math.max(3, Math.round(s * 0.14)),
            borderWidth: stroke,
            borderColor: color,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: Math.round(box * 0.18),
              left: Math.round(box * 0.18),
              width: dot,
              height: dot,
              borderRadius: dot,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -Math.round(box * 0.24),
              right: Math.round(box * 0.08),
              width: Math.round(box * 0.62),
              height: Math.round(box * 0.62),
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // 17. Eye / Password Visibility (eye-outline / eye-off-outline)
  if (n.startsWith('eye')) {
    const isOff = n.includes('off');
    const w = Math.round(s * 0.82);
    const h = Math.round(s * 0.5);
    const pupil = Math.max(3, Math.round(s * 0.22));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: w,
            height: h,
            borderRadius: h,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: pupil, height: pupil, borderRadius: pupil, backgroundColor: color }} />
        </View>
        {isOff && (
          <View
            style={{
              position: 'absolute',
              width: Math.round(s * 0.88),
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        )}
      </View>
    );
  }

  // 18. Clock / Time (time-outline)
  if (n.startsWith('time')) {
    const d = Math.round(s * 0.82);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: d,
            height: d,
            borderRadius: d,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: stroke,
              height: Math.round(d * 0.28),
              backgroundColor: color,
              marginBottom: Math.round(d * 0.14),
            }}
          />
        </View>
      </View>
    );
  }

  // 19. Chevron Up / Down (chevron-up / chevron-down)
  if (n.startsWith('chevron')) {
    const isUp = n.includes('up');
    const c = Math.max(5, Math.round(s * 0.38));
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: c,
            height: c,
            borderRightWidth: stroke,
            borderBottomWidth: stroke,
            borderColor: color,
            transform: [{ rotate: isUp ? '-135deg' : '45deg' }, { translateY: isUp ? 1 : -1 }],
          }}
        />
      </View>
    );
  }

  // 20. Sparkles / Flask / Chatbubble
  if (n.startsWith('sparkles')) {
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View style={{ width: stroke, height: Math.round(s * 0.78), backgroundColor: color, borderRadius: stroke }} />
        <View style={{ position: 'absolute', width: Math.round(s * 0.78), height: stroke, backgroundColor: color, borderRadius: stroke }} />
      </View>
    );
  }

  if (n.startsWith('chatbubble')) {
    const w = Math.round(s * 0.8);
    const h = Math.round(s * 0.66);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: w,
            height: h,
            borderRadius: Math.round(h * 0.5),
            backgroundColor: color,
          }}
        />
      </View>
    );
  }

  if (n.startsWith('flask')) {
    const w = Math.round(s * 0.7);
    const h = Math.round(s * 0.78);
    return (
      <View style={[styles.center, { width: s, height: s }, style]}>
        <View
          style={{
            width: Math.round(w * 0.42),
            height: Math.round(h * 0.35),
            borderLeftWidth: stroke,
            borderRightWidth: stroke,
            borderTopWidth: stroke,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: w,
            height: Math.round(h * 0.58),
            borderWidth: stroke,
            borderColor: color,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            marginTop: -1,
          }}
        />
      </View>
    );
  }

  // Default fallback geometric dot
  const d = Math.round(s * 0.5);
  return (
    <View style={[styles.center, { width: s, height: s }, style]}>
      <View style={{ width: d, height: d, borderRadius: d, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Ionicons;
