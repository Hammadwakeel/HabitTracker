import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = 'habit_logs';

// Get today's date string YYYY-MM-DD
export const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

// Get all logs
export const getAllLogs = async () => {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Get today's log
export const getTodayLog = async () => {
  const logs = await getAllLogs();
  const today = getTodayKey();
  return logs[today] || { exercise: false, reading: false };
};

// Save today's log
export const saveTodayLog = async (log) => {
  const logs = await getAllLogs();
  const today = getTodayKey();
  logs[today] = log;
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(logs));
};

// Calculate current streak for a habit
export const getStreak = async (habitKey) => {
  const logs = await getAllLogs();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().split('T')[0];
    if (logs[key] && logs[key][habitKey]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// Get last 30 days of logs for calendar view
export const getLast30Days = async () => {
  const logs = await getAllLogs();
  const result = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().split('T')[0];
    result.push({
      date: key,
      day: date.getDate(),
      exercise: logs[key]?.exercise || false,
      reading: logs[key]?.reading || false,
    });
  }
  return result;
};

// Check if user missed yesterday (for "never miss twice" warning)
export const missedYesterday = async (habitKey) => {
  const logs = await getAllLogs();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = yesterday.toISOString().split('T')[0];
  return logs[key] ? !logs[key][habitKey] : true;
};
