import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { ensureReminderScheduled, onReminderTap, TAP_TARGET } from '../services/reminders';

/**
 * Opens the right screen when a reminder notification is tapped, and
 * re-asserts the reminder schedule on launch (schedules can be dropped by
 * a device restart or app update). Renders nothing.
 *
 * The symptom check-in lives in Health Tools (subscriber feature). A tap
 * is held until the subscription status is known, then non-subscribers
 * land on Home, where the free daily check-in is.
 */
const NotificationHandler = () => {
  const navigate = useNavigate();
  const { isSubscribed, isLoading } = useSubscription();
  const pendingRef = useRef(null);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    ensureReminderScheduled();
    let unsubscribe = () => {};
    let cancelled = false;
    onReminderTap((target) => {
      pendingRef.current = target;
      setTapCount(n => n + 1);
    }).then((off) => {
      if (cancelled) off(); else unsubscribe = off;
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    const target = pendingRef.current;
    if (!target || isLoading) return;
    pendingRef.current = null;
    if (!isSubscribed) {
      navigate('/');
      return;
    }
    const view = target === TAP_TARGET.DASHBOARD ? 'dashboard' : 'checkin';
    // `at` makes every tap a new link, so it works even if Health Tools is already open.
    navigate(`/health-tools?tab=symptoms&view=${view}&at=${Date.now()}`);
  }, [tapCount, isLoading, isSubscribed, navigate]);

  return null;
};

export default NotificationHandler;
