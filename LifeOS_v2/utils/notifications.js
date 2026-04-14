import * as Notifications from 'expo-notifications';

export const scheduleNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: { title: '🏃 Exercise Time, Hammad!', body: 'Put on your workout clothes. Just 2 minutes to start.', sound: true },
    trigger: { hour: 9, minute: 30, repeats: true },
  });
  await Notifications.scheduleNotificationAsync({
    content: { title: '💧 Water Check', body: "How's your water intake today?", sound: false },
    trigger: { hour: 14, minute: 0, repeats: true },
  });
  await Notifications.scheduleNotificationAsync({
    content: { title: '📖 Reading Time!', body: 'Open your book before you touch your phone. Just 2 pages.', sound: true },
    trigger: { hour: 23, minute: 30, repeats: true },
  });
  await Notifications.scheduleNotificationAsync({
    content: { title: '📓 Daily Reflection', body: "30 seconds. What was today's win?", sound: false },
    trigger: { hour: 23, minute: 0, repeats: true },
  });
};
