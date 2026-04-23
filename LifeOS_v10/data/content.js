export const QUOTES = [
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Sleep is the single most effective thing you can do to reset your brain.", author: "Matthew Walker" },
  { text: "The ability to perform deep work is becoming increasingly rare and valuable.", author: "Cal Newport" },
  { text: "Manage your energy, not your time.", author: "Tony Schwartz" },
  { text: "Every action you take is a vote for the person you want to become.", author: "James Clear" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Consistency is more important than perfection.", author: "Unknown" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Energy, not time, is the fundamental currency of high performance.", author: "Jim Loehr" },
  { text: "The most important investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا — Verily, with hardship comes ease.", author: "Quran 94:6" },
  { text: "The best of people are those most beneficial to others.", author: "Prophet Muhammad ﷺ" },
  { text: "Seek knowledge from the cradle to the grave.", author: "Islamic Wisdom" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" },
];

export const getDailyQuote = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

export const BOOKS = [
  {
    id: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', emoji: '⚛️',
    color: '#F59E0B', colorSoft: '#F59E0B18', tagline: 'Tiny changes, remarkable results', readTime: '12 min',
    description: 'The definitive guide to building good habits. Small 1% improvements compound into extraordinary results over time.',
    chapters: [
      { title: 'The Power of Tiny Changes', content: `Most people overestimate what they can do in a day and underestimate what they can do in a year. We think in big leaps, but life changes through tiny steps.\n\nThe 1% rule: get 1% better every single day for a year and you end up 37 times better. Get 1% worse every day and you approach zero.\n\nBig goals create an all-or-nothing trap. Systems — the daily processes behind results — mean you're always progressing.\n\nThe core insight: You don't rise to the level of your goals. You fall to the level of your systems.` },
      { title: 'How Habits Actually Work', content: `Every habit follows a four-step loop: Cue → Craving → Response → Reward.\n\nThe cue triggers your brain to spot an opportunity. The craving is the motivational force. The response is the actual behavior. The reward satisfies the craving.\n\nTo build a good habit: make the cue obvious, the craving attractive, the response easy, the reward satisfying.\n\nTo break a bad habit, flip every step: make the cue invisible, the craving unattractive, the response difficult, the reward unsatisfying.` },
      { title: 'Identity-Based Habits', content: `Most people focus on outcomes ("I want to lose 10kg"). Clear argues you should start with identity ("I am someone who moves their body every day").\n\nThree layers of behavior change: outcomes, processes, identity. The most lasting change works inside out.\n\nEvery action is a vote for the type of person you want to become. Over time, the evidence accumulates and the identity becomes real.\n\nAsk not "what do I want to achieve?" but "who do I want to become?" — then act like that person starting today.` },
      { title: 'The Two-Minute Rule', content: `When starting a new habit, it should take less than two minutes to do.\n\n"Read every night" becomes "read one page." "Exercise daily" becomes "put on workout clothes."\n\nThe two-minute version isn't the goal — it's the entry point. Once you're in motion, you almost always continue.\n\nMaster the art of showing up. The most powerful thing you can do is prove to yourself you can do it at all — even in its smallest form.` },
      { title: 'Never Miss Twice', content: `Missing a habit once is an accident. Missing twice is the start of a new bad habit.\n\nThe "never miss twice" rule removes guilt from missing while keeping long-term momentum intact. You don't need a perfect record — you need a resilient one.\n\nA habit that happens 80% of the time for two years is far more valuable than one done perfectly for three weeks then abandoned.\n\nConsistency over intensity. Duration over perfection.` },
    ],
  },
  {
    id: 'deep-work', title: 'Deep Work', author: 'Cal Newport', emoji: '🧠',
    color: '#6C63FF', colorSoft: '#6C63FF18', tagline: 'Focus is the new superpower', readTime: '10 min',
    description: 'In a world of constant distraction, the ability to focus without interruption is becoming rare and increasingly valuable.',
    chapters: [
      { title: 'Deep Work vs Shallow Work', content: `Deep work is professional activity performed in a state of distraction-free concentration that pushes your cognitive capabilities to their limit.\n\nShallow work is non-cognitively demanding, logistical-style tasks performed while distracted — emails, meetings, notifications.\n\nThe modern economy rewards deep work highly but makes it increasingly rare. The people who can still go deep hold a massive competitive advantage.\n\nNewport's thesis: the ability to perform deep work is becoming both increasingly rare and increasingly valuable.` },
      { title: 'Protecting Your Deep Work Hours', content: `Deep work doesn't happen by accident. It requires deliberate scheduling and ruthless protection.\n\nThe rhythmic approach — most practical for most people — means building a daily deep work habit at the same time every day.\n\nTreat deep work like a professional appointment you cannot cancel. Block it on your calendar before anything else.\n\nFor most knowledge workers, 3-4 hours of true deep work per day is the practical ceiling. The goal is not more hours — it's more signal within the hours you have.` },
      { title: 'Quit Social Media', content: `Newport doesn't argue social media is evil. He argues it deserves critical scrutiny like any other tool.\n\nOnly adopt a tool if its benefits substantially outweigh its negatives, given your core goals.\n\nMost social media fails this test for knowledge workers. The benefits are mostly shallow. The costs — fragmented attention, reduced tolerance for boredom — are substantial.\n\nThe practical exercise: quit social media for 30 days without announcing it. At the end, ask: did anyone care? Did I miss anything irreplaceable?` },
      { title: 'Embrace Boredom', content: `You cannot pursue deep work if you've trained your brain to crave distraction the moment things get uncomfortable.\n\nMost people reach for their phone the instant they feel bored. This trains the brain to require constant input and makes sustained concentration nearly impossible.\n\nSchedule when you'll use the internet, and avoid it outside those times. Take walks without headphones. Sit with your thoughts.\n\nBoredom is not wasted time — it's when the brain consolidates learning, generates creative connections, and recovers from cognitive load.` },
    ],
  },
  {
    id: 'why-we-sleep', title: 'Why We Sleep', author: 'Matthew Walker', emoji: '😴',
    color: '#8B5CF6', colorSoft: '#8B5CF618', tagline: 'The science that changes everything', readTime: '10 min',
    description: 'A landmark work revealing how profoundly sleep shapes every aspect of our health, intelligence, and longevity.',
    chapters: [
      { title: 'Sleep is Not Optional', content: `We live in a culture that treats sleep deprivation as a badge of productivity. Walker's research shows this is one of the most dangerous lies in modern life.\n\nHumans need 7-9 hours. This isn't a guideline — it's a biological requirement. After 17 hours awake, cognitive performance equals someone legally drunk.\n\nMost people underestimate their own impairment because sleep deprivation also impairs self-assessment.\n\nThere is no life function that sleep does not affect.` },
      { title: 'What Happens While You Sleep', content: `Sleep is not a passive state. It is one of the most metabolically active periods of your existence.\n\nDuring NREM sleep, your brain transfers what you learned during the day from short-term to long-term storage. During REM sleep, the brain makes creative connections and strips emotional charge from difficult memories.\n\nCut sleep short and you interrupt both processes. A bad night's sleep before an exam is worse than studying less and sleeping well.\n\nSleep is not time stolen from productivity. It IS the productivity.` },
      { title: 'Light and Temperature', content: `Two environmental factors control sleep more than any others: light and temperature.\n\nBlue light from screens suppresses melatonin production — the chemical signal that tells your body it's night. Screens before bed delay melatonin by up to two hours.\n\nYour core body temperature needs to drop about 1°C to initiate sleep. A cool bedroom dramatically accelerates sleep onset.\n\nDim lights 1 hour before bed, use night mode on devices, and keep your bedroom cool. These two changes alone can transform sleep quality.` },
      { title: 'Caffeine and Alcohol', content: `Caffeine blocks adenosine receptors. The half-life of caffeine is 5-7 hours. A coffee at 2pm still has half its caffeine active at 7-9pm, actively fighting your sleep onset.\n\nAlcohol is widely misunderstood as a sleep aid. It sedates — which is not the same as sleep. Alcohol suppresses REM sleep and fragments the second half of the night.\n\nBoth substances are sleep disruptors wearing helpful disguises.\n\nCaffeine after 2pm and alcohol within 3 hours of bed are two of the most common and fixable causes of poor sleep.` },
    ],
  },
  {
    id: 'full-engagement', title: 'The Power of Full Engagement', author: 'Loehr & Schwartz', emoji: '⚡',
    color: '#10B981', colorSoft: '#10B98118', tagline: 'Manage energy, not time', readTime: '9 min',
    description: "The book that reframes the entire productivity conversation. It's not about time — it's about energy across four dimensions.",
    chapters: [
      { title: 'The Energy Paradigm', content: `Time management has dominated the productivity conversation for decades. Loehr and Schwartz argue we've been focused on the wrong resource.\n\nTime is fixed. Everyone gets 24 hours. But energy varies enormously between people — and within the same person across a day.\n\nThe goal of high performance is not to squeeze more hours out of the day. It is to bring the highest possible energy to every hour you have.\n\nFull engagement means bringing the right energy, in the right amount, to the things that matter most.` },
      { title: 'The Four Energy Dimensions', content: `Human performance draws from four interconnected energy sources: physical, emotional, mental, and spiritual.\n\nPhysical energy is the foundation — sleep, movement, nutrition. Without it, everything else suffers.\n\nEmotional energy determines the quality of your engagement. Negative emotions are enormous drains. Positive emotions are multipliers.\n\nMental energy governs focus. Spiritual energy is purpose and meaning. When work aligns with your values, energy is abundant.\n\nBurnout is rarely caused by working too much. It's caused by draining all four dimensions simultaneously without recovery.` },
      { title: 'Stress and Recovery', content: `The authors borrow a principle from elite athletic training: growth happens through the cycle of stress and recovery — not from stress alone.\n\nAthletes get stronger by applying stress and then allowing full recovery. Without recovery, the stress simply accumulates and eventually breaks the system.\n\nKnowledge workers apply stress (work) but rarely allow true recovery. Checking email during lunch is not recovery. Scrolling your phone is not recovery.\n\nThe highest performers oscillate most effectively between full engagement and full recovery.` },
      { title: 'The Power of Rituals', content: `Rituals are precisely defined behaviors performed at specific times — no decision required.\n\nWillpower depletes. Rituals become automatic. Pre-sleep rituals, morning rituals, pre-work rituals, recovery rituals.\n\nThe authors studied elite performers across fields and found rituals everywhere. Not as superstition, but as engineering.\n\nFeelings follow actions. You don't wait to feel ready — you perform the ritual, and the readiness follows.` },
    ],
  },
];
