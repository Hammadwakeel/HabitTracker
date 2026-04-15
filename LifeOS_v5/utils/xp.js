export const XP_REWARDS = {
  exercise: 20,
  reading: 15,
  allPrayers: 25,
  quranPage: 2,
  journal: 10,
  pomodoro: 10,
  water8: 10,
  sleep7plus: 15,
  noJunk: 10,
  sadaqah: 20,
  top3Done: 15,
};

export const LEVELS = [
  { level: 1, title: 'Beginner', minXP: 0, emoji: '🌱' },
  { level: 2, title: 'Rising', minXP: 100, emoji: '🌿' },
  { level: 3, title: 'Committed', minXP: 250, emoji: '⚡' },
  { level: 4, title: 'Focused', minXP: 500, emoji: '🔥' },
  { level: 5, title: 'Disciplined', minXP: 800, emoji: '💪' },
  { level: 6, title: 'Consistent', minXP: 1200, emoji: '🎯' },
  { level: 7, title: 'High Performer', minXP: 1800, emoji: '🚀' },
  { level: 8, title: 'Elite', minXP: 2500, emoji: '👑' },
  { level: 9, title: 'Master', minXP: 3500, emoji: '🏆' },
  { level: 10, title: 'Legend', minXP: 5000, emoji: '⭐' },
];

export const BADGES = [
  { id: 'first_day', title: 'First Step', desc: 'Complete your first habit', emoji: '👣', condition: (xp) => xp.total >= 20 },
  { id: 'week_exercise', title: 'Week Warrior', desc: '7-day exercise streak', emoji: '🏋️', condition: (_, streaks) => streaks.exercise >= 7 },
  { id: 'week_reading', title: 'Bookworm', desc: '7-day reading streak', emoji: '📚', condition: (_, streaks) => streaks.reading >= 7 },
  { id: 'prayers_week', title: 'Devoted', desc: '7 days of all 5 prayers', emoji: '🕌', condition: (xp) => xp.total >= 175 },
  { id: 'level5', title: 'Disciplined', desc: 'Reach Level 5', emoji: '💪', condition: (xp) => xp.total >= 800 },
  { id: 'level10', title: 'Legend', desc: 'Reach Level 10', emoji: '⭐', condition: (xp) => xp.total >= 5000 },
  { id: 'month_both', title: '30-Day Beast', desc: 'Both habits 30 days straight', emoji: '🔥', condition: (_, streaks) => streaks.exercise >= 30 && streaks.reading >= 30 },
  { id: 'journal_week', title: 'Reflector', desc: 'Journal 7 days in a row', emoji: '✍️', condition: (xp) => xp.total >= 70 },
];

export const getLevelInfo = (totalXP) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next ? ((totalXP - current.minXP) / (next.minXP - current.minXP)) * 100 : 100;
  return { current, next, progress };
};
