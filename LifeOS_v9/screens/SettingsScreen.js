import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Image, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, THEMES } from '../utils/ThemeContext';
import { getXPData, getProfile } from '../utils/storage';
import { getLevelInfo } from '../utils/xp';

export default function SettingsScreen({ navigation }) {
  const { C, themeId, setTheme } = useTheme();
  const [xpData, setXpData] = useState({ total: 0 });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getXPData().then(setXpData);
    getProfile().then(p => { if (p) setProfile(p); });
  }, []);

  const { current, next, progress } = getLevelInfo(xpData.total);

  const resetOnboarding = () => {
    Alert.alert(
      'Reset Setup',
      'Clear your profile and redo onboarding? Your habit data is kept.',
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={[s.closeBtnText, { color: C.accent }]}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: C.text }]}>Settings</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={[s.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {profile?.profilePic ? (
            <Image source={{ uri: profile.profilePic }} style={s.profilePic} />
          ) : (
            <View style={[s.profilePicPlaceholder, { backgroundColor: C.accentSoft }]}>
              <Text style={{ fontSize: 30 }}>{current.emoji}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: C.text }]}>{profile?.name || 'Your Name'}</Text>
            <Text style={[s.profileLevel, { color: C.accent }]}>Level {current.level} — {current.title}</Text>
            <Text style={[s.profileXP, { color: C.muted }]}>{xpData.total} XP total</Text>
            {profile?.city ? <Text style={[s.profileCity, { color: C.muted }]}>📍 {profile.city}</Text> : null}
          </View>
        </View>

        {/* XP Bar */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.row}>
            <Text style={[s.cardTitle, { color: C.text }]}>XP Progress</Text>
            <Text style={[{ color: C.accent, fontWeight: '800', fontSize: 15 }]}>{current.emoji} Lv.{current.level}</Text>
          </View>
          <View style={[s.xpBarBg, { backgroundColor: C.border }]}>
            <View style={[s.xpBarFill, { width: `${progress}%`, backgroundColor: C.accent }]} />
          </View>
          {next && <Text style={[s.xpNext, { color: C.muted }]}>{next.minXP - xpData.total} XP to Level {next.level} — {next.title} {next.emoji}</Text>}
        </View>

        {/* THEME PICKER */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>THEME</Text>
          <Text style={[s.sectionDesc, { color: C.muted }]}>Choose your app's look and feel</Text>
          <View style={s.themeGrid}>
            {THEMES.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  s.themeCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  themeId === theme.id && { borderColor: theme.colors.accent, borderWidth: 2 },
                ]}
                onPress={() => setTheme(theme.id)}
                activeOpacity={0.8}
              >
                {/* Mini preview */}
                <View style={[s.themePreview, { backgroundColor: theme.preview }]}>
                  <View style={[s.previewBar, { backgroundColor: theme.colors.surface }]} />
                  <View style={s.previewDots}>
                    <View style={[s.previewDot, { backgroundColor: theme.colors.accent }]} />
                    <View style={[s.previewDot, { backgroundColor: theme.colors.green }]} />
                    <View style={[s.previewDot, { backgroundColor: theme.colors.orange }]} />
                  </View>
                </View>
                <Text style={s.themeEmoji}>{theme.emoji}</Text>
                <Text style={[s.themeName, { color: theme.colors.text }]}>{theme.name}</Text>
                {themeId === theme.id && (
                  <View style={[s.themeActiveDot, { backgroundColor: theme.colors.accent }]}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
            <Text style={[{ color: C.muted, fontSize: 20 }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>ABOUT</Text>
          <View style={[s.infoCard, { backgroundColor: C.surface }]}>
            <Text style={[s.infoText, { color: C.muted }]}>🚀 Life OS — Your Personal System</Text>
            <Text style={[s.infoText, { color: C.muted }]}>Version 7.0 · Built with Expo + React Native</Text>
            <Text style={[s.infoText, { color: C.muted }]}>15 screens · 130+ features · 8 themes</Text>
          </View>
        </View>

        {/* Feature List */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionLabel, { color: C.muted }]}>ALL FEATURES</Text>
          {[
            '🎯 Daily habits + Top 3 tasks + Pomodoro timer',
            '💧 Water tracker with custom goal & reminders',
            '💪 Health: mood, energy, water, sleep, nutrition',
            '🏋️ Fitness: 3 tiers, 9 muscle groups, 180+ exercises',
            '🕌 Live prayer times via GPS + manual city input',
            '🧘 Breathing exercises (Box, 4-7-8, Calm) + CBT',
            '🌙 Sleep checklist + chronotype quiz + dream log',
            '💰 Net worth + savings goals + invoices + subs',
            '📱 Expense tracker + grocery list + bill reminders',
            '🎓 Word of day + study timer + code snippets',
            '🎨 Idea capture + gratitude jar + daily challenge',
            '📓 Daily journal with mood, wins, gratitude, CBT',
            '📊 30-day calendar + streaks + weekly review',
            '🎮 XP + 10 levels + badges + life wheel (8 areas)',
            '🏁 90-day sprint + bucket list + 8 app themes',
            '📁 Dynamic project tracking + time logger',
            '📚 4 book summaries with chapter-by-chapter tracker',
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
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  closeBtn: { width: 70 },
  closeBtnText: { fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 18, fontWeight: '700' },
  container: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
  },
  profilePic: { width: 56, height: 56, borderRadius: 28 },
  profilePicPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileLevel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileXP: { fontSize: 12, marginTop: 2 },
  profileCity: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  xpBarBg: { height: 6, borderRadius: 99, marginBottom: 6 },
  xpBarFill: { height: 6, borderRadius: 99 },
  xpNext: { fontSize: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  sectionDesc: { fontSize: 12, marginBottom: 12 },
  // Theme grid
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: {
    width: '22%',
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  themePreview: { height: 50, padding: 6 },
  previewBar: { height: 8, borderRadius: 4, marginBottom: 6 },
  previewDots: { flexDirection: 'row', gap: 4 },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  themeEmoji: { fontSize: 16, textAlign: 'center', marginTop: 6 },
  themeName: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 8, paddingHorizontal: 4 },
  themeActiveDot: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingDesc: { fontSize: 12 },
  infoCard: { borderRadius: 10, padding: 12, gap: 6 },
  infoText: { fontSize: 13 },
  featureItem: { fontSize: 13, paddingVertical: 6, borderBottomWidth: 1 },
});
