// SleepScreen.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const CHRONOTYPES = [
  { id: 'lion', name: 'Lion 🦁', desc: 'Early riser. Peak: 8–12 AM. Sleep: 10 PM.', peak: '8 AM – 12 PM', bed: '10:00 PM' },
  { id: 'bear', name: 'Bear 🐻', desc: 'Follows the sun. Peak: 10 AM–2 PM. Sleep: 11 PM.', peak: '10 AM – 2 PM', bed: '11:00 PM' },
  { id: 'wolf', name: 'Wolf 🐺', desc: 'Night owl. Peak: 5–9 PM. Sleep: 12–1 AM.', peak: '5 PM – 9 PM', bed: '12:30 AM' },
  { id: 'dolphin', name: 'Dolphin 🐬', desc: 'Light sleeper, anxious. Peak: 3–9 PM. Variable.', peak: '3 PM – 9 PM', bed: '11:30 PM' },
];

const PRE_SLEEP = [
  { key: 'dimLights', emoji: '💡', label: 'Dim lights / switch to warm light' },
  { key: 'noScreen', emoji: '📵', label: 'No screens for 30 min' },
  { key: 'read', emoji: '📖', label: 'Read physical book' },
  { key: 'brush', emoji: '🪥', label: 'Brush teeth & wash face' },
  { key: 'coolRoom', emoji: '❄️', label: 'Cool down the room' },
  { key: 'gratitude', emoji: '🙏', label: 'Write 3 things grateful for' },
  { key: 'noFood', emoji: '🍽️', label: 'No food for 2 hours' },
];

export default function SleepScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('checklist');
  const [checklist, setChecklist] = useState({});
  const [dreamLog, setDreamLog] = useState([]);
  const [newDream, setNewDream] = useState('');
  const [chronotype, setChronotype] = useState(null);

  const todayKey = new Date().toISOString().split('T')[0];

  useFocusEffect(useCallback(() => {
    (async () => {
      const cl = await AsyncStorage.getItem('sleepChecklist_' + todayKey); if (cl) setChecklist(JSON.parse(cl));
      const dl = await AsyncStorage.getItem('dreamLog'); if (dl) setDreamLog(JSON.parse(dl));
      const ct = await AsyncStorage.getItem('chronotype'); if (ct) setChronotype(ct);
    })();
  }, []));

  const toggleCheck = async (key) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated); await AsyncStorage.setItem('sleepChecklist_' + todayKey, JSON.stringify(updated));
  };

  const saveDream = async () => {
    if (!newDream.trim()) return;
    const updated = [{ text: newDream.trim(), date: todayKey, id: Date.now() }, ...dreamLog];
    setDreamLog(updated); await AsyncStorage.setItem('dreamLog', JSON.stringify(updated)); setNewDream('');
  };

  const setChronotypeSave = async (id) => {
    setChronotype(id); await AsyncStorage.setItem('chronotype', id);
  };

  const checkDone = PRE_SLEEP.filter(i => checklist[i.key]).length;
  const currentType = CHRONOTYPES.find(c => c.id === chronotype);
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>🌙 Sleep</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['checklist','✅ Routine'],['chronotype','🦁 Type'],['dreams','💭 Dreams']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {tab === 'checklist' && (
          <>
            {currentType && (
              <View style={[s.typeCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={[s.typeCardText, { color: C.purple }]}>You're a {currentType.name} — Ideal bedtime: {currentType.bed}</Text>
              </View>
            )}
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>🌙 Pre-Sleep Routine</Text>
                <Text style={[s.badge, { backgroundColor: C.purpleSoft, color: C.purple }]}>{checkDone}/{PRE_SLEEP.length}</Text>
              </View>
              {PRE_SLEEP.map(item => (
                <TouchableOpacity key={item.key} style={s.checkRow} onPress={() => toggleCheck(item.key)}>
                  <View style={[s.check, checklist[item.key] && { backgroundColor: C.purple, borderColor: C.purple }]}>
                    {checklist[item.key] && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <Text style={s.checkEmoji}>{item.emoji}</Text>
                  <Text style={[s.checkLabel, { color: checklist[item.key] ? C.muted : C.text, textDecorationLine: checklist[item.key] ? 'line-through' : 'none' }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.tipsCard, { backgroundColor: C.surface }]}>
              <Text style={[s.tipsTitle, { color: C.text }]}>🧠 Sleep Science Tips</Text>
              {[
                'Keep bedroom cool (~18°C). Core temp must drop to initiate sleep.',
                'Consistent wake time (even weekends) is the #1 sleep improvement.',
                'Avoid caffeine after 2 PM — half-life is 5–7 hours.',
                'Alcohol sedates but destroys REM sleep quality.',
                'Blue light delays melatonin by up to 2 hours. Use night mode.',
              ].map((tip, i) => (
                <Text key={i} style={[s.tipItem, { color: C.muted }]}>• {tip}</Text>
              ))}
            </View>
          </>
        )}

        {tab === 'chronotype' && (
          <>
            <Text style={[s.ctIntro, { color: C.muted }]}>Your chronotype is your biological sleep preference. It determines your peak performance hours. Select the one that best describes you:</Text>
            {CHRONOTYPES.map(ct => (
              <TouchableOpacity key={ct.id} style={[s.ctCard, chronotype === ct.id && { borderColor: C.accent, backgroundColor: C.accentSoft }]} onPress={() => setChronotypeSave(ct.id)} activeOpacity={0.8}>
                <Text style={s.ctName}>{ct.name}</Text>
                <Text style={[s.ctDesc, { color: C.muted }]}>{ct.desc}</Text>
                <View style={s.ctMeta}>
                  <Text style={[s.ctChip, { backgroundColor: C.greenSoft, color: C.green }]}>⚡ Peak: {ct.peak}</Text>
                  <Text style={[s.ctChip, { backgroundColor: C.purpleSoft, color: C.purple }]}>😴 Bed: {ct.bed}</Text>
                </View>
                {chronotype === ct.id && <Text style={[s.ctSelected, { color: C.accent }]}>✓ Your type</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {tab === 'dreams' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>💭 Dream Journal</Text>
              <Text style={[s.hint, { color: C.muted }]}>Log dreams immediately after waking. Over time patterns emerge.</Text>
              <TextInput style={s.dreamInput} placeholder="What did you dream about?" placeholderTextColor={C.muted} value={newDream} onChangeText={setNewDream} multiline numberOfLines={4} />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.purple }]} onPress={saveDream}><Text style={s.saveBtnText}>Save Dream</Text></TouchableOpacity>
            </View>
            {dreamLog.map(d => (
              <View key={d.id} style={s.dreamCard}>
                <Text style={[s.dreamDate, { color: C.purple }]}>{d.date}</Text>
                <Text style={[s.dreamText, { color: C.text }]}>{d.text}</Text>
              </View>
            ))}
            {dreamLog.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 30 }]}>No dreams logged yet.</Text>}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 16 },
  tabScroll: { marginBottom: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabText: { fontWeight: '600', fontSize: 13 },
  typeCard: { borderRadius: 12, padding: 12, marginBottom: 14 },
  typeCardText: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  checkEmoji: { fontSize: 18 },
  checkLabel: { flex: 1, fontSize: 14 },
  tipsCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  tipsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tipItem: { fontSize: 13, lineHeight: 22, marginBottom: 4 },
  ctIntro: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  ctCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  ctName: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  ctDesc: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  ctMeta: { flexDirection: 'row', gap: 8 },
  ctChip: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  ctSelected: { fontWeight: '700', marginTop: 8, fontSize: 14 },
  hint: { fontSize: 13, marginBottom: 10 },
  dreamInput: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: 10 },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dreamCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  dreamDate: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  dreamText: { fontSize: 14, lineHeight: 22 },
  empty: { fontSize: 14, paddingVertical: 20 },
});
