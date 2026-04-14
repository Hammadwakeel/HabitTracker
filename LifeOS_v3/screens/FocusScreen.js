import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayFocus, saveTodayFocus } from '../utils/storage';

const PROJECTS = ['Sarah Mitchell', 'CUIConnect', 'Freelance / Upwork', 'Learning / Courses', 'Other'];

export default function FocusScreen() {
  const { C } = useTheme();
  const [focus, setFocus] = useState({ pomodorosDone: 0, distractions: 0, projects: {} });
  const [tab, setTab] = useState('projects');

  useFocusEffect(useCallback(() => {
    (async () => { const f = await getTodayFocus(); setFocus(f); })();
  }, []));

  const save = async (updated) => { setFocus(updated); await saveTodayFocus(updated); };

  const addProjectTime = async (project, mins) => {
    const projects = { ...focus.projects, [project]: (focus.projects?.[project] || 0) + mins };
    await save({ ...focus, projects });
  };

  const logDistraction = async () => {
    await save({ ...focus, distractions: (focus.distractions || 0) + 1 });
  };

  const totalMins = Object.values(focus.projects || {}).reduce((a, b) => a + b, 0);
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>⏱ Focus</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['projects','📁 Projects'],['distract','🚫 Distractions'],['audit','📊 Time Audit']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Projects Tab */}
        {tab === 'projects' && (
          <>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>📁 Project Time Today</Text>
                <Text style={[s.bigNum, { color: C.accent }]}>{Math.floor(totalMins / 60)}h {totalMins % 60}m</Text>
              </View>
              {PROJECTS.map(project => {
                const mins = focus.projects?.[project] || 0;
                const pct = totalMins > 0 ? (mins / totalMins) * 100 : 0;
                return (
                  <View key={project} style={s.projectRow}>
                    <View style={s.projectInfo}>
                      <Text style={[s.projectName, { color: C.text }]}>{project}</Text>
                      <View style={s.miniBarBg}>
                        <View style={[s.miniBarFill, { width: `${pct}%`, backgroundColor: C.accent }]} />
                      </View>
                      <Text style={[s.projectMins, { color: C.muted }]}>{Math.floor(mins / 60)}h {mins % 60}m</Text>
                    </View>
                    <View style={s.projectBtns}>
                      {[30, 60, 90].map(m => (
                        <TouchableOpacity key={m} style={[s.addMinsBtn, { backgroundColor: C.accentSoft }]} onPress={() => addProjectTime(project, m)}>
                          <Text style={[s.addMinsBtnText, { color: C.accent }]}>+{m}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            {totalMins > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Today's Focus Split</Text>
                {PROJECTS.filter(p => focus.projects?.[p] > 0).map(p => {
                  const mins = focus.projects[p];
                  const pct = Math.round((mins / totalMins) * 100);
                  return (
                    <View key={p} style={s.splitRow}>
                      <Text style={[s.splitName, { color: C.text }]}>{p}</Text>
                      <View style={s.splitBarBg}><View style={[s.splitBarFill, { width: `${pct}%`, backgroundColor: C.accent }]} /></View>
                      <Text style={[s.splitPct, { color: C.accent }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Distractions Tab */}
        {tab === 'distract' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>🚫 Distraction Log</Text>
            <Text style={[s.hint, { color: C.muted }]}>Every time you want to open social media or get distracted — tap instead of giving in.</Text>
            <View style={s.distractCenter}>
              <Text style={[s.distractNum, { color: focus.distractions > 10 ? C.red : focus.distractions > 5 ? C.yellow : C.green }]}>{focus.distractions || 0}</Text>
              <Text style={[s.distractLabel, { color: C.muted }]}>urges resisted today</Text>
            </View>
            <TouchableOpacity style={[s.distractBtn, { backgroundColor: C.accentSoft }]} onPress={logDistraction} activeOpacity={0.7}>
              <Text style={[s.distractBtnText, { color: C.accent }]}>💪 I Resisted a Distraction</Text>
            </TouchableOpacity>
            {focus.distractions >= 5 && <Text style={[s.distractMsg, { color: C.green }]}>Wow! {focus.distractions} urges resisted. Your focus is strong today.</Text>}
            <View style={[s.tipCard, { backgroundColor: C.surface }]}>
              <Text style={[s.tipTitle, { color: C.text }]}>💡 When you feel distracted:</Text>
              <Text style={[s.tipText, { color: C.muted }]}>1. Tap this button instead of giving in{'\n'}2. Take 3 deep breaths{'\n'}3. Ask: "Is what I'm doing right now moving me forward?"{'\n'}4. Return to your task</Text>
            </View>
          </View>
        )}

        {/* Time Audit Tab */}
        {tab === 'audit' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📊 Weekly Time Audit</Text>
            <Text style={[s.hint, { color: C.muted }]}>Plan your week Monday, review Friday. Where did your time actually go?</Text>
            {['Deep Work', 'Meetings/Calls', 'Learning', 'Admin/Email', 'Exercise', 'Prayer/Deen', 'Family Time', 'Wasted Time'].map(area => {
              const planned = focus.audit_planned?.[area] || 0;
              const actual = focus.audit_actual?.[area] || 0;
              return (
                <View key={area} style={s.auditRow}>
                  <Text style={[s.auditArea, { color: C.text }]}>{area}</Text>
                  <View style={s.auditInputs}>
                    <View style={s.auditCol}>
                      <Text style={[s.auditLabel, { color: C.muted }]}>Plan</Text>
                      <TextInput
                        style={s.auditInput}
                        placeholder="h" placeholderTextColor={C.muted}
                        keyboardType="numeric" value={planned > 0 ? String(planned) : ''}
                        onChangeText={v => save({ ...focus, audit_planned: { ...focus.audit_planned, [area]: parseInt(v) || 0 } })}
                      />
                    </View>
                    <View style={s.auditCol}>
                      <Text style={[s.auditLabel, { color: C.muted }]}>Actual</Text>
                      <TextInput
                        style={s.auditInput}
                        placeholder="h" placeholderTextColor={C.muted}
                        keyboardType="numeric" value={actual > 0 ? String(actual) : ''}
                        onChangeText={v => save({ ...focus, audit_actual: { ...focus.audit_actual, [area]: parseInt(v) || 0 } })}
                      />
                    </View>
                    {actual > 0 && planned > 0 && (
                      <Text style={[s.auditDiff, { color: actual <= planned ? C.green : C.red }]}>
                        {actual <= planned ? '✓' : `+${actual - planned}h`}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
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
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bigNum: { fontSize: 22, fontWeight: '800' },
  projectRow: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  projectInfo: { marginBottom: 8 },
  projectName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  miniBarBg: { height: 4, backgroundColor: C.border, borderRadius: 99, marginBottom: 4 },
  miniBarFill: { height: 4, borderRadius: 99 },
  projectMins: { fontSize: 12 },
  projectBtns: { flexDirection: 'row', gap: 8 },
  addMinsBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addMinsBtnText: { fontWeight: '700', fontSize: 13 },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  splitName: { width: 100, fontSize: 12, fontWeight: '600' },
  splitBarBg: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 99 },
  splitBarFill: { height: 8, borderRadius: 99 },
  splitPct: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  hint: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  distractCenter: { alignItems: 'center', paddingVertical: 20 },
  distractNum: { fontSize: 72, fontWeight: '800' },
  distractLabel: { fontSize: 16, marginTop: 4 },
  distractBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  distractBtnText: { fontWeight: '700', fontSize: 16 },
  distractMsg: { textAlign: 'center', fontWeight: '600', fontSize: 14, marginBottom: 14 },
  tipCard: { borderRadius: 12, padding: 14 },
  tipTitle: { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  tipText: { fontSize: 13, lineHeight: 22, color: C.muted },
  auditRow: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  auditArea: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  auditInputs: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  auditCol: { alignItems: 'center' },
  auditLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  auditInput: { backgroundColor: C.surface, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.border, color: C.text, width: 50, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  auditDiff: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
});
