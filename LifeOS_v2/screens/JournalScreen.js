import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getTodayJournal, saveTodayJournal, getRecentJournals } from '../utils/storage';

const MOODS = ['😞','😕','😐','😊','😄'];

export default function JournalScreen() {
  const [entry, setEntry] = useState({ wins: '', grateful: '', tomorrow: '', mood: null });
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('today'); // 'today' | 'history'

  useFocusEffect(useCallback(() => {
    (async () => {
      const e = await getTodayJournal();
      setEntry(e);
      const r = await getRecentJournals(7);
      setRecent(r);
    })();
  }, []));

  const updateField = (key, val) => setEntry(p => ({ ...p, [key]: val }));

  const save = async () => {
    await saveTodayJournal(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const r = await getRecentJournals(7);
    setRecent(r);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={s.heading}>Daily Journal</Text>
        <Text style={s.sub}>30 seconds. That's all it takes.</Text>

        {/* Tab Toggle */}
        <View style={s.tabs}>
          {['today', 'history'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'today' ? "✏️ Today" : "📚 History"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'today' ? (
          <>
            {/* Mood */}
            <View style={s.card}>
              <Text style={s.cardTitle}>How are you feeling right now?</Text>
              <View style={s.moodRow}>
                {MOODS.map((m, i) => (
                  <TouchableOpacity key={i} style={[s.moodBtn, entry.mood === i + 1 && s.moodActive]} onPress={() => updateField('mood', i + 1)}>
                    <Text style={s.moodEmoji}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Win */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🏆 Today's biggest win</Text>
              <TextInput
                style={s.input}
                placeholder="Even something small counts..."
                placeholderTextColor={COLORS.muted}
                value={entry.wins}
                onChangeText={v => updateField('wins', v)}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Grateful */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🙏 One thing I'm grateful for</Text>
              <TextInput
                style={s.input}
                placeholder="What went right today?"
                placeholderTextColor={COLORS.muted}
                value={entry.grateful}
                onChangeText={v => updateField('grateful', v)}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Tomorrow */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🎯 Tomorrow's #1 priority</Text>
              <TextInput
                style={s.input}
                placeholder="The one thing that must get done..."
                placeholderTextColor={COLORS.muted}
                value={entry.tomorrow}
                onChangeText={v => updateField('tomorrow', v)}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity style={[s.saveBtn, saved && s.saveBtnDone]} onPress={save} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>{saved ? '✓ Saved!' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {recent.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>📓</Text>
                <Text style={s.emptyText}>No journal entries yet. Start writing today!</Text>
              </View>
            ) : (
              recent.map((r) => (
                <View key={r.date} style={s.historyCard}>
                  <View style={s.historyHeader}>
                    <Text style={s.historyDate}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                    {r.mood && <Text style={s.historyMood}>{MOODS[r.mood - 1]}</Text>}
                  </View>
                  {r.wins ? <View style={s.historySection}><Text style={s.historyLabel}>🏆 Win</Text><Text style={s.historyText}>{r.wins}</Text></View> : null}
                  {r.grateful ? <View style={s.historySection}><Text style={s.historyLabel}>🙏 Grateful</Text><Text style={s.historyText}>{r.grateful}</Text></View> : null}
                  {r.tomorrow ? <View style={s.historySection}><Text style={s.historyLabel}>🎯 Priority</Text><Text style={s.historyText}>{r.tomorrow}</Text></View> : null}
                </View>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginTop: 10 },
  sub: { fontSize: 14, color: COLORS.muted, marginBottom: 20, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { padding: 8, borderRadius: 10, alignItems: 'center' },
  moodActive: { backgroundColor: COLORS.accentSoft },
  moodEmoji: { fontSize: 30 },
  input: { color: COLORS.text, fontSize: 14, lineHeight: 22, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border, minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveBtnDone: { backgroundColor: COLORS.green },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15, textAlign: 'center' },
  historyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyDate: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },
  historyMood: { fontSize: 22 },
  historySection: { marginBottom: 10 },
  historyLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700', marginBottom: 3 },
  historyText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
});
