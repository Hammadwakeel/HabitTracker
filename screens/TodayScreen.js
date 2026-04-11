import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getTodayLog, saveTodayLog, getStreak, missedYesterday } from '../utils/storage';

const HABITS = [
  {
    key: 'exercise',
    emoji: '🏃',
    title: 'Exercise',
    full: '30–45 min workout',
    minimum: 'Just 10 min walk or stretch',
    time: 'Morning — right after waking up',
    color: COLORS.orange,
    colorSoft: COLORS.orangeSoft,
  },
  {
    key: 'reading',
    emoji: '📖',
    title: 'Reading',
    full: '30 min session',
    minimum: 'Just 2 pages',
    time: 'Night — last thing before sleep',
    color: COLORS.accent,
    colorSoft: COLORS.accentSoft,
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDateString = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
};

export default function TodayScreen() {
  const [log, setLog] = useState({ exercise: false, reading: false });
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [warnings, setWarnings] = useState({ exercise: false, reading: false });
  const scaleAnims = {
    exercise: useState(new Animated.Value(1))[0],
    reading: useState(new Animated.Value(1))[0],
  };

  const loadData = async () => {
    const todayLog = await getTodayLog();
    setLog(todayLog);

    const [exStreak, rdStreak] = await Promise.all([
      getStreak('exercise'),
      getStreak('reading'),
    ]);
    setStreaks({ exercise: exStreak, reading: rdStreak });

    const [exMissed, rdMissed] = await Promise.all([
      missedYesterday('exercise'),
      missedYesterday('reading'),
    ]);
    setWarnings({ exercise: exMissed, reading: rdMissed });
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const toggleHabit = async (key) => {
    const newLog = { ...log, [key]: !log[key] };
    setLog(newLog);
    await saveTodayLog(newLog);

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnims[key], { toValue: 1.08, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnims[key], { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();

    // Refresh streaks
    const streak = await getStreak(key);
    setStreaks(prev => ({ ...prev, [key]: streak }));
  };

  const completedCount = (log.exercise ? 1 : 0) + (log.reading ? 1 : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, Hammad 👋</Text>
          <Text style={styles.date}>{getDateString()}</Text>
        </View>

        {/* Progress pill */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressCount}>
              {completedCount}/2 done
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(completedCount / 2) * 100}%` }]} />
          </View>
          {completedCount === 2 && (
            <Text style={styles.allDone}>🎉 Both habits done! Great day.</Text>
          )}
        </View>

        {/* Habit Cards */}
        {HABITS.map((habit) => (
          <Animated.View
            key={habit.key}
            style={[styles.habitCard, { transform: [{ scale: scaleAnims[habit.key] }] }]}
          >
            {/* Never miss twice warning */}
            {warnings[habit.key] && !log[habit.key] && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>⚠️ You missed yesterday — don't miss twice!</Text>
              </View>
            )}

            <View style={styles.habitTop}>
              <View style={styles.habitLeft}>
                <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                <View>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitTime}>{habit.time}</Text>
                </View>
              </View>

              {/* Streak badge */}
              {streaks[habit.key] > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: habit.colorSoft }]}>
                  <Text style={[styles.streakText, { color: habit.color }]}>
                    🔥 {streaks[habit.key]}d
                  </Text>
                </View>
              )}
            </View>

            {/* Full / Minimum */}
            <View style={styles.versionsRow}>
              <View style={styles.versionChip}>
                <Text style={styles.versionLabel}>Full</Text>
                <Text style={styles.versionText}>{habit.full}</Text>
              </View>
              <View style={styles.versionChip}>
                <Text style={styles.versionLabel}>Minimum</Text>
                <Text style={styles.versionText}>{habit.minimum}</Text>
              </View>
            </View>

            {/* Done button */}
            <TouchableOpacity
              style={[
                styles.doneBtn,
                log[habit.key]
                  ? { backgroundColor: habit.color }
                  : { backgroundColor: COLORS.border },
              ]}
              onPress={() => toggleHabit(habit.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.doneBtnText,
                { color: log[habit.key] ? '#fff' : COLORS.muted }
              ]}>
                {log[habit.key] ? '✓ Done!' : 'Mark as Done'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Rule reminder */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>📌 Your One Rule</Text>
          <Text style={styles.ruleText}>
            Never miss twice in a row. Miss once? That's fine. Just get back tomorrow.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 24, marginTop: 10 },
  greeting: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 14, color: COLORS.muted, marginTop: 4 },

  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  progressCount: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 99 },
  progressBarFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 99 },
  allDone: { color: COLORS.green, fontSize: 13, marginTop: 10, fontWeight: '600' },

  habitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warningBanner: {
    backgroundColor: '#FB923C18',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  warningText: { color: COLORS.orange, fontSize: 12, fontWeight: '600' },

  habitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitEmoji: { fontSize: 28 },
  habitTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  habitTime: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '700' },

  versionsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  versionChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase' },
  versionText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },

  doneBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700' },

  ruleCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.accent + '33',
  },
  ruleTitle: { color: COLORS.accent, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  ruleText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
});
