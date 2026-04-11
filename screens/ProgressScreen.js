import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getLast30Days, getStreak } from '../utils/storage';

export default function ProgressScreen() {
  const [days, setDays] = useState([]);
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [filter, setFilter] = useState('both'); // 'both' | 'exercise' | 'reading'

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const last30 = await getLast30Days();
      setDays(last30);
      const [ex, rd] = await Promise.all([getStreak('exercise'), getStreak('reading')]);
      setStreaks({ exercise: ex, reading: rd });
    };
    load();
  }, []));

  const totalExercise = days.filter(d => d.exercise).length;
  const totalReading = days.filter(d => d.reading).length;
  const totalBoth = days.filter(d => d.exercise && d.reading).length;

  const getDotColor = (day) => {
    if (filter === 'exercise') return day.exercise ? COLORS.orange : COLORS.border;
    if (filter === 'reading') return day.reading ? COLORS.accent : COLORS.border;
    if (day.exercise && day.reading) return COLORS.green;
    if (day.exercise) return COLORS.orange;
    if (day.reading) return COLORS.accent;
    return COLORS.border;
  };

  const isToday = (dateStr) => dateStr === new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Your Progress</Text>
        <Text style={styles.sub}>Last 30 days</Text>

        {/* Streak cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.orange + '44' }]}>
            <Text style={styles.statEmoji}>🏃</Text>
            <Text style={[styles.statNum, { color: COLORS.orange }]}>{streaks.exercise}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.accent + '44' }]}>
            <Text style={styles.statEmoji}>📖</Text>
            <Text style={[styles.statNum, { color: COLORS.accent }]}>{streaks.reading}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.green + '44' }]}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={[styles.statNum, { color: COLORS.green }]}>{totalBoth}</Text>
            <Text style={styles.statLabel}>Both done</Text>
          </View>
        </View>

        {/* Monthly totals */}
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>This Month</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={[styles.totalNum, { color: COLORS.orange }]}>{totalExercise}/30</Text>
              <Text style={styles.totalLabel}>🏃 Exercise</Text>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${(totalExercise / 30) * 100}%`, backgroundColor: COLORS.orange }]} />
              </View>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalNum, { color: COLORS.accent }]}>{totalReading}/30</Text>
              <Text style={styles.totalLabel}>📖 Reading</Text>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${(totalReading / 30) * 100}%`, backgroundColor: COLORS.accent }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {['both', 'exercise', 'reading'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'both' ? '⚡ Both' : f === 'exercise' ? '🏃 Exercise' : '📖 Reading'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 30-day dot calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.dotGrid}>
            {days.map((day) => (
              <View key={day.date} style={styles.dotWrapper}>
                <View style={[
                  styles.dot,
                  { backgroundColor: getDotColor(day) },
                  isToday(day.date) && styles.dotToday,
                ]} />
                <Text style={styles.dotDay}>{day.day}</Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.legendText}>Both</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} />
              <Text style={styles.legendText}>Exercise</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Reading</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>
        </View>

        {/* Motivational footer */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "You don't rise to the level of your goals. You fall to the level of your systems."
          </Text>
          <Text style={styles.quoteAuthor}>— James Clear, Atomic Habits</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },

  heading: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginTop: 10 },
  sub: { fontSize: 14, color: COLORS.muted, marginBottom: 24, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2, fontWeight: '600' },

  totalsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalsTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 14 },
  totalsRow: { flexDirection: 'row', gap: 16 },
  totalItem: { flex: 1 },
  totalNum: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  totalLabel: { fontSize: 13, color: COLORS.text, marginBottom: 8 },
  miniBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 99 },
  miniBarFill: { height: 4, borderRadius: 99 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  filterText: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  filterTextActive: { color: COLORS.accent },

  calendarCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  dotWrapper: { alignItems: 'center', width: 32 },
  dot: { width: 24, height: 24, borderRadius: 6, marginBottom: 4 },
  dotToday: { borderWidth: 2, borderColor: COLORS.white },
  dotDay: { fontSize: 9, color: COLORS.muted },

  legend: { flexDirection: 'row', gap: 12, marginTop: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: COLORS.muted },

  quoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  quoteText: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { color: COLORS.muted, fontSize: 12, marginTop: 8, fontWeight: '600' },
});
