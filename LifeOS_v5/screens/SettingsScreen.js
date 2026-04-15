import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Switch, Image, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../utils/ThemeContext';
import { getXPData, getProfile, setOnboarded } from '../utils/storage';
import { getLevelInfo } from '../utils/xp';

export default function SettingsScreen({ navigation }) {
  const { C, isDark, toggle } = useTheme();
  const [xpData, setXpData] = useState({ total: 0 });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getXPData().then(setXpData);
    getProfile().then(p => { if (p) setProfile(p); });
  }, []);

  const { current, next, progress } = getLevelInfo(xpData.total);

  const resetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your profile setup and show the welcome screens again on next launch. Your habit data is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarded');
            await AsyncStorage.removeItem('profile');
            Alert.alert('Done', 'Restart the app to see onboarding again.');
          },
        },
      ]
    );
  };

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[s.closeBtn, { color: C.accent }]}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: C.text }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={[s.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {profile?.profilePic
            ? <Image source={{ uri: profile.profilePic }} style={s.profilePic} />
            : <View style={[s.profilePicPlaceholder, { backgroundColor: C.accentSoft }]}>
                <Text style={{ fontSize: 32 }}>{current.emoji}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: C.text }]}>{profile?.name || 'Your Name'}</Text>
            <Text style={[s.profileLevel, { color: C.accent }]}>Level {current.level} — {current.title}</Text>
            <Text style={[s.profileXP, { color: C.muted }]}>{xpData.total} XP total</Text>
            {profile?.city ? <Text style={[s.profileCity, { color: C.muted }]}>📍 {profile.city}</Text> : null}
          </View>
        </View>

        {/* XP Progress */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.row}>
            <Text style={[s.cardTitle, { color: C.text }]}>XP Progress</Text>
            <Text style={[{ color: C.accent, fontWeight: '800', fontSize: 16 }]}>{current.emoji} Lv.{current.level}</Text>
          </View>
          <View style={[s.xpBarBg, { backgroundColor: C.border }]}>
            <View style={[s.xpBarFill, { width: `${progress}%`, backgroundColor: C.accent }]} />
          </View>
          {next && <Text style={[s.xpNext, { color: C.muted }]}>{next.minXP - xpData.total} XP to Level {next.level} — {next.title} {next.emoji}</Text>}
        </View>

        {/* Appearance */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>APPEARANCE</Text>
          <View style={s.settingRow}>
            <View>
              <Text style={[s.settingLabel, { color: C.text }]}>Dark Mode</Text>
              <Text style={[s.settingDesc, { color: C.muted }]}>Switch between light and dark theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={C.white}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>ACCOUNT</Text>
          <TouchableOpacity style={s.settingRow} onPress={resetOnboarding}>
            <View>
              <Text style={[s.settingLabel, { color: C.text }]}>Reset Onboarding</Text>
              <Text style={[s.settingDesc, { color: C.muted }]}>Redo your profile setup</Text>
            </View>
            <Text style={[{ color: C.muted, fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>ABOUT</Text>
          <View style={[s.infoCard, { backgroundColor: C.surface }]}>
            <Text style={[s.infoText, { color: C.muted }]}>🚀 Life OS — Your Personal System</Text>
            <Text style={[s.infoText, { color: C.muted }]}>Version 6.0 — Built with Expo + React Native</Text>
            <Text style={[s.infoText, { color: C.muted }]}>15 screens · 120+ features · Live prayer times</Text>
          </View>
        </View>

        {/* Features */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>ALL FEATURES</Text>
          {[
            '🎯 Daily habits + Top 3 tasks + Pomodoro',
            '💪 Health: mood, energy, water, sleep, weight',
            '🏋️ Fitness: 3 tiers, 8 muscle groups, video guides',
            '🕌 Live prayer times via GPS + Quran tracker',
            '🧘 Breathing exercises + CBT thought journal',
            '🌙 Sleep checklist + chronotype + dream log',
            '💰 Net worth + savings + invoices + subscriptions',
            '📱 Expense tracker + grocery list + bill reminders',
            '🎓 Word of day + study timer + code snippets',
            '🎨 Idea capture + gratitude jar + daily challenge',
            '📓 Daily journal + decision log + history',
            '📊 30-day calendar + streaks + weekly review',
            '🎮 XP system + 10 levels + badges + life wheel',
            '🏁 90-day goal sprint + bucket list',
            '📚 4 book summaries with chapter tracking',
            '🌙 Light/dark mode + scrollable tabs',
            '🎉 8-step onboarding with profile photo',
          ].map((f, i) => (
            <Text key={i} style={[s.featureItem, { color: C.muted, borderBottomColor: C.border }]}>{f}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C?.bg || '#0D0F14' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: C?.border || '#2A2D38',
  },
  closeBtn: { fontSize: 16, fontWeight: '600', width: 60 },
  heading: { fontSize: 18, fontWeight: '700' },
  container: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1,
  },
  profilePic: { width: 56, height: 56, borderRadius: 28 },
  profilePicPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileLevel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  profileXP: { fontSize: 12, marginTop: 2 },
  profileCity: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  xpBarBg: { height: 6, borderRadius: 99, marginBottom: 6 },
  xpBarFill: { height: 6, borderRadius: 99 },
  xpNext: { fontSize: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingDesc: { fontSize: 12 },
  infoCard: { borderRadius: 10, padding: 12, gap: 6 },
  infoText: { fontSize: 13 },
  featureItem: { fontSize: 13, paddingVertical: 6, borderBottomWidth: 1 },
});
