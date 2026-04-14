import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Linking, Modal, Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { EXERCISES, MUSCLE_GROUPS, TIERS, WEEKLY_PLANS } from '../data/fitness';
import { addXP } from '../utils/xp';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_ICONS = { home: '🏠', outdoor: '🌳', gym: '🏋️' };

export default function FitnessScreen() {
  const { C } = useTheme();
  const [tier, setTier] = useState('beginner');
  const [muscle, setMuscle] = useState('abs');
  const [location, setLocation] = useState('home');
  const [tab, setTab] = useState('exercises'); // exercises | plan | log
  const [completedToday, setCompletedToday] = useState({});
  const [xpMsg, setXpMsg] = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef(null);
  const xpAnim = useRef(new Animated.Value(0)).current;

  const todayKey = new Date().toISOString().split('T')[0];

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('fitness_' + todayKey).then(v => {
      if (v) setCompletedToday(JSON.parse(v));
    });
  }, []));

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      restRef.current = setTimeout(() => setRestTimer(t => t - 1), 1000);
    } else if (restTimer === 0) {
      setRestRunning(false);
      setRestTimer(null);
    }
    return () => clearTimeout(restRef.current);
  }, [restRunning, restTimer]);

  const showXP = (msg) => {
    setXpMsg(msg);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(xpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setXpMsg(null));
  };

  const markDone = async (exercise) => {
    const key = `${muscle}_${exercise.name}`;
    const alreadyDone = completedToday[key];
    const updated = { ...completedToday, [key]: !alreadyDone };
    setCompletedToday(updated);
    await AsyncStorage.setItem('fitness_' + todayKey, JSON.stringify(updated));
    if (!alreadyDone) {
      await addXP(exercise.xp);
      showXP(`+${exercise.xp} XP — ${exercise.name}!`);
      const restSecs = parseInt(exercise.rest) || 60;
      setRestTimer(restSecs);
      setRestRunning(true);
    }
  };

  const openVideo = (url) => { Linking.openURL(url); };

  const exercises = (EXERCISES[muscle]?.[tier] || []).filter(
    e => e.location.includes(location)
  );

  const currentTier = TIERS.find(t => t.id === tier);
  const plan = WEEKLY_PLANS[tier];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const todayPlan = plan?.find(d => d.day === today);

  const totalXPToday = Object.keys(completedToday)
    .filter(k => completedToday[k])
    .reduce((sum, k) => {
      for (const mg of Object.keys(EXERCISES)) {
        for (const t of ['beginner', 'intermediate', 'pro']) {
          const found = EXERCISES[mg][t]?.find(e => `${mg}_${e.name}` === k);
          if (found) return sum + found.xp;
        }
      }
      return sum;
    }, 0);

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>

      {/* XP Popup */}
      {xpMsg && (
        <Animated.View style={[s.xpPopup, { opacity: xpAnim }]}>
          <Text style={s.xpPopupText}>{xpMsg}</Text>
        </Animated.View>
      )}

      {/* Rest Timer Banner */}
      {restTimer !== null && (
        <TouchableOpacity style={[s.restBanner, { backgroundColor: restTimer > 0 ? C.orangeSoft : C.greenSoft }]} onPress={() => { setRestRunning(false); setRestTimer(null); }}>
          <Text style={[s.restText, { color: restTimer > 0 ? C.orange : C.green }]}>
            {restTimer > 0 ? `⏱ Rest: ${restTimer}s — tap to skip` : '✅ Rest done! Next set.'}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.heading}>💪 Fitness</Text>
            {totalXPToday > 0 && <Text style={[s.xpToday, { color: C.accent }]}>+{totalXPToday} XP earned today</Text>}
          </View>
          <View style={[s.tierBadge, { backgroundColor: currentTier.color + '22' }]}>
            <Text style={s.tierBadgeEmoji}>{currentTier.emoji}</Text>
            <Text style={[s.tierBadgeText, { color: currentTier.color }]}>{currentTier.label}</Text>
          </View>
        </View>

        {/* Tab Nav */}
        <View style={s.tabRow}>
          {[['exercises','🏋️ Train'],['plan','📅 Plan'],['log','📊 Log']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── EXERCISES TAB ── */}
        {tab === 'exercises' && (
          <>
            {/* Tier Selector */}
            <View style={s.card}>
              <Text style={s.cardLabel}>SELECT TIER</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierBtn, tier === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]} onPress={() => setTier(t.id)}>
                    <Text style={s.tierBtnEmoji}>{t.emoji}</Text>
                    <Text style={[s.tierBtnText, { color: tier === t.id ? t.color : C.muted }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.tierDesc, { color: C.muted }]}>{currentTier.desc}</Text>
            </View>

            {/* Location Filter */}
            <View style={s.locationRow}>
              {['home', 'outdoor', 'gym'].map(loc => (
                <TouchableOpacity key={loc} style={[s.locationBtn, location === loc && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setLocation(loc)}>
                  <Text style={s.locationEmoji}>{LOCATION_ICONS[loc]}</Text>
                  <Text style={[s.locationText, { color: location === loc ? C.accent : C.muted }]}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Muscle Group Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.muscleScroll}>
              {MUSCLE_GROUPS.map(mg => (
                <TouchableOpacity key={mg.id} style={[s.muscleBtn, muscle === mg.id && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setMuscle(mg.id)}>
                  <Text style={s.muscleEmoji}>{mg.emoji}</Text>
                  <Text style={[s.muscleText, { color: muscle === mg.id ? C.accent : C.muted }]}>{mg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise Cards */}
            {exercises.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🏠</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No {tier} {muscle} exercises for {location}. Try switching location.</Text>
              </View>
            ) : (
              exercises.map((exercise, idx) => {
                const key = `${muscle}_${exercise.name}`;
                const done = completedToday[key];
                return (
                  <View key={idx} style={[s.exerciseCard, done && { borderColor: C.green + '66', backgroundColor: C.greenSoft }]}>
                    <View style={s.exerciseHeader}>
                      <View style={s.exerciseTitleRow}>
                        <Text style={[s.exerciseName, { color: C.text }]}>{exercise.name}</Text>
                        <View style={[s.xpChip, { backgroundColor: C.accentSoft }]}>
                          <Text style={[s.xpChipText, { color: C.accent }]}>+{exercise.xp}XP</Text>
                        </View>
                      </View>
                      <View style={s.exerciseMeta}>
                        <Text style={[s.metaChip, { backgroundColor: C.surface, color: C.muted }]}>📋 {exercise.sets}</Text>
                        <Text style={[s.metaChip, { backgroundColor: C.surface, color: C.muted }]}>⏱ Rest: {exercise.rest}</Text>
                        <Text style={[s.metaChip, { backgroundColor: C.surface, color: C.muted }]}>🔧 {exercise.equipment}</Text>
                      </View>
                    </View>

                    {/* Pro Tip */}
                    <View style={[s.tipBox, { backgroundColor: C.yellowSoft }]}>
                      <Text style={[s.tipText, { color: C.text }]}>💡 {exercise.tip}</Text>
                    </View>

                    {/* Location badges */}
                    <View style={s.locationBadges}>
                      {exercise.location.map(loc => (
                        <View key={loc} style={[s.locBadge, { backgroundColor: C.surface }]}>
                          <Text style={[s.locBadgeText, { color: C.muted }]}>{LOCATION_ICONS[loc]} {loc}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={s.actionRow}>
                      <TouchableOpacity style={[s.videoBtn, { backgroundColor: C.redSoft }]} onPress={() => openVideo(exercise.youtube)} activeOpacity={0.8}>
                        <Text style={[s.videoBtnText, { color: C.red }]}>▶ Watch on YouTube</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.doneBtn, { backgroundColor: done ? C.green : C.accent }]} onPress={() => markDone(exercise)} activeOpacity={0.8}>
                        <Text style={s.doneBtnText}>{done ? '✓ Done' : 'Mark Done'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── PLAN TAB ── */}
        {tab === 'plan' && (
          <>
            <View style={s.card}>
              <Text style={s.cardLabel}>TIER</Text>
              <View style={s.tierRowSmall}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierBtnSmall, tier === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]} onPress={() => setTier(t.id)}>
                    <Text style={[s.tierBtnSmallText, { color: tier === t.id ? t.color : C.muted }]}>{t.emoji} {t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>📅 Weekly Split — {currentTier.label}</Text>
              {plan.map((d, i) => (
                <View key={i} style={[s.planRow, d.day === today && { backgroundColor: C.accentSoft, borderRadius: 10, padding: 8, marginHorizontal: -4 }]}>
                  <View style={[s.planDay, { backgroundColor: d.day === today ? C.accent : C.surface }]}>
                    <Text style={[s.planDayText, { color: d.day === today ? '#fff' : C.muted }]}>{d.day}</Text>
                  </View>
                  <View style={s.planInfo}>
                    <Text style={[s.planLabel, { color: C.text }]}>{d.label}</Text>
                    <View style={s.planMuscles}>
                      {d.focus.map(mg => {
                        const found = MUSCLE_GROUPS.find(m => m.id === mg);
                        return found ? <Text key={mg} style={[s.planMuscleChip, { backgroundColor: C.surface, color: C.muted }]}>{found.emoji} {found.label}</Text> : null;
                      })}
                    </View>
                  </View>
                  {d.day === today && <Text style={[s.todayBadge, { color: C.accent }]}>Today</Text>}
                </View>
              ))}
            </View>

            {todayPlan && todayPlan.focus.length > 0 && (
              <View style={[s.card, { borderColor: C.accent + '44' }]}>
                <Text style={s.cardTitle}>Today: {todayPlan.label}</Text>
                <Text style={[s.hint, { color: C.muted }]}>Tap a muscle group to start training:</Text>
                <View style={s.todayMuscles}>
                  {todayPlan.focus.map(mg => {
                    const found = MUSCLE_GROUPS.find(m => m.id === mg);
                    return (
                      <TouchableOpacity key={mg} style={[s.todayMuscleBtn, { backgroundColor: C.accentSoft }]} onPress={() => { setMuscle(mg); setTab('exercises'); }}>
                        <Text style={{ fontSize: 24 }}>{found?.emoji}</Text>
                        <Text style={[s.todayMuscleName, { color: C.accent }]}>{found?.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📊 Today's Workout Log</Text>
            {Object.keys(completedToday).filter(k => completedToday[k]).length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🏋️</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No exercises logged yet today. Go train!</Text>
              </View>
            ) : (
              Object.keys(completedToday).filter(k => completedToday[k]).map(k => {
                const [mg, ...rest] = k.split('_');
                const name = rest.join('_');
                const mgInfo = MUSCLE_GROUPS.find(m => m.id === mg);
                return (
                  <View key={k} style={[s.logRow, { borderBottomColor: C.border }]}>
                    <Text style={s.logEmoji}>{mgInfo?.emoji || '💪'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.logName, { color: C.text }]}>{name}</Text>
                      <Text style={[s.logMuscle, { color: C.muted }]}>{mgInfo?.label}</Text>
                    </View>
                    <Text style={[s.logDone, { color: C.green }]}>✓ Done</Text>
                  </View>
                );
              })
            )}
            {totalXPToday > 0 && (
              <View style={[s.totalXPCard, { backgroundColor: C.accentSoft }]}>
                <Text style={[s.totalXPText, { color: C.accent }]}>⚡ Total XP earned today: {totalXPToday}</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  xpPopup: { position: 'absolute', top: 70, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, zIndex: 999, elevation: 10 },
  xpPopupText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  restBanner: { marginHorizontal: 20, marginTop: 8, borderRadius: 10, padding: 10, alignItems: 'center' },
  restText: { fontWeight: '700', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text },
  xpToday: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tierBadgeEmoji: { fontSize: 16 },
  tierBadgeText: { fontWeight: '700', fontSize: 13 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabText: { fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tierBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  tierBtnEmoji: { fontSize: 20, marginBottom: 4 },
  tierBtnText: { fontSize: 12, fontWeight: '700' },
  tierDesc: { fontSize: 12, lineHeight: 18 },
  locationRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  locationEmoji: { fontSize: 16 },
  locationText: { fontSize: 12, fontWeight: '600' },
  muscleScroll: { marginBottom: 14 },
  muscleBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, flexDirection: 'row', gap: 6 },
  muscleEmoji: { fontSize: 16 },
  muscleText: { fontSize: 12, fontWeight: '600' },
  exerciseCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  exerciseHeader: { marginBottom: 12 },
  exerciseTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exerciseName: { fontSize: 17, fontWeight: '800', flex: 1 },
  xpChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  xpChipText: { fontSize: 12, fontWeight: '800' },
  exerciseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '600' },
  tipBox: { borderRadius: 10, padding: 10, marginBottom: 10 },
  tipText: { fontSize: 13, lineHeight: 19 },
  locationBadges: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  locBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  locBadgeText: { fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  videoBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  videoBtnText: { fontWeight: '700', fontSize: 13 },
  doneBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  tierRowSmall: { flexDirection: 'row', gap: 8 },
  tierBtnSmall: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tierBtnSmallText: { fontWeight: '700', fontSize: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, marginBottom: 4 },
  planDay: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planDayText: { fontWeight: '800', fontSize: 13 },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  planMuscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  planMuscleChip: { fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '600' },
  todayBadge: { fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 13, marginBottom: 12 },
  todayMuscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  todayMuscleBtn: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, minWidth: 80 },
  todayMuscleName: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  logEmoji: { fontSize: 22 },
  logName: { fontSize: 14, fontWeight: '600' },
  logMuscle: { fontSize: 12, marginTop: 2 },
  logDone: { fontWeight: '700', fontSize: 13 },
  totalXPCard: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  totalXPText: { fontWeight: '800', fontSize: 15 },
});
