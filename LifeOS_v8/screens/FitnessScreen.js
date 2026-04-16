import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Modal, Animated, Dimensions, Image, Linking, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { EXERCISES, MUSCLE_GROUPS, TIERS, WEEKLY_PLANS } from '../data/fitness';
import { addXP, XP_REWARDS } from '../utils/xp';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_ICONS = { home: '🏠', outdoor: '🌳', gym: '🏋️' };

const getYouTubeId = (url) => {
  const match = url?.match(/(?:youtu\.be\/|v=)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const getThumbnail = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};

const openVideo = async (url) => {
  if (!url) return;
  const id = getYouTubeId(url);
  // Try YouTube app first, then browser
  const ytAppUrl = `youtube://www.youtube.com/watch?v=${id}`;
  const ytWebUrl = `https://www.youtube.com/watch?v=${id}`;
  try {
    const canOpen = await Linking.canOpenURL(ytAppUrl);
    if (canOpen) {
      await Linking.openURL(ytAppUrl);
    } else {
      await Linking.openURL(ytWebUrl);
    }
  } catch {
    await Linking.openURL(ytWebUrl);
  }
};

export default function FitnessScreen() {
  const { C } = useTheme();
  const [tier, setTier] = useState('beginner');
  const [muscle, setMuscle] = useState('abs');
  const [location, setLocation] = useState('home');
  const [tab, setTab] = useState('train');
  const [completedToday, setCompletedToday] = useState({});
  const [xpMsg, setXpMsg] = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const [restRunning, setRestRunning] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
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
      setRestRunning(false); setRestTimer(null);
    }
    return () => clearTimeout(restRef.current);
  }, [restRunning, restTimer]);

  const showXP = (msg) => {
    setXpMsg(msg);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(xpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setXpMsg(null));
  };

  const markDone = async (exercise) => {
    const key = `${muscle}_${exercise.name}`;
    const done = !completedToday[key];
    const updated = { ...completedToday, [key]: done };
    setCompletedToday(updated);
    await AsyncStorage.setItem('fitness_' + todayKey, JSON.stringify(updated));
    if (done) {
      await addXP(exercise.xp);
      showXP(`+${exercise.xp} XP — ${exercise.name}!`);
      const restSecs = parseInt(exercise.rest?.match(/\d+/)?.[0] || '60');
      setRestTimer(restSecs);
      setRestRunning(true);
    }
  };

  const exercises = (EXERCISES[muscle]?.[tier] || []).filter(e => e.location.includes(location));
  const currentTier = TIERS.find(t => t.id === tier);
  const plan = WEEKLY_PLANS[tier];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const todayPlan = plan?.find(d => d.day === today);

  const totalXPToday = Object.keys(completedToday).filter(k => completedToday[k])
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

      {xpMsg && (
        <Animated.View style={[s.xpPopup, { opacity: xpAnim }]}>
          <Text style={s.xpPopupText}>{xpMsg}</Text>
        </Animated.View>
      )}

      {restTimer !== null && (
        <TouchableOpacity style={[s.restBanner, { backgroundColor: restTimer > 0 ? C.orangeSoft : C.greenSoft }]} onPress={() => { setRestRunning(false); setRestTimer(null); }}>
          <Text style={[s.restText, { color: restTimer > 0 ? C.orange : C.green }]}>
            {restTimer > 0 ? `⏱ Rest: ${restTimer}s — tap to skip` : '✅ Rest done!'}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        <View style={s.headerRow}>
          <View>
            <Text style={s.heading}>💪 Fitness</Text>
            {totalXPToday > 0 && <Text style={[s.xpToday, { color: C.accent }]}>+{totalXPToday} XP today</Text>}
          </View>
          <View style={[s.tierPill, { backgroundColor: currentTier.color + '22' }]}>
            <Text style={{ fontSize: 16 }}>{currentTier.emoji}</Text>
            <Text style={[s.tierPillText, { color: currentTier.color }]}>{currentTier.label}</Text>
          </View>
        </View>

        <View style={s.tabRow}>
          {[['train','🏋️ Train'],['plan','📅 Plan'],['log','📊 Log']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'train' && (
          <>
            {/* Tier Selector */}
            <View style={s.card}>
              <Text style={s.cardLabel}>TRAINING TIER</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierBtn, tier === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]} onPress={() => setTier(t.id)}>
                    <Text style={{ fontSize: 22, marginBottom: 3 }}>{t.emoji}</Text>
                    <Text style={[s.tierBtnText, { color: tier === t.id ? t.color : C.muted }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.tierDesc, { color: C.muted }]}>{currentTier.desc}</Text>
            </View>

            {/* Location */}
            <View style={s.locationRow}>
              {['home','outdoor','gym'].map(loc => (
                <TouchableOpacity key={loc} style={[s.locationBtn, location === loc && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setLocation(loc)}>
                  <Text style={{ fontSize: 18 }}>{LOCATION_ICONS[loc]}</Text>
                  <Text style={[s.locationText, { color: location === loc ? C.accent : C.muted }]}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Muscle Group */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.muscleScroll}>
              {MUSCLE_GROUPS.map(mg => (
                <TouchableOpacity key={mg.id} style={[s.muscleChip, muscle === mg.id && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setMuscle(mg.id)}>
                  <Text style={{ fontSize: 15 }}>{mg.emoji}</Text>
                  <Text style={[s.muscleText, { color: muscle === mg.id ? C.accent : C.muted }]}>{mg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.exCount, { color: C.muted }]}>{exercises.length} exercises · {muscle} · {tier} · {location}</Text>

            {exercises.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>🔄</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No exercises for this combination. Try switching location.</Text>
              </View>
            ) : (
              exercises.map((exercise, idx) => {
                const key = `${muscle}_${exercise.name}`;
                const done = !!completedToday[key];
                const expanded = expandedExercise === key;
                const thumb = getThumbnail(exercise.youtube);

                return (
                  <View key={idx} style={[s.exerciseCard, done && { borderColor: C.green + '88' }]}>

                    {/* Thumbnail Row */}
                    <TouchableOpacity style={s.thumbRow} onPress={() => setExpandedExercise(expanded ? null : key)} activeOpacity={0.85}>
                      {thumb ? (
                        <Image
                          source={{ uri: thumb }}
                          style={s.thumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[s.thumbPlaceholder, { backgroundColor: C.surface }]}>
                          <Text style={{ fontSize: 32 }}>🎬</Text>
                        </View>
                      )}

                      {/* Play overlay */}
                      <View style={s.thumbOverlay}>
                        <View style={s.playCircle}>
                          <Text style={s.playIcon}>▶</Text>
                        </View>
                      </View>

                      {/* Name + XP on thumbnail */}
                      <View style={s.thumbFooter}>
                        <Text style={s.thumbName} numberOfLines={1}>{exercise.name}</Text>
                        <View style={s.thumbXP}>
                          <Text style={s.thumbXPText}>+{exercise.xp}XP</Text>
                        </View>
                      </View>

                      {/* Done badge */}
                      {done && (
                        <View style={[s.doneBadge, { backgroundColor: C.green }]}>
                          <Text style={s.doneBadgeText}>✓ Done</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Collapsed info row */}
                    <View style={s.exerciseInfo}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.muted }]}>📋 {exercise.sets}</Text>
                        </View>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.muted }]}>⏱ {exercise.rest}</Text>
                        </View>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.muted }]}>🔧 {exercise.equipment}</Text>
                        </View>
                      </ScrollView>
                    </View>

                    {/* Expanded detail */}
                    {expanded && (
                      <View style={s.expandedSection}>
                        <Text style={[s.exerciseDesc, { color: C.muted }]}>{exercise.desc}</Text>
                        <View style={[s.tipBox, { backgroundColor: C.yellowSoft }]}>
                          <Text style={[s.tipText, { color: C.text }]}>💡 {exercise.tip}</Text>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.videoBtn, { backgroundColor: '#FF000015', borderWidth: 1, borderColor: '#FF000030' }]}
                        onPress={() => openVideo(exercise.youtube)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 16 }}>▶</Text>
                        <Text style={[s.videoBtnText, { color: '#FF4444' }]}>YouTube</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[s.detailBtn, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }]}
                        onPress={() => setExpandedExercise(expanded ? null : key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.detailBtnText, { color: C.muted }]}>{expanded ? '▲ Less' : '▼ Details'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[s.doneBtn, { backgroundColor: done ? C.green : C.accent }]}
                        onPress={() => markDone(exercise)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.doneBtnText}>{done ? '✓ Done' : 'Mark Done'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === 'plan' && (
          <>
            <View style={s.card}>
              <Text style={s.cardLabel}>SELECT TIER</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierBtn, tier === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]} onPress={() => setTier(t.id)}>
                    <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                    <Text style={[s.tierBtnText, { color: tier === t.id ? t.color : C.muted }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={[s.cardTitle, { color: C.text }]}>📅 Weekly Split — {currentTier.label}</Text>
              {plan.map((d, i) => (
                <View key={i} style={[s.planRow, d.day === today && { backgroundColor: C.accentSoft, borderRadius: 12, padding: 8, marginHorizontal: -4 }]}>
                  <View style={[s.planDayBadge, { backgroundColor: d.day === today ? C.accent : C.surface }]}>
                    <Text style={[s.planDayText, { color: d.day === today ? '#fff' : C.muted }]}>{d.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.planLabel, { color: C.text }]}>{d.label}</Text>
                    <View style={s.planMuscleRow}>
                      {d.focus.map(mg => {
                        const found = MUSCLE_GROUPS.find(m => m.id === mg);
                        return found ? <Text key={mg} style={[s.planMuscleChip, { backgroundColor: C.surface, color: C.muted }]}>{found.emoji} {found.label}</Text> : null;
                      })}
                    </View>
                  </View>
                  {d.day === today && <Text style={[{ color: C.accent, fontSize: 12, fontWeight: '700' }]}>Today</Text>}
                </View>
              ))}
            </View>

            {todayPlan?.focus?.length > 0 && (
              <View style={[s.card, { borderColor: C.accent + '44' }]}>
                <Text style={[s.cardTitle, { color: C.text }]}>Today: {todayPlan.label}</Text>
                <View style={s.todayMuscleGrid}>
                  {todayPlan.focus.map(mg => {
                    const found = MUSCLE_GROUPS.find(m => m.id === mg);
                    return (
                      <TouchableOpacity key={mg} style={[s.todayMuscleBtn, { backgroundColor: C.accentSoft }]} onPress={() => { setMuscle(mg); setTab('train'); }}>
                        <Text style={{ fontSize: 26 }}>{found?.emoji}</Text>
                        <Text style={[s.todayMuscleName, { color: C.accent }]}>{found?.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {tab === 'log' && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: C.text }]}>📊 Today's Workout Log</Text>
            {Object.keys(completedToday).filter(k => completedToday[k]).length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>🏋️</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No exercises logged yet today. Go train!</Text>
              </View>
            ) : (
              Object.keys(completedToday).filter(k => completedToday[k]).map(k => {
                const [mg, ...rest] = k.split('_');
                const mgInfo = MUSCLE_GROUPS.find(m => m.id === mg);
                return (
                  <View key={k} style={[s.logRow, { borderBottomColor: C.border }]}>
                    <Text style={{ fontSize: 22 }}>{mgInfo?.emoji || '💪'}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[s.logName, { color: C.text }]}>{rest.join('_')}</Text>
                      <Text style={[s.logMuscle, { color: C.muted }]}>{mgInfo?.label}</Text>
                    </View>
                    <Text style={[{ color: C.green, fontWeight: '700', fontSize: 13 }]}>✓ Done</Text>
                  </View>
                );
              })
            )}
            {totalXPToday > 0 && (
              <View style={[s.totalXPCard, { backgroundColor: C.accentSoft }]}>
                <Text style={[s.totalXPText, { color: C.accent }]}>⚡ {totalXPToday} XP earned today</Text>
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
  container: { padding: 16, paddingBottom: 40 },
  xpPopup: { position: 'absolute', top: 70, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, zIndex: 999, elevation: 10 },
  xpPopupText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  restBanner: { marginHorizontal: 16, marginTop: 6, borderRadius: 10, padding: 10, alignItems: 'center' },
  restText: { fontWeight: '700', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  heading: { fontSize: 24, fontWeight: '700', color: C.text },
  xpToday: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tierPillText: { fontWeight: '700', fontSize: 13 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabText: { fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tierBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  tierBtnText: { fontSize: 11, fontWeight: '700' },
  tierDesc: { fontSize: 12, lineHeight: 18 },
  locationRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  locationText: { fontSize: 12, fontWeight: '600' },
  muscleScroll: { marginBottom: 8 },
  muscleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, marginRight: 7, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  muscleText: { fontSize: 12, fontWeight: '600' },
  exCount: { fontSize: 11, marginBottom: 10 },
  // Exercise Card
  exerciseCard: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  thumbRow: { position: 'relative', height: 160, backgroundColor: '#000' },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  thumbOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  playCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  playIcon: { color: '#fff', fontSize: 20, marginLeft: 4 },
  thumbFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 8,
  },
  thumbName: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  thumbXP: { backgroundColor: '#6C63FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  thumbXPText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  doneBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  doneBadgeText: { color: '#000', fontWeight: '800', fontSize: 12 },
  exerciseInfo: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6 },
  metaText: { fontSize: 11, fontWeight: '600' },
  expandedSection: { paddingHorizontal: 12, paddingBottom: 8 },
  exerciseDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  tipBox: { borderRadius: 10, padding: 10, marginBottom: 4 },
  tipText: { fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 8 },
  videoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  videoBtnText: { fontWeight: '700', fontSize: 13 },
  detailBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  detailBtnText: { fontWeight: '700', fontSize: 12 },
  doneBtn: { flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, marginBottom: 4 },
  planDayBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planDayText: { fontWeight: '800', fontSize: 13 },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  planMuscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  planMuscleChip: { fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '600' },
  todayMuscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  todayMuscleBtn: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, minWidth: 80 },
  todayMuscleName: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  logName: { fontSize: 14, fontWeight: '600' },
  logMuscle: { fontSize: 12, marginTop: 2 },
  totalXPCard: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  totalXPText: { fontWeight: '800', fontSize: 15 },
});
