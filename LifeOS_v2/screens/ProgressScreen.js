import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getLast30Days, getStreak, getWeeklyReview, saveWeeklyReview } from '../utils/storage';

export default function ProgressScreen() {
  const [days, setDays] = useState([]);
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [filter, setFilter] = useState('both');
  const [review, setReview] = useState({ rating: null, wins: '', improve: '', focus: '' });
  const [reviewSaved, setReviewSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const d = await getLast30Days();
      setDays(d);
      const [ex, rd] = await Promise.all([getStreak('exercise'), getStreak('reading')]);
      setStreaks({ exercise: ex, reading: rd });
      const wr = await getWeeklyReview();
      setReview(wr);
    })();
  }, []));

  const getDotColor = (day) => {
    if (filter === 'exercise') return day.exercise ? COLORS.orange : COLORS.border;
    if (filter === 'reading') return day.reading ? COLORS.accent : COLORS.border;
    if (day.exercise && day.reading) return COLORS.green;
    if (day.exercise) return COLORS.orange;
    if (day.reading) return COLORS.accent;
    return COLORS.border;
  };

  const isToday = (d) => d === new Date().toISOString().split('T')[0];
  const total30Ex = days.filter(d => d.exercise).length;
  const total30Rd = days.filter(d => d.reading).length;
  const total30Both = days.filter(d => d.exercise && d.reading).length;

  const saveReview = async () => {
    await saveWeeklyReview(review);
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 2000);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Progress</Text>
        <Text style={s.sub}>Last 30 days</Text>

        {/* Streak cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderColor: COLORS.orange + '44' }]}>
            <Text style={s.statEmoji}>🏃</Text>
            <Text style={[s.statNum, { color: COLORS.orange }]}>{streaks.exercise}</Text>
            <Text style={s.statLabel}>Day streak</Text>
          </View>
          <View style={[s.statCard, { borderColor: COLORS.accent + '44' }]}>
            <Text style={s.statEmoji}>📖</Text>
            <Text style={[s.statNum, { color: COLORS.accent }]}>{streaks.reading}</Text>
            <Text style={s.statLabel}>Day streak</Text>
          </View>
          <View style={[s.statCard, { borderColor: COLORS.green + '44' }]}>
            <Text style={s.statEmoji}>⚡</Text>
            <Text style={[s.statNum, { color: COLORS.green }]}>{total30Both}</Text>
            <Text style={s.statLabel}>Both done</Text>
          </View>
        </View>

        {/* Monthly totals */}
        <View style={s.card}>
          <Text style={s.cardTitle}>This Month</Text>
          <View style={s.totalsRow}>
            {[
              { label: '🏃 Exercise', val: total30Ex, color: COLORS.orange },
              { label: '📖 Reading', val: total30Rd, color: COLORS.accent },
            ].map(item => (
              <View key={item.label} style={s.totalItem}>
                <Text style={[s.totalNum, { color: item.color }]}>{item.val}/30</Text>
                <Text style={s.totalLabel}>{item.label}</Text>
                <View style={s.miniBarBg}>
                  <View style={[s.miniBarFill, { width: `${(item.val / 30) * 100}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Filter */}
        <View style={s.filterRow}>
          {['both','exercise','reading'].map(f => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'both' ? '⚡ Both' : f === 'exercise' ? '🏃 Exercise' : '📖 Reading'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 30-day Calendar */}
        <View style={s.card}>
          <Text style={s.cardTitle}>30-Day View</Text>
          <View style={s.dotGrid}>
            {days.map(day => (
              <View key={day.date} style={s.dotWrapper}>
                <View style={[s.dot, { backgroundColor: getDotColor(day) }, isToday(day.date) && s.dotToday]} />
                <Text style={s.dotDay}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View style={s.legend}>
            {[
              { color: COLORS.green, label: 'Both' },
              { color: COLORS.orange, label: 'Exercise' },
              { color: COLORS.accent, label: 'Reading' },
              { color: COLORS.border, label: 'Missed' },
            ].map(l => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={s.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Review */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Weekly Review</Text>
          <Text style={s.reviewSub}>Rate this week overall</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} style={[s.ratingBtn, review.rating === n && s.ratingActive]} onPress={() => setReview(p => ({ ...p, rating: n }))}>
                <Text style={[s.ratingText, review.rating === n && { color: COLORS.text }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.saveBtn, reviewSaved && s.saveBtnDone]} onPress={saveReview} activeOpacity={0.8}>
            <Text style={s.saveBtnText}>{reviewSaved ? '✓ Saved!' : 'Save Review'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={s.quoteCard}>
          <Text style={s.quoteText}>"You don't rise to the level of your goals. You fall to the level of your systems."</Text>
          <Text style={s.quoteAuthor}>— James Clear</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginTop: 10 },
  sub: { fontSize: 14, color: COLORS.muted, marginBottom: 20, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  totalsRow: { flexDirection: 'row', gap: 16 },
  totalItem: { flex: 1 },
  totalNum: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  totalLabel: { fontSize: 13, color: COLORS.text, marginBottom: 8 },
  miniBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 99 },
  miniBarFill: { height: 4, borderRadius: 99 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 99, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  filterActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  filterText: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  filterTextActive: { color: COLORS.accent },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dotWrapper: { alignItems: 'center', width: 30 },
  dot: { width: 22, height: 22, borderRadius: 6, marginBottom: 3 },
  dotToday: { borderWidth: 2, borderColor: COLORS.white },
  dotDay: { fontSize: 8, color: COLORS.muted },
  legend: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: COLORS.muted },
  reviewSub: { color: COLORS.muted, fontSize: 12, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ratingBtn: { flex: 1, paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  ratingActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  ratingText: { color: COLORS.muted, fontWeight: '800', fontSize: 18 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnDone: { backgroundColor: COLORS.green },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  quoteCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  quoteText: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { color: COLORS.muted, fontSize: 12, marginTop: 8, fontWeight: '600' },
});
