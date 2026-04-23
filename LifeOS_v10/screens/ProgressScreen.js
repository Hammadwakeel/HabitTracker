// ProgressScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getLast30Days, getStreak, getWeeklyReview, saveWeeklyReview } from '../utils/storage';

export default function ProgressScreen() {
  const { C } = useTheme();
  const [days, setDays] = useState([]);
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [filter, setFilter] = useState('both');
  const [review, setReview] = useState({ rating: null });
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const d = await getLast30Days(); setDays(d);
      const [ex, rd] = await Promise.all([getStreak('exercise'), getStreak('reading')]);
      setStreaks({ exercise: ex, reading: rd });
      const wr = await getWeeklyReview(); setReview(wr);
    })();
  }, []));

  const getDotColor = (day) => {
    if (filter === 'exercise') return day.exercise ? C.orange : C.border;
    if (filter === 'reading') return day.reading ? C.accent : C.border;
    if (day.exercise && day.reading) return C.green;
    if (day.exercise) return C.orange;
    if (day.reading) return C.accent;
    return C.border;
  };

  const isToday = (d) => d === new Date().toISOString().split('T')[0];
  const total30Ex = days.filter(d => d.exercise).length;
  const total30Rd = days.filter(d => d.reading).length;
  const total30Both = days.filter(d => d.exercise && d.reading).length;

  const saveReview = async () => {
    await saveWeeklyReview(review); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Progress</Text>

        <View style={s.statsRow}>
          {[
            { emoji: '🏃', val: streaks.exercise, label: 'Exercise streak', color: C.orange, border: C.orange + '44' },
            { emoji: '📖', val: streaks.reading, label: 'Reading streak', color: C.accent, border: C.accent + '44' },
            { emoji: '⚡', val: total30Both, label: 'Both done', color: C.green, border: C.green + '44' },
          ].map((item, i) => (
            <View key={i} style={[s.statCard, { borderColor: item.border }]}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{item.emoji}</Text>
              <Text style={[s.statNum, { color: item.color }]}>{item.val}</Text>
              <Text style={[s.statLabel, { color: C.muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>This Month</Text>
          {[{ label: '🏃 Exercise', val: total30Ex, color: C.orange }, { label: '📖 Reading', val: total30Rd, color: C.accent }].map(item => (
            <View key={item.label} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[s.totalLabel, { color: C.text }]}>{item.label}</Text>
                <Text style={[s.totalNum, { color: item.color }]}>{item.val}/30</Text>
              </View>
              <View style={s.barBg}><View style={[s.barFill, { width: `${(item.val / 30) * 100}%`, backgroundColor: item.color }]} /></View>
            </View>
          ))}
        </View>

        <View style={s.filterRow}>
          {[['both','⚡ Both'],['exercise','🏃 Ex'],['reading','📖 Read']].map(([f, l]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, { color: filter === f ? C.accent : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>30-Day View</Text>
          <View style={s.dotGrid}>
            {days.map(day => (
              <View key={day.date} style={{ alignItems: 'center', width: 30 }}>
                <View style={[s.dot, { backgroundColor: getDotColor(day) }, isToday(day.date) && { borderWidth: 2, borderColor: C.white }]} />
                <Text style={[s.dotDay, { color: C.muted }]}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View style={s.legend}>
            {[{ color: C.green, l: 'Both' }, { color: C.orange, l: 'Exercise' }, { color: C.accent, l: 'Reading' }, { color: C.border, l: 'Missed' }].map(item => (
              <View key={item.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[s.legendDot, { backgroundColor: item.color }]} />
                <Text style={[s.legendText, { color: C.muted }]}>{item.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Weekly Review</Text>
          <Text style={[s.hint, { color: C.muted }]}>Rate this week overall</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} style={[s.ratingBtn, review.rating === n && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setReview(p => ({ ...p, rating: n }))}>
                <Text style={[s.ratingText, { color: review.rating === n ? C.accent : C.muted }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: saved ? C.green : C.accent }]} onPress={saveReview}>
            <Text style={s.saveBtnText}>{saved ? '✓ Saved!' : 'Save Review'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2, fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalNum: { fontSize: 16, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600' },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: { width: 22, height: 22, borderRadius: 6, marginBottom: 3 },
  dotDay: { fontSize: 8 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11 },
  hint: { fontSize: 12, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ratingBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  ratingText: { fontWeight: '800', fontSize: 18 },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
