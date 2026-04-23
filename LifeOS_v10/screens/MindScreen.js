import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AFFIRMATIONS = [
  "I am capable of achieving everything I set my mind to.",
  "Every day I grow stronger, smarter, and more focused.",
  "I am building a life I am proud of, one habit at a time.",
  "My consistency compounds into extraordinary results.",
  "I am disciplined, focused, and driven by purpose.",
  "Every challenge I face makes me more resilient.",
  "I deserve success and I am working hard for it.",
  "My work today is an investment in my future self.",
  "I am becoming the best version of myself every single day.",
  "Small progress is still progress. I keep moving forward.",
  "Allah is with the patient. I trust the process.",
  "I have the intelligence, tools, and drive to build great things.",
  "I am not behind. I am exactly where I need to be.",
  "My mind is sharp, my body is strong, my heart is focused.",
  "I choose discipline over regret, every single time.",
];

const BREATHING = [
  { id: 'box', name: 'Box Breathing', desc: 'Reduces stress and anxiety instantly', color: '#6C63FF', steps: [{ label: 'Inhale', sec: 4 }, { label: 'Hold', sec: 4 }, { label: 'Exhale', sec: 4 }, { label: 'Hold', sec: 4 }] },
  { id: '478', name: '4-7-8 Breathing', desc: 'Natural tranquilizer for the nervous system', color: '#10B981', steps: [{ label: 'Inhale', sec: 4 }, { label: 'Hold', sec: 7 }, { label: 'Exhale', sec: 8 }] },
  { id: 'calm', name: 'Calm Breathing', desc: 'Simple deep breathing for daily calm', color: '#8B5CF6', steps: [{ label: 'Inhale', sec: 5 }, { label: 'Exhale', sec: 5 }] },
];

export default function MindScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('affirmations');
  const [affirmRead, setAffirmRead] = useState(false);
  const [breathExercise, setBreathExercise] = useState(null);
  const [breathStep, setBreathStep] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathTimer, setBreathTimer] = useState(0);
  const [anxietyLogs, setAnxietyLogs] = useState([]);
  const [newAnxiety, setNewAnxiety] = useState({ level: null, trigger: '', helped: '' });
  const [cbtLogs, setCbtLogs] = useState([]);
  const [newCbt, setNewCbt] = useState({ thought: '', challenge: '', reframe: '' });
  const breathAnim = useRef(new Animated.Value(1)).current;
  const breathRef = useRef(null);

  const todayKey = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayAffirmation = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];

  useFocusEffect(useCallback(() => {
    (async () => {
      const ad = await AsyncStorage.getItem('affirmDone_' + todayKey); if (ad) setAffirmRead(true);
      const al = await AsyncStorage.getItem('anxietyLogs'); if (al) setAnxietyLogs(JSON.parse(al));
      const cl = await AsyncStorage.getItem('cbtLogs'); if (cl) setCbtLogs(JSON.parse(cl));
    })();
  }, []));

  useEffect(() => {
    if (breathRunning && breathExercise) {
      const steps = breathExercise.steps;
      const currentStep = steps[breathStep];
      setBreathTimer(currentStep.sec);
      const isInhale = currentStep.label === 'Inhale';
      Animated.timing(breathAnim, { toValue: isInhale ? 1.5 : 0.8, duration: currentStep.sec * 1000, useNativeDriver: true }).start();
      breathRef.current = setTimeout(() => {
        const nextStep = (breathStep + 1) % steps.length;
        if (nextStep === 0) setBreathCount(c => c + 1);
        setBreathStep(nextStep);
      }, currentStep.sec * 1000);
    }
    return () => clearTimeout(breathRef.current);
  }, [breathRunning, breathStep, breathExercise]);

  const startBreath = (ex) => {
    setBreathExercise(ex); setBreathStep(0); setBreathCount(0); setBreathRunning(true);
  };

  const stopBreath = () => {
    setBreathRunning(false); clearTimeout(breathRef.current);
    Animated.timing(breathAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const saveAnxiety = async () => {
    if (!newAnxiety.level) return;
    const updated = [{ ...newAnxiety, date: new Date().toISOString(), id: Date.now() }, ...anxietyLogs];
    setAnxietyLogs(updated); await AsyncStorage.setItem('anxietyLogs', JSON.stringify(updated));
    setNewAnxiety({ level: null, trigger: '', helped: '' });
  };

  const saveCbt = async () => {
    if (!newCbt.thought) return;
    const updated = [{ ...newCbt, date: new Date().toISOString(), id: Date.now() }, ...cbtLogs];
    setCbtLogs(updated); await AsyncStorage.setItem('cbtLogs', JSON.stringify(updated));
    setNewCbt({ thought: '', challenge: '', reframe: '' });
  };

  const s = makeStyles(C);
  const currentBreathStep = breathExercise?.steps[breathStep];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>🧘 Mind</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['affirmations','✨ Affirm'],['breathing','🌬 Breathe'],['anxiety','💭 Anxiety'],['cbt','🧠 CBT']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AFFIRMATIONS */}
        {tab === 'affirmations' && (
          <>
            <View style={[s.affirmCard, { backgroundColor: C.purpleSoft, borderColor: C.purple + '44' }]}>
              <Text style={[s.affirmLabel, { color: C.purple }]}>TODAY'S AFFIRMATION</Text>
              <Text style={[s.affirmText, { color: C.text }]}>"{todayAffirmation}"</Text>
              {!affirmRead ? (
                <TouchableOpacity style={[s.affirmBtn, { backgroundColor: C.purple }]} onPress={async () => { await AsyncStorage.setItem('affirmDone_' + todayKey, '1'); setAffirmRead(true); }}>
                  <Text style={s.affirmBtnText}>✓ I believe this today</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[s.affirmDone, { color: C.green }]}>✅ Affirmation read today</Text>
              )}
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>All Affirmations</Text>
              {AFFIRMATIONS.map((a, i) => (
                <View key={i} style={[s.affirmItem, { borderBottomColor: C.border }]}>
                  <Text style={[s.affirmItemText, { color: C.text }]}>"{a}"</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* BREATHING */}
        {tab === 'breathing' && (
          <>
            {!breathRunning ? (
              <>
                <Text style={[s.breathIntro, { color: C.muted }]}>Choose a breathing technique. Each one has a different purpose.</Text>
                {BREATHING.map(ex => (
                  <TouchableOpacity key={ex.id} style={[s.breathCard, { borderColor: ex.color + '44' }]} onPress={() => startBreath(ex)} activeOpacity={0.8}>
                    <View style={[s.breathDot, { backgroundColor: ex.color + '22' }]}>
                      <Text style={{ fontSize: 28 }}>🌬</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.breathName, { color: C.text }]}>{ex.name}</Text>
                      <Text style={[s.breathDesc, { color: C.muted }]}>{ex.desc}</Text>
                      <Text style={[s.breathPattern, { color: ex.color }]}>{ex.steps.map(s => `${s.sec}s ${s.label}`).join(' → ')}</Text>
                    </View>
                    <Text style={[s.startText, { color: ex.color }]}>Start →</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={s.breathSession}>
                <Text style={[s.breathSessionName, { color: C.text }]}>{breathExercise.name}</Text>
                <Text style={[s.breathCycles, { color: C.muted }]}>{breathCount} cycles completed</Text>
                <Animated.View style={[s.breathCircle, { backgroundColor: breathExercise.color + '22', borderColor: breathExercise.color, transform: [{ scale: breathAnim }] }]}>
                  <Text style={[s.breathStepLabel, { color: breathExercise.color }]}>{currentBreathStep?.label}</Text>
                  <Text style={[s.breathStepSec, { color: C.text }]}>{currentBreathStep?.sec}s</Text>
                </Animated.View>
                <TouchableOpacity style={[s.stopBtn, { backgroundColor: C.redSoft }]} onPress={stopBreath}>
                  <Text style={[s.stopBtnText, { color: C.red }]}>Stop Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ANXIETY TRACKER */}
        {tab === 'anxiety' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Log Anxiety Episode</Text>
              <Text style={[s.fieldLabel, { color: C.muted }]}>Intensity (1 = mild, 10 = severe)</Text>
              <View style={s.levelRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity key={n} style={[s.levelDot, { backgroundColor: newAnxiety.level === n ? (n > 7 ? C.red : n > 4 ? C.yellow : C.green) : C.border }]} onPress={() => setNewAnxiety(p => ({ ...p, level: n }))} />
                ))}
              </View>
              <TextInput style={s.input} placeholder="What triggered it?" placeholderTextColor={C.muted} value={newAnxiety.trigger} onChangeText={v => setNewAnxiety(p => ({ ...p, trigger: v }))} multiline />
              <TextInput style={s.input} placeholder="What helped or could help?" placeholderTextColor={C.muted} value={newAnxiety.helped} onChangeText={v => setNewAnxiety(p => ({ ...p, helped: v }))} multiline />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={saveAnxiety}><Text style={s.saveBtnText}>Log Episode</Text></TouchableOpacity>
            </View>
            {anxietyLogs.slice(0, 5).map(log => (
              <View key={log.id} style={s.logCard}>
                <View style={s.row}>
                  <Text style={[s.logDate, { color: C.muted }]}>{new Date(log.date).toLocaleDateString()}</Text>
                  <View style={[s.levelBadge, { backgroundColor: log.level > 7 ? C.redSoft : log.level > 4 ? C.yellowSoft : C.greenSoft }]}>
                    <Text style={[s.levelBadgeText, { color: log.level > 7 ? C.red : log.level > 4 ? C.yellow : C.green }]}>Level {log.level}</Text>
                  </View>
                </View>
                {log.trigger ? <Text style={[s.logField, { color: C.text }]}>Trigger: {log.trigger}</Text> : null}
                {log.helped ? <Text style={[s.logField, { color: C.muted }]}>Helped: {log.helped}</Text> : null}
              </View>
            ))}
          </>
        )}

        {/* CBT THOUGHT LOG */}
        {tab === 'cbt' && (
          <>
            <View style={[s.cbtIntro, { backgroundColor: C.accentSoft }]}>
              <Text style={[s.cbtIntroTitle, { color: C.accent }]}>💡 CBT Thought Journal</Text>
              <Text style={[s.cbtIntroText, { color: C.muted }]}>Cognitive Behavioral Therapy: identify negative thoughts, challenge them, reframe them. Over time this rewires your thinking patterns.</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Log a Negative Thought</Text>
              <Text style={[s.fieldLabel, { color: C.muted }]}>The thought:</Text>
              <TextInput style={s.input} placeholder="e.g. I'm not good enough to succeed..." placeholderTextColor={C.muted} value={newCbt.thought} onChangeText={v => setNewCbt(p => ({ ...p, thought: v }))} multiline />
              <Text style={[s.fieldLabel, { color: C.muted }]}>Challenge it (is it 100% true?):</Text>
              <TextInput style={s.input} placeholder="e.g. I've actually shipped several projects successfully..." placeholderTextColor={C.muted} value={newCbt.challenge} onChangeText={v => setNewCbt(p => ({ ...p, challenge: v }))} multiline />
              <Text style={[s.fieldLabel, { color: C.muted }]}>Reframe it:</Text>
              <TextInput style={s.input} placeholder="e.g. I am learning and growing every day. Success is built gradually." placeholderTextColor={C.muted} value={newCbt.reframe} onChangeText={v => setNewCbt(p => ({ ...p, reframe: v }))} multiline />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={saveCbt}><Text style={s.saveBtnText}>Save Entry</Text></TouchableOpacity>
            </View>
            {cbtLogs.slice(0, 5).map(log => (
              <View key={log.id} style={s.cbtCard}>
                <Text style={[s.cbtDate, { color: C.muted }]}>{new Date(log.date).toLocaleDateString()}</Text>
                <View style={[s.cbtSection, { backgroundColor: C.redSoft }]}><Text style={[s.cbtSectionLabel, { color: C.red }]}>Thought</Text><Text style={[s.cbtSectionText, { color: C.text }]}>{log.thought}</Text></View>
                {log.challenge ? <View style={[s.cbtSection, { backgroundColor: C.yellowSoft }]}><Text style={[s.cbtSectionLabel, { color: C.yellow }]}>Challenge</Text><Text style={[s.cbtSectionText, { color: C.text }]}>{log.challenge}</Text></View> : null}
                {log.reframe ? <View style={[s.cbtSection, { backgroundColor: C.greenSoft }]}><Text style={[s.cbtSectionLabel, { color: C.green }]}>Reframe</Text><Text style={[s.cbtSectionText, { color: C.text }]}>{log.reframe}</Text></View> : null}
              </View>
            ))}
          </>
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
  affirmCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1 },
  affirmLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  affirmText: { fontSize: 18, lineHeight: 28, fontWeight: '600', marginBottom: 16, fontStyle: 'italic' },
  affirmBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  affirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  affirmDone: { textAlign: 'center', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  affirmItem: { paddingVertical: 12, borderBottomWidth: 1 },
  affirmItemText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  breathIntro: { color: C.muted, fontSize: 14, marginBottom: 14, lineHeight: 22 },
  breathCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  breathDot: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  breathName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  breathDesc: { fontSize: 12, marginBottom: 4 },
  breathPattern: { fontSize: 11, fontWeight: '700' },
  startText: { fontSize: 14, fontWeight: '700' },
  breathSession: { alignItems: 'center', paddingVertical: 20 },
  breathSessionName: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  breathCycles: { fontSize: 14, marginBottom: 30 },
  breathCircle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 30 },
  breathStepLabel: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  breathStepSec: { fontSize: 32, fontWeight: '800' },
  stopBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  stopBtnText: { fontWeight: '700', fontSize: 15 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  levelRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  levelDot: { flex: 1, height: 28, borderRadius: 6 },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, marginBottom: 10, minHeight: 50, textAlignVertical: 'top' },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  logDate: { fontSize: 12, fontWeight: '600' },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  logField: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  cbtIntro: { borderRadius: 14, padding: 14, marginBottom: 14 },
  cbtIntroTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cbtIntroText: { fontSize: 13, lineHeight: 20 },
  cbtCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cbtDate: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  cbtSection: { borderRadius: 8, padding: 10, marginBottom: 6 },
  cbtSectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  cbtSectionText: { fontSize: 13, lineHeight: 20 },
});
