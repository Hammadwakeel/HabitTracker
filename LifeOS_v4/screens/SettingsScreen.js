import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Switch } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getXPData } from '../utils/storage';
import { getLevelInfo } from '../utils/xp';

export default function SettingsScreen({ navigation }) {
  const { C, isDark, toggle } = useTheme();
  const [xpData, setXpData] = useState({ total: 0 });

  useEffect(() => {
    getXPData().then(setXpData);
    getProfile().then(p => { if (p?.name) setProfileData(p); });
  }, []);
  const [profileData, setProfileData] = useState(null);
  const { current } = getLevelInfo(xpData.total);
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[s.back, { color: C.accent }]}>✕ Close</Text></TouchableOpacity>
        <Text style={s.heading}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.container}>

        {/* Profile Card */}
        <View style={s.profileCard}>
          <Text style={s.profileEmoji}>{current.emoji}</Text>
          <View>
            <Text style={[s.profileName, { color: C.text }]}>Hammad Wakeel</Text>
            <Text style={[s.profileLevel, { color: C.accent }]}>Level {current.level} — {current.title}</Text>
            <Text style={[s.profileXP, { color: C.muted }]}>{xpData.total} XP total</Text>
          </View>
        </View>

        {/* Theme */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Appearance</Text>
          <View style={s.settingRow}>
            <View>
              <Text style={[s.settingLabel, { color: C.text }]}>Dark Mode</Text>
              <Text style={[s.settingDesc, { color: C.muted }]}>Switch between light and dark theme</Text>
            </View>
            <Switch value={isDark} onValueChange={toggle} trackColor={{ false: C.border, true: C.accent }} thumbColor={C.white} />
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.infoCard}>
            <Text style={[s.infoText, { color: C.muted }]}>🚀 Life OS — Hammad's Personal System</Text>
            <Text style={[s.infoText, { color: C.muted }]}>Version 3.0</Text>
            <Text style={[s.infoText, { color: C.muted }]}>Built with Expo + React Native</Text>
          </View>
        </View>

        {/* Features list */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All Features</Text>
          {[
            '🎯 Daily habits with streaks',
            '☀️ Morning routine checklist',
            '⏱ Pomodoro focus timer',
            '🎯 Top 3 daily tasks',
            '💪 Health: mood, energy, water, sleep, weight',
            '🕌 Salah tracker with streak',
            '📖 Quran page log',
            '💝 Sadaqah & Dhikr tracking',
            '📓 Daily journal & reflection',
            '📊 30-day progress calendar',
            '📅 Weekly review',
            '⚡ XP system & levels',
            '🏅 Achievement badges',
            '🎯 Life wheel (8 areas)',
            '🏁 90-day goal sprint',
            '🪣 Bucket list',
            '📁 Project time tracker',
            '🚫 Distraction counter',
            '📊 Weekly time audit',
            '📚 Book summaries (4 books)',
            '🌙 Light/dark mode',
            '🔔 Smart daily notifications',
          ].map((f, i) => (
            <Text key={i} style={[s.featureItem, { color: C.muted }]}>{f}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { fontSize: 16, fontWeight: '600', width: 60 },
  heading: { fontSize: 18, fontWeight: '700', color: C.text },
  container: { padding: 20, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  profileEmoji: { fontSize: 40 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileLevel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  profileXP: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingDesc: { fontSize: 12 },
  infoCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 6 },
  infoText: { fontSize: 13 },
  featureItem: { fontSize: 13, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
});
