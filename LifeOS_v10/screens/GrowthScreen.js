import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getXPData, saveXPData } from '../utils/storage';
import { getLevelInfo, BADGES, LEVELS } from '../utils/xp';

const LIFE_AREAS = ['Health', 'Career', 'Finance', 'Relationships', 'Learning', 'Faith', 'Fun', 'Purpose'];

export default function GrowthScreen() {
  const { C } = useTheme();
  const [xpData, setXpData] = useState({ total: 0, level: 1, badges: [], sprint: null, bucketList: [], lifeWheel: {} });
  const [tab, setTab] = useState('xp');
  const [newItem, setNewItem] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => { const d = await getXPData(); setXpData(d); })();
  }, []));

  const save = async (updated) => { setXpData(updated); await saveXPData(updated); };

  const { current, next, progress } = getLevelInfo(xpData.total);

  const setLifeWheel = async (area, val) => {
    const updated = { ...xpData, lifeWheel: { ...xpData.lifeWheel, [area]: val } };
    await save(updated);
  };

  const addBucketItem = async () => {
    if (!newItem.trim()) return;
    const updated = { ...xpData, bucketList: [...(xpData.bucketList || []), { text: newItem.trim(), done: false }] };
    await save(updated); setNewItem('');
  };

  const toggleBucket = async (idx) => {
    const list = [...(xpData.bucketList || [])];
    list[idx] = { ...list[idx], done: !list[idx].done };
    await save({ ...xpData, bucketList: list });
  };

  const setSprint = async () => {
    if (!sprintGoal.trim()) return;
    const sprint = { goal: sprintGoal.trim(), startDate: new Date().toISOString().split('T')[0], milestones: [] };
    await save({ ...xpData, sprint }); setSprintGoal('');
  };

  const earnedBadges = BADGES.filter(b => xpData.badges?.includes(b.id));
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>🎮 Growth & Goals</Text>

        {/* Tab Nav */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['xp','⚡ XP'],['wheel','🎯 Life Wheel'],['sprint','🏁 Sprint'],['bucket','🪣 Bucket List']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* XP Tab */}
        {tab === 'xp' && (
          <>
            <View style={[s.levelCard, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
              <Text style={s.levelEmoji}>{current.emoji}</Text>
              <Text style={[s.levelTitle, { color: C.accent }]}>Level {current.level} — {current.title}</Text>
              <Text style={[s.xpTotal, { color: C.text }]}>{xpData.total} XP total</Text>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${progress}%`, backgroundColor: C.accent }]} />
              </View>
              {next && <Text style={[s.xpNext, { color: C.muted }]}>{next.minXP - xpData.total} XP to Level {next.level} — {next.title} {next.emoji}</Text>}
            </View>

            {/* All Levels */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Level Roadmap</Text>
              {LEVELS.map(lv => (
                <View key={lv.level} style={[s.levelRow, xpData.total >= lv.minXP && { opacity: 1 }, xpData.total < lv.minXP && { opacity: 0.4 }]}>
                  <Text style={s.levelRowEmoji}>{lv.emoji}</Text>
                  <View style={s.levelRowInfo}>
                    <Text style={[s.levelRowTitle, { color: C.text }]}>Lv.{lv.level} — {lv.title}</Text>
                    <Text style={[s.levelRowXP, { color: C.muted }]}>{lv.minXP} XP required</Text>
                  </View>
                  {xpData.total >= lv.minXP && <Text style={[s.levelUnlocked, { color: C.green }]}>✓</Text>}
                </View>
              ))}
            </View>

            {/* Badges */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🏅 Badges</Text>
              <View style={s.badgeGrid}>
                {BADGES.map(b => {
                  const earned = xpData.badges?.includes(b.id);
                  return (
                    <View key={b.id} style={[s.badgeCard, { backgroundColor: earned ? C.goldSoft : C.surface, borderColor: earned ? C.gold + '44' : C.border, opacity: earned ? 1 : 0.5 }]}>
                      <Text style={s.badgeEmoji}>{b.emoji}</Text>
                      <Text style={[s.badgeTitle, { color: earned ? C.text : C.muted }]}>{b.title}</Text>
                      <Text style={[s.badgeDesc, { color: C.muted }]}>{b.desc}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Life Wheel Tab */}
        {tab === 'wheel' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Rate Your Life Areas (1–10)</Text>
            <Text style={[s.hint, { color: C.muted }]}>Be honest. This is your monthly check-in.</Text>
            {LIFE_AREAS.map(area => {
              const val = xpData.lifeWheel?.[area] || 0;
              const color = val >= 8 ? C.green : val >= 5 ? C.yellow : C.red;
              return (
                <View key={area} style={s.wheelRow}>
                  <Text style={[s.wheelArea, { color: C.text }]}>{area}</Text>
                  <View style={s.wheelDots}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <TouchableOpacity key={n} style={[s.wheelDot, { backgroundColor: val >= n ? color : C.border }]} onPress={() => setLifeWheel(area, n)} />
                    ))}
                  </View>
                  <Text style={[s.wheelVal, { color }]}>{val || '-'}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 90-Day Sprint Tab */}
        {tab === 'sprint' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>🏁 90-Day Goal Sprint</Text>
            {xpData.sprint ? (
              <>
                <View style={[s.sprintActive, { backgroundColor: C.accentSoft }]}>
                  <Text style={[s.sprintGoalText, { color: C.accent }]}>🎯 {xpData.sprint.goal}</Text>
                  <Text style={[s.sprintStart, { color: C.muted }]}>Started: {xpData.sprint.startDate}</Text>
                </View>
                <TouchableOpacity style={[s.clearBtn, { backgroundColor: C.redSoft }]} onPress={() => save({ ...xpData, sprint: null })}>
                  <Text style={[s.clearBtnText, { color: C.red }]}>Clear Sprint</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[s.hint, { color: C.muted }]}>What's your one big goal for the next 90 days?</Text>
                <TextInput style={s.input} placeholder="e.g. Launch Sarah Mitchell live and get first client..." placeholderTextColor={C.muted} value={sprintGoal} onChangeText={setSprintGoal} multiline />
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.accent }]} onPress={setSprint}>
                  <Text style={s.actionBtnText}>Set Sprint Goal</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Bucket List Tab */}
        {tab === 'bucket' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>🪣 Bucket List</Text>
            <View style={s.addRow}>
              <TextInput style={[s.addInput, { flex: 1 }]} placeholder="Add something to do in life..." placeholderTextColor={C.muted} value={newItem} onChangeText={setNewItem} />
              <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent }]} onPress={addBucketItem}>
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            {(xpData.bucketList || []).length === 0 && <Text style={[s.empty, { color: C.muted }]}>No items yet. Dream big!</Text>}
            {(xpData.bucketList || []).map((item, idx) => (
              <TouchableOpacity key={idx} style={s.bucketItem} onPress={() => toggleBucket(idx)}>
                <View style={[s.bucketCheck, item.done && { backgroundColor: C.green, borderColor: C.green }]}>
                  {item.done && <Text style={s.checkMark}>✓</Text>}
                </View>
                <Text style={[s.bucketText, { color: item.done ? C.muted : C.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 16 },
  tabScroll: { marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabText: { fontWeight: '600', fontSize: 13 },
  levelCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, alignItems: 'center' },
  levelEmoji: { fontSize: 48, marginBottom: 8 },
  levelTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  xpTotal: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  xpBarBg: { width: '100%', height: 8, backgroundColor: C.border, borderRadius: 99, marginBottom: 8 },
  xpBarFill: { height: 8, borderRadius: 99 },
  xpNext: { fontSize: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  levelRowEmoji: { fontSize: 22 },
  levelRowInfo: { flex: 1 },
  levelRowTitle: { fontSize: 14, fontWeight: '600' },
  levelRowXP: { fontSize: 12, marginTop: 2 },
  levelUnlocked: { fontSize: 18, fontWeight: '800' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '47%', borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center' },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
  badgeDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  hint: { fontSize: 13, marginBottom: 14 },
  wheelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  wheelArea: { width: 80, fontSize: 13, fontWeight: '600' },
  wheelDots: { flex: 1, flexDirection: 'row', gap: 4 },
  wheelDot: { flex: 1, height: 20, borderRadius: 4 },
  wheelVal: { width: 20, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  sprintActive: { borderRadius: 12, padding: 16, marginBottom: 12 },
  sprintGoalText: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  sprintStart: { fontSize: 12 },
  clearBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  clearBtnText: { fontWeight: '700' },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  actionBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  addInput: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  bucketItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  bucketCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  bucketText: { flex: 1, fontSize: 14 },
});
