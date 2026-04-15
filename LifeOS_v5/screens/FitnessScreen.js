import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Modal, Animated, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { EXERCISES, MUSCLE_GROUPS, TIERS, WEEKLY_PLANS } from '../data/fitness';
import { addXP, XP_REWARDS } from '../utils/xp';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const LOCATION_ICONS = { home: '🏠', outdoor: '🌳', gym: '🏋️' };

// Extract YouTube video ID from URL
const getYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|v=)([^&\n?]+)/);
  return match ? match[1] : null;
};

// Get YouTube thumbnail
const getThumb = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
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
  const [videoModal, setVideoModal] = useState(null); // exercise object or null
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
            {restTimer > 0 ? `⏱ Rest: ${restTimer}s — tap to skip` : '✅ Rest done! Go next set.'}
          </Text>
        </TouchableOpacity>
      )}

      {/* In-app Video Modal */}
      <Modal
        visible={!!videoModal}
        animationType="slide"
        onRequestClose={() => setVideoModal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={s.videoHeader}>
            <TouchableOpacity onPress={() => setVideoModal(null)} style={s.closeVideoBtn}>
              <Text style={s.closeVideoText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={s.videoTitle} numberOfLines={1}>{videoModal?.name}</Text>
          </View>
          {videoModal && (
            <WebView
              style={{ flex: 1 }}
              source={{ uri: `https://www.youtube.com/embed/${getYouTubeId(videoModal.youtube)}?autoplay=1&rel=0&modestbranding=1` }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          )}
          {videoModal && (
            <View style={[s.videoInfoBox, { backgroundColor: '#111' }]}>
              <Text style={s.videoInfoName}>{videoModal.name}</Text>
              <Text style={s.videoInfoSets}>{videoModal.sets} · Rest: {videoModal.rest}</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
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

        {/* Tab Nav */}
        <View style={s.tabRow}>
          {[['train','🏋️ Train'],['plan','📅 Plan'],['log','📊 Log']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TRAIN TAB ── */}
        {tab === 'train' && (
          <>
            {/* Tier Selector */}
            <View style={s.card}>
              <Text style={s.cardLabel}>TRAINING TIER</Text>
              <View style={s.tierRow}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t.id} style={[s.tierBtn, tier === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]} onPress={() => setTier(t.id)}>
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</Text>
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
                  <Text style={[s.locationText, { color: location === loc ? C.accent : C.muted }]}>
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Muscle Group */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.muscleScroll}>
              {MUSCLE_GROUPS.map(mg => (
                <TouchableOpacity key={mg.id} style={[s.muscleChip, muscle === mg.id && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setMuscle(mg.id)}>
                  <Text style={{ fontSize: 16 }}>{mg.emoji}</Text>
                  <Text style={[s.muscleText, { color: muscle === mg.id ? C.accent : C.muted }]}>{mg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise Count */}
            <View style={s.exerciseCountRow}>
              <Text style={[s.exerciseCount, { color: C.muted }]}>
                {exercises.length} exercises · {muscle} · {tier} · {location}
              </Text>
            </View>

            {/* Exercise Cards */}
            {exercises.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>🔄</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No exercises for this combination. Try switching location.</Text>
              </View>
            ) : (
              exercises.map((exercise, idx) => {
                const key = `${muscle}_${exercise.name}`;
                const done = completedToday[key];
                const thumbUrl = getThumb(exercise.youtube);
                return (
                  <View key={idx} style={[s.exerciseCard, done && { borderColor: C.green }]}>
                    
                    {/* Video Thumbnail */}
                    <TouchableOpacity style={s.thumbContainer} onPress={() => setVideoModal(exercise)} activeOpacity={0.9}>
                      {thumbUrl ? (
                        <View style={s.thumbWrapper}>
                          <WebView
                            source={{ uri: thumbUrl }}
                            style={s.thumbWebView}
                            scrollEnabled={false}
                            pointerEvents="none"
                          />
                          <View style={s.playOverlay}>
                            <View style={[s.playBtn, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                              <Text style={s.playIcon}>▶</Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={[s.thumbPlaceholder, { backgroundColor: C.surface }]}>
                          <Text style={{ fontSize: 36 }}>▶</Text>
                          <Text style={[{ color: C.muted, fontSize: 12, marginTop: 4 }]}>Watch Video</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Exercise Info */}
                    <View style={s.exerciseBody}>
                      <View style={s.exerciseTitleRow}>
                        <Text style={[s.exerciseName, { color: C.text }]}>{exercise.name}</Text>
                        <View style={[s.xpBadge, { backgroundColor: C.accentSoft }]}>
                          <Text style={[s.xpBadgeText, { color: C.accent }]}>+{exercise.xp}XP</Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text style={[s.exerciseDesc, { color: C.muted }]} numberOfLines={3}>
                        {exercise.desc}
                      </Text>

                      {/* Meta chips */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.metaScroll}>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.text }]}>📋 {exercise.sets}</Text>
                        </View>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.text }]}>⏱ {exercise.rest}</Text>
                        </View>
                        <View style={[s.metaChip, { backgroundColor: C.surface }]}>
                          <Text style={[s.metaText, { color: C.text }]}>🔧 {exercise.equipment}</Text>
                        </View>
                        {exercise.location.map(loc => (
                          <View key={loc} style={[s.metaChip, { backgroundColor: C.surface }]}>
                            <Text style={[s.metaText, { color: C.muted }]}>{LOCATION_ICONS[loc]}</Text>
                          </View>
                        ))}
                      </ScrollView>

                      {/* Pro Tip */}
                      <View style={[s.tipBox, { backgroundColor: C.yellowSoft }]}>
                        <Text style={[s.tipText, { color: C.text }]}>💡 {exercise.tip}</Text>
                      </View>

                      {/* Action Buttons */}
                      <View style={s.actionRow}>
                        <TouchableOpacity style={[s.watchBtn, { backgroundColor: C.redSoft }]} onPress={() => setVideoModal(exercise)} activeOpacity={0.8}>
                          <Text style={[s.watchBtnText, { color: C.red }]}>▶ Watch Video</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.doneBtn, { backgroundColor: done ? C.green : C.accent }]} onPress={() => markDone(exercise)} activeOpacity={0.8}>
                          <Text style={s.doneBtnText}>{done ? '✓ Done!' : 'Mark Done'}</Text>
                        </TouchableOpacity>
                      </View>
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
            {/* Tier picker */}
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
                        return found ? (
                          <Text key={mg} style={[s.planMuscleChip, { backgroundColor: C.surface, color: C.muted }]}>
                            {found.emoji} {found.label}
                          </Text>
                        ) : null;
                      })}
                    </View>
                  </View>
                  {d.day === today && <Text style={[{ color: C.accent, fontSize: 12, fontWeight: '700' }]}>Today</Text>}
                </View>
              ))}
            </View>

            {todayPlan && todayPlan.focus.length > 0 && (
              <View style={[s.card, { borderColor: C.accent + '44' }]}>
                <Text style={[s.cardTitle, { color: C.text }]}>Today: {todayPlan.label}</Text>
                <Text style={[{ color: C.muted, fontSize: 13, marginBottom: 12 }]}>Tap a muscle to start training:</Text>
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

        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: C.text }]}>📊 Today's Workout Log</Text>
            {Object.keys(completedToday).filter(k => completedToday[k]).length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>🏋️</Text>
                <Text style={[s.emptyText, { color: C.muted }]}>No exercises logged yet. Go train!</Text>
              </View>
            ) : (
              Object.keys(completedToday).filter(k => completedToday[k]).map(k => {
                const parts = k.split('_');
                const mg = parts[0];
                const name = parts.slice(1).join('_');
                const mgInfo = MUSCLE_GROUPS.find(m => m.id === mg);
                return (
                  <View key={k} style={[s.logRow, { borderBottomColor: C.border }]}>
                    <Text style={{ fontSize: 22 }}>{mgInfo?.emoji || '💪'}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
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
  videoHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#111' },
  closeVideoBtn: { paddingRight: 16 },
  closeVideoText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  videoTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },
  videoInfoBox: { padding: 16 },
  videoInfoName: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  videoInfoSets: { color: '#aaa', fontSize: 13 },
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
  tierBtnText: { fontSize: 12, fontWeight: '700' },
  tierDesc: { fontSize: 12, lineHeight: 18 },
  locationRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  locationText: { fontSize: 12, fontWeight: '600' },
  muscleScroll: { marginBottom: 10 },
  muscleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  muscleText: { fontSize: 12, fontWeight: '600' },
  exerciseCountRow: { marginBottom: 10 },
  exerciseCount: { fontSize: 12 },

  // Exercise Card
  exerciseCard: {
    backgroundColor: C.card, borderRadius: 18, marginBottom: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  thumbContainer: { width: '100%', height: 180, backgroundColor: '#000' },
  thumbWrapper: { flex: 1, position: 'relative' },
  thumbWebView: { flex: 1 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 22, marginLeft: 4 },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exerciseBody: { padding: 14 },
  exerciseTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  exerciseName: { fontSize: 18, fontWeight: '800', flex: 1, lineHeight: 24 },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginLeft: 8 },
  xpBadgeText: { fontSize: 12, fontWeight: '800' },
  exerciseDesc: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  metaScroll: { marginBottom: 10 },
  metaChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },
  tipBox: { borderRadius: 10, padding: 10, marginBottom: 12 },
  tipText: { fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10 },
  watchBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  watchBtnText: { fontWeight: '700', fontSize: 14 },
  doneBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, marginBottom: 4 },
  planDayBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planDayText: { fontWeight: '800', fontSize: 13 },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  planMuscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  planMuscleChip: { fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '600' },
  todayMuscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  todayMuscleBtn: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, minWidth: 80 },
  todayMuscleName: { fontSize: 12, fontWeight: '700', marginTop: 4 },

  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  logName: { fontSize: 14, fontWeight: '600' },
  logMuscle: { fontSize: 12, marginTop: 2 },
  logDone: { fontWeight: '700', fontSize: 13 },
  totalXPCard: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  totalXPText: { fontWeight: '800', fontSize: 15 },
});
