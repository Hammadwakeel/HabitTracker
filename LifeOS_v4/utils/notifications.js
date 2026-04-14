import * as Notifications from 'expo-notifications';

export const scheduleNotifications = async (profile) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminders = [
    { hour: 5, minute: 0, title: '🕌 Fajr Time', body: 'Start your day with prayer.' },
    { hour: 9, minute: 30, title: '🏃 Exercise Time!', body: 'Put on your workout clothes. Just 2 minutes to start.' },
    { hour: 13, minute: 0, title: '🕌 Dhuhr Reminder', body: "Don't forget your midday prayer." },
    { hour: 14, minute: 0, title: '💧 Water Check', body: "How's your hydration today?" },
    { hour: 16, minute: 30, title: '🕌 Asr Time', body: 'Take a break and pray.' },
    { hour: 19, minute: 30, title: '🕌 Maghrib Time', body: 'Sunset prayer time.' },
    { hour: 21, minute: 0, title: '⏱ Deep Work Session', body: 'Last focus block of the day. Make it count.' },
    { hour: 21, minute: 30, title: '🕌 Isha Time', body: "End your day with Isha prayer." },
    { hour: 23, minute: 0, title: '📓 Journal Time', body: "30 seconds. What was today's win?" },
    { hour: 23, minute: 30, title: '📖 Reading Time', body: 'Open your book. Just 2 pages before sleep.' },
  ];

  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, sound: true },
      trigger: { hour: r.hour, minute: r.minute, repeats: true },
    });
  }
};
