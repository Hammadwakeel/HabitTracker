import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Image, Animated, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../utils/ThemeContext';
import { saveProfile, setOnboarded } from '../utils/storage';

const { width } = Dimensions.get('window');

const GOALS = [
  { id: 'muscle', label: 'Build Muscle', emoji: '💪' },
  { id: 'lose_weight', label: 'Lose Weight', emoji: '🔥' },
  { id: 'fitness', label: 'General Fitness', emoji: '🏃' },
  { id: 'mental', label: 'Mental Clarity', emoji: '🧘' },
  { id: 'deen', label: 'Spiritual Growth', emoji: '🕌' },
  { id: 'career', label: 'Career & Skills', emoji: '🎓' },
  { id: 'finance', label: 'Financial Health', emoji: '💰' },
  { id: 'habits', label: 'Build Habits', emoji: '⚡' },
];

const WAKE_TIMES = ['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 'Varies'];
const SLEEP_TIMES = ['9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM', 'Varies'];
const FITNESS_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting out', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', desc: '3–12 months experience', emoji: '⚡' },
  { id: 'pro', label: 'Pro', desc: '1+ years training', emoji: '🔥' },
];
const WORK_LOCATIONS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { id: 'gym', label: 'Gym', emoji: '🏋️' },
];

export default function OnboardingScreen({ onComplete }) {
  const { C } = useTheme();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    city: '',
    profilePic: null,
    goals: [],
    wakeTime: '8:00 AM',
    sleepTime: '12:00 AM',
    fitnessLevel: 'beginner',
    workoutLocation: ['home'],
    revenueGoal: '',
    monthlyBudget: '',
    projects: [],
    religion: '',
    showDeen: false,
  });
  const [newProject, setNewProject] = useState('');

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const toggleGoal = (id) => {
    const goals = profile.goals.includes(id)
      ? profile.goals.filter(g => g !== id)
      : [...profile.goals, id];
    update('goals', goals);
  };
  const toggleLocation = (id) => {
    const locs = profile.workoutLocation.includes(id)
      ? profile.workoutLocation.filter(l => l !== id)
      : [...profile.workoutLocation, id];
    update('workoutLocation', locs);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) update('profilePic', result.assets[0].uri);
  };

  const addProject = () => {
    if (!newProject.trim()) return;
    update('projects', [...profile.projects, { id: Date.now(), name: newProject.trim(), color: '#6C63FF' }]);
    setNewProject('');
  };

  const finish = async () => {
    await saveProfile(profile);
    await setOnboarded();
    onComplete();
  };

  const s = makeStyles(C);

  const STEPS = [
    // Step 0 - Welcome
    <View key={0} style={s.stepContainer}>
      <Text style={s.stepEmoji}>👋</Text>
      <Text style={s.stepTitle}>Welcome to Life OS</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>Your personal system for building the life you want. Let's set it up in 2 minutes.</Text>
      <View style={s.featureList}>
        {['🎯 Habit tracking & streaks','💪 Fitness with video guides','🕌 Prayer & spiritual tracking','💰 Finance & expense tracking','🧘 Mental health & breathing','🎓 Learning & career tools'].map((f, i) => (
          <Text key={i} style={[s.featureItem, { color: C.text }]}>{f}</Text>
        ))}
      </View>
    </View>,

    // Step 1 - Basic Info
    <View key={1} style={s.stepContainer}>
      <Text style={s.stepEmoji}>🧑</Text>
      <Text style={s.stepTitle}>About You</Text>
      <TouchableOpacity style={s.picPicker} onPress={pickImage}>
        {profile.profilePic
          ? <Image source={{ uri: profile.profilePic }} style={s.picPreview} />
          : <View style={[s.picPlaceholder, { backgroundColor: C.accentSoft, borderColor: C.accent }]}>
              <Text style={{ fontSize: 36 }}>📷</Text>
              <Text style={[{ color: C.accent, fontWeight: '600', marginTop: 6, fontSize: 13 }]}>Add Photo (Optional)</Text>
            </View>
        }
      </TouchableOpacity>
      <TextInput style={s.input} placeholder="Your name *" placeholderTextColor={C.muted} value={profile.name} onChangeText={v => update('name', v)} />
      <View style={s.row}>
        <TextInput style={[s.input, { flex: 0.4 }]} placeholder="Age" placeholderTextColor={C.muted} keyboardType="numeric" value={profile.age} onChangeText={v => update('age', v)} />
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Your city" placeholderTextColor={C.muted} value={profile.city} onChangeText={v => update('city', v)} />
      </View>
      <View style={s.toggleRow}>
        <Text style={[s.toggleLabel, { color: C.text }]}>Include Islamic / Deen features?</Text>
        <TouchableOpacity style={[s.toggle, profile.showDeen && { backgroundColor: C.accent }]} onPress={() => update('showDeen', !profile.showDeen)}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{profile.showDeen ? 'YES' : 'NO'}</Text>
        </TouchableOpacity>
      </View>
      {profile.showDeen && (
        <TextInput style={s.input} placeholder="Your religion (e.g. Islam)" placeholderTextColor={C.muted} value={profile.religion} onChangeText={v => update('religion', v)} />
      )}
    </View>,

    // Step 2 - Goals
    <View key={2} style={s.stepContainer}>
      <Text style={s.stepEmoji}>🎯</Text>
      <Text style={s.stepTitle}>Your Goals</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>Select all that apply. We'll personalize the app for you.</Text>
      <View style={s.goalGrid}>
        {GOALS.map(goal => (
          <TouchableOpacity key={goal.id} style={[s.goalBtn, profile.goals.includes(goal.id) && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => toggleGoal(goal.id)}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>{goal.emoji}</Text>
            <Text style={[s.goalLabel, { color: profile.goals.includes(goal.id) ? C.accent : C.text }]}>{goal.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,

    // Step 3 - Schedule
    <View key={3} style={s.stepContainer}>
      <Text style={s.stepEmoji}>⏰</Text>
      <Text style={s.stepTitle}>Your Schedule</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>This helps us schedule notifications at the right time.</Text>
      <Text style={[s.fieldLabel, { color: C.muted }]}>I usually wake up at:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
        {WAKE_TIMES.map(t => (
          <TouchableOpacity key={t} style={[s.timeChip, profile.wakeTime === t && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => update('wakeTime', t)}>
            <Text style={[s.timeChipText, { color: profile.wakeTime === t ? C.accent : C.muted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={[s.fieldLabel, { color: C.muted }]}>I usually sleep at:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
        {SLEEP_TIMES.map(t => (
          <TouchableOpacity key={t} style={[s.timeChip, profile.sleepTime === t && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => update('sleepTime', t)}>
            <Text style={[s.timeChipText, { color: profile.sleepTime === t ? C.accent : C.muted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>,

    // Step 4 - Fitness
    <View key={4} style={s.stepContainer}>
      <Text style={s.stepEmoji}>💪</Text>
      <Text style={s.stepTitle}>Fitness Setup</Text>
      <Text style={[s.fieldLabel, { color: C.muted }]}>Current fitness level:</Text>
      {FITNESS_LEVELS.map(lv => (
        <TouchableOpacity key={lv.id} style={[s.fitCard, profile.fitnessLevel === lv.id && { borderColor: C.accent, backgroundColor: C.accentSoft }]} onPress={() => update('fitnessLevel', lv.id)}>
          <Text style={{ fontSize: 24 }}>{lv.emoji}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.fitLabel, { color: C.text }]}>{lv.label}</Text>
            <Text style={[s.fitDesc, { color: C.muted }]}>{lv.desc}</Text>
          </View>
          {profile.fitnessLevel === lv.id && <Text style={[{ color: C.accent, fontWeight: '800' }]}>✓</Text>}
        </TouchableOpacity>
      ))}
      <Text style={[s.fieldLabel, { color: C.muted, marginTop: 10 }]}>Where do you work out? (select all)</Text>
      <View style={s.locRow}>
        {WORK_LOCATIONS.map(loc => (
          <TouchableOpacity key={loc.id} style={[s.locBtn, profile.workoutLocation.includes(loc.id) && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => toggleLocation(loc.id)}>
            <Text style={{ fontSize: 22 }}>{loc.emoji}</Text>
            <Text style={[s.locLabel, { color: profile.workoutLocation.includes(loc.id) ? C.accent : C.muted }]}>{loc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,

    // Step 5 - Projects
    <View key={5} style={s.stepContainer}>
      <Text style={s.stepEmoji}>📁</Text>
      <Text style={s.stepTitle}>Your Projects</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>Add your current projects to track time spent on each.</Text>
      <View style={s.row}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Project name (e.g. My Startup)" placeholderTextColor={C.muted} value={newProject} onChangeText={setNewProject} onSubmitEditing={addProject} />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent }]} onPress={addProject}>
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      {profile.projects.map(p => (
        <View key={p.id} style={[s.projectChip, { backgroundColor: C.accentSoft }]}>
          <Text style={[{ color: C.accent, fontWeight: '600' }]}>📁 {p.name}</Text>
          <TouchableOpacity onPress={() => update('projects', profile.projects.filter(pr => pr.id !== p.id))}>
            <Text style={{ color: C.red }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {profile.projects.length === 0 && <Text style={[s.hint, { color: C.muted }]}>No projects yet. You can always add them later in the Focus tab.</Text>}
    </View>,

    // Step 6 - Finance
    <View key={6} style={s.stepContainer}>
      <Text style={s.stepEmoji}>💰</Text>
      <Text style={s.stepTitle}>Finance Setup</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>Optional — helps track budgets and income goals.</Text>
      <Text style={[s.fieldLabel, { color: C.muted }]}>Monthly budget (₨ or your currency):</Text>
      <TextInput style={s.input} placeholder="e.g. 50000" placeholderTextColor={C.muted} keyboardType="numeric" value={profile.monthlyBudget} onChangeText={v => update('monthlyBudget', v)} />
      <Text style={[s.fieldLabel, { color: C.muted }]}>Monthly income/revenue goal:</Text>
      <TextInput style={s.input} placeholder="e.g. 100000" placeholderTextColor={C.muted} keyboardType="numeric" value={profile.revenueGoal} onChangeText={v => update('revenueGoal', v)} />
      <Text style={[s.skipNote, { color: C.muted }]}>You can skip this and set it later.</Text>
    </View>,

    // Step 7 - Ready
    <View key={7} style={s.stepContainer}>
      <Text style={s.stepEmoji}>🚀</Text>
      <Text style={s.stepTitle}>You're all set{profile.name ? `, ${profile.name}` : ''}!</Text>
      <Text style={[s.stepDesc, { color: C.muted }]}>Your Life OS is personalized and ready. Everything can be changed in Settings at any time.</Text>
      {profile.profilePic && <Image source={{ uri: profile.profilePic }} style={s.finalPic} />}
      <View style={s.summaryCard}>
        {profile.goals.length > 0 && <Text style={[s.summaryItem, { color: C.text }]}>🎯 {profile.goals.length} goals selected</Text>}
        {profile.projects.length > 0 && <Text style={[s.summaryItem, { color: C.text }]}>📁 {profile.projects.length} project{profile.projects.length > 1 ? 's' : ''} added</Text>}
        <Text style={[s.summaryItem, { color: C.text }]}>💪 Fitness: {profile.fitnessLevel}</Text>
        <Text style={[s.summaryItem, { color: C.text }]}>⏰ Wake: {profile.wakeTime} · Sleep: {profile.sleepTime}</Text>
        {profile.city && <Text style={[s.summaryItem, { color: C.text }]}>📍 {profile.city} — Namaz times auto-loaded</Text>}
      </View>
    </View>,
  ];

  const canProceed = () => {
    if (step === 1 && !profile.name.trim()) return false;
    return true;
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: C.accent }]} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {STEPS[step]}
      </ScrollView>

      {/* Navigation */}
      <View style={[s.navBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        {step > 0 && (
          <TouchableOpacity style={[s.backBtn, { borderColor: C.border }]} onPress={() => setStep(s => s - 1)}>
            <Text style={[s.backBtnText, { color: C.muted }]}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: canProceed() ? C.accent : C.border, flex: step > 0 ? 0.6 : 1 }]}
          onPress={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
          disabled={!canProceed()}
        >
          <Text style={[s.nextBtnText, { color: canProceed() ? '#fff' : C.muted }]}>
            {step === STEPS.length - 1 ? '🚀 Start Life OS' : step === 0 ? "Let's Go →" : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1 },
  progressBar: { height: 4, backgroundColor: C?.border || '#2A2D38' },
  progressFill: { height: 4, borderRadius: 2 },
  scrollContent: { padding: 24, paddingBottom: 20 },
  stepContainer: { flex: 1, alignItems: 'center' },
  stepEmoji: { fontSize: 64, marginBottom: 16, marginTop: 10 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: C?.text || '#F1F5F9', textAlign: 'center', marginBottom: 10 },
  stepDesc: { fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  featureList: { alignSelf: 'stretch', gap: 8 },
  featureItem: { fontSize: 15, paddingVertical: 6 },
  picPicker: { marginBottom: 16, alignItems: 'center' },
  picPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: C?.accent || '#6C63FF' },
  picPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  input: { alignSelf: 'stretch', backgroundColor: C?.surface || '#161820', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C?.border || '#2A2D38', color: C?.text || '#F1F5F9', fontSize: 15, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', marginBottom: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C?.border || '#2A2D38' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  goalBtn: { width: '45%', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C?.border || '#2A2D38', backgroundColor: C?.card || '#1E2028' },
  goalLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  fieldLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chipScroll: { alignSelf: 'stretch', marginBottom: 16 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, marginRight: 8, backgroundColor: C?.card || '#1E2028', borderWidth: 1, borderColor: C?.border || '#2A2D38' },
  timeChipText: { fontWeight: '600', fontSize: 13 },
  fitCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C?.border || '#2A2D38', backgroundColor: C?.card || '#1E2028', marginBottom: 10, alignSelf: 'stretch' },
  fitLabel: { fontSize: 15, fontWeight: '700' },
  fitDesc: { fontSize: 12, marginTop: 2 },
  locRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  locBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C?.border || '#2A2D38', backgroundColor: C?.card || '#1E2028' },
  locLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  projectChip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 8, alignSelf: 'stretch' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 10 },
  skipNote: { fontSize: 12, marginTop: 10 },
  finalPic: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, borderWidth: 3, borderColor: C?.accent || '#6C63FF' },
  summaryCard: { alignSelf: 'stretch', backgroundColor: C?.card || '#1E2028', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: C?.border || '#2A2D38' },
  summaryItem: { fontSize: 14, fontWeight: '600' },
  navBar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1 },
  backBtn: { flex: 0.35, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  backBtnText: { fontWeight: '700', fontSize: 15 },
  nextBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { fontWeight: '800', fontSize: 16 },
});
