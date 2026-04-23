import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayFocus, saveTodayFocus, getProfile, saveProfile } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';

const PROJECT_COLORS = ['#6C63FF','#4ADE80','#FB923C','#F59E0B','#F87171','#38BDF8','#8B5CF6','#10B981'];

export default function FocusScreen() {
  const { C } = useTheme();
  const [focus, setFocus] = useState({ pomodorosDone: 0, distractions: 0, projects: {} });
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState('');
  const [studyTimer, setStudyTimer] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef(null);

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const loadData = async () => {
    const f = await getTodayFocus(); setFocus(f);
    const profile = await getProfile();
    if (profile?.projects?.length > 0) setProjects(profile.projects);
    else setProjects([
      { id: 1, name: 'Learning / Courses', color: '#6C63FF' },
      { id: 2, name: 'Freelance Work', color: '#4ADE80' },
      { id: 3, name: 'Personal Project', color: '#FB923C' },
    ]);
  };

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setStudyTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            if (!isBreak) addXP(XP_REWARDS.pomodoro);
            setIsBreak(b => !b);
            return isBreak ? 25 * 60 : 5 * 60;
          }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerRunning, isBreak]);

  const save = async (updated) => { setFocus(updated); await saveTodayFocus(updated); };

  const addProjectTime = async (projectName, mins) => {
    const updated = { ...focus, projects: { ...focus.projects, [projectName]: (focus.projects?.[projectName] || 0) + mins } };
    await save(updated);
  };

  const addProject = async () => {
    if (!newProject.trim()) return;
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    const newP = { id: Date.now(), name: newProject.trim(), color };
    const updated = [...projects, newP];
    setProjects(updated);
    const profile = await getProfile();
    await saveProfile({ ...profile, projects: updated });
    setNewProject('');
  };

  const deleteProject = (id) => {
    Alert.alert('Delete Project', 'Remove this project?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        const profile = await getProfile();
        await saveProfile({ ...profile, projects: updated });
      }},
    ]);
  };

  const logDistraction = async () => {
    await save({ ...focus, distractions: (focus.distractions || 0) + 1 });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalMins = Object.values(focus.projects || {}).reduce((a, b) => a + b, 0);
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>⏱ Focus</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['projects','📁 Projects'],['timer','⏱ Timer'],['distract','🚫 Focus'],['audit','📊 Audit']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <>
            {/* Add Project */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📁 Manage Projects</Text>
              <View style={s.addRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Add a new project..."
                  placeholderTextColor={C.muted}
                  value={newProject}
                  onChangeText={setNewProject}
                  onSubmitEditing={addProject}
                />
                <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent }]} onPress={addProject}>
                  <Text style={s.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {projects.map(p => (
                <View key={p.id} style={[s.projectChip, { borderLeftColor: p.color }]}>
                  <View style={[s.projectDot, { backgroundColor: p.color }]} />
                  <Text style={[s.projectChipName, { color: C.text }]}>{p.name}</Text>
                  <TouchableOpacity onPress={() => deleteProject(p.id)}>
                    <Text style={[{ color: C.red, fontSize: 16, paddingHorizontal: 4 }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {projects.length === 0 && <Text style={[s.empty, { color: C.muted }]}>No projects yet. Add one above.</Text>}
            </View>

            {/* Time Tracker */}
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>⏱ Time Logged Today</Text>
                <Text style={[s.bigNum, { color: C.accent }]}>{Math.floor(totalMins / 60)}h {totalMins % 60}m</Text>
              </View>
              {projects.map(p => {
                const mins = focus.projects?.[p.name] || 0;
                const pct = totalMins > 0 ? (mins / totalMins) * 100 : 0;
                return (
                  <View key={p.id} style={s.projectTimeRow}>
                    <View style={[s.projectDot, { backgroundColor: p.color }]} />
                    <View style={{ flex: 1 }}>
                      <View style={s.row}>
                        <Text style={[s.projectTimeName, { color: C.text }]}>{p.name}</Text>
                        <Text style={[s.projectTimeMins, { color: p.color }]}>
                          {Math.floor(mins / 60)}h {mins % 60}m
                        </Text>
                      </View>
                      <View style={[s.barBg, { backgroundColor: C.border }]}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: p.color }]} />
                      </View>
                    </View>
                    <View style={s.timeBtns}>
                      {[30, 60].map(m => (
                        <TouchableOpacity key={m} style={[s.timeBtn, { backgroundColor: p.color + '22' }]} onPress={() => addProjectTime(p.name, m)}>
                          <Text style={[s.timeBtnText, { color: p.color }]}>+{m}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* TIMER TAB */}
        {tab === 'timer' && (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.cardTitle}>⏱ Pomodoro Timer</Text>
              <View style={[s.modeBadge, { backgroundColor: isBreak ? C.greenSoft : C.accentSoft }]}>
                <Text style={[s.modeBadgeText, { color: isBreak ? C.green : C.accent }]}>{isBreak ? '☕ Break' : '🔥 Focus'}</Text>
              </View>
            </View>
            <Text style={[s.timerDisplay, { color: C.text }]}>{fmt(studyTimer)}</Text>
            <View style={s.timerBtns}>
              <TouchableOpacity style={[s.timerBtn, { backgroundColor: timerRunning ? C.redSoft : C.accentSoft }]} onPress={() => setTimerRunning(r => !r)}>
                <Text style={[s.timerBtnText, { color: timerRunning ? C.red : C.accent }]}>{timerRunning ? '⏸ Pause' : '▶ Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.timerBtn, { backgroundColor: C.surface }]} onPress={() => { setTimerRunning(false); setStudyTimer(25 * 60); setIsBreak(false); }}>
                <Text style={[s.timerBtnText, { color: C.muted }]}>↺ Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={[s.timerHint, { color: C.muted }]}>25 min focus → 5 min break. +{XP_REWARDS.pomodoro}XP per session.</Text>
          </View>
        )}

        {/* DISTRACTION TAB */}
        {tab === 'distract' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>🚫 Distraction Log</Text>
            <Text style={[s.hint, { color: C.muted }]}>Every time you feel like opening social media or getting distracted — tap this instead.</Text>
            <View style={s.distractCenter}>
              <Text style={[s.distractNum, { color: (focus.distractions || 0) > 10 ? C.red : (focus.distractions || 0) > 5 ? C.yellow : C.green }]}>
                {focus.distractions || 0}
              </Text>
              <Text style={[s.distractLabel, { color: C.muted }]}>urges resisted today</Text>
            </View>
            <TouchableOpacity style={[s.distractBtn, { backgroundColor: C.accentSoft }]} onPress={logDistraction}>
              <Text style={[s.distractBtnText, { color: C.accent }]}>💪 I Resisted a Distraction</Text>
            </TouchableOpacity>
            {(focus.distractions || 0) >= 5 && (
              <Text style={[s.distractMsg, { color: C.green }]}>🔥 {focus.distractions} urges resisted. Your focus is exceptional!</Text>
            )}
            <View style={[s.tipCard, { backgroundColor: C.surface }]}>
              <Text style={[s.tipTitle, { color: C.text }]}>💡 When you feel distracted:</Text>
              <Text style={[s.tipText, { color: C.muted }]}>
                1. Tap this button instead of giving in{'\n'}
                2. Take 3 slow deep breaths{'\n'}
                3. Ask: "Is this moving me forward?"{'\n'}
                4. Return to your task
              </Text>
            </View>
          </View>
        )}

        {/* AUDIT TAB */}
        {tab === 'audit' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📊 Weekly Time Audit</Text>
            <Text style={[s.hint, { color: C.muted }]}>Plan Monday, review Friday. Where does your time actually go?</Text>
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
                        style={[s.auditInput, { color: C.text, backgroundColor: C.surface, borderColor: C.border }]}
                        placeholder="h" placeholderTextColor={C.muted}
                        keyboardType="numeric" value={planned > 0 ? String(planned) : ''}
                        onChangeText={v => save({ ...focus, audit_planned: { ...focus.audit_planned, [area]: parseInt(v) || 0 } })}
                      />
                    </View>
                    <View style={s.auditCol}>
                      <Text style={[s.auditLabel, { color: C.muted }]}>Actual</Text>
                      <TextInput
                        style={[s.auditInput, { color: C.text, backgroundColor: C.surface, borderColor: C.border }]}
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
  tabScroll: { marginBottom: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabText: { fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bigNum: { fontSize: 22, fontWeight: '800' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  projectChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderLeftWidth: 4, backgroundColor: C.surface, marginBottom: 8 },
  projectDot: { width: 10, height: 10, borderRadius: 5 },
  projectChipName: { flex: 1, fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  projectTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  projectTimeName: { fontSize: 13, fontWeight: '600', flex: 1 },
  projectTimeMins: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 5, borderRadius: 99, marginTop: 5 },
  barFill: { height: 5, borderRadius: 99 },
  timeBtns: { flexDirection: 'row', gap: 6 },
  timeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  timeBtnText: { fontWeight: '700', fontSize: 12 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  modeBadgeText: { fontWeight: '700', fontSize: 12 },
  timerDisplay: { fontSize: 64, fontWeight: '800', textAlign: 'center', marginVertical: 16, letterSpacing: 3 },
  timerBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  timerBtnText: { fontWeight: '700', fontSize: 16 },
  timerHint: { fontSize: 12, textAlign: 'center' },
  hint: { fontSize: 13, marginBottom: 16, lineHeight: 20, color: C.muted },
  distractCenter: { alignItems: 'center', paddingVertical: 20 },
  distractNum: { fontSize: 72, fontWeight: '800' },
  distractLabel: { fontSize: 16, marginTop: 4 },
  distractBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  distractBtnText: { fontWeight: '700', fontSize: 16 },
  distractMsg: { textAlign: 'center', fontWeight: '600', fontSize: 14, marginBottom: 14 },
  tipCard: { borderRadius: 12, padding: 14 },
  tipTitle: { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  tipText: { fontSize: 13, lineHeight: 22 },
  auditRow: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  auditArea: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  auditInputs: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  auditCol: { alignItems: 'center' },
  auditLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  auditInput: { borderRadius: 8, padding: 8, borderWidth: 1, width: 50, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  auditDiff: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
});
