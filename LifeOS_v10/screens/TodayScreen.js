import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Animated, RefreshControl,
  KeyboardAvoidingView, Platform, Alert, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import {
  getTodayHabits, saveTodayHabits, getStreak, missedYesterday,
  getCustomHabits, saveCustomHabits, getStreakFreezes, useStreakFreeze,
  earnStreakFreeze, getPersonalRecords, updatePersonalRecords,
  getXPData, getWeekStats, getDeenStreak
} from '../utils/storage';
import { addXP, XP_REWARDS, getLevelInfo } from '../utils/xp';
import { getDailyQuote } from '../data/content';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../utils/haptics';
import Confetti from '../components/Confetti';
import ShareCard from '../components/ShareCard';
import EmptyState from '../components/EmptyState';

const DEFAULT_HABITS = [
  { key: 'exercise', emoji: '🏃', title: 'Exercise', full: '30–45 min workout', minimum: '10 min walk', time: 'Morning', xp: 20, color: '#FB923C', isDefault: true },
  { key: 'reading', emoji: '📖', title: 'Reading', full: '30 min session', minimum: '2 pages', time: 'Night', xp: 15, color: '#6C63FF', isDefault: true },
];

const CHECKLIST = [
  { key: 'water', emoji: '💧', label: 'Drink water first thing' },
  { key: 'noPhone', emoji: '📵', label: 'No phone for 30 min' },
  { key: 'clothes', emoji: '👟', label: 'Put on workout clothes' },
  { key: 'breakfast', emoji: '🍳', label: 'Eat a proper breakfast' },
  { key: 'plan', emoji: '📋', label: "Write today's 3 priorities" },
];

const CUSTOM_COLORS = ['#6C63FF','#FB923C','#4ADE80','#F59E0B','#F87171','#38BDF8','#8B5CF6','#10B981','#FBBF24'];

// Smart greeting based on time
const getSmartContent = (profile) => {
  const h = new Date().getHours();
  if (h >= 4 && h < 7) return { greeting: 'Early bird! 🌅', focus: 'Start strong. Most people are still asleep.', showChecklist: true };
  if (h >= 7 && h < 12) return { greeting: `Good morning${profile?.name ? `, ${profile.name}` : ''} 👋`, focus: 'Best time for your hardest task.', showChecklist: true };
  if (h >= 12 && h < 14) return { greeting: `Good afternoon${profile?.name ? `, ${profile.name}` : ''} ☀️`, focus: 'Post-lunch slump — do something light.', showChecklist: false };
  if (h >= 14 && h < 18) return { greeting: 'Afternoon focus 🎯', focus: 'Energy rising again. Great for deep work.', showChecklist: false };
  if (h >= 18 && h < 21) return { greeting: `Good evening${profile?.name ? `, ${profile.name}` : ''} 🌆`, focus: 'Wind down soon. Reading time coming up.', showChecklist: false };
  return { greeting: `Late night ${profile?.name ? profile.name : ''} 🌙`, focus: "Don't forget your reading habit before sleep.", showChecklist: false };
};

export default function TodayScreen() {
  const { C } = useTheme();
  const [log, setLog] = useState({ exercise: false, reading: false, checklist: {}, top3: ['','',''], top3Done: [false,false,false] });
  const [streaks, setStreaks] = useState({ exercise: 0, reading: 0 });
  const [warnings, setWarnings] = useState({ exercise: false, reading: false });
  const [customHabits, setCustomHabits] = useState([]);
  const [freezes, setFreezes] = useState({ tokens: 3 });
  const [records, setRecords] = useState({});
  const [xpData, setXpData] = useState({ total: 0 });
  const [profile, setProfile] = useState(null);
  const [xpMsg, setXpMsg] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareData, setShareData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: '', emoji: '⭐', color: CUSTOM_COLORS[0] });
  const xpAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef({});

  const getScale = (key) => {
    if (!scaleAnims.current[key]) scaleAnims.current[key] = new Animated.Value(1);
    return scaleAnims.current[key];
  };

  const quote = getDailyQuote();

  const loadData = async () => {
    const [h, custom, fr, rec, xp] = await Promise.all([
      getTodayHabits(),
      getCustomHabits(),
      getStreakFreezes(),
      getPersonalRecords(),
      getXPData(),
    ]);
    setLog(h);
    setCustomHabits(custom);
    setFreezes(fr);
    setRecords(rec);
    setXpData(xp);

    const allHabitKeys = ['exercise', 'reading', ...custom.map(c => c.key)];
    const streakResults = await Promise.all(allHabitKeys.map(k => getStreak(k)));
    const warnResults = await Promise.all(allHabitKeys.map(k => missedYesterday(k)));
    const s = {}, w = {};
    allHabitKeys.forEach((k, i) => { s[k] = streakResults[i]; w[k] = warnResults[i]; });
    setStreaks(s);
    setWarnings(w);

    // Load profile for smart greeting
    const { getProfile } = require('../utils/storage');
    getProfile().then(p => setProfile(p));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    hapticLight();
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const showXPToast = (msg) => {
    setXpMsg(msg);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(xpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setXpMsg(null));
  };

  const bounce = (key) => {
    const anim = getScale(key);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.05, useNativeDriver: true, speed: 60 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 60 }),
    ]).start();
  };

  const allHabits = [...DEFAULT_HABITS, ...customHabits];
  const doneCount = allHabits.filter(h => log[h.key]).length;
  const totalHabits = allHabits.length;

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const toggleHabit = async (habit) => {
    hapticMedium();
    const newVal = !log[habit.key];
    const updated = { ...log, [habit.key]: newVal };
    setLog(updated);
    await saveTodayHabits(updated);
    bounce(habit.key);

    if (newVal) {
      await addXP(habit.xp);
      showXPToast(`+${habit.xp} XP — ${habit.title}!`);
      const newStreak = (streaks[habit.key] || 0) + 1;
      setStreaks(p => ({ ...p, [habit.key]: newStreak }));

      // Update personal records
      const rec = await updatePersonalRecords({
        [`best${habit.key.charAt(0).toUpperCase() + habit.key.slice(1)}Streak`]: newStreak,
        increment: 1,
      });
      setRecords(rec);

      // Check if all habits done → confetti!
      const allDone = allHabits.every(h => h.key === habit.key ? true : !!updated[h.key]);
      if (allDone) {
        hapticSuccess();
        triggerConfetti();
        showXPToast('🎉 All habits done! Incredible day!');
      }
    } else {
      hapticLight();
      setStreaks(p => ({ ...p, [habit.key]: Math.max(0, (p[habit.key] || 1) - 1) }));
    }
  };

  const handleFreezeStreak = async (habitKey) => {
    if (freezes.tokens <= 0) {
      hapticWarning();
      Alert.alert('No Freeze Tokens', 'You have no streak freeze tokens left. Earn them by completing 7-day streaks!');
      return;
    }
    hapticMedium();
    Alert.alert(
      '❄️ Use Streak Freeze?',
      `You have ${freezes.tokens} token${freezes.tokens !== 1 ? 's' : ''}. This will protect your ${habitKey} streak for today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Token',
          onPress: async () => {
            const success = await useStreakFreeze(habitKey);
            if (success) {
              const fr = await getStreakFreezes();
              setFreezes(fr);
              showXPToast(`❄️ Streak frozen! ${fr.tokens} tokens left`);
            }
          },
        },
      ]
    );
  };

  const addCustomHabit = async () => {
    if (!newHabit.title.trim()) return;
    hapticSuccess();
    const habit = {
      key: `custom_${Date.now()}`,
      emoji: newHabit.emoji,
      title: newHabit.title.trim(),
      full: 'Complete daily',
      minimum: 'Do any amount',
      time: 'Anytime',
      xp: 15,
      color: newHabit.color,
      isDefault: false,
    };
    const updated = [...customHabits, habit];
    setCustomHabits(updated);
    await saveCustomHabits(updated);
    setNewHabit({ title: '', emoji: '⭐', color: CUSTOM_COLORS[0] });
    setShowAddHabit(false);
  };

  const deleteCustomHabit = (key) => {
    hapticWarning();
    Alert.alert('Delete Habit', 'Remove this habit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = customHabits.filter(h => h.key !== key);
          setCustomHabits(updated);
          await saveCustomHabits(updated);
        },
      },
    ]);
  };

  const openShareCard = async () => {
    hapticLight();
    const [weekStats, xp, exStreak, rdStreak, prStreak] = await Promise.all([
      getWeekStats(),
      getXPData(),
      getStreak('exercise'),
      getStreak('reading'),
      getDeenStreak(),
    ]);
    const { current } = getLevelInfo(xp.total);
    setShareData({
      ...weekStats,
      totalXP: xp.total,
      level: current.level,
      levelTitle: current.title,
      levelEmoji: current.emoji,
      exerciseStreak: exStreak,
      readingStreak: rdStreak,
      prayerStreak: prStreak,
    });
    setShowShare(true);
  };

  const toggleChecklist = async (key) => {
    hapticLight();
    const updated = { ...log, checklist: { ...log.checklist, [key]: !log.checklist?.[key] } };
    setLog(updated);
    await saveTodayHabits(updated);
  };

  const updateTop3 = async (idx, val) => {
    const top3 = [...(log.top3 || ['','',''])]; top3[idx] = val;
    const updated = { ...log, top3 }; setLog(updated); await saveTodayHabits(updated);
  };

  const toggleTop3Done = async (idx) => {
    hapticLight();
    const top3Done = [...(log.top3Done || [false,false,false])];
    top3Done[idx] = !top3Done[idx];
    const updated = { ...log, top3Done }; setLog(updated); await saveTodayHabits(updated);
    if (top3Done.every(Boolean)) {
      hapticSuccess();
      await addXP(XP_REWARDS.top3Done);
      showXPToast(`+${XP_REWARDS.top3Done} XP — All 3 tasks done!`);
    }
  };

  const smart = getSmartContent(profile);
  const checkDone = CHECKLIST.filter(c => log.checklist?.[c.key]).length;
  const s = makeStyles(C);
  const { current: lvl } = getLevelInfo(xpData.total);

  return (
    <SafeAreaView style={s.safe}>
      <Confetti visible={showConfetti} count={70} />
      <ShareCard visible={showShare} onClose={() => setShowShare(false)} data={shareData} />

      {/* XP Toast */}
      {xpMsg && (
        <Animated.View style={[s.xpToast, { opacity: xpAnim }]}>
          <Text style={s.xpToastText}>{xpMsg}</Text>
        </Animated.View>
      )}

      {/* Add Custom Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="slide" onRequestClose={() => setShowAddHabit(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.modalTitle, { color: C.text }]}>Add Custom Habit</Text>

              <View style={s.emojiRow}>
                {['⭐','🎯','💡','🧠','🏆','✍️','🎵','🌿','💊','🛡️','🙏','📝'].map(e => (
                  <TouchableOpacity key={e} style={[s.emojiBtn, newHabit.emoji === e && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => { hapticLight(); setNewHabit(p => ({ ...p, emoji: e })); }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[s.modalInput, { color: C.text, backgroundColor: C.surface, borderColor: C.border }]}
                placeholder="Habit name (e.g. Meditate, Walk, Stretch)"
                placeholderTextColor={C.muted}
                value={newHabit.title}
                onChangeText={v => setNewHabit(p => ({ ...p, title: v }))}
                autoFocus
              />

              <View style={s.colorRow}>
                {CUSTOM_COLORS.map(col => (
                  <TouchableOpacity key={col} style={[s.colorBtn, { backgroundColor: col }, newHabit.color === col && s.colorBtnActive]} onPress={() => { hapticLight(); setNewHabit(p => ({ ...p, color: col })); }} />
                ))}
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={[s.modalCancelBtn, { borderColor: C.border }]} onPress={() => setShowAddHabit(false)}>
                  <Text style={[{ color: C.muted, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalSaveBtn, { backgroundColor: C.accent }]} onPress={addCustomHabit}>
                  <Text style={[{ color: '#fff', fontWeight: '700' }]}>Add Habit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greeting, { color: C.text }]}>{smart.greeting}</Text>
              <Text style={[s.focusTip, { color: C.muted }]}>{smart.focus}</Text>
            </View>
            <TouchableOpacity style={[s.shareBtn, { backgroundColor: C.accentSoft, borderColor: C.accent + '40' }]} onPress={openShareCard} activeOpacity={0.8}>
              <Text style={{ fontSize: 16 }}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Level + freeze tokens strip */}
          <View style={[s.statusStrip, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.statusItem}>
              <Text style={{ fontSize: 14 }}>{lvl.emoji}</Text>
              <Text style={[s.statusLabel, { color: C.muted }]}>Lv.{lvl.level} {lvl.title}</Text>
            </View>
            <View style={[s.statusDivider, { backgroundColor: C.border }]} />
            <View style={s.statusItem}>
              <Text style={{ fontSize: 14 }}>❄️</Text>
              <Text style={[s.statusLabel, { color: C.muted }]}>{freezes.tokens} freeze{freezes.tokens !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[s.statusDivider, { backgroundColor: C.border }]} />
            <View style={s.statusItem}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={[s.statusLabel, { color: C.muted }]}>{xpData.total} XP</Text>
            </View>
          </View>

          {/* Quote */}
          <View style={[s.quoteCard, { backgroundColor: C.accent + '10', borderColor: C.accent + '25' }]}>
            <Text style={[s.quoteText, { color: C.text }]}>"{quote.text}"</Text>
            <Text style={[s.quoteAuthor, { color: C.accent }]}>— {quote.author}</Text>
          </View>

          {/* Progress */}
          <View style={[s.progressCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.progressHeader}>
              <Text style={[s.progressLabel, { color: C.muted }]}>TODAY'S HABITS</Text>
              <Text style={[s.progressCount, { color: doneCount === totalHabits ? C.green : C.text }]}>
                {doneCount}/{totalHabits} done
              </Text>
            </View>
            <View style={[s.progressBarBg, { backgroundColor: C.border }]}>
              <View style={[s.progressBarFill, {
                width: `${totalHabits > 0 ? (doneCount / totalHabits) * 100 : 0}%`,
                backgroundColor: doneCount === totalHabits ? C.green : C.accent,
              }]} />
            </View>
            {doneCount === totalHabits && totalHabits > 0 && (
              <Text style={[s.allDoneText, { color: C.green }]}>🎉 All habits done! Perfect day!</Text>
            )}
          </View>

          {/* All Habit Cards */}
          {allHabits.map((habit) => {
            const done = !!log[habit.key];
            const warned = warnings[habit.key] && !done;
            return (
              <Animated.View key={habit.key} style={[s.habitCard, { backgroundColor: C.card, borderColor: done ? habit.color + '50' : C.border, transform: [{ scale: getScale(habit.key) }] }]}>
                {warned && (
                  <View style={[s.warnBanner, { backgroundColor: C.orange + '15' }]}>
                    <Text style={[s.warnText, { color: C.orange }]}>⚠️ Missed yesterday — never miss twice!</Text>
                    <TouchableOpacity onPress={() => handleFreezeStreak(habit.key)} style={[s.freezeBtn, { backgroundColor: '#38BDF820' }]}>
                      <Text style={[s.freezeBtnText, { color: '#38BDF8' }]}>❄️ Freeze</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={s.habitRow}>
                  <View style={[s.habitIcon, { backgroundColor: habit.color + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{habit.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.habitTitle, { color: C.text }]}>{habit.title}</Text>
                    <Text style={[s.habitTime, { color: C.muted }]}>{habit.time}</Text>
                  </View>
                  <View style={s.habitMeta}>
                    {(streaks[habit.key] || 0) > 0 && (
                      <View style={[s.streakBadge, { backgroundColor: habit.color + '18' }]}>
                        <Text style={[s.streakText, { color: habit.color }]}>🔥 {streaks[habit.key]}</Text>
                      </View>
                    )}
                    <Text style={[s.habitXP, { color: C.muted }]}>+{habit.xp}XP</Text>
                    {!habit.isDefault && (
                      <TouchableOpacity onPress={() => deleteCustomHabit(habit.key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={[{ color: C.muted, fontSize: 14 }]}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {habit.isDefault && (
                  <View style={s.versionsRow}>
                    <View style={[s.versionChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <Text style={[s.versionLabel, { color: C.muted }]}>FULL</Text>
                      <Text style={[s.versionText, { color: C.text }]}>{habit.full}</Text>
                    </View>
                    <View style={[s.versionChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <Text style={[s.versionLabel, { color: C.muted }]}>MIN</Text>
                      <Text style={[s.versionText, { color: C.text }]}>{habit.minimum}</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.doneBtn, { backgroundColor: done ? habit.color : habit.color + '18', borderColor: habit.color + '40' }]}
                  onPress={() => toggleHabit(habit)}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 16, color: done ? '#fff' : habit.color }}>{done ? '✓' : '○'}</Text>
                  <Text style={[s.doneBtnText, { color: done ? '#fff' : habit.color }]}>
                    {done ? 'Done!' : 'Mark as Done'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Add Custom Habit Button */}
          <TouchableOpacity style={[s.addHabitBtn, { borderColor: C.border }]} onPress={() => { hapticLight(); setShowAddHabit(true); }} activeOpacity={0.8}>
            <Text style={[s.addHabitText, { color: C.muted }]}>+ Add Custom Habit</Text>
          </TouchableOpacity>

          {/* Top 3 Tasks */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.cardHeader}>
              <Text style={[s.cardTitle, { color: C.text }]}>🎯 Top 3 Today</Text>
              <Text style={[s.cardSub, { color: C.muted }]}>{(log.top3Done || []).filter(Boolean).length}/3</Text>
            </View>
            {[0,1,2].map(i => (
              <View key={i} style={[s.top3Row, { borderBottomColor: C.border }]}>
                <TouchableOpacity style={[s.top3Check, log.top3Done?.[i] && { backgroundColor: C.accent, borderColor: C.accent }]} onPress={() => toggleTop3Done(i)}>
                  {log.top3Done?.[i] && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>✓</Text>}
                </TouchableOpacity>
                <Text style={[s.top3Num, { color: C.muted }]}>{i+1}.</Text>
                <TextInput
                  style={[s.top3Input, { color: log.top3Done?.[i] ? C.muted : C.text }]}
                  placeholder={`Priority ${i+1}...`}
                  placeholderTextColor={C.muted + '60'}
                  value={log.top3?.[i] || ''}
                  onChangeText={v => updateTop3(i, v)}
                  onFocus={() => hapticLight()}
                  textDecorationLine={log.top3Done?.[i] ? 'line-through' : 'none'}
                />
              </View>
            ))}
          </View>

          {/* Morning Checklist (smart — only show in morning) */}
          {smart.showChecklist && (
            <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={s.cardHeader}>
                <Text style={[s.cardTitle, { color: C.text }]}>☀️ Morning Routine</Text>
                <View style={[s.checkCountBadge, { backgroundColor: checkDone === CHECKLIST.length ? C.green + '20' : C.surface }]}>
                  <Text style={[s.checkCountText, { color: checkDone === CHECKLIST.length ? C.green : C.muted }]}>{checkDone}/{CHECKLIST.length}</Text>
                </View>
              </View>
              {CHECKLIST.map((item) => (
                <TouchableOpacity key={item.key} style={s.checkItem} onPress={() => toggleChecklist(item.key)} activeOpacity={0.75}>
                  <View style={[s.checkbox, log.checklist?.[item.key] && { backgroundColor: C.green, borderColor: C.green }]}>
                    {log.checklist?.[item.key] && <Text style={{ color: '#000', fontWeight: '800', fontSize: 10 }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 18, marginHorizontal: 10 }}>{item.emoji}</Text>
                  <Text style={[s.checkLabel, { color: log.checklist?.[item.key] ? C.muted : C.text, textDecorationLine: log.checklist?.[item.key] ? 'line-through' : 'none' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Personal Records */}
          {(records.bestExerciseStreak > 0 || records.bestReadingStreak > 0) && (
            <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[s.cardTitle, { color: C.text }]}>🏆 Personal Records</Text>
              <View style={s.recordsRow}>
                {[
                  { label: 'Best Exercise', val: records.bestExerciseStreak, unit: 'days', emoji: '🏃' },
                  { label: 'Best Reading', val: records.bestReadingStreak, unit: 'days', emoji: '📖' },
                  { label: 'Total Habits', val: records.totalHabitsCompleted, unit: 'done', emoji: '✅' },
                ].map(r => (
                  <View key={r.label} style={[s.recordItem, { backgroundColor: C.surface }]}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</Text>
                    <Text style={[s.recordVal, { color: C.accent }]}>{r.val || 0}</Text>
                    <Text style={[s.recordUnit, { color: C.muted }]}>{r.unit}</Text>
                    <Text style={[s.recordLabel, { color: C.muted }]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Streak Freeze Info */}
          <TouchableOpacity style={[s.freezeInfoCard, { backgroundColor: '#38BDF810', borderColor: '#38BDF825' }]} onPress={() => Alert.alert('❄️ Streak Freeze Tokens', `You have ${freezes.tokens} freeze token${freezes.tokens !== 1 ? 's' : ''}.\n\nUse a token to protect a streak when you miss a day.\n\nEarn tokens by completing 7-day streaks!`)} activeOpacity={0.85}>
            <Text style={{ fontSize: 20 }}>❄️</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.freezeTitle, { color: '#38BDF8' }]}>{freezes.tokens} Streak Freeze Token{freezes.tokens !== 1 ? 's' : ''}</Text>
              <Text style={[s.freezeDesc, { color: C.muted }]}>Tap to learn more · Tap "❄️ Freeze" on a habit when you miss</Text>
            </View>
          </TouchableOpacity>

          {/* Rule */}
          <View style={[s.ruleCard, { backgroundColor: C.accent + '10', borderColor: C.accent + '25' }]}>
            <Text style={{ fontSize: 20 }}>📌</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.ruleTitle, { color: C.accent }]}>Never Miss Twice</Text>
              <Text style={[s.ruleText, { color: C.text }]}>Miss once? Totally fine. Just get back tomorrow. Two misses in a row is where habits die.</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 16, paddingBottom: 40 },
  xpToast: {
    position: 'absolute', top: 56, alignSelf: 'center', zIndex: 999,
    backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99,
    shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  xpToastText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, marginTop: 6, gap: 10 },
  greeting: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28 },
  focusTip: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  shareBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statusStrip: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 10, marginBottom: 12 },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  statusDivider: { width: 1, height: '100%', opacity: 0.5 },
  quoteCard: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  quoteText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 6 },
  quoteAuthor: { fontSize: 12, fontWeight: '700' },
  progressCard: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  progressCount: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 7, borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 99 },
  allDoneText: { fontSize: 13, fontWeight: '700', marginTop: 10 },
  habitCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  warnBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 9, marginBottom: 12 },
  warnText: { fontSize: 12, fontWeight: '600', flex: 1 },
  freezeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginLeft: 8 },
  freezeBtnText: { fontSize: 12, fontWeight: '700' },
  habitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  habitIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  habitTime: { fontSize: 12, marginTop: 2 },
  habitMeta: { alignItems: 'flex-end', gap: 5 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '800' },
  habitXP: { fontSize: 11, fontWeight: '700' },
  versionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  versionChip: { flex: 1, borderRadius: 10, padding: 10, borderWidth: 1 },
  versionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  versionText: { fontSize: 12, fontWeight: '600' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 12, borderWidth: 1,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800' },
  addHabitBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', marginBottom: 12 },
  addHabitText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  cardSub: { fontSize: 13, fontWeight: '600' },
  checkCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  checkCountText: { fontSize: 12, fontWeight: '700' },
  top3Row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  top3Check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  top3Num: { fontSize: 14, fontWeight: '700', width: 18 },
  top3Input: { flex: 1, fontSize: 14, paddingVertical: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: 14 },
  recordsRow: { flexDirection: 'row', gap: 10 },
  recordItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  recordVal: { fontSize: 22, fontWeight: '900' },
  recordUnit: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  recordLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  freezeInfoCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 12 },
  freezeTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  freezeDesc: { fontSize: 11, lineHeight: 16 },
  ruleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  ruleText: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderRadius: 24, borderWidth: 1, padding: 20, margin: 12, marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  modalInput: { borderRadius: 12, padding: 14, borderWidth: 1, fontSize: 15, marginBottom: 14 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center' },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },
  colorBtnActive: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalSaveBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
});
