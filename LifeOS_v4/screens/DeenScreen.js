import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useTheme } from '../utils/ThemeContext';
import { getTodayDeen, saveTodayDeen, getDeenStreak, getLast7DaysDeen, getProfile } from '../utils/storage';
import { addXP, XP_REWARDS } from '../utils/xp';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_EMOJIS = { Fajr: '🌙', Dhuhr: '☀️', Asr: '🌤', Maghrib: '🌅', Isha: '⭐' };

export default function DeenScreen() {
  const { C } = useTheme();
  const [deen, setDeen] = useState({ prayers: {}, quranPages: 0, sadaqah: false, dhikr: false });
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [xpMsg, setXpMsg] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [timeError, setTimeError] = useState(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const d = await getTodayDeen(); setDeen(d);
      const s = await getDeenStreak(); setStreak(s);
      const h = await getLast7DaysDeen(); setHistory(h);
      fetchPrayerTimes();
    })();
  }, []));

  const fetchPrayerTimes = async () => {
    setLoadingTimes(true); setTimeError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const today = new Date();
      const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo[0]) setLocationName(geo[0].city || geo[0].region || 'Your location');
        const res = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=1`);
        const data = await res.json();
        if (data.code === 200) {
          const t = data.data.timings;
          setPrayerTimes({ Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha });
        }
      } else {
        const profile = await getProfile();
        const city = profile?.city || 'Rawalpindi';
        setLocationName(city);
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=PK&method=1`);
        const data = await res.json();
        if (data.code === 200) {
          const t = data.data.timings;
          setPrayerTimes({ Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha });
        }
      }
    } catch {
      setTimeError('Could not load prayer times. Check connection.');
    } finally {
      setLoadingTimes(false);
    }
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    for (const prayer of PRAYERS) {
      const [h, m] = prayerTimes[prayer].split(':').map(Number);
      if ((h * 60 + m) > nowMins) return prayer;
    }
    return 'Fajr';
  };

  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const showXP = (msg) => { setXpMsg(msg); setTimeout(() => setXpMsg(null), 2000); };

  const togglePrayer = async (prayer) => {
    const updated = { ...deen, prayers: { ...deen.prayers, [prayer]: !deen.prayers?.[prayer] } };
    setDeen(updated); await saveTodayDeen(updated);
    if (PRAYERS.every(p => updated.prayers[p])) { await addXP(XP_REWARDS.allPrayers); showXP(`+${XP_REWARDS.allPrayers}XP — All Prayers! 🕌`); }
    setStreak(await getDeenStreak());
  };

  const addQuranPage = async (n) => {
    const updated = { ...deen, quranPages: Math.max(0, (deen.quranPages || 0) + n) };
    setDeen(updated); await saveTodayDeen(updated);
    if (n > 0) { await addXP(XP_REWARDS.quranPage * n); showXP(`+${XP_REWARDS.quranPage * n}XP`); }
  };

  const toggle = async (key, xp, label) => {
    const updated = { ...deen, [key]: !deen[key] };
    setDeen(updated); await saveTodayDeen(updated);
    if (updated[key]) { await addXP(xp); showXP(`+${xp}XP — ${label}`); }
  };

  const nextPrayer = getNextPrayer();
  const prayerCount = PRAYERS.filter(p => deen.prayers?.[p]).length;
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {xpMsg && <View style={s.xpPopup}><Text style={s.xpText}>{xpMsg}</Text></View>}
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>🕌 Deen</Text>

        {/* Live Prayer Times */}
        <View style={[s.timesCard, { backgroundColor: C.goldSoft, borderColor: C.gold + '44' }]}>
          <View style={s.timesHeader}>
            <View>
              <Text style={[s.timesTitle, { color: C.gold }]}>🕌 Prayer Times</Text>
              {locationName ? <Text style={[s.timesLoc, { color: C.muted }]}>📍 {locationName}</Text> : null}
            </View>
            <TouchableOpacity onPress={fetchPrayerTimes} style={[s.refreshBtn, { backgroundColor: C.gold + '22' }]}>
              <Text style={[{ color: C.gold, fontWeight: '700', fontSize: 12 }]}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>
          {loadingTimes
            ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ActivityIndicator color={C.gold} /><Text style={[{ color: C.muted, fontSize: 13 }]}>Loading...</Text></View>
            : timeError
              ? <Text style={[{ color: C.red, fontSize: 13 }]}>{timeError}</Text>
              : prayerTimes
                ? <View style={s.timesGrid}>
                    {PRAYERS.map(p => (
                      <View key={p} style={[s.timeItem, nextPrayer === p && { backgroundColor: C.gold + '22', borderRadius: 10 }]}>
                        <Text style={{ fontSize: 18, marginBottom: 2 }}>{PRAYER_EMOJIS[p]}</Text>
                        <Text style={[s.timePray, { color: C.text }]}>{p}</Text>
                        <Text style={[s.timeVal, { color: nextPrayer === p ? C.gold : C.accent }]}>{fmt(prayerTimes[p])}</Text>
                        {nextPrayer === p && <Text style={[{ color: C.gold, fontSize: 9, fontWeight: '800', marginTop: 2 }]}>NEXT</Text>}
                      </View>
                    ))}
                  </View>
                : null
          }
        </View>

        {/* Streak */}
        <View style={[s.streakCard, { backgroundColor: C.goldSoft, borderColor: C.gold + '44' }]}>
          <Text style={{ fontSize: 32 }}>🌟</Text>
          <View style={{ marginLeft: 14 }}>
            <Text style={[{ fontSize: 22, fontWeight: '800', color: C.gold }]}>{streak} day streak</Text>
            <Text style={[{ fontSize: 13, color: C.muted, marginTop: 2 }]}>All 5 prayers consecutive days</Text>
          </View>
        </View>

        {/* Salah */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>🙏 Salah Today</Text>
            <Text style={[s.badge, { backgroundColor: prayerCount === 5 ? C.greenSoft : C.goldSoft, color: prayerCount === 5 ? C.green : C.gold }]}>{prayerCount}/5</Text>
          </View>
          {PRAYERS.map(prayer => (
            <TouchableOpacity key={prayer} style={s.prayerRow} onPress={() => togglePrayer(prayer)} activeOpacity={0.7}>
              <View style={[s.pCheck, deen.prayers?.[prayer] && { backgroundColor: C.green, borderColor: C.green }]}>
                {deen.prayers?.[prayer] && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 20, marginHorizontal: 10 }}>{PRAYER_EMOJIS[prayer]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 15, fontWeight: '600', color: C.text }]}>{prayer}</Text>
                {prayerTimes && <Text style={[{ fontSize: 12, color: C.muted, marginTop: 1 }]}>{fmt(prayerTimes[prayer])}</Text>}
              </View>
              {deen.prayers?.[prayer] && <Text style={[{ color: C.green, fontWeight: '600', fontSize: 12 }]}>Prayed ✓</Text>}
              {nextPrayer === prayer && !deen.prayers?.[prayer] && (
                <View style={[{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: C.goldSoft }]}>
                  <Text style={[{ color: C.gold, fontSize: 11, fontWeight: '700' }]}>Now</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          {prayerCount === 5 && <Text style={[{ color: C.green, fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' }]}>🎉 All prayers done! +{XP_REWARDS.allPrayers}XP</Text>}
        </View>

        {/* Quran */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>📖 Quran Today</Text>
            <Text style={[{ fontSize: 22, fontWeight: '800', color: C.accent }]}>{deen.quranPages || 0} pages</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 5].map(n => (
              <TouchableOpacity key={n} style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: C.accentSoft }]} onPress={() => addQuranPage(n)}>
                <Text style={[{ fontWeight: '700', fontSize: 14, color: C.accent }]}>+{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[{ flex: 0.4, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: C.redSoft }]} onPress={() => addQuranPage(-1)}>
              <Text style={[{ fontWeight: '700', fontSize: 14, color: C.red }]}>-1</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Practices */}
        <View style={s.card}>
          <Text style={s.cardTitle}>✨ Daily Practices</Text>
          {[{ key: 'sadaqah', emoji: '💝', label: 'Sadaqah / Kindness', xp: XP_REWARDS.sadaqah }, { key: 'dhikr', emoji: '📿', label: 'Dhikr / Remembrance', xp: 10 }].map(item => (
            <TouchableOpacity key={item.key} style={s.practRow} onPress={() => toggle(item.key, item.xp, item.label)}>
              <View style={[s.pCheck, deen[item.key] && { backgroundColor: C.emerald, borderColor: C.emerald }]}>
                {deen[item.key] && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 22, marginHorizontal: 10 }}>{item.emoji}</Text>
              <Text style={[{ flex: 1, fontSize: 14, fontWeight: '600', color: C.text }]}>{item.label}</Text>
              <Text style={[{ color: C.accent, fontSize: 12, fontWeight: '700' }]}>+{item.xp}XP</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7-day */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Last 7 Days</Text>
          <View style={{ flexDirection: 'row' }}>
            {history.map(d => (
              <View key={d.date} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ gap: 3, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(i => <View key={i} style={[{ width: 10, height: 10, borderRadius: 3 }, { backgroundColor: i <= d.count ? C.green : C.border }]} />)}
                </View>
                <Text style={[{ fontSize: 10, fontWeight: '600', color: C.muted }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[{ borderRadius: 14, padding: 16, borderWidth: 1 }, { backgroundColor: C.goldSoft, borderColor: C.gold + '33' }]}>
          <Text style={[{ fontSize: 20, textAlign: 'center', marginBottom: 8, fontWeight: '600', color: C.text }]}>إِنَّ مَعَ الْعُسْرِ يُسْرًا</Text>
          <Text style={[{ fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 20, color: C.muted }]}>"Verily, with hardship comes ease." — Quran 94:6</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 16 },
  xpPopup: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, zIndex: 999 },
  xpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  timesCard: { borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  timesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  timesTitle: { fontSize: 16, fontWeight: '800' },
  timesLoc: { fontSize: 12, marginTop: 3 },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  timesGrid: { flexDirection: 'row' },
  timeItem: { alignItems: 'center', flex: 1, paddingVertical: 6 },
  timePray: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  timeVal: { fontSize: 10, fontWeight: '700' },
  streakCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  pCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  practRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
});
