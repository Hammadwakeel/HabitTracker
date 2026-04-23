import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Share, Alert
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { hapticMedium, hapticSuccess } from '../utils/haptics';

export default function ShareCard({ visible, onClose, data }) {
  const { C } = useTheme();

  const shareText = () => {
    const lines = [
      `📊 My Life OS Week in Review`,
      ``,
      `🔥 Exercise streak: ${data.exerciseStreak} days`,
      `📖 Reading streak: ${data.readingStreak} days`,
      `🕌 Prayer streak: ${data.prayerStreak} days`,
      ``,
      `📅 This week:`,
      `  ✅ Exercise: ${data.weekExercise}/7 days`,
      `  ✅ Reading: ${data.weekReading}/7 days`,
      `  💧 Water goal met: ${data.weekWater} days`,
      `  😴 7+ hours sleep: ${data.weekSleep} nights`,
      ``,
      `⚡ Total XP: ${data.totalXP}`,
      `🏆 Level: ${data.level} — ${data.levelTitle}`,
      ``,
      `Built with Life OS 🚀`,
    ].join('\n');

    hapticSuccess();
    Share.share({ message: shareText })
      .catch(() => {});
  };

  if (!visible) return null;

  const s = makeStyles(C);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.sheetHandle} />
          <Text style={[s.sheetTitle, { color: C.text }]}>Share Your Progress</Text>

          {/* Card preview */}
          <View style={[s.card, { backgroundColor: C.bg, borderColor: C.accent + '30' }]}>
            {/* Header */}
            <View style={[s.cardHeader, { backgroundColor: C.accent }]}>
              <Text style={s.cardAppName}>Life OS</Text>
              <Text style={s.cardDate}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </View>

            <View style={s.cardBody}>
              {/* Streaks */}
              <Text style={[s.cardSectionTitle, { color: C.muted }]}>CURRENT STREAKS</Text>
              <View style={s.streakRow}>
                {[
                  { emoji: '🏃', label: 'Exercise', val: data.exerciseStreak, color: C.orange },
                  { emoji: '📖', label: 'Reading', val: data.readingStreak, color: C.accent },
                  { emoji: '🕌', label: 'Prayer', val: data.prayerStreak, color: C.gold },
                ].map(item => (
                  <View key={item.label} style={[s.streakItem, { borderColor: item.color + '30', backgroundColor: item.color + '10' }]}>
                    <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                    <Text style={[s.streakVal, { color: item.color }]}>{item.val}</Text>
                    <Text style={[s.streakLabel, { color: C.muted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* This week */}
              <Text style={[s.cardSectionTitle, { color: C.muted, marginTop: 14 }]}>THIS WEEK</Text>
              <View style={s.weekGrid}>
                {[
                  { emoji: '🏃', label: 'Exercise', val: `${data.weekExercise}/7`, color: C.orange },
                  { emoji: '📖', label: 'Reading', val: `${data.weekReading}/7`, color: C.accent },
                  { emoji: '💧', label: 'Water goal', val: `${data.weekWater}/7`, color: C.blue },
                  { emoji: '😴', label: '7h+ sleep', val: `${data.weekSleep}/7`, color: C.purple },
                ].map(item => (
                  <View key={item.label} style={s.weekItem}>
                    <Text style={{ fontSize: 18, marginBottom: 4 }}>{item.emoji}</Text>
                    <Text style={[s.weekVal, { color: item.color }]}>{item.val}</Text>
                    <Text style={[s.weekLabel, { color: C.muted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* XP / Level */}
              <View style={[s.xpRow, { backgroundColor: C.accent + '15', borderColor: C.accent + '30' }]}>
                <Text style={{ fontSize: 22 }}>⚡</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.xpVal, { color: C.accent }]}>{data.totalXP} XP total</Text>
                  <Text style={[s.xpLevel, { color: C.muted }]}>Level {data.level} — {data.levelTitle}</Text>
                </View>
                <Text style={{ fontSize: 22 }}>{data.levelEmoji}</Text>
              </View>
            </View>

            <View style={[s.cardFooter, { borderTopColor: C.border }]}>
              <Text style={[s.cardFooterText, { color: C.muted }]}>Built with Life OS 🚀</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: C.accent }]} onPress={shareText} activeOpacity={0.85}>
            <Text style={s.shareBtnText}>📤 Share Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.closeBtn, { borderColor: C.border }]} onPress={onClose}>
            <Text style={[s.closeBtnText, { color: C.muted }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderRadius: 24, borderWidth: 1, padding: 20, margin: 12, marginBottom: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  cardAppName: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: -0.5 },
  cardDate: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 16 },
  cardSectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  streakRow: { flexDirection: 'row', gap: 10 },
  streakItem: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  streakVal: { fontSize: 24, fontWeight: '900', marginVertical: 2 },
  streakLabel: { fontSize: 10, fontWeight: '600' },
  weekGrid: { flexDirection: 'row', gap: 8 },
  weekItem: { flex: 1, alignItems: 'center' },
  weekVal: { fontSize: 15, fontWeight: '800' },
  weekLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, marginTop: 12 },
  xpVal: { fontSize: 15, fontWeight: '800' },
  xpLevel: { fontSize: 12, marginTop: 2 },
  cardFooter: { borderTopWidth: 1, padding: 10, alignItems: 'center' },
  cardFooterText: { fontSize: 11, fontWeight: '600' },
  shareBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  closeBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  closeBtnText: { fontWeight: '700', fontSize: 15 },
});
