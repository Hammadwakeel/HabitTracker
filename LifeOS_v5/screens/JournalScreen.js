import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayJournal, saveTodayJournal, getRecentJournals } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';

const MOODS = ['😞','😕','😐','😊','😄'];

export default function JournalScreen() {
  const { C } = useTheme();
  const [entry, setEntry] = useState({ wins: '', grateful: '', tomorrow: '', mood: null, trigger: '', decision: '' });
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('today');

  useFocusEffect(useCallback(() => {
    (async () => {
      const e = await getTodayJournal(); setEntry(e);
      const r = await getRecentJournals(7); setRecent(r);
    })();
  }, []));

  const save = async () => {
    await saveTodayJournal(entry);
    await addXP(XP_REWARDS.journal);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    const r = await getRecentJournals(7); setRecent(r);
  };

  const s = makeStyles(C);
  const fields = [
    { key: 'wins', title: '🏆 Today\'s biggest win', placeholder: 'Even something small counts...' },
    { key: 'grateful', title: '🙏 One thing I\'m grateful for', placeholder: 'What went right today?' },
    { key: 'tomorrow', title: '🎯 Tomorrow\'s #1 priority', placeholder: 'The one thing that must get done...' },
    { key: 'trigger', title: '⚡ What drained my energy today?', placeholder: 'Optional — find patterns over time...' },
    { key: 'decision', title: '🧠 Important decision made', placeholder: 'Optional — log decisions to review later...' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Daily Journal</Text>

        <View style={s.tabs}>
          {['today','history'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{t === 'today' ? '✏️ Today' : '📚 History'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'today' ? (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>How are you feeling?</Text>
              <View style={s.moodRow}>
                {MOODS.map((m, i) => (
                  <TouchableOpacity key={i} style={[s.moodBtn, entry.mood === i + 1 && { backgroundColor: C.accentSoft }]} onPress={() => setEntry(p => ({ ...p, mood: i + 1 }))}>
                    <Text style={{ fontSize: 30 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {fields.map(f => (
              <View key={f.key} style={s.card}>
                <Text style={s.cardTitle}>{f.title}</Text>
                <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={C.muted} value={entry[f.key]} onChangeText={v => setEntry(p => ({ ...p, [f.key]: v }))} multiline numberOfLines={3} />
              </View>
            ))}
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: saved ? C.green : C.accent }]} onPress={save} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>{saved ? `✓ Saved! +${XP_REWARDS.journal}XP` : 'Save Entry'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          recent.length === 0 ? (
            <View style={s.empty}><Text style={{ fontSize: 48 }}>📓</Text><Text style={[s.emptyText, { color: C.muted }]}>No entries yet. Start writing today!</Text></View>
          ) : (
            recent.map(r => (
              <View key={r.date} style={s.histCard}>
                <View style={s.histHeader}>
                  <Text style={[s.histDate, { color: C.accent }]}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                  {r.mood && <Text style={{ fontSize: 22 }}>{MOODS[r.mood - 1]}</Text>}
                </View>
                {r.wins ? <View style={s.histSection}><Text style={[s.histLabel, { color: C.muted }]}>🏆 Win</Text><Text style={[s.histText, { color: C.text }]}>{r.wins}</Text></View> : null}
                {r.grateful ? <View style={s.histSection}><Text style={[s.histLabel, { color: C.muted }]}>🙏 Grateful</Text><Text style={[s.histText, { color: C.text }]}>{r.grateful}</Text></View> : null}
                {r.tomorrow ? <View style={s.histSection}><Text style={[s.histLabel, { color: C.muted }]}>🎯 Priority</Text><Text style={[s.histText, { color: C.text }]}>{r.tomorrow}</Text></View> : null}
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabText: { fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { padding: 8, borderRadius: 10 },
  input: { color: C.text, fontSize: 14, lineHeight: 22, backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  histCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  histDate: { fontWeight: '700', fontSize: 14 },
  histSection: { marginBottom: 8 },
  histLabel: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  histText: { fontSize: 13, lineHeight: 20 },
});
