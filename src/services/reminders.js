/**
 * reminders.js — Gentle daily check-in reminder
 *
 * Uses @capacitor/local-notifications on native platforms. On plain web the
 * functions no-op gracefully (the ReminderCard explains reminders live in
 * the mobile app). Preference is stored under STORAGE_KEYS.REMINDER so it
 * survives restarts and rides along in backups.
 *
 * NOTE FOR BUILDS: after `npm install`, run `npx cap sync` so the native
 * projects pick up the LocalNotifications plugin.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import storage, { STORAGE_KEYS } from './storage';

const NOTIFICATION_ID = 7001;
const WEEKLY_SUMMARY_ID = 7002;

/* Sunday-evening "your week in review" invitation. Local notifications are
   static, so the numbers live on the dashboard — this just opens the door. */
const weeklySummaryNotification = () => ({
  id: WEEKLY_SUMMARY_ID,
  title: 'Your week in review',
  body: 'Your dashboard has this week\u2019s trends, what helped, and any patterns worth a look.',
  schedule: { on: { weekday: 1, hour: 18, minute: 0 }, allowWhileIdle: true }, // Sunday 6pm
});

export const isReminderSupported = () => Capacitor.isNativePlatform();

export async function getReminderPref() {
  const pref = await storage.get(STORAGE_KEYS.REMINDER);
  return pref && typeof pref === 'object'
    ? { enabled: !!pref.enabled, hour: pref.hour ?? 19, minute: pref.minute ?? 0 }
    : { enabled: false, hour: 19, minute: 0 };
}

/**
 * Enable the daily reminder at the given local time.
 * Returns { ok, reason } — reason is 'permission' when the user declined.
 */
export async function enableReminder(hour, minute) {
  if (!isReminderSupported()) return { ok: false, reason: 'web' };
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return { ok: false, reason: 'permission' };

    // Replace any previous schedule before creating the new one.
    await cancelPending();
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIFICATION_ID,
        title: 'Resilient Path',
        // Deliberately gentle: no streaks, no guilt — an invitation, not a demand.
        body: 'A 30-second check-in, whenever you\u2019re ready. No pressure.',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      }, weeklySummaryNotification()],
    });
    await storage.set(STORAGE_KEYS.REMINDER, { enabled: true, hour, minute });
    return { ok: true };
  } catch (e) {
    console.error('Reminder scheduling failed', e);
    return { ok: false, reason: 'error' };
  }
}

export async function disableReminder() {
  try {
    if (isReminderSupported()) await cancelPending();
  } catch (e) {
    console.error('Reminder cancel failed', e);
  }
  const pref = await getReminderPref();
  await storage.set(STORAGE_KEYS.REMINDER, { ...pref, enabled: false });
}

async function cancelPending() {
  const pending = await LocalNotifications.getPending();
  const ours = (pending.notifications || []).filter(n => n.id === NOTIFICATION_ID || n.id === WEEKLY_SUMMARY_ID);
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) });
}

/**
 * Re-assert the schedule on app launch. Notification schedules can be lost
 * on device restart or app update; if the user opted in, quietly restore it.
 */
export async function ensureReminderScheduled() {
  if (!isReminderSupported()) return;
  try {
    const pref = await getReminderPref();
    if (!pref.enabled) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    const pending = await LocalNotifications.getPending();
    const have = new Set((pending.notifications || []).map(n => n.id));
    const toSchedule = [];
    if (!have.has(NOTIFICATION_ID)) {
      toSchedule.push({
        id: NOTIFICATION_ID,
        title: 'Resilient Path',
        body: 'A 30-second check-in, whenever you\u2019re ready. No pressure.',
        schedule: { on: { hour: pref.hour, minute: pref.minute }, allowWhileIdle: true },
      });
    }
    if (!have.has(WEEKLY_SUMMARY_ID)) toSchedule.push(weeklySummaryNotification());
    if (toSchedule.length) await LocalNotifications.schedule({ notifications: toSchedule });
  } catch (e) {
    console.error('Reminder re-schedule failed', e);
  }
}
