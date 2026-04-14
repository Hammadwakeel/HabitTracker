import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getTodayDeen, saveTodayDeen, getDeenStreak, getLast7DaysDeen } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_TIMES = { Fajr: '~5:00 AM', Dhuhr: '~1:00 PM', Asr: '~4:30 PM', Maghrib: '~7:00 PM', Isha: '~9:00 PM' };
const PRAYER_EMOJIS = { Fajr: '🌙', Dhuhr: '☀️', Asr: '🌤', Maghrib: '🌅', Isha: '⭐' };

export default function DeenScreen() {
  const { C } = useTheme();
  const [deen, setDeen] = useState({ prayers: {}, quranPages: 0, sadaqah: false, dhikr: false });
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [xpMsg, setXpMsg] = useState(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const d = await getTodayDeen();
      setDeen(d);
      const s = await getDeenStreak();
      setStreak(s);
      const h = await getLast7DaysDeen();
      setHistory(h);
    })();
  }, []));

  const showXP = (msg) => { setXpMsg(msg); setTimeout(() => setXpMsg(null), 2000); };

  const togglePrayer = async (prayer) => {
    const updated = { ...deen, prayers: { ...deen.prayers, [prayer]: !deen.prayers?.[prayer] } };
    setDeen(updated);
    await saveTodayDeen(updated);
    const allDone = PRAYERS.every(p => updated.prayers[p]);
    if (allDone) { await addXP(XP_REWARDS.allPrayers); showXP(`+${XP_REWARDS.allPrayers}XP — All Prayers! 🕌`); }
    const s = await getDeenStreak();
    setStreak(s);
  };

  const addQuranPage = async (n) => {
    const updated = { ...deen, quranPages: Math.max(0, (deen.quranPages || 0) + n) };
    setDeen(updated);
    await saveTodayDeen(updated);
    if (n > 0) { await addXP(XP_REWARDS.quranPage * n); showXP(`+${XP_REWARDS.quranPage * n}XP — Quran 📖`); }
  };

  const toggle = async (key, xpAmt, label) => {
    const updated = { ...deen, [key]: !deen[key] };
    setDeen(updated);
    await saveTodayDeen(updated);
    if (updated[key] && xpAmt) { await addXP(xpAmt); showXP(`+${xpAmt}XP — ${label}`); }
  };

  const prayerCount = PRAYERS.filter(p => deen.prayers?.[p]).length;
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpMsg && <View style={s.xpPopup}><Text style={s.xpPopupText}>{xpMsg}</Text></View>}
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        <Text style={s.heading}>🕌 Deen</Text>
        <Text style={s.sub}>Your spiritual practice</Text>

        {/* Streak */}
        <View style={[s.streakCard, { backgroundColor: C.goldSoft, borderColor: C.gold + '44' }]}>
          <Text style={s.streakEmoji}>🌟</Text>
          <View>
            <Text style={[s.streakNum, { color: C.gold }]}>{streak} day streak</Text>
            <Text style={[s.streakLabel, { color: C.muted }]}>All 5 prayers consecutive days</Text>
          </View>
        </View>

        {/* Prayers */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>🙏 Salah Today</Text>
            <Text style={[s.badge, { backgroundColor: prayerCount === 5 ? C.greenSoft : C.goldSoft, color: prayerCount === 5 ? C.green : C.gold }]}>{prayerCount}/5</Text>
          </View>
          {PRAYERS.map(prayer => (
            <TouchableOpacity key={prayer} style={s.prayerRow} onPress={() => togglePrayer(prayer)} activeOpacity={0.7}>
              <View style={[s.prayerCheck, deen.prayers?.[prayer] && { backgroundColor: C.green, borderColor: C.green }]}>
                {deen.prayers?.[prayer] && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.prayerEmoji}>{PRAYER_EMOJIS[prayer]}</Text>
              <View style={s.prayerInfo}>
                <Text style={[s.prayerName, { color: C.text }]}>{prayer}</Text>
                <Text style={[s.prayerTime, { color: C.muted }]}>{PRAYER_TIMES[prayer]}</Text>
              </View>
              {deen.prayers?.[prayer] && <Text style={[s.prayerDone, { color: C.green }]}>Prayed ✓</Text>}
            </TouchableOpacity>
          ))}
          {prayerCount === 5 && <Text style={[s.allDone, { color: C.green }]}>🎉 All 5 prayers complete! +{XP_REWARDS.allPrayers}XP earned.</Text>}
        </View>

        {/* Quran */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>📖 Quran Reading</Text>
            <Text style={[s.bigNum, { color: C.accent }]}>{deen.quranPages || 0} pages</Text>
          </View>
          <View style={s.quranBtns}>
            {[1, 2, 5].map(n => (
              <TouchableOpacity key={n} style={[s.quranBtn, { backgroundColor: C.accentSoft }]} onPress={() => addQuranPage(n)}>
                <Text style={[s.quranBtnText, { color: C.accent }]}>+{n} page{n > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.quranBtn, { backgroundColor: C.redSoft }]} onPress={() => addQuranPage(-1)}>
              <Text style={[s.quranBtnText, { color: C.red }]}>-1</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.hint, { color: C.muted }]}>+{XP_REWARDS.quranPage}XP per page recited</Text>
        </View>

        {/* Sadaqah & Dhikr */}
        <View style={s.card}>
          <Text style={s.cardTitle}>✨ Daily Practices</Text>
          {[
            { key: 'sadaqah', emoji: '💝', label: 'Sadaqah / Act of Kindness', xp: XP_REWARDS.sadaqah, desc: 'Did something good for someone today' },
            { key: 'dhikr', emoji: '📿', label: 'Dhikr / Remembrance', xp: 10, desc: 'SubhanAllah, Alhamdulillah, Allahu Akbar' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={s.practiceRow} onPress={() => toggle(item.key, item.xp, item.label)} activeOpacity={0.7}>
              <View style={[s.practiceCheck, deen[item.key] && { backgroundColor: C.emerald, borderColor: C.emerald }]}>
                {deen[item.key] && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.practiceEmoji}>{item.emoji}</Text>
              <View style={s.practiceInfo}>
                <Text style={[s.practiceName, { color: C.text }]}>{item.label}</Text>
                <Text style={[s.practiceDesc, { color: C.muted }]}>{item.desc}</Text>
              </View>
              <Text style={[s.practiceXP, { color: C.accent }]}>+{item.xp}XP</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7-day prayer history */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Last 7 Days</Text>
          <View style={s.historyRow}>
            {history.map(d => (
              <View key={d.date} style={s.historyCol}>
                <View style={s.prayerDots}>
                  {[1,2,3,4,5].map(i => (
                    <View key={i} style={[s.prayerDot, { backgroundColor: i <= d.count ? C.green : C.border }]} />
                  ))}
                </View>
                <Text style={[s.historyLabel, { color: C.muted }]}>{d.label}</Text>
                {d.quranPages > 0 && <Text style={[s.historyPages, { color: C.accent }]}>{d.quranPages}p</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={[s.ayahCard, { backgroundColor: C.goldSoft, borderColor: C.gold + '33' }]}>
          <Text style={[s.ayahText, { color: C.text }]}>إِنَّ مَعَ الْعُسْرِ يُسْرًا</Text>
          <Text style={[s.ayahTrans, { color: C.muted }]}>"Verily, with hardship comes ease." — Quran 94:6</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10 },
  sub: { fontSize: 14, color: C.muted, marginBottom: 20, marginTop: 4 },
  xpPopup: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, zIndex: 999 },
  xpPopupText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  streakEmoji: { fontSize: 36 },
  streakNum: { fontSize: 22, fontWeight: '800' },
  streakLabel: { fontSize: 13, marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  prayerCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  prayerEmoji: { fontSize: 20 },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 15, fontWeight: '600' },
  prayerTime: { fontSize: 12, marginTop: 1 },
  prayerDone: { fontSize: 12, fontWeight: '600' },
  allDone: { fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  bigNum: { fontSize: 22, fontWeight: '800' },
  quranBtns: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quranBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  quranBtnText: { fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 12, textAlign: 'center' },
  practiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  practiceCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  practiceEmoji: { fontSize: 22 },
  practiceInfo: { flex: 1 },
  practiceName: { fontSize: 14, fontWeight: '600' },
  practiceDesc: { fontSize: 12, marginTop: 2 },
  practiceXP: { fontSize: 12, fontWeight: '700' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyCol: { alignItems: 'center', flex: 1 },
  prayerDots: { gap: 3, marginBottom: 6 },
  prayerDot: { width: 10, height: 10, borderRadius: 3 },
  historyLabel: { fontSize: 10, fontWeight: '600' },
  historyPages: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  ayahCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  ayahText: { fontSize: 20, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  ayahTrans: { fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
});
