import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHALLENGES = [
  'Do 50 push-ups today 💪', 'No social media for 24 hours 📵', 'Drink 10 glasses of water 💧',
  'Write 500 words of anything ✍️', 'Learn one new keyboard shortcut ⌨️', 'Walk 10,000 steps today 🚶',
  'Cold water face splash for 30 seconds 🥶', 'Eat no sugar today 🚫🍬', 'Call a family member 📞',
  'Read 30 pages of a book 📚', 'Do 10 minutes of stretching 🧘', 'Cook a meal from scratch 🍳',
  'Write 3 things you\'re proud of 🌟', 'Spend 1 hour learning something new 🎓',
  'Go outside for 20 minutes without your phone 🌿', 'Write a thank-you message to someone 💌',
  'Do a full body workout 🏋️', 'Organize one area of your space 🗂️',
  'Try a new healthy food today 🥗', 'Write down your 5-year vision 🔭',
  'Log every expense today 💰', 'Complete your full morning checklist ☀️',
  'Meditate or breathe for 5 minutes 🌬️', 'Write your best idea this week 💡',
  'Review your goals and update them 🎯', 'Do something kind for someone 💝',
  'Pray all 5 prayers with full focus 🕌', 'Finish your Top 3 tasks before noon ⚡',
  'Sleep before midnight 🌙', 'Write in your journal every detail of today 📓',
];

export default function CreativeScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('ideas');
  const [ideas, setIdeas] = useState([]);
  const [gratitude, setGratitude] = useState([]);
  const [newIdea, setNewIdea] = useState({ title: '', body: '', tag: 'General' });
  const [newGratitude, setNewGratitude] = useState('');
  const [todayChallenge, setTodayChallenge] = useState(null);
  const [challengeDone, setChallengeDone] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  useFocusEffect(useCallback(() => {
    (async () => {
      const id = await AsyncStorage.getItem('ideas'); if (id) setIdeas(JSON.parse(id));
      const gr = await AsyncStorage.getItem('gratitudeJar'); if (gr) setGratitude(JSON.parse(gr));
      const cd = await AsyncStorage.getItem('challengeDone_' + todayKey); if (cd) setChallengeDone(true);
      const custom = await AsyncStorage.getItem('todayChallenge_' + todayKey);
      if (custom) setTodayChallenge(custom);
      else {
        const auto = CHALLENGES[dayOfYear % CHALLENGES.length];
        setTodayChallenge(auto);
        await AsyncStorage.setItem('todayChallenge_' + todayKey, auto);
      }
    })();
  }, []));

  const save = async (key, val) => AsyncStorage.setItem(key, JSON.stringify(val));

  const addIdea = async () => {
    if (!newIdea.title.trim()) return;
    const updated = [{ ...newIdea, id: Date.now(), date: todayKey }, ...ideas];
    setIdeas(updated); await save('ideas', updated);
    setNewIdea({ title: '', body: '', tag: 'General' });
  };

  const deleteIdea = async (id) => {
    const updated = ideas.filter(i => i.id !== id);
    setIdeas(updated); await save('ideas', updated);
  };

  const addGratitude = async () => {
    if (!newGratitude.trim()) return;
    const updated = [{ text: newGratitude.trim(), date: todayKey, id: Date.now() }, ...gratitude];
    setGratitude(updated); await save('gratitudeJar', updated); setNewGratitude('');
  };

  const markChallengeDone = async () => {
    await AsyncStorage.setItem('challengeDone_' + todayKey, '1');
    setChallengeDone(true);
  };

  const rerollChallenge = async () => {
    const random = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setTodayChallenge(random);
    await AsyncStorage.setItem('todayChallenge_' + todayKey, random);
    setChallengeDone(false);
    await AsyncStorage.removeItem('challengeDone_' + todayKey);
  };

  const TAGS = ['General', 'App Idea', 'Business', 'Content', 'AI / Tech', 'Personal'];
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>🎨 Creative</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['ideas','💡 Ideas'],['gratitude','🫙 Gratitude'],['challenge','⚡ Challenge']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* IDEAS */}
        {tab === 'ideas' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>💡 Capture an Idea</Text>
              <Text style={[s.hint, { color: C.muted }]}>Ideas disappear in seconds. Capture them before they're gone.</Text>
              <TextInput style={s.input} placeholder="Idea title..." placeholderTextColor={C.muted} value={newIdea.title} onChangeText={v => setNewIdea(p => ({ ...p, title: v }))} />
              <TextInput style={[s.input, { minHeight: 70 }]} placeholder="Details (optional)..." placeholderTextColor={C.muted} value={newIdea.body} onChangeText={v => setNewIdea(p => ({ ...p, body: v }))} multiline />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {TAGS.map(tag => (
                  <TouchableOpacity key={tag} style={[s.tagBtn, newIdea.tag === tag && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setNewIdea(p => ({ ...p, tag }))}>
                    <Text style={[s.tagText, { color: newIdea.tag === tag ? C.accent : C.muted }]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={addIdea}><Text style={s.saveBtnText}>💾 Save Idea</Text></TouchableOpacity>
            </View>
            {ideas.map(idea => (
              <View key={idea.id} style={s.ideaCard}>
                <View style={s.row}>
                  <View style={[s.tagBadge, { backgroundColor: C.accentSoft }]}><Text style={[s.tagBadgeText, { color: C.accent }]}>{idea.tag}</Text></View>
                  <Text style={[s.ideaDate, { color: C.muted }]}>{idea.date}</Text>
                  <TouchableOpacity onPress={() => deleteIdea(idea.id)}><Text style={{ color: C.red }}>✕</Text></TouchableOpacity>
                </View>
                <Text style={[s.ideaTitle, { color: C.text }]}>{idea.title}</Text>
                {idea.body ? <Text style={[s.ideaBody, { color: C.muted }]}>{idea.body}</Text> : null}
              </View>
            ))}
            {ideas.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 30 }]}>No ideas saved yet. Start capturing!</Text>}
          </>
        )}

        {/* GRATITUDE JAR */}
        {tab === 'gratitude' && (
          <>
            <View style={[s.jarCard, { backgroundColor: C.yellowSoft, borderColor: C.yellow + '44' }]}>
              <Text style={s.jarEmoji}>🫙</Text>
              <Text style={[s.jarCount, { color: C.yellow }]}>{gratitude.length}</Text>
              <Text style={[s.jarLabel, { color: C.muted }]}>gratitude entries</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Add to Gratitude Jar</Text>
              <TextInput style={s.input} placeholder="I am grateful for..." placeholderTextColor={C.muted} value={newGratitude} onChangeText={setNewGratitude} multiline />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.yellow }]} onPress={addGratitude}><Text style={s.saveBtnText}>Add to Jar ✨</Text></TouchableOpacity>
            </View>
            {gratitude.map(g => (
              <View key={g.id} style={[s.gratCard, { borderColor: C.yellow + '33' }]}>
                <Text style={[s.gratDate, { color: C.yellow }]}>{g.date}</Text>
                <Text style={[s.gratText, { color: C.text }]}>"{g.text}"</Text>
              </View>
            ))}
            {gratitude.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 20 }]}>Your jar is empty. Fill it up!</Text>}
          </>
        )}

        {/* DAILY CHALLENGE */}
        {tab === 'challenge' && (
          <>
            <View style={[s.challengeCard, { backgroundColor: challengeDone ? C.greenSoft : C.accentSoft, borderColor: challengeDone ? C.green + '44' : C.accent + '44' }]}>
              <Text style={[s.challengeLabel, { color: challengeDone ? C.green : C.accent }]}>TODAY'S CHALLENGE</Text>
              <Text style={[s.challengeText, { color: C.text }]}>{todayChallenge}</Text>
              {!challengeDone ? (
                <TouchableOpacity style={[s.challengeBtn, { backgroundColor: challengeDone ? C.green : C.accent }]} onPress={markChallengeDone}>
                  <Text style={s.challengeBtnText}>✓ Challenge Complete!</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[s.challengeDone, { color: C.green }]}>🎉 Completed today! Well done.</Text>
              )}
              <TouchableOpacity style={[s.rerollBtn, { borderColor: C.border }]} onPress={rerollChallenge}>
                <Text style={[s.rerollText, { color: C.muted }]}>🎲 Get different challenge</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>All Challenges</Text>
              <Text style={[s.hint, { color: C.muted }]}>You get a new challenge every day. Or tap reroll above.</Text>
              {CHALLENGES.map((c, i) => (
                <Text key={i} style={[s.challengeListItem, { color: C.muted, borderBottomColor: C.border }]}>{c}</Text>
              ))}
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
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hint: { fontSize: 13, marginBottom: 10 },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, marginBottom: 8, textAlignVertical: 'top' },
  tagBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginRight: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tagText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ideaCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagBadgeText: { fontSize: 11, fontWeight: '700' },
  ideaDate: { fontSize: 11 },
  ideaTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  ideaBody: { fontSize: 13, lineHeight: 20 },
  jarCard: { borderRadius: 20, padding: 24, marginBottom: 14, borderWidth: 1, alignItems: 'center' },
  jarEmoji: { fontSize: 56, marginBottom: 8 },
  jarCount: { fontSize: 48, fontWeight: '800' },
  jarLabel: { fontSize: 14, marginTop: 4 },
  gratCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  gratDate: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  gratText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  challengeCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1 },
  challengeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  challengeText: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 16 },
  challengeBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  challengeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  challengeDone: { textAlign: 'center', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  rerollBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  rerollText: { fontWeight: '600', fontSize: 13 },
  challengeListItem: { fontSize: 13, paddingVertical: 8, borderBottomWidth: 1 },
  empty: { fontSize: 14, paddingVertical: 20 },
});
