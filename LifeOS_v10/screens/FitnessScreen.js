import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Image, Linking, Animated, Platform, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { EXERCISES, MUSCLE_GROUPS, TIERS, WEEKLY_PLANS } from '../data/fitness';
import { addXP } from '../utils/xp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const LOCATION_ICONS = { home: '🏠', outdoor: '🌳', gym: '🏋️' };

const getYouTubeId = (url) => {
  if (!url) return null;
  // Handle youtu.be/ID and youtube.com/watch?v=ID
  const m1 = url.match(/youtu\.be\/([^?&\n]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]v=([^?&\n]+)/);
  if (m2) return m2[1];
  return null;
};

const getThumbnail = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// Fixed video open — no canOpenURL (requires manifest), just open directly
const openVideo = (url) => {
  if (!url) return;
  const id = getYouTubeId(url);
  if (!id) return;
  // Direct YouTube URL — browser or app handles it
  Linking.openURL(`https://www.youtube.com/watch?v=${id}`).catch(() => {});
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
  const [expandedKey, setExpandedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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
    hapticMedium();
    const key = `${muscle}_${exercise.name}`;
    const done = !completedToday[key];
    const updated = { ...completedToday, [key]: done };
    setCompletedToday(updated);
    await AsyncStorage.setItem('fitness_' + todayKey, JSON.stringify(updated));
    if (done) {
      hapticSuccess();
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
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const todayPlan = plan?.find(d => d.day === todayDay);

  const totalXPToday = Object.keys(completedToday).filter(k => completedToday[k])
    .reduce((sum, k) => {
      for (const mg of Object.keys(EXERCISES))
        for (const t of ['beginner','intermediate','pro']) {
          const found = EXERCISES[mg][t]?.find(e => `${mg}_${e.name}` === k);
          if (found) return sum + found.xp;
        }
      return sum;
    }, 0);

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>

      {/* XP toast */}
      {xpMsg && (
        <Animated.View style={[s.xpToast, { opacity: xpAnim }]}>
          <Text style={s.xpToastText}>{xpMsg}</Text>
        </Animated.View>
      )}

      {/* Rest timer */}
      {restTimer !== null && (
        <TouchableOpacity
          style={[s.restBanner, { backgroundColor: restTimer > 0 ? C.orange + '18' : C.green + '18', borderColor: restTimer > 0 ? C.orange + '40' : C.green + '40' }]}
          onPress={() => { setRestRunning(false); setRestTimer(null); }}
        >
          <Text style={{ fontSize: 16 }}>{restTimer > 0 ? '⏱' : '✅'}</Text>
          <Text style={[s.restText, { color: restTimer > 0 ? C.orange : C.green }]}>
            {restTimer > 0 ? `Rest ${restTimer}s — tap to skip` : 'Rest done! Next set.'}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>💪 Fitness</Text>
            {totalXPToday > 0 && (
              <Text style={[s.pageSubtitle, { color: C.accent }]}>⚡ +{totalXPToday} XP earned today</Text>
            )}
          </View>
          <View style={[s.tierBadge, { backgroundColor: currentTier.color + '20', borderColor: currentTier.color + '40' }]}>
            <Text style={{ fontSize: 14 }}>{currentTier.emoji}</Text>
            <Text style={[s.tierBadgeLabel, { color: currentTier.color }]}>{currentTier.label}</Text>
          </View>
        </View>

        {/* Tab selector */}
        <View style={[s.tabRow, { backgroundColor: C.surface, borderColor: C.border }]}>
          {[['train','🏋️','Train'],['plan','📅','Plan'],['log','📊','Log']].map(([t, e, l]) => (
            <TouchableOpacity
              key={t}
              style={[s.tabItem, tab === t && { backgroundColor: C.accent }]}
              onPress={() => setTab(t)}
            >
              <Text style={{ fontSize: 14 }}>{e}</Text>
              <Text style={[s.tabLabel, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TRAIN ── */}
        {tab === 'train' && (
          <>
            {/* Tier picker */}
            <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.sectionLabel, { color: C.muted }]}>LEVEL</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.tierPill, { borderColor: tier === t.id ? t.color : C.border, backgroundColor: tier === t.id ? t.color + '18' : C.surface }]}
                    onPress={() => setTier(t.id)}
                  >
                    <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                    <Text style={[s.tierPillLabel, { color: tier === t.id ? t.color : C.muted }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.tierDesc, { color: C.muted }]}>{currentTier.desc}</Text>
            </View>

            {/* Location */}
            <View style={s.locRow}>
              {['home','outdoor','gym'].map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[s.locBtn, { backgroundColor: location === loc ? C.accent : C.card, borderColor: location === loc ? C.accent : C.border }]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={{ fontSize: 20 }}>{LOCATION_ICONS[loc]}</Text>
                  <Text style={[s.locLabel, { color: location === loc ? '#fff' : C.muted }]}>
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Muscle groups */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.muscleScroll} contentContainerStyle={s.muscleContent}>
              {MUSCLE_GROUPS.map(mg => (
                <TouchableOpacity
                  key={mg.id}
                  style={[s.muscleChip, muscle === mg.id && { backgroundColor: C.accent, borderColor: C.accent }]}
                  onPress={() => setMuscle(mg.id)}
                >
                  <Text style={{ fontSize: 14 }}>{mg.emoji}</Text>
                  <Text style={[s.muscleLabel, { color: muscle === mg.id ? '#fff' : C.muted }]}>{mg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Count */}
            <Text style={[s.countText, { color: C.muted }]}>
              {exercises.length} exercises · {muscle} · {currentTier.label} · {location}
            </Text>

            {exercises.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 52 }}>🔄</Text>
                <Text style={[s.emptyTitle, { color: C.text }]}>No exercises found</Text>
                <Text style={[s.emptyDesc, { color: C.muted }]}>Try switching location or tier</Text>
              </View>
            ) : (
              exercises.map((ex, idx) => {
                const key = `${muscle}_${ex.name}`;
                const done = !!completedToday[key];
                const expanded = expandedKey === key;
                const thumb = getThumbnail(ex.youtube);

                return (
                  <View key={idx} style={[s.exCard, done && { borderColor: C.green + '60', backgroundColor: C.green + '05' }]}>

                    {/* Thumbnail */}
                    <TouchableOpacity
                      style={s.thumbWrap}
                      onPress={() => openVideo(ex.youtube)}
                      activeOpacity={0.9}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={s.thumb} resizeMode="cover" />
                      ) : (
                        <View style={[s.thumbFallback, { backgroundColor: C.surface }]}>
                          <Text style={{ fontSize: 40 }}>🎬</Text>
                        </View>
                      )}

                      {/* Dark gradient overlay */}
                      <View style={s.thumbGradient} />

                      {/* Play button */}
                      <View style={s.playWrap}>
                        <View style={s.playBtn}>
                          <Text style={s.playIcon}>▶</Text>
                        </View>
                        <Text style={s.playLabel}>Watch on YouTube</Text>
                      </View>

                      {/* Done badge */}
                      {done && (
                        <View style={[s.doneBadge, { backgroundColor: C.green }]}>
                          <Text style={s.doneBadgeText}>✓ DONE</Text>
                        </View>
                      )}

                      {/* Bottom info bar */}
                      <View style={s.thumbBottom}>
                        <Text style={s.thumbTitle} numberOfLines={1}>{ex.name}</Text>
                        <View style={[s.xpPill, { backgroundColor: C.accent }]}>
                          <Text style={s.xpPillText}>+{ex.xp} XP</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Info row */}
                    <View style={s.infoRow}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                        {[`📋 ${ex.sets}`, `⏱ ${ex.rest}`, `🔧 ${ex.equipment}`].map((c, i) => (
                          <View key={i} style={[s.chip, { backgroundColor: C.surface, borderColor: C.border }]}>
                            <Text style={[s.chipText, { color: C.muted }]}>{c}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Expandable details */}
                    {expanded && (
                      <View style={s.expandedBody}>
                        <Text style={[s.exDesc, { color: C.text }]}>{ex.desc}</Text>
                        <View style={[s.tipRow, { backgroundColor: C.yellow + '15', borderLeftColor: C.yellow, borderLeftWidth: 3 }]}>
                          <Text style={[s.tipText, { color: C.text }]}>💡 {ex.tip}</Text>
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={[s.actionsRow, { borderTopColor: C.border }]}>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: '#FF0000' + '15' }]}
                        onPress={() => openVideo(ex.youtube)}
                      >
                        <Text style={{ fontSize: 13 }}>▶</Text>
                        <Text style={[s.actionLabel, { color: '#FF4444' }]}>Watch</Text>
                      </TouchableOpacity>

                      <View style={[s.actionDivider, { backgroundColor: C.border }]} />

                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: C.surface }]}
                        onPress={() => setExpandedKey(expanded ? null : key)}
                      >
                        <Text style={{ fontSize: 13 }}>{expanded ? '▲' : '▼'}</Text>
                        <Text style={[s.actionLabel, { color: C.muted }]}>{expanded ? 'Less' : 'Details'}</Text>
                      </TouchableOpacity>

                      <View style={[s.actionDivider, { backgroundColor: C.border }]} />

                      <TouchableOpacity
                        style={[s.actionBtnWide, { backgroundColor: done ? C.green + '20' : C.accent + '20' }]}
                        onPress={() => markDone(ex)}
                      >
                        <Text style={{ fontSize: 13 }}>{done ? '✓' : '○'}</Text>
                        <Text style={[s.actionLabel, { color: done ? C.green : C.accent, fontWeight: '700' }]}>
                          {done ? 'Completed' : 'Mark Done'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── PLAN ── */}
        {tab === 'plan' && (
          <>
            <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.sectionLabel, { color: C.muted }]}>SELECT LEVEL</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierPill, { borderColor: tier === t.id ? t.color : C.border, backgroundColor: tier === t.id ? t.color + '18' : C.surface }]} onPress={() => setTier(t.id)}>
                    <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                    <Text style={[s.tierPillLabel, { color: tier === t.id ? t.color : C.muted }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.sectionTitle, { color: C.text }]}>📅 {currentTier.label} Weekly Split</Text>
              {plan.map((d, i) => {
                const isToday = d.day === todayDay;
                return (
                  <View key={i} style={[s.planRow, isToday && { backgroundColor: C.accent + '12', borderRadius: 12, marginHorizontal: -6, paddingHorizontal: 6 }]}>
                    <View style={[s.dayBadge, { backgroundColor: isToday ? C.accent : C.surface, borderColor: isToday ? C.accent : C.border }]}>
                      <Text style={[s.dayText, { color: isToday ? '#fff' : C.muted }]}>{d.day}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.planLabel, { color: C.text }]}>{d.label}</Text>
                      <View style={s.planMuscleRow}>
                        {d.focus.map(mg => {
                          const info = MUSCLE_GROUPS.find(m => m.id === mg);
                          return info ? (
                            <Text key={mg} style={[s.planMuscleTag, { backgroundColor: C.surface, color: C.muted }]}>{info.emoji} {info.label}</Text>
                          ) : null;
                        })}
                        {d.focus.length === 0 && <Text style={[s.planMuscleTag, { backgroundColor: C.surface, color: C.muted }]}>Recovery</Text>}
                      </View>
                    </View>
                    {isToday && <Text style={[{ color: C.accent, fontSize: 11, fontWeight: '800' }]}>TODAY</Text>}
                  </View>
                );
              })}
            </View>

            {todayPlan?.focus?.length > 0 && (
              <View style={[s.section, { backgroundColor: C.card, borderColor: C.accent + '40' }]}>
                <Text style={[s.sectionTitle, { color: C.text }]}>Today: {todayPlan.label}</Text>
                <Text style={[{ color: C.muted, fontSize: 13, marginBottom: 12 }]}>Tap a muscle group to jump into training</Text>
                <View style={s.todayGrid}>
                  {todayPlan.focus.map(mg => {
                    const info = MUSCLE_GROUPS.find(m => m.id === mg);
                    return (
                      <TouchableOpacity key={mg} style={[s.todayBtn, { backgroundColor: C.accent + '18', borderColor: C.accent + '30' }]} onPress={() => { setMuscle(mg); setTab('train'); }}>
                        <Text style={{ fontSize: 28 }}>{info?.emoji}</Text>
                        <Text style={[s.todayBtnLabel, { color: C.accent }]}>{info?.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── LOG ── */}
        {tab === 'log' && (
          <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.sectionTitle, { color: C.text }]}>📊 Today's Workout</Text>
            {Object.keys(completedToday).filter(k => completedToday[k]).length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>🏋️</Text>
                <Text style={[s.emptyTitle, { color: C.text }]}>Nothing logged yet</Text>
                <Text style={[s.emptyDesc, { color: C.muted }]}>Go to Train tab to start working out</Text>
              </View>
            ) : (
              <>
                {Object.keys(completedToday).filter(k => completedToday[k]).map(k => {
                  const [mg, ...rest] = k.split('_');
                  const mgInfo = MUSCLE_GROUPS.find(m => m.id === mg);
                  return (
                    <View key={k} style={[s.logItem, { borderBottomColor: C.border }]}>
                      <Text style={{ fontSize: 22, marginRight: 12 }}>{mgInfo?.emoji || '💪'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.logName, { color: C.text }]}>{rest.join('_')}</Text>
                        <Text style={[s.logMuscle, { color: C.muted }]}>{mgInfo?.label}</Text>
                      </View>
                      <View style={[s.logDoneBadge, { backgroundColor: C.green + '20' }]}>
                        <Text style={[{ color: C.green, fontWeight: '700', fontSize: 12 }]}>✓ Done</Text>
                      </View>
                    </View>
                  );
                })}
                {totalXPToday > 0 && (
                  <View style={[s.xpSummary, { backgroundColor: C.accent + '15', borderColor: C.accent + '30' }]}>
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                    <Text style={[s.xpSummaryText, { color: C.accent }]}>{totalXPToday} XP earned today</Text>
                  </View>
                )}
              </>
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

  // Toast
  xpToast: {
    position: 'absolute', top: 60, alignSelf: 'center',
    backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 99, zIndex: 999, elevation: 10,
    shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  xpToastText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Rest banner
  restBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 6, marginBottom: 4,
    borderRadius: 12, padding: 10, borderWidth: 1,
  },
  restText: { fontWeight: '700', fontSize: 13 },

  // Page header
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, marginTop: 4,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1,
  },
  tierBadgeLabel: { fontWeight: '700', fontSize: 12 },

  // Tabs
  tabRow: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 4, marginBottom: 16, gap: 4,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  tabLabel: { fontWeight: '700', fontSize: 13 },

  // Section card
  section: {
    borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },

  // Tier
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tierPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  tierPillLabel: { fontSize: 12, fontWeight: '700' },
  tierDesc: { fontSize: 12, lineHeight: 18 },

  // Location
  locRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  locBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  locLabel: { fontSize: 12, fontWeight: '700' },

  // Muscle
  muscleScroll: { marginBottom: 8 },
  muscleContent: { paddingBottom: 4, gap: 8 },
  muscleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  muscleLabel: { fontSize: 12, fontWeight: '700' },
  countText: { fontSize: 11, marginBottom: 12 },

  // Exercise Card
  exCard: {
    backgroundColor: C.card, borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  // Thumbnail
  thumbWrap: { height: 190, position: 'relative', backgroundColor: '#000' },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  thumbGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  playWrap: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -44 }, { translateY: -28 }],
    alignItems: 'center',
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  playIcon: { color: '#fff', fontSize: 20, marginLeft: 4 },
  playLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  doneBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  doneBadgeText: { color: '#000', fontWeight: '800', fontSize: 11 },
  thumbBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)', paddingHorizontal: 14, paddingVertical: 10,
  },
  thumbTitle: { color: '#fff', fontWeight: '800', fontSize: 15, flex: 1, letterSpacing: -0.3 },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginLeft: 8 },
  xpPillText: { color: '#fff', fontWeight: '800', fontSize: 11 },

  // Info chips
  infoRow: { paddingHorizontal: 12, paddingVertical: 10 },
  chipRow: { gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '600' },

  // Expanded
  expandedBody: { paddingHorizontal: 14, paddingBottom: 12 },
  exDesc: { fontSize: 13, lineHeight: 21, marginBottom: 10 },
  tipRow: { borderRadius: 10, padding: 11 },
  tipText: { fontSize: 13, lineHeight: 19 },

  // Actions
  actionsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, paddingVertical: 2,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 12,
  },
  actionBtnWide: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 12,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  actionDivider: { width: 1, height: 24, opacity: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 13 },

  // Plan
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, marginBottom: 2 },
  dayBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dayText: { fontWeight: '800', fontSize: 13 },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  planMuscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  planMuscleTag: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600' },
  todayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  todayBtn: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  todayBtnLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Log
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  logName: { fontSize: 14, fontWeight: '700' },
  logMuscle: { fontSize: 12, marginTop: 2 },
  logDoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  xpSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, borderRadius: 12, padding: 12, borderWidth: 1 },
  xpSummaryText: { fontWeight: '800', fontSize: 15 },
});
