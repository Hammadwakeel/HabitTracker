export const QUOTES = [
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "You do not rise to the occasion, you sink to your training.", author: "Navy SEAL Saying" },
  { text: "A man who conquers himself is greater than one who conquers a thousand men in battle.", author: "Buddha" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Sleep is the single most effective thing you can do to reset your brain and body.", author: "Matthew Walker" },
  { text: "The ability to perform deep work is becoming increasingly rare and increasingly valuable.", author: "Cal Newport" },
  { text: "Manage your energy, not your time.", author: "Tony Schwartz" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Energy, not time, is the fundamental currency of high performance.", author: "Jim Loehr" },
  { text: "The most important investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Every action you take is a vote for the person you want to become.", author: "James Clear" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Consistency is more important than perfection.", author: "Unknown" },
];

export const getDailyQuote = () => {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
};
