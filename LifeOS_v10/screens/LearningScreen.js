import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addXP } from '../utils/xp';

const WORDS = [
  { word: 'Serendipity', meaning: 'Finding something good without looking for it', example: 'Meeting my mentor was pure serendipity.' },
  { word: 'Resilience', meaning: 'Ability to recover quickly from difficulties', example: 'His resilience after failure inspired everyone.' },
  { word: 'Eloquent', meaning: 'Fluent and persuasive in speaking or writing', example: 'She gave an eloquent speech at the conference.' },
  { word: 'Pragmatic', meaning: 'Dealing with things practically rather than theoretically', example: 'A pragmatic approach to problem solving.' },
  { word: 'Tenacious', meaning: 'Holding firm to a purpose; persistent', example: 'His tenacious work ethic built his career.' },
  { word: 'Perspicacious', meaning: 'Having a ready insight; shrewd', example: 'A perspicacious developer spots bugs before they happen.' },
  { word: 'Diligent', meaning: 'Careful and persistent in work or effort', example: 'Diligent practice makes a great developer.' },
  { word: 'Catalyst', meaning: 'A person or thing that speeds up a process', example: 'AI is the catalyst for modern innovation.' },
  { word: 'Lucid', meaning: 'Expressed clearly; easy to understand', example: 'Write lucid documentation for your API.' },
  { word: 'Meticulous', meaning: 'Showing great attention to detail', example: 'Meticulous code review prevents production issues.' },
  { word: 'Profound', meaning: 'Very great or intense; having deep insight', example: 'The paper had a profound impact on the field.' },
  { word: 'Astute', meaning: 'Having an ability to assess situations accurately', example: 'An astute engineer anticipates edge cases.' },
  { word: 'Fervent', meaning: 'Having or displaying passionate intensity', example: 'He was fervent about building his startup.' },
  { word: 'Innate', meaning: 'Inborn; natural', example: 'Some engineers have an innate sense of architecture.' },
  { word: 'Leverage', meaning: 'Use something to maximum advantage', example: 'Leverage AI tools to multiply your productivity.' },
  { word: 'Iterative', meaning: 'Relating to repetition of a process', example: 'Software development is an iterative process.' },
  { word: 'Paradigm', meaning: 'A typical example or pattern; a model', example: 'LLMs represent a new AI paradigm.' },
  { word: 'Synthesize', meaning: 'Combine elements to form a connected whole', example: 'Synthesize research from multiple sources.' },
  { word: 'Autonomous', meaning: 'Having self-governance; independent', example: 'An autonomous agent completes tasks without supervision.' },
  { word: 'Robust', meaning: 'Strong and effective in all conditions', example: 'Build robust systems with proper error handling.' },
  { word: 'Concurrent', meaning: 'Existing or happening at the same time', example: 'Handle concurrent requests with async/await.' },
  { word: 'Scalable', meaning: 'Able to be changed in size or scale', example: 'Design scalable architecture from day one.' },
  { word: 'Latency', meaning: 'A delay before a transfer of data begins', example: 'Reduce latency in your voice AI pipeline.' },
  { word: 'Inference', meaning: 'A conclusion reached from evidence', example: 'Model inference speed affects user experience.' },
  { word: 'Perpetual', meaning: 'Never ending; occurring repeatedly', example: 'Perpetual learning is a developer\'s superpower.' },
  { word: 'Conscientious', meaning: 'Wishing to do what is right; careful', example: 'A conscientious developer writes tests.' },
  { word: 'Articulate', meaning: 'Able to speak fluently and clearly', example: 'Articulate your ideas well in client meetings.' },
  { word: 'Methodical', meaning: 'Done according to a systematic plan', example: 'A methodical debugging approach saves hours.' },
  { word: 'Prolific', meaning: 'Producing many works or results', example: 'A prolific open-source contributor builds reputation.' },
  { word: 'Pivotal', meaning: 'Of crucial importance', example: 'This project is pivotal for your freelance career.' },
];

const STUDY_SUBJECTS = ['AI / ML', 'Backend Dev', 'Frontend Dev', 'DSA / Algorithms', 'System Design', 'English', 'Business', 'Other'];

export default function LearningScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('word');
  const [wordDone, setWordDone] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [interviewLog, setInterviewLog] = useState({ dsa: 0, topics: [], notes: '' });
  const [studyTimer, setStudyTimer] = useState(25 * 60);
  const [studyRunning, setStudyRunning] = useState(false);
  const [studySubject, setStudySubject] = useState('AI / ML');
  const [studyLog, setStudyLog] = useState({});
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', lang: 'Python' });
  const timerRef = useRef(null);

  const todayKey = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayWord = WORDS[dayOfYear % WORDS.length];

  useFocusEffect(useCallback(() => {
    (async () => {
      const wd = await AsyncStorage.getItem('wordDone_' + todayKey); if (wd) setWordDone(true);
      const sn = await AsyncStorage.getItem('snippets'); if (sn) setSnippets(JSON.parse(sn));
      const il = await AsyncStorage.getItem('interviewLog'); if (il) setInterviewLog(JSON.parse(il));
      const sl = await AsyncStorage.getItem('studyLog_' + todayKey); if (sl) setStudyLog(JSON.parse(sl));
    })();
  }, []));

  useEffect(() => {
    if (studyRunning) {
      timerRef.current = setInterval(() => {
        setStudyTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setStudyRunning(false);
            addXP(15);
            const updated = { ...studyLog, [studySubject]: (studyLog[studySubject] || 0) + 25 };
            setStudyLog(updated);
            AsyncStorage.setItem('studyLog_' + todayKey, JSON.stringify(updated));
            return 25 * 60;
          }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [studyRunning]);

  const markWordDone = async () => {
    await AsyncStorage.setItem('wordDone_' + todayKey, '1');
    await addXP(5);
    setWordDone(true);
  };

  const addSnippet = async () => {
    if (!newSnippet.title || !newSnippet.code) return;
    const updated = [{ ...newSnippet, id: Date.now() }, ...snippets];
    setSnippets(updated);
    await AsyncStorage.setItem('snippets', JSON.stringify(updated));
    setNewSnippet({ title: '', code: '', lang: 'Python' });
  };

  const deleteSnippet = async (id) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    await AsyncStorage.setItem('snippets', JSON.stringify(updated));
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalStudyMins = Object.values(studyLog).reduce((a, b) => a + b, 0);
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>🎓 Learning</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['word','📖 Word'],['study','⏱ Study'],['snippets','💾 Snippets'],['interview','🧠 Interview']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* WORD OF THE DAY */}
        {tab === 'word' && (
          <View style={[s.wordCard, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
            <Text style={[s.wordLabel, { color: C.accent }]}>WORD OF THE DAY</Text>
            <Text style={[s.word, { color: C.text }]}>{todayWord.word}</Text>
            <Text style={[s.wordMeaning, { color: C.muted }]}>{todayWord.meaning}</Text>
            <View style={[s.exampleBox, { backgroundColor: C.surface }]}>
              <Text style={[s.exampleLabel, { color: C.muted }]}>Example:</Text>
              <Text style={[s.example, { color: C.text }]}>"{todayWord.example}"</Text>
            </View>
            {!wordDone ? (
              <TouchableOpacity style={[s.learnedBtn, { backgroundColor: C.accent }]} onPress={markWordDone}>
                <Text style={s.learnedBtnText}>✓ I learned this word! +5 XP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[s.learnedMsg, { color: C.green }]}>✅ Word learned today! Come back tomorrow.</Text>
            )}
          </View>
        )}

        {/* STUDY TIMER */}
        {tab === 'study' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>⏱ Study Session Timer</Text>
              <Text style={[s.timerDisplay, { color: C.text }]}>{fmt(studyTimer)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {STUDY_SUBJECTS.map(sub => (
                  <TouchableOpacity key={sub} style={[s.subjectBtn, studySubject === sub && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setStudySubject(sub)}>
                    <Text style={[s.subjectText, { color: studySubject === sub ? C.accent : C.muted }]}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.timerBtns}>
                <TouchableOpacity style={[s.timerBtn, { backgroundColor: studyRunning ? C.redSoft : C.accentSoft }]} onPress={() => setStudyRunning(r => !r)}>
                  <Text style={[s.timerBtnText, { color: studyRunning ? C.red : C.accent }]}>{studyRunning ? '⏸ Pause' : '▶ Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.timerBtn, { backgroundColor: C.surface }]} onPress={() => { setStudyRunning(false); setStudyTimer(25 * 60); }}>
                  <Text style={[s.timerBtnText, { color: C.muted }]}>↺ Reset</Text>
                </TouchableOpacity>
              </View>
              <Text style={[s.hint, { color: C.muted }]}>+15 XP per completed session</Text>
            </View>

            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>Today's Study Log</Text>
                <Text style={[s.bigNum, { color: C.accent }]}>{totalStudyMins}m</Text>
              </View>
              {Object.keys(studyLog).length === 0 ? (
                <Text style={[s.empty, { color: C.muted }]}>No sessions logged yet today.</Text>
              ) : (
                Object.entries(studyLog).map(([sub, mins]) => (
                  <View key={sub} style={s.logRow}>
                    <Text style={[s.logSubject, { color: C.text }]}>{sub}</Text>
                    <View style={s.logBarBg}><View style={[s.logBarFill, { width: `${(mins / Math.max(...Object.values(studyLog))) * 100}%`, backgroundColor: C.accent }]} /></View>
                    <Text style={[s.logMins, { color: C.accent }]}>{mins}m</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* CODE SNIPPETS */}
        {tab === 'snippets' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>💾 Save Code Snippet</Text>
              <TextInput style={s.input} placeholder="Title (e.g. FastAPI JWT auth)" placeholderTextColor={C.muted} value={newSnippet.title} onChangeText={v => setNewSnippet(p => ({ ...p, title: v }))} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {['Python', 'JavaScript', 'TypeScript', 'SQL', 'Bash', 'Other'].map(lang => (
                  <TouchableOpacity key={lang} style={[s.langBtn, newSnippet.lang === lang && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setNewSnippet(p => ({ ...p, lang }))}>
                    <Text style={[s.langText, { color: newSnippet.lang === lang ? C.accent : C.muted }]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[s.codeInput, { color: C.text, borderColor: C.border }]} placeholder="Paste your code here..." placeholderTextColor={C.muted} value={newSnippet.code} onChangeText={v => setNewSnippet(p => ({ ...p, code: v }))} multiline numberOfLines={5} />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={addSnippet}>
                <Text style={s.saveBtnText}>Save Snippet</Text>
              </TouchableOpacity>
            </View>

            {snippets.map(sn => (
              <View key={sn.id} style={s.snippetCard}>
                <View style={s.snippetHeader}>
                  <Text style={[s.snippetTitle, { color: C.text }]}>{sn.title}</Text>
                  <View style={s.snippetMeta}>
                    <Text style={[s.snippetLang, { color: C.accent, backgroundColor: C.accentSoft }]}>{sn.lang}</Text>
                    <TouchableOpacity onPress={() => deleteSnippet(sn.id)}><Text style={{ color: C.red, fontSize: 16 }}>✕</Text></TouchableOpacity>
                  </View>
                </View>
                <Text style={[s.snippetCode, { color: C.green, backgroundColor: C.surface }]}>{sn.code}</Text>
              </View>
            ))}
            {snippets.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 30 }]}>No snippets saved yet.</Text>}
          </>
        )}

        {/* INTERVIEW PREP */}
        {tab === 'interview' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>🧠 DSA Progress</Text>
              <View style={s.row}>
                <Text style={[s.bigNum, { color: C.accent }]}>{interviewLog.dsa}</Text>
                <Text style={[s.hint, { color: C.muted }]}>problems solved</Text>
              </View>
              <View style={s.timerBtns}>
                <TouchableOpacity style={[s.timerBtn, { backgroundColor: C.accentSoft }]} onPress={async () => {
                  const updated = { ...interviewLog, dsa: (interviewLog.dsa || 0) + 1 };
                  setInterviewLog(updated); await AsyncStorage.setItem('interviewLog', JSON.stringify(updated));
                  await addXP(10);
                }}>
                  <Text style={[s.timerBtnText, { color: C.accent }]}>+1 Problem Solved (+10 XP)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>📋 Topics to Review</Text>
              {['Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Dynamic Programming', 'System Design', 'FastAPI', 'LangChain / RAG', 'LiveKit & Voice AI', 'SQL & Supabase', 'React Native'].map(topic => {
                const done = interviewLog.topics?.includes(topic);
                return (
                  <TouchableOpacity key={topic} style={s.topicRow} onPress={async () => {
                    const topics = interviewLog.topics || [];
                    const updated = { ...interviewLog, topics: done ? topics.filter(t => t !== topic) : [...topics, topic] };
                    setInterviewLog(updated); await AsyncStorage.setItem('interviewLog', JSON.stringify(updated));
                  }}>
                    <View style={[s.check, done && { backgroundColor: C.green, borderColor: C.green }]}>
                      {done && <Text style={s.checkMark}>✓</Text>}
                    </View>
                    <Text style={[s.topicText, { color: done ? C.muted : C.text, textDecorationLine: done ? 'line-through' : 'none' }]}>{topic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  wordCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1 },
  wordLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  word: { fontSize: 32, fontWeight: '800', marginBottom: 6 },
  wordMeaning: { fontSize: 16, lineHeight: 24, marginBottom: 14 },
  exampleBox: { borderRadius: 10, padding: 12, marginBottom: 16 },
  exampleLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  example: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  learnedBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  learnedBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  learnedMsg: { textAlign: 'center', fontWeight: '700', fontSize: 14, paddingVertical: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bigNum: { fontSize: 32, fontWeight: '800' },
  timerDisplay: { fontSize: 56, fontWeight: '800', textAlign: 'center', marginVertical: 10, letterSpacing: 2 },
  subjectBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, marginRight: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  subjectText: { fontSize: 12, fontWeight: '600' },
  timerBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timerBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  timerBtnText: { fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 12, textAlign: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  logSubject: { width: 100, fontSize: 13, fontWeight: '600' },
  logBarBg: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 99 },
  logBarFill: { height: 8, borderRadius: 99 },
  logMins: { fontWeight: '700', fontSize: 13, width: 35, textAlign: 'right' },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, marginBottom: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginRight: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  langText: { fontSize: 12, fontWeight: '600' },
  codeInput: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, fontSize: 13, fontFamily: 'monospace', minHeight: 100, textAlignVertical: 'top', marginBottom: 10, color: C.text },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  snippetCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  snippetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  snippetTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  snippetMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  snippetLang: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  snippetCode: { fontSize: 12, fontFamily: 'monospace', backgroundColor: C.surface, borderRadius: 8, padding: 10, lineHeight: 20 },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  topicText: { fontSize: 14, fontWeight: '500' },
  empty: { fontSize: 14, paddingVertical: 20 },
});
