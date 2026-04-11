import * as Notifications from 'expo-notifications';

export const scheduleNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Morning exercise reminder — 9:30 AM daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏃 Exercise Time, Hammad!',
      body: 'Put on your workout clothes. Just 2 minutes to start.',
      sound: true,
    },
    trigger: {
      hour: 9,
      minute: 30,
      repeats: true,
    },
  });

  // Night reading reminder — 11:30 PM daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📖 Reading Time!',
      body: 'Open your book before you touch your phone. Just 2 pages.',
      sound: true,
    },
    trigger: {
      hour: 23,
      minute: 30,
      repeats: true,
    },
  });
};
