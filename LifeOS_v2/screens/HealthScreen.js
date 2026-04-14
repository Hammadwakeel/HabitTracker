import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getTodayHealth, saveTodayHealth, getLast7DaysHealth } from '../utils/storage';

const MOODS = [
  { val: 1, emoji: '😞', label: 'Rough' },
  { val: 2, emoji: '😕', label: 'Meh' },
  { val: 3, emoji: '😐', label: 'Okay' },
  { val: 4, emoji: '😊', label: 'Good' },
  { val: 5, emoji: '😄', label: 'Great' },
];

const WATER_GOAL = 8;

export default function HealthScreen() {
  const [health, setHealth] = useState({ energy: null, mood: null, water: 0, sleepHours: null });
  const [history, setHistory] = useState([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const h = await getTodayHealth();
      setHealth(h);
      const hist = await getLast7DaysHealth();
      setHistory(hist);
    })();
  }, []));

  const update = async (key, val) => {
    const updated = { ...health, [key]: val };
    setHealth(updated);
    await saveTodayHealth(updated);
  };

  const energyColor = (e) => {
    if (!e) return COLORS.border;
    if (e <= 3) return COLORS.red;
    if (e <= 6) return COLORS.yellow;
    return COLORS.green;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Health Tracker</Text>
        <Text style={s.sub}>How are you doing today?</Text>

        {/* Mood */}
        <View style={s.card}>
          <Text style={s.cardTitle}>😊 Mood</Text>
          <View style={s.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity key={m.val} style={[s.moodBtn, health.mood === m.val && s.moodBtnActive]} onPress={() => update('mood', m.val)} activeOpacity={0.7}>
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, health.mood === m.val && { color: COLORS.text }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Energy */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>⚡ Energy Level</Text>
            {health.energy && <Text style={[s.bigNum, { color: energyColor(health.energy) }]}>{health.energy}/10</Text>}
          </View>
          <View style={s.sliderRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity key={n} style={[s.energyDot, { backgroundColor: health.energy >= n ? energyColor(health.energy) : COLORS.border }]} onPress={() => update('energy', n)} />
            ))}
          </View>
          <View style={s.sliderLabels}>
            <Text style={s.sliderLabel}>Low</Text>
            <Text style={s.sliderLabel}>High</Text>
          </View>
        </View>

        {/* Water */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>💧 Water Intake</Text>
            <Text style={[s.bigNum, { color: health.water >= WATER_GOAL ? COLORS.green : COLORS.blue }]}>{health.water}/{WATER_GOAL}</Text>
          </View>
          <View style={s.waterRow}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => update('water', i + 1 === health.water ? i : i + 1)}>
                <Text style={[s.waterGlass, { opacity: i < health.water ? 1 : 0.3 }]}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.waterHint}>Tap glasses to log. Goal: 8 glasses per day.</Text>
          {health.water >= WATER_GOAL && <Text style={s.goalMet}>✅ Water goal met!</Text>}
        </View>

        {/* Sleep */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>😴 Sleep Last Night</Text>
            {health.sleepHours && <Text style={[s.bigNum, { color: health.sleepHours >= 7 ? COLORS.green : health.sleepHours >= 5 ? COLORS.yellow : COLORS.red }]}>{health.sleepHours}h</Text>}
          </View>
          <View style={s.sleepRow}>
            {[4,5,6,7,8,9].map(h => (
              <TouchableOpacity key={h} style={[s.sleepBtn, health.sleepHours === h && s.sleepBtnActive]} onPress={() => update('sleepHours', h)}>
                <Text style={[s.sleepText, health.sleepHours === h && { color: COLORS.text }]}>{h}h</Text>
              </TouchableOpacity>
            ))}
          </View>
          {health.sleepHours && health.sleepHours < 7 && (
            <Text style={s.sleepWarn}>⚠️ Under 7 hours impacts focus and mood significantly.</Text>
          )}
          {health.sleepHours && health.sleepHours >= 7 && (
            <Text style={s.sleepGood}>✅ Great sleep! Your brain is well rested.</Text>
          )}
        </View>

        {/* 7-day mini chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📈 Last 7 Days — Energy</Text>
          <View style={s.chartRow}>
            {history.map((d) => (
              <View key={d.date} style={s.chartCol}>
                <View style={s.barContainer}>
                  <View style={[s.bar, { height: d.energy ? `${d.energy * 10}%` : '2%', backgroundColor: energyColor(d.energy) }]} />
                </View>
                <Text style={s.chartLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7-day sleep chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📈 Last 7 Days — Sleep</Text>
          <View style={s.chartRow}>
            {history.map((d) => (
              <View key={d.date} style={s.chartCol}>
                <View style={s.barContainer}>
                  <View style={[s.bar, { height: d.sleepHours ? `${(d.sleepHours / 9) * 100}%` : '2%', backgroundColor: COLORS.purple }]} />
                </View>
                <Text style={s.chartLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
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
  card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  bigNum: { fontSize: 22, fontWeight: '800' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: 12, flex: 1, marginHorizontal: 2 },
  moodBtnActive: { backgroundColor: COLORS.accentSoft },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  energyDot: { width: 26, height: 26, borderRadius: 8, flex: 1 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderLabel: { fontSize: 11, color: COLORS.muted },
  waterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  waterGlass: { fontSize: 28 },
  waterHint: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  goalMet: { color: COLORS.green, fontSize: 13, fontWeight: '600', marginTop: 8 },
  sleepRow: { flexDirection: 'row', gap: 8 },
  sleepBtn: { flex: 1, paddingVertical: 10, backgroundColor: COLORS.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sleepBtnActive: { backgroundColor: COLORS.purpleSoft, borderColor: COLORS.purple },
  sleepText: { color: COLORS.muted, fontWeight: '700', fontSize: 14 },
  sleepWarn: { color: COLORS.yellow, fontSize: 12, marginTop: 10, fontWeight: '600' },
  sleepGood: { color: COLORS.green, fontSize: 12, marginTop: 10, fontWeight: '600' },
  chartRow: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 3 },
  chartLabel: { fontSize: 9, color: COLORS.muted, marginTop: 4 },
});
