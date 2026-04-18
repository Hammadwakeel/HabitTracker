import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayHabits, saveTodayHabits, getStreak, missedYesterday } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';
import { getDailyQuote } from '../data/content';

const HABITS = [
  { key: 'exercise', emoji: '🏃', title: 'Exercise', full: '30–45 min workout', minimum: '10 min walk', time: 'Morning', xp: 20, color: '#FB923C' },
  { key: 'reading', emoji: '📖', title: 'Reading', full: '30 min session', minimum: '2 pages', time: 'Night', xp: 15, color: '#6C63FF' },
];

const CHECKLIST = [
  { key: 'water', emoji: '💧', label: 'Drink water first thing' },
  { key: 'noPhone', emoji: '📵', label: 'No phone for 30 min' },
  { key: 'clothes', emoji: '👟', label: 'Put on workout clothes' },
  { key: 'breakfast', emoji: '🍳', label: 'Eat a proper breakfast' },
  { key: 'plan', emoji: '📋', label: "Write today's 3 priorities" },
];

export default function TodayScreen() {
  const { C } = useTheme();
  const [log, setLog] = useState({ exercise: false, reading: false, checklist: {}, top3: ['','',''], top3Done: [false,false,false] });
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [warnings, setWarnings] = useState({ exercise: false, reading: false });
  const [xpMsg, setXpMsg] = useState(null);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const scaleEx = useRef(new Animated.Value(1)).current;
  const scaleRd = useRef(new Animated.Value(1)).current;
  const scales = { exercise: scaleEx, reading: scaleRd };
  const quote = getDailyQuote();

  useFocusEffect(useCallback(() => {
    (async () => {
      const h = await getTodayHabits(); setLog(h);
      const [ex, rd] = await Promise.all([getStreak('exercise'), getStreak('reading')]);
      setStreaks({ exercise: ex, reading: rd });
      const [ew, rw] = await Promise.all([missedYesterday('exercise'), missedYesterday('reading')]);
      setWarnings({ exercise: ew, reading: rw });
    })();
  }, []));

  const showXP = (msg) => {
    setXpMsg(msg);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(xpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setXpMsg(null));
  };

  const bounce = (key) => {
    Animated.sequence([
      Animated.spring(scales[key], { toValue: 1.04, useNativeDriver: true, speed: 50 }),
      Animated.spring(scales[key], { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  };

  const toggleHabit = async (key) => {
    const newVal = !log[key];
    const updated = { ...log, [key]: newVal };
    setLog(updated); await saveTodayHabits(updated);
    if (newVal) {
      const xp = HABITS.find(h => h.key === key).xp;
      await addXP(xp); showXP(`+${xp} XP — ${HABITS.find(h => h.key === key).title}!`);
    }
    bounce(key);
    setStreaks(p => ({ ...p, [key]: p[key] + (newVal ? 1 : -1) }));
  };

  const toggleChecklist = async (key) => {
    const updated = { ...log, checklist: { ...log.checklist, [key]: !log.checklist?.[key] } };
    setLog(updated); await saveTodayHabits(updated);
  };

  const updateTop3 = async (idx, val) => {
    const top3 = [...(log.top3 || ['','',''])]; top3[idx] = val;
    const updated = { ...log, top3 }; setLog(updated); await saveTodayHabits(updated);
  };

  const toggleTop3Done = async (idx) => {
    const top3Done = [...(log.top3Done || [false,false,false])];
    top3Done[idx] = !top3Done[idx];
    const updated = { ...log, top3Done }; setLog(updated); await saveTodayHabits(updated);
    if (top3Done.every(Boolean)) { await addXP(XP_REWARDS.top3Done); showXP(`+${XP_REWARDS.top3Done} XP — Top 3 Done!`); }
  };

  const done = (log.exercise ? 1 : 0) + (log.reading ? 1 : 0);
  const checkDone = CHECKLIST.filter(c => log.checklist?.[c.key]).length;
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpMsg && (
        <Animated.View style={[s.xpToast, { opacity: xpAnim }]}>
          <Text style={s.xpToastText}>{xpMsg}</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()} 👋</Text>
            <Text style={[s.date, { color: C.muted }]}>{dateStr}</Text>
          </View>
          <View style={[s.progressRing, { borderColor: done === 2 ? C.green : done === 1 ? C.accent : C.border }]}>
            <Text style={[s.progressRingText, { color: done === 2 ? C.green : C.text }]}>{done}/2</Text>
          </View>
        </View>

        {/* Quote */}
        <View style={[s.quoteCard, { backgroundColor: C.accent + '12', borderColor: C.accent + '30' }]}>
          <Text style={[s.quoteText, { color: C.text }]}>"{quote.text}"</Text>
          <Text style={[s.quoteAuthor, { color: C.accent }]}>— {quote.author}</Text>
        </View>

        {/* Progress */}
        <View style={[s.progressCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.progressHeader}>
            <Text style={[s.progressLabel, { color: C.muted }]}>TODAY'S HABITS</Text>
            <Text style={[s.progressCount, { color: C.text }]}>{done} of 2 done</Text>
          </View>
          <View style={[s.progressBar, { backgroundColor: C.border }]}>
            <Animated.View style={[s.progressFill, { width: `${done * 50}%`, backgroundColor: done === 2 ? C.green : C.accent }]} />
          </View>
          {done === 2 && <Text style={[s.allDoneText, { color: C.green }]}>🎉 Both habits done! Amazing day.</Text>}
        </View>

        {/* Habit Cards */}
        {HABITS.map((habit) => (
          <Animated.View key={habit.key} style={[s.habitCard, { backgroundColor: C.card, borderColor: log[habit.key] ? habit.color + '50' : C.border, transform: [{ scale: scales[habit.key] }] }]}>

            {/* Warning */}
            {warnings[habit.key] && !log[habit.key] && (
              <View style={[s.warnBanner, { backgroundColor: C.orange + '15' }]}>
                <Text style={[s.warnText, { color: C.orange }]}>⚠️ Missed yesterday — never miss twice!</Text>
              </View>
            )}

            <View style={s.habitTop}>
              <View style={[s.habitIconWrap, { backgroundColor: habit.color + '18' }]}>
                <Text style={{ fontSize: 26 }}>{habit.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.habitTitle, { color: C.text }]}>{habit.title}</Text>
                <Text style={[s.habitTime, { color: C.muted }]}>{habit.time}</Text>
              </View>
              <View style={s.habitRight}>
                {streaks[habit.key] > 0 && (
                  <View style={[s.streakBadge, { backgroundColor: habit.color + '18' }]}>
                    <Text style={[s.streakText, { color: habit.color }]}>🔥 {streaks[habit.key]}</Text>
                  </View>
                )}
                <Text style={[s.habitXP, { color: C.accent }]}>+{habit.xp}XP</Text>
              </View>
            </View>

            <View style={s.versionsRow}>
              <View style={[s.versionChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[s.versionLabel, { color: C.muted }]}>FULL</Text>
                <Text style={[s.versionText, { color: C.text }]}>{habit.full}</Text>
              </View>
              <View style={[s.versionChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[s.versionLabel, { color: C.muted }]}>MIN</Text>
                <Text style={[s.versionText, { color: C.text }]}>{habit.minimum}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.habitDoneBtn, { backgroundColor: log[habit.key] ? habit.color : habit.color + '20', borderColor: habit.color + '40' }]}
              onPress={() => toggleHabit(habit.key)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>{log[habit.key] ? '✓' : '○'}</Text>
              <Text style={[s.habitDoneBtnText, { color: log[habit.key] ? '#fff' : habit.color }]}>
                {log[habit.key] ? 'Done!' : 'Mark as Done'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Top 3 Tasks */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: C.text }]}>🎯 Top 3 Today</Text>
            <Text style={[s.cardSubtitle, { color: C.muted }]}>{(log.top3Done || []).filter(Boolean).length}/3 done</Text>
          </View>
          {[0,1,2].map(i => (
            <View key={i} style={[s.top3Row, { borderBottomColor: C.border }]}>
              <TouchableOpacity
                style={[s.top3Check, log.top3Done?.[i] && { backgroundColor: C.accent, borderColor: C.accent }]}
                onPress={() => toggleTop3Done(i)}
              >
                {log.top3Done?.[i] && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>✓</Text>}
              </TouchableOpacity>
              <Text style={[s.top3Num, { color: C.muted }]}>{i + 1}.</Text>
              <TextInput
                style={[s.top3Input, { color: log.top3Done?.[i] ? C.muted : C.text }]}
                placeholder={`Priority ${i + 1}...`}
                placeholderTextColor={C.muted + '80'}
                value={log.top3?.[i] || ''}
                onChangeText={v => updateTop3(i, v)}
                textDecorationLine={log.top3Done?.[i] ? 'line-through' : 'none'}
              />
            </View>
          ))}
        </View>

        {/* Morning Checklist */}
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: C.text }]}>☀️ Morning Routine</Text>
            <View style={[s.checkBadge, { backgroundColor: checkDone === CHECKLIST.length ? C.green + '20' : C.surface }]}>
              <Text style={[s.checkBadgeText, { color: checkDone === CHECKLIST.length ? C.green : C.muted }]}>{checkDone}/{CHECKLIST.length}</Text>
            </View>
          </View>
          {CHECKLIST.map((item) => (
            <TouchableOpacity key={item.key} style={s.checkItem} onPress={() => toggleChecklist(item.key)} activeOpacity={0.7}>
              <View style={[s.checkbox, log.checklist?.[item.key] && { backgroundColor: C.green, borderColor: C.green }]}>
                {log.checklist?.[item.key] && <Text style={{ color: '#000', fontWeight: '800', fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 18, marginHorizontal: 10 }}>{item.emoji}</Text>
              <Text style={[s.checkLabel, { color: log.checklist?.[item.key] ? C.muted : C.text, textDecorationLine: log.checklist?.[item.key] ? 'line-through' : 'none' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rule */}
        <View style={[s.ruleCard, { backgroundColor: C.accent + '10', borderColor: C.accent + '25' }]}>
          <Text style={[s.ruleEmoji]}>📌</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.ruleTitle, { color: C.accent }]}>Never Miss Twice</Text>
            <Text style={[s.ruleText, { color: C.text }]}>Miss once? Totally fine. Just get back tomorrow. Two misses in a row is where habits die.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 16, paddingBottom: 40 },
  xpToast: {
    position: 'absolute', top: 56, alignSelf: 'center',
    backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 99, zIndex: 999, elevation: 10,
    shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  xpToastText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, marginTop: 8 },
  greeting: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  date: { fontSize: 13, marginTop: 3 },
  progressRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressRingText: { fontSize: 14, fontWeight: '800' },
  quoteCard: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  quoteText: { fontSize: 13, lineHeight: 21, fontStyle: 'italic', marginBottom: 6 },
  quoteAuthor: { fontSize: 12, fontWeight: '700' },
  progressCard: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  progressCount: { fontSize: 13, fontWeight: '700' },
  progressBar: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  allDoneText: { fontSize: 13, fontWeight: '700', marginTop: 10 },
  habitCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  warnBanner: { borderRadius: 8, padding: 8, marginBottom: 12 },
  warnText: { fontSize: 12, fontWeight: '600' },
  habitTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  habitIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  habitTime: { fontSize: 12, marginTop: 2 },
  habitRight: { alignItems: 'flex-end', gap: 6 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '800' },
  habitXP: { fontSize: 11, fontWeight: '700' },
  versionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  versionChip: { flex: 1, borderRadius: 10, padding: 10, borderWidth: 1 },
  versionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  versionText: { fontSize: 12, fontWeight: '600' },
  habitDoneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13, borderWidth: 1,
  },
  habitDoneBtnText: { fontSize: 15, fontWeight: '800' },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 13, fontWeight: '600' },
  checkBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  checkBadgeText: { fontSize: 12, fontWeight: '700' },
  top3Row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  top3Check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  top3Num: { fontSize: 14, fontWeight: '700', width: 18 },
  top3Input: { flex: 1, fontSize: 14, paddingVertical: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  ruleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  ruleEmoji: { fontSize: 22, marginTop: 2 },
  ruleTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  ruleText: { fontSize: 13, lineHeight: 20 },
});
