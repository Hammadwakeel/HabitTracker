import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTodayKey = () => new Date().toISOString().split('T')[0];

const get = async (key) => { try { const d = await AsyncStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; } };
const set = async (key, val) => { try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── HABITS ───────────────────────────────────────────────
export const getTodayHabits = async () => (await get('habits_' + getTodayKey())) || { exercise: false, reading: false, checklist: {}, top3: ['', '', ''], top3Done: [false, false, false] };
export const saveTodayHabits = async (v) => set('habits_' + getTodayKey(), v);

export const getAllHabitLogs = async () => {
  const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith('habits_'));
  const pairs = await AsyncStorage.multiGet(keys);
  const r = {};
  pairs.forEach(([k, v]) => { r[k.replace('habits_', '')] = JSON.parse(v); });
  return r;
};

export const getStreak = async (habitKey) => {
  const logs = await getAllHabitLogs();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (logs[key]?.[habitKey]) streak++; else break;
  }
  return streak;
};

export const getLast30Days = async () => {
  const logs = await getAllHabitLogs();
  const result = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, day: d.getDate(), exercise: logs[key]?.exercise || false, reading: logs[key]?.reading || false });
  }
  return result;
};

export const missedYesterday = async (habitKey) => {
  const logs = await getAllHabitLogs();
  const y = new Date(); y.setDate(y.getDate() - 1);
  return !logs[y.toISOString().split('T')[0]]?.[habitKey];
};

// ─── HEALTH ───────────────────────────────────────────────
export const getTodayHealth = async () => (await get('health_' + getTodayKey())) || { energy: null, mood: null, water: 0, sleepHours: null, weight: null, noJunk: false, meals: { breakfast: false, lunch: false, dinner: false }, lastCoffee: null, fastStart: null, fastEnd: null };
export const saveTodayHealth = async (v) => set('health_' + getTodayKey(), v);

export const getLast7DaysHealth = async () => {
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const data = (await get('health_' + key)) || {};
    result.push({ date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), ...data });
  }
  return result;
};

export const getWeightHistory = async () => {
  const today = new Date();
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const data = (await get('health_' + key)) || {};
    if (data.weight) result.push({ date: key, label: d.getDate() + '/' + (d.getMonth() + 1), weight: data.weight });
  }
  return result;
};

// ─── DEEN ─────────────────────────────────────────────────
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const getTodayDeen = async () => (await get('deen_' + getTodayKey())) || { prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false }, quranPages: 0, sadaqah: false, dhikr: false };
export const saveTodayDeen = async (v) => set('deen_' + getTodayKey(), v);

export const getDeenStreak = async () => {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const data = await get('deen_' + key);
    if (data && Object.values(data.prayers).every(Boolean)) streak++; else break;
  }
  return streak;
};

export const getLast7DaysDeen = async () => {
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const data = (await get('deen_' + key)) || { prayers: {} };
    const count = PRAYERS.filter(p => data.prayers?.[p]).length;
    result.push({ date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), count, quranPages: data.quranPages || 0 });
  }
  return result;
};

// ─── JOURNAL ──────────────────────────────────────────────
export const getTodayJournal = async () => (await get('journal_' + getTodayKey())) || { wins: '', grateful: '', tomorrow: '', mood: null, trigger: '', decision: '' };
export const saveTodayJournal = async (v) => set('journal_' + getTodayKey(), v);
export const getRecentJournals = async (days = 7) => {
  const result = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const raw = await get('journal_' + key);
    if (raw) result.push({ date: key, ...raw });
  }
  return result;
};

// ─── FOCUS ────────────────────────────────────────────────
export const getTodayFocus = async () => (await get('focus_' + getTodayKey())) || { pomodorosDone: 0, distractions: 0, projects: {} };
export const saveTodayFocus = async (v) => set('focus_' + getTodayKey(), v);

// ─── GROWTH ───────────────────────────────────────────────
export const getGrowthData = async () => (await get('growth')) || { monthlyGoal: 0, payments: [], pipeline: [], skills: [], courses: [] };
export const saveGrowthData = async (v) => set('growth', v);

// ─── XP & GAMIFICATION ────────────────────────────────────
export const getXPData = async () => (await get('xp')) || { total: 0, level: 1, badges: [], sprint: null, bucketList: [], lifeWheel: {} };
export const saveXPData = async (v) => set('xp', v);

export const addXP = async (amount, reason) => {
  const data = await getXPData();
  data.total += amount;
  data.level = Math.floor(data.total / 100) + 1;
  await saveXPData(data);
  return data;
};

// ─── PROGRESS / WEEKLY REVIEW ─────────────────────────────
export const getWeekKey = () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d.setDate(diff)); return m.toISOString().split('T')[0]; };
export const getWeeklyReview = async () => (await get('weekly_' + getWeekKey())) || { rating: null, wins: '', improve: '', focus: '', timeAudit: {} };
export const saveWeeklyReview = async (v) => set('weekly_' + getWeekKey(), v);

// ─── PEOPLE ───────────────────────────────────────────────
export const getPeople = async () => (await get('people')) || [];
export const savePeople = async (v) => set('people', v);

// ─── BOOKS ────────────────────────────────────────────────
export const getBookProgress = async (id) => (await get('book_' + id)) || { readChapters: [] };
export const saveBookProgress = async (id, v) => set('book_' + id, v);

// ─── ONBOARDING ───────────────────────────────────────────
export const getOnboarded = async () => (await get('onboarded')) || false;
export const setOnboarded = async () => set('onboarded', true);
export const getProfile = async () => (await get('profile')) || { name: 'Hammad', wakeTime: '10:00', sleepTime: '01:00', weightGoal: null, revenueGoal: 0 };
export const saveProfile = async (v) => set('profile', v);

// ─── CUSTOM HABITS ────────────────────────────────────────
export const getCustomHabits = async () => (await get('customHabits')) || [];
export const saveCustomHabits = async (v) => set('customHabits', v);

// ─── STREAK FREEZE ────────────────────────────────────────
export const getStreakFreezes = async () => (await get('streakFreezes')) || { tokens: 3, used: {} };
export const saveStreakFreezes = async (v) => set('streakFreezes', v);

export const useStreakFreeze = async (habitKey) => {
  const data = await getStreakFreezes();
  if (data.tokens <= 0) return false;
  const today = getTodayKey();
  data.tokens -= 1;
  data.used[`${habitKey}_${today}`] = true;
  await saveStreakFreezes(data);
  return true;
};

export const earnStreakFreeze = async () => {
  const data = await getStreakFreezes();
  data.tokens = Math.min(data.tokens + 1, 10);
  await saveStreakFreezes(data);
  return data;
};

// ─── PERSONAL RECORDS ────────────────────────────────────
export const getPersonalRecords = async () => (await get('personalRecords')) || {
  bestExerciseStreak: 0,
  bestReadingStreak: 0,
  bestPrayerStreak: 0,
  mostXPInDay: 0,
  totalHabitsCompleted: 0,
  firstHabitDate: null,
  longestBothStreak: 0,
};

export const updatePersonalRecords = async (updates) => {
  const current = await getPersonalRecords();
  const updated = { ...current };
  for (const [key, val] of Object.entries(updates)) {
    if (val > (current[key] || 0)) updated[key] = val;
  }
  if (!updated.firstHabitDate) updated.firstHabitDate = getTodayKey();
  updated.totalHabitsCompleted = (current.totalHabitsCompleted || 0) + (updates.increment || 0);
  await set('personalRecords', updated);
  return updated;
};

// ─── WEEK STATS (for share card) ─────────────────────────
export const getWeekStats = async () => {
  const logs = await getAllHabitLogs();
  const today = new Date();
  let weekEx = 0, weekRd = 0, weekWater = 0, weekSleep = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (logs[key]?.exercise) weekEx++;
    if (logs[key]?.reading) weekRd++;
    const health = await get('health_' + key);
    if (health?.water >= 8) weekWater++;
    if (health?.sleepHours >= 7) weekSleep++;
  }
  return { weekExercise: weekEx, weekReading: weekRd, weekWater, weekSleep };
};

// ─── CACHED PRAYER TIMES (offline support) ───────────────
export const getCachedPrayerTimes = async (city) => {
  const key = `prayerCache_${city}_${getTodayKey()}`;
  return await get(key);
};
export const cachePrayerTimes = async (city, times) => {
  const key = `prayerCache_${city}_${getTodayKey()}`;
  await set(key, times);
};
