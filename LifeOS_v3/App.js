import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native'; // Added ScrollView
import * as Notifications from 'expo-notifications';

import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { scheduleNotifications } from './utils/notifications';

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
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const TABS = [
  { name: 'Today', component: TodayScreen, emoji: '🎯' },
  { name: 'Health', component: HealthScreen, emoji: '💪' },
  { name: 'Fitness', component: FitnessScreen, emoji: '🏋️' },
  { name: 'Deen', component: DeenScreen, emoji: '🕌' },
  { name: 'Mind', component: MindScreen, emoji: '🧘' },
  { name: 'Sleep', component: SleepScreen, emoji: '🌙' },
  { name: 'Finance', component: FinanceScreen, emoji: '💰' },
  { name: 'Life', component: DailyLifeScreen, emoji: '📱' },
  { name: 'Learn', component: LearningScreen, emoji: '🎓' },
  { name: 'Creative', component: CreativeScreen, emoji: '🎨' },
  { name: 'Journal', component: JournalScreen, emoji: '📓' },
  { name: 'Focus', component: FocusScreen, emoji: '⏱' },
  { name: 'Progress', component: ProgressScreen, emoji: '📊' },
  { name: 'Growth', component: GrowthScreen, emoji: '🎮' },
  { name: 'Books', component: BooksScreen, emoji: '📚' },
];

// 1. Create a Custom Scrollable Tab Bar Component
function CustomTabBar({ state, descriptors, navigation, C }) {
  return (
    <View style={{ backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1, paddingBottom: 10 }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          // Match the emoji to the current tab
          const tabData = TABS.find(t => t.name === route.name);
          const emoji = tabData ? tabData.emoji : '📄';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 12, minWidth: 55 }}
            >
              <Text style={{ fontSize: 22, opacity: isFocused ? 1 : 0.4 }}>{emoji}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 4, color: isFocused ? C.accent : C.muted }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MainTabs() {
  const { C, isDark } = useTheme();
  return (
    <Tab.Navigator
      // 2. Pass the custom component to the Navigator
      tabBar={(props) => <CustomTabBar {...props} C={C} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: C.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: C.border },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 16 }}>
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
        />
      ))}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { C, isDark } = useTheme();
  useEffect(() => { scheduleNotifications(); }, []);
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false, presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}