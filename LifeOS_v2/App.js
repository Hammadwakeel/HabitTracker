import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import * as Notifications from 'expo-notifications';

import TodayScreen from './screens/TodayScreen';
import HealthScreen from './screens/HealthScreen';
import JournalScreen from './screens/JournalScreen';
import ProgressScreen from './screens/ProgressScreen';
import BooksScreen from './screens/BooksScreen';
import { scheduleNotifications } from './utils/notifications';
import { COLORS } from './utils/theme';

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TABS = [
  { name: 'Today', component: TodayScreen, emoji: '🎯' },
  { name: 'Health', component: HealthScreen, emoji: '💪' },
  { name: 'Journal', component: JournalScreen, emoji: '📓' },
  { name: 'Progress', component: ProgressScreen, emoji: '📊' },
  { name: 'Books', component: BooksScreen, emoji: '📚' },
];

export default function App() {
  useEffect(() => { scheduleNotifications(); }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>{tab.emoji}</Text> }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
