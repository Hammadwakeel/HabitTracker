import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';

import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { scheduleNotifications } from './utils/notifications';
import { getOnboarded } from './utils/storage';
import CustomTabBar from './components/CustomTabBar';
import ErrorBoundary from './components/ErrorBoundary';

import OnboardingScreen from './screens/OnboardingScreen';
import TodayScreen from './screens/TodayScreen';
import HealthScreen from './screens/HealthScreen';
import DeenScreen from './screens/DeenScreen';
import JournalScreen from './screens/JournalScreen';
import ProgressScreen from './screens/ProgressScreen';
import FocusScreen from './screens/FocusScreen';
import GrowthScreen from './screens/GrowthScreen';
import BooksScreen from './screens/BooksScreen';
import FitnessScreen from './screens/FitnessScreen';
import DailyLifeScreen from './screens/DailyLifeScreen';
import LearningScreen from './screens/LearningScreen';
import MindScreen from './screens/MindScreen';
import FinanceScreen from './screens/FinanceScreen';
import SleepScreen from './screens/SleepScreen';
import CreativeScreen from './screens/CreativeScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TABS = [
  { name: 'Today',    component: TodayScreen,    emoji: '🎯' },
  { name: 'Health',   component: HealthScreen,   emoji: '💪' },
  { name: 'Fitness',  component: FitnessScreen,  emoji: '🏋️' },
  { name: 'Deen',     component: DeenScreen,     emoji: '🕌' },
  { name: 'Mind',     component: MindScreen,     emoji: '🧘' },
  { name: 'Sleep',    component: SleepScreen,    emoji: '🌙' },
  { name: 'Finance',  component: FinanceScreen,  emoji: '💰' },
  { name: 'Life',     component: DailyLifeScreen,emoji: '📱' },
  { name: 'Learn',    component: LearningScreen, emoji: '🎓' },
  { name: 'Creative', component: CreativeScreen, emoji: '🎨' },
  { name: 'Journal',  component: JournalScreen,  emoji: '📓' },
  { name: 'Focus',    component: FocusScreen,    emoji: '⏱' },
  { name: 'Progress', component: ProgressScreen, emoji: '📊' },
  { name: 'Growth',   component: GrowthScreen,   emoji: '🎮' },
  { name: 'Books',    component: BooksScreen,    emoji: '📚' },
];

function MainTabs() {
  const { C } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: C.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          height: 56,
        },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 14, padding: 6 }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        ),
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarEmoji: tab.emoji }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AppNavigator({ onboardingDone, onOnboardingComplete }) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (onboardingDone) scheduleNotifications();
  }, [onboardingDone]);

  if (!onboardingDone) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={onOnboardingComplete} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppWithTheme() {
  const { C } = useTheme();
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    getOnboarded().then(v => setOnboardingDone(!!v));
  }, []);

  if (onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <AppNavigator
      onboardingDone={onboardingDone}
      onOnboardingComplete={() => setOnboardingDone(true)}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
