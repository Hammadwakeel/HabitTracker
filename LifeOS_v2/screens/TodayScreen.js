import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getTodayHabits, saveTodayHabits, getStreak, missedYesterday } from '../utils/storage';
import { getDailyQuote } from '../data/quotes';

const HABITS = [
  { key: 'exercise', emoji: '🏃', title: 'Exercise', full: '30–45 min workout', minimum: 'Just 10 min walk', time: 'Morning — right after waking', color: COLORS.orange, colorSoft: COLORS.orangeSoft },
  { key: 'reading', emoji: '📖', title: 'Reading', full: '30 min session', minimum: 'Just 2 pages', time: 'Night — before sleep', color: COLORS.accent, colorSoft: COLORS.accentSoft },
];

const CHECKLIST = [
  { key: 'water', emoji: '💧', label: 'Drink water first thing' },
  { key: 'noPhone', emoji: '📵', label: 'No phone for 30 min' },
  { key: 'clothes', emoji: '👟', label: 'Put on workout clothes' },
  { key: 'breakfast', emoji: '🍳', label: 'Eat a proper breakfast' },
  { key: 'plan', emoji: '📋', label: 'Write today\'s 3 priorities' },
];

export default function TodayScreen() {
  const [log, setLog] = useState({ exercise: false, reading: false, checklist: {} });
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [warnings, setWarnings] = useState({ exercise: false, reading: false });
  const quote = getDailyQuote();
  const scaleEx = useState(new Animated.Value(1))[0];
  const scaleRd = useState(new Animated.Value(1))[0];
  const scales = { exercise: scaleEx, reading: scaleRd };

  useFocusEffect(useCallback(() => {
    (async () => {
      const h = await getTodayHabits();
      setLog(h);
      const [ex, rd] = await Promise.all([getStreak('exercise'), getStreak('reading')]);
      setStreaks({ exercise: ex, reading: rd });
      const [ew, rw] = await Promise.all([missedYesterday('exercise'), missedYesterday('reading')]);
      setWarnings({ exercise: ew, reading: rw });
    })();
  }, []));

  const toggleHabit = async (key) => {
    const updated = { ...log, [key]: !log[key] };
    setLog(updated);
    await saveTodayHabits(updated);
    Animated.sequence([
      Animated.spring(scales[key], { toValue: 1.06, useNativeDriver: true, speed: 50 }),
      Animated.spring(scales[key], { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    const s = await getStreak(key);
    setStreaks(p => ({ ...p, [key]: s }));
  };

  const toggleChecklist = async (key) => {
    const updated = { ...log, checklist: { ...log.checklist, [key]: !log.checklist?.[key] } };
    setLog(updated);
    await saveTodayHabits(updated);
  };

  const done = (log.exercise ? 1 : 0) + (log.reading ? 1 : 0);
  const checkDone = CHECKLIST.filter(c => log.checklist?.[c.key]).length;
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.greeting}>{greeting()}, Hammad 👋</Text>
          <Text style={s.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Quote */}
        <View style={s.quoteCard}>
          <Text style={s.quoteText}>"{quote.text}"</Text>
          <Text style={s.quoteAuthor}>— {quote.author}</Text>
        </View>

        {/* Progress */}
        <View style={s.progressCard}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Today's Habits</Text>
            <Text style={s.progressCount}>{done}/2</Text>
          </View>
          <View style={s.barBg}><View style={[s.barFill, { width: `${(done / 2) * 100}%` }]} /></View>
          {done === 2 && <Text style={s.allDone}>🎉 Both habits done! Amazing day.</Text>}
        </View>

        {/* Habit Cards */}
        {HABITS.map((habit) => (
          <Animated.View key={habit.key} style={[s.habitCard, { transform: [{ scale: scales[habit.key] }] }]}>
            {warnings[habit.key] && !log[habit.key] && (
              <View style={s.warnBanner}><Text style={s.warnText}>⚠️ Missed yesterday — don't miss twice!</Text></View>
            )}
            <View style={s.habitTop}>
              <View style={s.habitLeft}>
                <Text style={s.habitEmoji}>{habit.emoji}</Text>
                <View>
                  <Text style={s.habitTitle}>{habit.title}</Text>
                  <Text style={s.habitTime}>{habit.time}</Text>
                </View>
              </View>
              {streaks[habit.key] > 0 && (
                <View style={[s.streakBadge, { backgroundColor: habit.colorSoft }]}>
                  <Text style={[s.streakText, { color: habit.color }]}>🔥 {streaks[habit.key]}d</Text>
                </View>
              )}
            </View>
            <View style={s.versionsRow}>
              <View style={s.chip}><Text style={s.chipLabel}>FULL</Text><Text style={s.chipText}>{habit.full}</Text></View>
              <View style={s.chip}><Text style={s.chipLabel}>MINIMUM</Text><Text style={s.chipText}>{habit.minimum}</Text></View>
            </View>
            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: log[habit.key] ? habit.color : COLORS.border }]}
              onPress={() => toggleHabit(habit.key)} activeOpacity={0.8}
            >
              <Text style={[s.doneBtnText, { color: log[habit.key] ? '#fff' : COLORS.muted }]}>
                {log[habit.key] ? '✓ Done!' : 'Mark as Done'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Morning Checklist */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>☀️ Morning Routine</Text>
            <Text style={s.sectionCount}>{checkDone}/{CHECKLIST.length}</Text>
          </View>
          {CHECKLIST.map((item) => (
            <TouchableOpacity key={item.key} style={s.checkItem} onPress={() => toggleChecklist(item.key)} activeOpacity={0.7}>
              <View style={[s.checkbox, log.checklist?.[item.key] && s.checkboxDone]}>
                {log.checklist?.[item.key] && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.checkEmoji}>{item.emoji}</Text>
              <Text style={[s.checkLabel, log.checklist?.[item.key] && s.checkLabelDone]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rule */}
        <View style={s.ruleCard}>
          <Text style={s.ruleTitle}>📌 Never Miss Twice</Text>
          <Text style={s.ruleText}>Miss once? That's human. Just get back tomorrow. Two misses in a row is where habits die.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16, marginTop: 10 },
  greeting: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  quoteCard: { backgroundColor: COLORS.accentSoft, borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  quoteText: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { color: COLORS.accent, fontSize: 12, marginTop: 6, fontWeight: '600' },
  progressCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  progressCount: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 99 },
  barFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 99 },
  allDone: { color: COLORS.green, fontSize: 13, marginTop: 10, fontWeight: '600' },
  habitCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  warnBanner: { backgroundColor: '#FB923C18', borderRadius: 8, padding: 8, marginBottom: 12 },
  warnText: { color: COLORS.orange, fontSize: 12, fontWeight: '600' },
  habitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitEmoji: { fontSize: 26 },
  habitTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  habitTime: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '700' },
  versionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  chipLabel: { fontSize: 9, color: COLORS.muted, fontWeight: '700', marginBottom: 3 },
  chipText: { fontSize: 12, color: COLORS.text },
  doneBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700' },
  sectionCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkmark: { color: '#000', fontSize: 13, fontWeight: '800' },
  checkEmoji: { fontSize: 18 },
  checkLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  checkLabelDone: { color: COLORS.muted, textDecorationLine: 'line-through' },
  ruleCard: { backgroundColor: COLORS.accentSoft, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.accent + '33' },
  ruleTitle: { color: COLORS.accent, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  ruleText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
});
