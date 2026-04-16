import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../utils/ThemeContext';
import { getTodayHealth, saveTodayHealth, getLast7DaysHealth } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOODS = [
  { val: 1, e: '😞', label: 'Rough' },
  { val: 2, e: '😕', label: 'Meh' },
  { val: 3, e: '😐', label: 'Okay' },
  { val: 4, e: '😊', label: 'Good' },
  { val: 5, e: '😄', label: 'Great' },
];

const scheduleWaterReminders = async (goalGlasses, intervalHours) => {
  // Cancel existing water reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'water') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // Schedule reminders every X hours from 8am to 10pm
  const wakeHour = 8;
  const sleepHour = 22;
  const totalHours = sleepHour - wakeHour;
  const remindersCount = Math.floor(totalHours / intervalHours);

  for (let i = 0; i < remindersCount; i++) {
    const hour = wakeHour + (i * intervalHours);
    if (hour < sleepHour) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Water Reminder',
          body: `Time for a glass of water! Goal: ${goalGlasses} glasses today.`,
          data: { type: 'water' },
          sound: false,
        },
        trigger: { hour: Math.floor(hour), minute: 0, repeats: true },
      });
    }
  }
};

export default function HealthScreen() {
  const { C } = useTheme();
  const [health, setHealth] = useState({
    energy: null, mood: null, water: 0, sleepHours: null,
    weight: null, noJunk: false, meals: {},
  });
  const [history, setHistory] = useState([]);
  const [xpMsg, setXpMsg] = useState(null);
  const [waterGoal, setWaterGoal] = useState(8);
  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('8');
  const [reminderInterval, setReminderInterval] = useState(2);

  useFocusEffect(useCallback(() => {
    (async () => {
      const h = await getTodayHealth(); setHealth(h);
      const hist = await getLast7DaysHealth(); setHistory(hist);
      const goal = await AsyncStorage.getItem('waterGoal');
      if (goal) setWaterGoal(parseInt(goal));
      const interval = await AsyncStorage.getItem('waterReminderInterval');
      if (interval) setReminderInterval(parseInt(interval));
    })();
  }, []));

  const showXP = (msg) => { setXpMsg(msg); setTimeout(() => setXpMsg(null), 2000); };

  const update = async (key, val, xpAmt, xpLabel) => {
    const updated = { ...health, [key]: val };
    setHealth(updated);
    await saveTodayHealth(updated);
    if (xpAmt && val) { await addXP(xpAmt); showXP(`+${xpAmt}XP — ${xpLabel}`); }
  };

  const setWater = async (val) => {
    const clamped = Math.max(0, Math.min(val, waterGoal + 4));
    const updated = { ...health, water: clamped };
    setHealth(updated);
    await saveTodayHealth(updated);
    if (clamped >= waterGoal) {
      await addXP(XP_REWARDS.water8);
      showXP(`+${XP_REWARDS.water8}XP — Water Goal! 💧`);
    }
  };

  const saveWaterGoal = async () => {
    const g = parseInt(goalInput) || 8;
    const clamped = Math.max(4, Math.min(g, 20));
    setWaterGoal(clamped);
    setGoalInput(String(clamped));
    await AsyncStorage.setItem('waterGoal', String(clamped));
    await AsyncStorage.setItem('waterReminderInterval', String(reminderInterval));
    await scheduleWaterReminders(clamped, reminderInterval);
    setGoalModal(false);
    showXP('Water goal & reminders set! 💧');
  };

  const ec = (e) => !e ? C.border : e <= 3 ? C.red : e <= 6 ? C.yellow : C.green;
  const waterPct = Math.min((health.water / waterGoal) * 100, 100);
  const waterColor = waterPct >= 100 ? C.green : waterPct >= 60 ? C.blue : C.muted;
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpMsg && <View style={s.xpPopup}><Text style={s.xpText}>{xpMsg}</Text></View>}

      {/* Water Goal Modal */}
      <Modal visible={goalModal} transparent animationType="fade" onRequestClose={() => setGoalModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.modalTitle, { color: C.text }]}>💧 Water Settings</Text>

            <Text style={[s.modalLabel, { color: C.muted }]}>Daily water goal (glasses):</Text>
            <View style={s.goalInputRow}>
              <TouchableOpacity style={[s.goalAdjBtn, { backgroundColor: C.surface }]} onPress={() => setGoalInput(String(Math.max(4, parseInt(goalInput || 8) - 1)))}>
                <Text style={[{ color: C.text, fontWeight: '700', fontSize: 18 }]}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[s.goalInput, { color: C.text, backgroundColor: C.surface, borderColor: C.border }]}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity style={[s.goalAdjBtn, { backgroundColor: C.surface }]} onPress={() => setGoalInput(String(Math.min(20, parseInt(goalInput || 8) + 1)))}>
                <Text style={[{ color: C.text, fontWeight: '700', fontSize: 18 }]}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.modalLabel, { color: C.muted }]}>Reminder every (hours):</Text>
            <View style={s.intervalRow}>
              {[1, 2, 3, 4].map(h => (
                <TouchableOpacity key={h} style={[s.intervalBtn, reminderInterval === h && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setReminderInterval(h)}>
                  <Text style={[s.intervalText, { color: reminderInterval === h ? C.accent : C.muted }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.modalNote, { color: C.muted }]}>Reminders run from 8 AM to 10 PM</Text>

            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalCancelBtn, { borderColor: C.border }]} onPress={() => setGoalModal(false)}>
                <Text style={[{ color: C.muted, fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSaveBtn, { backgroundColor: C.accent }]} onPress={saveWaterGoal}>
                <Text style={[{ color: '#fff', fontWeight: '700' }]}>Save & Set Reminders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Health Tracker</Text>

        {/* Mood */}
        <View style={s.card}>
          <Text style={s.cardTitle}>😊 Mood</Text>
          <View style={s.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity key={m.val} style={[s.moodBtn, health.mood === m.val && { backgroundColor: C.accentSoft }]} onPress={() => update('mood', m.val)}>
                <Text style={{ fontSize: 28 }}>{m.e}</Text>
                <Text style={[s.moodLabel, { color: health.mood === m.val ? C.accent : C.muted }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Energy */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>⚡ Energy Level</Text>
            {health.energy && <Text style={[s.bigNum, { color: ec(health.energy) }]}>{health.energy}/10</Text>}
          </View>
          <View style={s.dotsRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity key={n} style={[s.energyDot, { backgroundColor: health.energy >= n ? ec(health.energy) : C.border }]} onPress={() => update('energy', n)} />
            ))}
          </View>
          <View style={s.energyLabels}>
            <Text style={[s.energyLabel, { color: C.muted }]}>Low 😴</Text>
            <Text style={[s.energyLabel, { color: C.muted }]}>High ⚡</Text>
          </View>
        </View>

        {/* Water */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>💧 Water Intake</Text>
              <Text style={[s.waterGoalText, { color: C.muted }]}>Goal: {waterGoal} glasses/day</Text>
            </View>
            <View style={s.waterRight}>
              <Text style={[s.bigNum, { color: waterColor }]}>{health.water}/{waterGoal}</Text>
              <TouchableOpacity style={[s.goalSettingBtn, { backgroundColor: C.accentSoft }]} onPress={() => { setGoalInput(String(waterGoal)); setGoalModal(true); }}>
                <Text style={[{ color: C.accent, fontSize: 11, fontWeight: '700' }]}>⚙️ Goal</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[s.waterBarBg, { backgroundColor: C.border }]}>
            <View style={[s.waterBarFill, { width: `${waterPct}%`, backgroundColor: waterPct >= 100 ? C.green : C.blue }]} />
          </View>
          <Text style={[s.waterPctText, { color: waterColor }]}>{waterPct.toFixed(0)}% of daily goal</Text>

          {/* Glass grid */}
          <View style={s.waterGrid}>
            {Array.from({ length: waterGoal }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[s.waterGlass, { opacity: i < health.water ? 1 : 0.2, backgroundColor: i < health.water ? C.blue + '20' : 'transparent' }]}
                onPress={() => setWater(i < health.water ? i : i + 1)}
              >
                <Text style={{ fontSize: 22 }}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick add buttons */}
          <View style={s.waterBtns}>
            <TouchableOpacity style={[s.waterBtn, { backgroundColor: C.blueSoft }]} onPress={() => setWater(health.water + 1)}>
              <Text style={[s.waterBtnText, { color: C.blue }]}>+1 glass</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.waterBtn, { backgroundColor: C.blueSoft }]} onPress={() => setWater(health.water + 2)}>
              <Text style={[s.waterBtnText, { color: C.blue }]}>+2 glasses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.waterBtn, { backgroundColor: C.redSoft }]} onPress={() => setWater(Math.max(0, health.water - 1))}>
              <Text style={[s.waterBtnText, { color: C.red }]}>-1</Text>
            </TouchableOpacity>
          </View>

          {health.water >= waterGoal && (
            <Text style={[s.goalMet, { color: C.green }]}>🎉 Water goal reached! +{XP_REWARDS.water8}XP</Text>
          )}
        </View>

        {/* Sleep */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>😴 Sleep Last Night</Text>
            {health.sleepHours && (
              <Text style={[s.bigNum, { color: health.sleepHours >= 7 ? C.green : health.sleepHours >= 5 ? C.yellow : C.red }]}>
                {health.sleepHours}h
              </Text>
            )}
          </View>
          <View style={s.sleepRow}>
            {[4,5,6,7,8,9].map(h => (
              <TouchableOpacity key={h} style={[s.sleepBtn, health.sleepHours === h && { backgroundColor: C.purpleSoft, borderColor: C.purple }]} onPress={() => update('sleepHours', h, h >= 7 ? XP_REWARDS.sleep7plus : 0, '7+ Hours Sleep!')}>
                <Text style={[s.sleepBtnText, { color: health.sleepHours === h ? C.purple : C.muted }]}>{h}h</Text>
              </TouchableOpacity>
            ))}
          </View>
          {health.sleepHours && health.sleepHours < 7 && (
            <Text style={[s.warn, { color: C.yellow }]}>⚠️ Under 7 hours significantly impacts focus and mood.</Text>
          )}
          {health.sleepHours && health.sleepHours >= 7 && (
            <Text style={[s.success, { color: C.green }]}>✅ Great sleep! Brain fully rested. +{XP_REWARDS.sleep7plus}XP</Text>
          )}
        </View>

        {/* Nutrition */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🍽️ Nutrition</Text>
          <TouchableOpacity
            style={[s.toggleRow, health.noJunk && { backgroundColor: C.greenSoft }]}
            onPress={() => update('noJunk', !health.noJunk, !health.noJunk ? XP_REWARDS.noJunk : 0, 'No Junk Food!')}
          >
            <Text style={{ fontSize: 22 }}>🚫</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.toggleLabel, { color: C.text }]}>No Junk Food Today</Text>
              <Text style={[s.toggleDesc, { color: C.muted }]}>+{XP_REWARDS.noJunk}XP reward</Text>
            </View>
            <View style={[s.checkBox, health.noJunk && { backgroundColor: C.green, borderColor: C.green }]}>
              {health.noJunk && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✓</Text>}
            </View>
          </TouchableOpacity>
          {['breakfast','lunch','dinner'].map(meal => (
            <TouchableOpacity key={meal} style={[s.toggleRow, health.meals?.[meal] && { backgroundColor: C.tealSoft }]} onPress={() => update('meals', { ...health.meals, [meal]: !health.meals?.[meal] })}>
              <Text style={{ fontSize: 20 }}>{meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : '🌙'}</Text>
              <Text style={[s.toggleLabel, { color: C.text, flex: 1, marginLeft: 12 }]}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
              {health.meals?.[meal] && <Text style={[{ color: C.green, fontWeight: '700' }]}>✓ Eaten</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* 7-day energy chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📈 7-Day Energy</Text>
          <View style={s.chartRow}>
            {history.map(d => (
              <View key={d.date} style={s.chartCol}>
                <View style={s.barCont}>
                  <View style={[s.bar, { height: d.energy ? `${d.energy * 10}%` : '2%', backgroundColor: ec(d.energy) }]} />
                </View>
                <Text style={[s.chartLabel, { color: C.muted }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7-day water chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📈 7-Day Water (glasses)</Text>
          <View style={s.chartRow}>
            {history.map(d => (
              <View key={d.date} style={s.chartCol}>
                <View style={s.barCont}>
                  <View style={[s.bar, { height: d.water ? `${Math.min((d.water / waterGoal) * 100, 100)}%` : '2%', backgroundColor: C.blue }]} />
                </View>
                <Text style={[s.chartLabel, { color: C.muted }]}>{d.label}</Text>
                <Text style={[s.chartVal, { color: C.muted }]}>{d.water || 0}</Text>
              </View>
            ))}
          </View>
          <View style={s.chartGoalLine}>
            <Text style={[{ color: C.muted, fontSize: 11 }]}>Goal line: {waterGoal} glasses</Text>
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
  xpPopup: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, zIndex: 999, elevation: 10 },
  xpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  bigNum: { fontSize: 22, fontWeight: '800' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: 12, flex: 1 },
  moodLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  energyDot: { flex: 1, height: 30, borderRadius: 8 },
  energyLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  energyLabel: { fontSize: 11 },
  waterGoalText: { fontSize: 12, marginTop: 2 },
  waterRight: { alignItems: 'flex-end', gap: 4 },
  goalSettingBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  waterBarBg: { height: 8, borderRadius: 99, marginBottom: 6 },
  waterBarFill: { height: 8, borderRadius: 99 },
  waterPctText: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  waterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  waterGlass: { borderRadius: 8, padding: 4 },
  waterBtns: { flexDirection: 'row', gap: 8 },
  waterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  waterBtnText: { fontWeight: '700', fontSize: 13 },
  goalMet: { fontSize: 13, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  sleepRow: { flexDirection: 'row', gap: 6 },
  sleepBtn: { flex: 1, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  sleepBtnText: { fontWeight: '700', fontSize: 14 },
  warn: { fontSize: 12, marginTop: 10, fontWeight: '600' },
  success: { fontSize: 12, marginTop: 10, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  chartRow: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  barCont: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 3 },
  chartLabel: { fontSize: 9, marginTop: 4 },
  chartVal: { fontSize: 9, marginTop: 1 },
  chartGoalLine: { marginTop: 6 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  goalAdjBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalInput: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, fontSize: 24, fontWeight: '800', height: 52 },
  intervalRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  intervalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  intervalText: { fontWeight: '700', fontSize: 14 },
  modalNote: { fontSize: 11, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalSaveBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
});
