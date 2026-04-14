import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTodayKey = () => new Date().toISOString().split('T')[0];

// ─── HABITS ───────────────────────────────────────────────
export const getTodayHabits = async () => {
  const data = await AsyncStorage.getItem('habits_' + getTodayKey());
  return data ? JSON.parse(data) : {
    exercise: false, reading: false,
    checklist: { water: false, noPhone: false, clothes: false, breakfast: false, plan: false },
  };
};

export const saveTodayHabits = async (log) => {
  await AsyncStorage.setItem('habits_' + getTodayKey(), JSON.stringify(log));
};

export const getAllHabitLogs = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const habitKeys = keys.filter(k => k.startsWith('habits_'));
  const pairs = await AsyncStorage.multiGet(habitKeys);
  const result = {};
  pairs.forEach(([key, val]) => {
    result[key.replace('habits_', '')] = JSON.parse(val);
  });
  return result;
};

export const getStreak = async (habitKey) => {
  const logs = await getAllHabitLogs();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (logs[key]?.[habitKey]) streak++;
    else break;
  }
  return streak;
};

export const getLast30Days = async () => {
  const logs = await getAllHabitLogs();
  const result = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({
      date: key,
      day: d.getDate(),
      exercise: logs[key]?.exercise || false,
      reading: logs[key]?.reading || false,
    });
  }
  return result;
};

export const missedYesterday = async (habitKey) => {
  const logs = await getAllHabitLogs();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const key = y.toISOString().split('T')[0];
  return !logs[key]?.[habitKey];
};

// ─── HEALTH ───────────────────────────────────────────────
export const getTodayHealth = async () => {
  const data = await AsyncStorage.getItem('health_' + getTodayKey());
  return data ? JSON.parse(data) : {
    energy: null, mood: null, water: 0, sleepHours: null,
  };
};

export const saveTodayHealth = async (health) => {
  await AsyncStorage.setItem('health_' + getTodayKey(), JSON.stringify(health));
};

export const getLast7DaysHealth = async () => {
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem('health_' + key);
    const data = raw ? JSON.parse(raw) : {};
    result.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      energy: data.energy || 0,
      mood: data.mood || 0,
      water: data.water || 0,
      sleepHours: data.sleepHours || 0,
    });
  }
  return result;
};

// ─── JOURNAL ──────────────────────────────────────────────
export const getTodayJournal = async () => {
  const data = await AsyncStorage.getItem('journal_' + getTodayKey());
  return data ? JSON.parse(data) : { wins: '', grateful: '', tomorrow: '', mood: null };
};

export const saveTodayJournal = async (entry) => {
  await AsyncStorage.setItem('journal_' + getTodayKey(), JSON.stringify(entry));
};

export const getRecentJournals = async (days = 7) => {
  const result = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem('journal_' + key);
    if (raw) result.push({ date: key, ...JSON.parse(raw) });
  }
  return result;
};

// ─── WEEKLY REVIEW ────────────────────────────────────────
export const getWeekKey = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const getWeeklyReview = async () => {
  const data = await AsyncStorage.getItem('weekly_' + getWeekKey());
  return data ? JSON.parse(data) : { rating: null, wins: '', improve: '', focus: '' };
};

export const saveWeeklyReview = async (review) => {
  await AsyncStorage.setItem('weekly_' + getWeekKey(), JSON.stringify(review));
};

// ─── BOOKS PROGRESS ───────────────────────────────────────
export const getBookProgress = async (bookId) => {
  const data = await AsyncStorage.getItem('book_' + bookId);
  return data ? JSON.parse(data) : { readChapters: [] };
};

export const saveBookProgress = async (bookId, progress) => {
  await AsyncStorage.setItem('book_' + bookId, JSON.stringify(progress));
};
