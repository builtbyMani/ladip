/**
 * Medication Dose Time Notification Service
 * Schedules daily medication time reminders (8:00 AM, 1:00 PM, 7:00 PM, 10:00 PM)
 * via expo-notifications (iOS/Android) and Web Notification API, and supports
 * instant live dose due notifications & 15-minute snoozing.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior so alerts appear even while app is open
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // Web or unsupported environment fallback
}

export const SLOT_ALARM_CONFIG = {
  morning: {
    key: 'morning',
    title: 'Morning Dose (8:00 AM)',
    shortTime: '8:00 AM',
    hour: 8,
    minute: 0,
  },
  afternoon: {
    key: 'afternoon',
    title: 'Afternoon Dose (1:00 PM)',
    shortTime: '1:00 PM',
    hour: 13,
    minute: 0,
  },
  evening: {
    key: 'evening',
    title: 'Evening Dose (7:00 PM)',
    shortTime: '7:00 PM',
    hour: 19,
    minute: 0,
  },
  bedtime: {
    key: 'bedtime',
    title: 'Bedtime Dose (10:00 PM)',
    shortTime: '10:00 PM',
    hour: 22,
    minute: 0,
  },
};

/**
 * Request notification permissions on iOS, Android, or Web
 */
export async function requestMedicationNotificationPermissions() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'granted') {
          return { granted: true };
        }
        const perm = await window.Notification.requestPermission();
        return { granted: perm === 'granted' };
      }
      return { granted: true };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ladip-med-reminders', {
        name: 'LADIP Medication Dose Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B7A3D',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return { granted: finalStatus === 'granted' };
  } catch {
    return { granted: true };
  }
}

/**
 * Inspect the patient's daily schedule and return the next upcoming (or currently due) slot
 */
export function getNextUpcomingDoseSlot(schedule, takenMeds = {}) {
  if (!schedule) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const orderedKeys = ['morning', 'afternoon', 'evening', 'bedtime'];

  const availableSlots = orderedKeys
    .map((slotKey) => {
      const slot = schedule[slotKey];
      const items = slot?.items || [];
      if (items.length === 0) return null;

      const config = SLOT_ALARM_CONFIG[slotKey] || {
        key: slotKey,
        title: slot.title || slotKey,
        shortTime: '8:00 AM',
        hour: 8,
        minute: 0,
      };

      const untakenItems = items.filter(
        (med, idx) => !takenMeds[`${slotKey}_${med.drug_name}_${idx}`]
      );

      return {
        slotKey,
        title: slot.title || config.title,
        shortTime: config.shortTime,
        hour: config.hour,
        minute: config.minute,
        slotMinutes: config.hour * 60 + config.minute,
        items,
        untakenItems,
      };
    })
    .filter(Boolean);

  if (availableSlots.length === 0) return null;

  // Prefer the next slot today that still has untaken medicines
  const upcomingUntaken = availableSlots.find(
    (s) => s.untakenItems.length > 0 && s.slotMinutes >= currentMinutes - 60
  );
  if (upcomingUntaken) return upcomingUntaken;

  // Otherwise first slot with untaken medicines
  const anyUntaken = availableSlots.find((s) => s.untakenItems.length > 0);
  if (anyUntaken) return anyUntaken;

  // Otherwise tomorrow morning's first slot
  return availableSlots[0];
}

/**
 * Schedule daily local notifications for every active slot in the patient's regimen
 */
export async function scheduleDailyMedicationNotifications(schedule, patientName = 'Ramesh Sharma') {
  if (!schedule) return { scheduledCount: 0, slots: [] };

  await requestMedicationNotificationPermissions();

  const scheduledSlots = [];
  const firstName = (patientName || 'Patient').split(' ')[0];

  try {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    for (const slotKey of Object.keys(SLOT_ALARM_CONFIG)) {
      const slot = schedule[slotKey];
      const items = slot?.items || [];
      if (items.length === 0) continue;

      const config = SLOT_ALARM_CONFIG[slotKey];
      const medSummary = items.map((m) => `${m.drug_name} (${m.dose})`).join(', ');

      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${firstName}'s ${config.shortTime} Medication`,
            body: `Please take: ${medSummary}`,
            data: {
              slotKey,
              slotTitle: slot.title || config.title,
              medications: items,
            },
            sound: true,
          },
          trigger: {
            hour: config.hour,
            minute: config.minute,
            repeats: true,
          },
        });
      }

      scheduledSlots.push({
        slotKey,
        shortTime: config.shortTime,
        title: slot.title || config.title,
        medCount: items.length,
        medSummary,
      });
    }
  } catch (err) {
    console.warn('Could not schedule native daily notifications:', err);
  }

  return {
    scheduledCount: scheduledSlots.length,
    slots: scheduledSlots,
  };
}

/**
 * Trigger an immediate medication dose notification now (for due doses or live demonstration)
 */
export async function triggerMedicationDueNotificationNow(
  slotInfo,
  patientName = 'Ramesh Sharma'
) {
  await requestMedicationNotificationPermissions();

  const firstName = (patientName || 'Patient').split(' ')[0];
  const items = slotInfo?.untakenItems?.length
    ? slotInfo.untakenItems
    : slotInfo?.items || [];
  const medSummary =
    items.length > 0
      ? items.map((m) => `${m.drug_name} (${m.dose})`).join(', ')
      : 'Warfarin 5mg, Aspirin 81mg';
  const timeLabel = slotInfo?.shortTime || '8:00 AM';
  const title = `Medication Due (${timeLabel}) — ${firstName}`;
  const body = `It is time to take: ${medSummary}. Tap to mark your dose as taken.`;

  try {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted'
      ) {
        new window.Notification(title, { body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            slotKey: slotInfo?.slotKey || 'morning',
            medications: items,
          },
          sound: true,
        },
        trigger: null, // Immediate delivery
      });
    }
  } catch (err) {
    console.warn('Immediate notification fallback:', err);
  }

  return {
    id: `notif_${Date.now()}`,
    title,
    body,
    slotKey: slotInfo?.slotKey || 'morning',
    slotTitle: slotInfo?.title || `Morning (8:00 AM)`,
    shortTime: timeLabel,
    items,
    triggeredAt: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
