// HealthScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayHealth, saveTodayHealth, getLast7DaysHealth, getWeightHistory } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';

const MOODS = [{ val: 1, e: '😞' },{ val: 2, e: '😕' },{ val: 3, e: '😐' },{ val: 4, e: '😊' },{ val: 5, e: '😄' }];

export default function HealthScreen() {
  const { C } = useTheme();
  const [health, setHealth] = useState({ energy: null, mood: null, water: 0, sleepHours: null, weight: null, noJunk: false, meals: {}, lastCoffee: null });
  const [history, setHistory] = useState([]);
  const [xpMsg, setXpMsg] = useState(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const h = await getTodayHealth(); setHealth(h);
      const hist = await getLast7DaysHealth(); setHistory(hist);
    })();
  }, []));

  const showXP = (msg) => { setXpMsg(msg); setTimeout(() => setXpMsg(null), 2000); };

  const update = async (key, val, xpAmt, xpLabel) => {
    const updated = { ...health, [key]: val };
    setHealth(updated);
    await saveTodayHealth(updated);
    if (xpAmt && val) { await addXP(xpAmt); showXP(`+${xpAmt}XP — ${xpLabel}`); }
  };

  const ec = (e) => !e ? C.border : e <= 3 ? C.red : e <= 6 ? C.yellow : C.green;
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpMsg && <View style={s.xpPopup}><Text style={s.xpPopupText}>{xpMsg}</Text></View>}
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Health Tracker</Text>

        {/* Mood */}
        <View style={s.card}>
          <Text style={s.cardTitle}>😊 Mood</Text>
          <View style={s.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity key={m.val} style={[s.moodBtn, health.mood === m.val && { backgroundColor: C.accentSoft }]} onPress={() => update('mood', m.val)}>
                <Text style={{ fontSize: 28 }}>{m.e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Energy */}
        <View style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>⚡ Energy</Text>{health.energy && <Text style={[s.bigNum, { color: ec(health.energy) }]}>{health.energy}/10</Text>}</View>
          <View style={s.dotsRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity key={n} style={[s.energyDot, { backgroundColor: health.energy >= n ? ec(health.energy) : C.border }]} onPress={() => update('energy', n)} />
            ))}
          </View>
        </View>

        {/* Water */}
        <View style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>💧 Water</Text><Text style={[s.bigNum, { color: health.water >= 8 ? C.green : C.blue }]}>{health.water}/8</Text></View>
          <View style={s.waterRow}>
            {Array.from({ length: 8 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => { const v = i + 1 === health.water ? i : i + 1; update('water', v, v >= 8 ? XP_REWARDS.water8 : 0, '8 Glasses!'); }}>
                <Text style={{ fontSize: 28, opacity: i < health.water ? 1 : 0.25 }}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
          {health.water >= 8 && <Text style={[s.success, { color: C.green }]}>✅ Water goal met! +{XP_REWARDS.water8}XP</Text>}
        </View>

        {/* Sleep */}
        <View style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>😴 Sleep</Text>{health.sleepHours && <Text style={[s.bigNum, { color: health.sleepHours >= 7 ? C.green : health.sleepHours >= 5 ? C.yellow : C.red }]}>{health.sleepHours}h</Text>}</View>
          <View style={s.sleepRow}>
            {[4,5,6,7,8,9].map(h => (
              <TouchableOpacity key={h} style={[s.sleepBtn, health.sleepHours === h && { backgroundColor: C.purpleSoft, borderColor: C.purple }]} onPress={() => update('sleepHours', h, h >= 7 ? XP_REWARDS.sleep7plus : 0, '7+ Hours Sleep!')}>
                <Text style={[s.sleepBtnText, { color: health.sleepHours === h ? C.purple : C.muted }]}>{h}h</Text>
              </TouchableOpacity>
            ))}
          </View>
          {health.sleepHours && health.sleepHours < 7 && <Text style={[s.warn, { color: C.yellow }]}>⚠️ Under 7h significantly impacts focus.</Text>}
        </View>

        {/* No Junk + Meals */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🍽️ Nutrition</Text>
          <TouchableOpacity style={[s.toggleRow, health.noJunk && { backgroundColor: C.greenSoft }]} onPress={() => update('noJunk', !health.noJunk, !health.noJunk ? XP_REWARDS.noJunk : 0, 'No Junk Food!')}>
            <Text style={{ fontSize: 22 }}>🚫</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.toggleLabel, { color: C.text }]}>No Junk Food Today</Text>
              <Text style={[s.toggleDesc, { color: C.muted }]}>+{XP_REWARDS.noJunk}XP</Text>
            </View>
            <View style={[s.toggleCheck, health.noJunk && { backgroundColor: C.green, borderColor: C.green }]}>
              {health.noJunk && <Text style={s.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
          {['breakfast','lunch','dinner'].map(meal => (
            <TouchableOpacity key={meal} style={[s.mealRow, health.meals?.[meal] && { backgroundColor: C.tealSoft }]} onPress={() => update('meals', { ...health.meals, [meal]: !health.meals?.[meal] })}>
              <Text style={{ fontSize: 20 }}>{meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : '🌙'}</Text>
              <Text style={[s.toggleLabel, { color: C.text, flex: 1, marginLeft: 12 }]}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
              {health.meals?.[meal] && <Text style={[{ color: C.green, fontWeight: '700' }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* 7-day chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📈 7-Day Energy</Text>
          <View style={s.chartRow}>
            {history.map(d => (
              <View key={d.date} style={s.chartCol}>
                <View style={s.barCont}><View style={[s.bar, { height: d.energy ? `${d.energy * 10}%` : '2%', backgroundColor: ec(d.energy) }]} /></View>
                <Text style={[s.chartLabel, { color: C.muted }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 20 },
  xpPopup: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, zIndex: 999 },
  xpPopupText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bigNum: { fontSize: 22, fontWeight: '800' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { padding: 10, borderRadius: 12 },
  dotsRow: { flexDirection: 'row', gap: 6 },
  energyDot: { flex: 1, height: 28, borderRadius: 8 },
  waterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  success: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  warn: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  sleepRow: { flexDirection: 'row', gap: 8 },
  sleepBtn: { flex: 1, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  sleepBtnText: { fontWeight: '700', fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  mealRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  toggleCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chartRow: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  barCont: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 3 },
  chartLabel: { fontSize: 9, marginTop: 4 },
});
