import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayHabits, saveTodayHabits, getStreak, missedYesterday } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';
import { getDailyQuote } from '../data/content';

const HABITS = [
  { key: 'exercise', emoji: '🏃', title: 'Exercise', full: '30–45 min workout', minimum: '10 min walk', time: 'Morning — right after waking', xp: 20 },
  { key: 'reading', emoji: '📖', title: 'Reading', full: '30 min session', minimum: '2 pages', time: 'Night — before sleep', xp: 15 },
];

const CHECKLIST = [
  { key: 'water', emoji: '💧', label: 'Drink water first thing' },
  { key: 'noPhone', emoji: '📵', label: 'No phone for 30 min' },
  { key: 'clothes', emoji: '👟', label: 'Put on workout clothes' },
  { key: 'breakfast', emoji: '🍳', label: 'Eat a proper breakfast' },
  { key: 'plan', emoji: '📋', label: "Write today's 3 priorities" },
];

const POMODORO_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function TodayScreen() {
  const { C } = useTheme();
  const [log, setLog] = useState({ exercise: false, reading: false, checklist: {}, top3: ['', '', ''], top3Done: [false, false, false] });
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [warnings, setWarnings] = useState({ exercise: false, reading: false });
  const [xpPopup, setXpPopup] = useState(null);
  const [timer, setTimer] = useState(POMODORO_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef(null);
  const quote = getDailyQuote();
  const scaleEx = useRef(new Animated.Value(1)).current;
  const scaleRd = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            if (!isBreak) { addXP(XP_REWARDS.pomodoro); showXP(XP_REWARDS.pomodoro, '⏱ Pomodoro!'); }
            setIsBreak(b => !b);
            return isBreak ? POMODORO_DURATION : BREAK_DURATION;
          }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerRunning, isBreak]);

  const showXP = (amt, label) => {
    setXpPopup(`+${amt} XP — ${label}`);
    setTimeout(() => setXpPopup(null), 2000);
  };

  const toggleHabit = async (key) => {
    const newVal = !log[key];
    const updated = { ...log, [key]: newVal };
    setLog(updated);
    await saveTodayHabits(updated);
    if (newVal) { const xp = await addXP(HABITS.find(h => h.key === key).xp); showXP(HABITS.find(h => h.key === key).xp, HABITS.find(h => h.key === key).title); }
    Animated.sequence([
      Animated.spring(scales[key], { toValue: 1.06, useNativeDriver: true, speed: 50 }),
      Animated.spring(scales[key], { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    const s = await getStreak(key);
    setStreaks(p => ({ ...p, [key]: s }));
  };

  const toggleChecklist = async (key) => {
    const updated = { ...log, checklist: { ...log.checklist, [key]: !log.checklist?.[key] } };
    setLog(updated); await saveTodayHabits(updated);
  };

  const updateTop3 = async (idx, val) => {
    const top3 = [...(log.top3 || ['', '', ''])];
    top3[idx] = val;
    const updated = { ...log, top3 };
    setLog(updated); await saveTodayHabits(updated);
  };

  const toggleTop3Done = async (idx) => {
    const top3Done = [...(log.top3Done || [false, false, false])];
    top3Done[idx] = !top3Done[idx];
    const updated = { ...log, top3Done };
    setLog(updated); await saveTodayHabits(updated);
    const allDone = top3Done.every(Boolean) && (log.top3 || []).every(t => t.trim());
    if (allDone) { await addXP(XP_REWARDS.top3Done); showXP(XP_REWARDS.top3Done, 'Top 3 Done!'); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const done = (log.exercise ? 1 : 0) + (log.reading ? 1 : 0);
  const checkDone = CHECKLIST.filter(c => log.checklist?.[c.key]).length;
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpPopup && <View style={s.xpPopup}><Text style={s.xpPopupText}>{xpPopup}</Text></View>}
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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
        <View style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>Today's Habits</Text><Text style={[s.badge, { backgroundColor: C.accentSoft, color: C.accent }]}>{done}/2 done</Text></View>
          <View style={s.barBg}><View style={[s.barFill, { width: `${(done / 2) * 100}%`, backgroundColor: C.green }]} /></View>
          {done === 2 && <Text style={[s.successText, { color: C.green }]}>🎉 Both habits done!</Text>}
        </View>

        {/* Habit Cards */}
        {HABITS.map((habit) => (
          <Animated.View key={habit.key} style={[s.habitCard, { transform: [{ scale: scales[habit.key] }] }]}>
            {warnings[habit.key] && !log[habit.key] && <View style={[s.warnBanner, { backgroundColor: C.orangeSoft }]}><Text style={[s.warnText, { color: C.orange }]}>⚠️ Missed yesterday — don't miss twice!</Text></View>}
            <View style={s.row}>
              <View style={s.habitLeft}>
                <Text style={s.habitEmoji}>{habit.emoji}</Text>
                <View>
                  <Text style={s.habitTitle}>{habit.title}</Text>
                  <Text style={s.habitTime}>{habit.time}</Text>
                </View>
              </View>
              <View style={s.habitRight}>
                {streaks[habit.key] > 0 && <View style={[s.streakBadge, { backgroundColor: C.orangeSoft }]}><Text style={[s.streakText, { color: C.orange }]}>🔥 {streaks[habit.key]}d</Text></View>}
                <Text style={[s.xpBadge, { color: C.accent }]}>+{habit.xp}XP</Text>
              </View>
            </View>
            <View style={s.versionsRow}>
              <View style={s.chip}><Text style={s.chipLabel}>FULL</Text><Text style={s.chipText}>{habit.full}</Text></View>
              <View style={s.chip}><Text style={s.chipLabel}>MIN</Text><Text style={s.chipText}>{habit.minimum}</Text></View>
            </View>
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: log[habit.key] ? C.green : C.border }]} onPress={() => toggleHabit(habit.key)} activeOpacity={0.8}>
              <Text style={[s.doneBtnText, { color: log[habit.key] ? '#000' : C.muted }]}>{log[habit.key] ? '✓ Done!' : 'Mark as Done'}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Top 3 Tasks */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🎯 Today's Top 3 Tasks</Text>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.top3Row}>
              <TouchableOpacity style={[s.top3Check, (log.top3Done?.[i]) && { backgroundColor: C.accent, borderColor: C.accent }]} onPress={() => toggleTop3Done(i)}>
                {log.top3Done?.[i] && <Text style={s.top3CheckMark}>✓</Text>}
              </TouchableOpacity>
              <TextInput
                style={[s.top3Input, (log.top3Done?.[i]) && s.top3InputDone]}
                placeholder={`Priority ${i + 1}...`} placeholderTextColor={C.muted}
                value={log.top3?.[i] || ''} onChangeText={v => updateTop3(i, v)}
              />
            </View>
          ))}
        </View>

        {/* Pomodoro */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>⏱ Pomodoro</Text>
            <Text style={[s.badge, { backgroundColor: isBreak ? C.greenSoft : C.accentSoft, color: isBreak ? C.green : C.accent }]}>{isBreak ? 'Break' : 'Focus'}</Text>
          </View>
          <Text style={s.timerDisplay}>{fmt(timer)}</Text>
          <View style={s.timerBtns}>
            <TouchableOpacity style={[s.timerBtn, { backgroundColor: timerRunning ? C.redSoft : C.accentSoft }]} onPress={() => setTimerRunning(r => !r)}>
              <Text style={[s.timerBtnText, { color: timerRunning ? C.red : C.accent }]}>{timerRunning ? '⏸ Pause' : '▶ Start'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.timerBtn, { backgroundColor: C.surface }]} onPress={() => { setTimerRunning(false); setTimer(POMODORO_DURATION); setIsBreak(false); }}>
              <Text style={[s.timerBtnText, { color: C.muted }]}>↺ Reset</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.timerHint, { color: C.muted }]}>25 min focus → 5 min break. +{XP_REWARDS.pomodoro}XP per session.</Text>
        </View>

        {/* Morning Checklist */}
        <View style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>☀️ Morning Routine</Text><Text style={[s.badge, { backgroundColor: C.yellowSoft, color: C.yellow }]}>{checkDone}/{CHECKLIST.length}</Text></View>
          {CHECKLIST.map((item) => (
            <TouchableOpacity key={item.key} style={s.checkItem} onPress={() => toggleChecklist(item.key)} activeOpacity={0.7}>
              <View style={[s.checkbox, log.checklist?.[item.key] && { backgroundColor: C.green, borderColor: C.green }]}>
                {log.checklist?.[item.key] && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.checkEmoji}>{item.emoji}</Text>
              <Text style={[s.checkLabel, log.checklist?.[item.key] && { color: C.muted, textDecorationLine: 'line-through' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.ruleCard, { backgroundColor: C.accentSoft, borderColor: C.accent + '33' }]}>
          <Text style={[s.ruleTitle, { color: C.accent }]}>📌 Never Miss Twice</Text>
          <Text style={[s.ruleText, { color: C.text }]}>Miss once? That's human. Just get back tomorrow. Two misses is where habits die.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16, marginTop: 10 },
  greeting: { fontSize: 26, fontWeight: '700', color: C.text },
  date: { fontSize: 14, color: C.muted, marginTop: 4 },
  xpPopup: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, zIndex: 999 },
  xpPopupText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  quoteCard: { backgroundColor: C.accentSoft, borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: C.accent },
  quoteText: { color: C.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { color: C.accent, fontSize: 12, marginTop: 6, fontWeight: '600' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  successText: { fontSize: 13, marginTop: 10, fontWeight: '600' },
  habitCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  warnBanner: { borderRadius: 8, padding: 8, marginBottom: 12 },
  warnText: { fontSize: 12, fontWeight: '600' },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitRight: { alignItems: 'flex-end', gap: 4 },
  habitEmoji: { fontSize: 26 },
  habitTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  habitTime: { fontSize: 12, color: C.muted, marginTop: 2 },
  streakBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  streakText: { fontSize: 12, fontWeight: '700' },
  xpBadge: { fontSize: 11, fontWeight: '700' },
  versionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 4 },
  chip: { flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  chipLabel: { fontSize: 9, color: C.muted, fontWeight: '700', marginBottom: 3 },
  chipText: { fontSize: 12, color: C.text },
  doneBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700' },
  top3Row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  top3Check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  top3CheckMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  top3Input: { flex: 1, color: C.text, fontSize: 14, backgroundColor: C.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  top3InputDone: { textDecorationLine: 'line-through', color: C.muted },
  timerDisplay: { fontSize: 56, fontWeight: '800', color: C.text, textAlign: 'center', marginVertical: 10, letterSpacing: 2 },
  timerBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timerBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  timerBtnText: { fontWeight: '700', fontSize: 15 },
  timerHint: { fontSize: 12, textAlign: 'center' },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#000', fontWeight: '800', fontSize: 12 },
  checkEmoji: { fontSize: 18 },
  checkLabel: { flex: 1, fontSize: 14, color: C.text },
  ruleCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  ruleTitle: { fontWeight: '700', fontSize: 14, marginBottom: 6 },
  ruleText: { fontSize: 13, lineHeight: 20 },
});
