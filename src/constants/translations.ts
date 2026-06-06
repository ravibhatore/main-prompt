/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRANSLATIONS = {
  appName: 'Aspirant Mind & Exam Wellness Tracker',
  tabs: {
    bento: 'Bento Grid Space',
    checkIn: 'Daily Check-In',
    triggers: 'Stress Triggers',
    reflection: 'Reflection Module',
    stats: 'Progress Dashboard',
    support: 'Wellness Support',
  },
  mood: {
    title: 'Daily Mood Check-In',
    morningPrompt: 'Good morning! Preparing for NEET, JEE, Board Exams, CUET, CAT, GATE, or UPSC? Track how you are starting your prep today.',
    eveningPrompt: 'Good evening! How went your revision sessions, mock papers, and practice sets today?',
    scale: {
      1: 'Burned out / Terrible',
      2: 'Anxious / Stressed',
      3: 'Okay / Neutral',
      4: 'Focused / Good',
      5: 'Confident / Great',
    },
    journalPlaceholder: 'Write down details about today’s prep stress, self-doubt, or study wins...',
    journalLabel: 'Journal Entry Details',
    charCount: 'character counter',
    logButton: 'Log Today’s Mood',
    successMsg: 'Mood logged successfully!',
    maxLengthWarning: 'Maximum 500 characters allowed.',
  },
  trigger: {
    title: 'Stress Trigger Identifier',
    description: 'Track the exam-related elements or anxieties affecting your focus, self-doubt, or well-being today.',
    predefined: {
      mock_test: 'Mock Test Performance (NEET/JEE/GATE)',
      syllabus: 'Syllabus Backlog & Overwhelm',
      peer: 'Peer Comparisons & Rank Stress',
      family: 'Family Expectations & Boards pressure',
      result_season: 'Result Season Anxiety & Fear',
      burnout: 'Study Burnout & Low Motivation',
      sleep: 'Sleep Deprivation (Midnight Oil)',
      uncertainty: 'Exam Uncertainty & Self-Doubt',
    },
    customLabel: 'Add Custom Stress Trigger',
    customPlaceholder: 'e.g., UPSC current affairs, NEET chemistry formulas, Board exam practicals',
    addButton: 'Add Trigger',
    logButton: 'Log Today’s Triggers',
    heatmapTitle: 'Recurring Triggers Heatmap (Last 30 Days)',
    frequencyTitle: 'Trigger Distribution',
    successMsg: 'Triggers logged successfully!',
  },
  reflection: {
    title: 'Emotion Reflection Module',
    promptHard: 'What was your biggest stress or self-doubt bottleneck today?',
    promptManaged: 'One study or mindfulness win I managed well today',
    promptTomorrow: 'Tomorrow I will tackle…',
    streakTitle: 'Your Daily Reflection Streak',
    streakSubtitle: 'days of mindfulness',
    savingReflection: 'Saving Reflection...',
    completedToday: 'You have logged your reflection for today. Awesome job maintaining your focus!',
    submitButton: 'Complete Reflection',
    historyTitle: 'Mindful Reflections History',
    noHistory: 'No reflections logged yet. Take your first step today.',
  },
  support: {
    title: 'Personalized Wellness Support',
    crisisTitle: 'Crisis Services & Helpline Support',
    crisisDescription: 'You’ve flagged low mood for multiple consecutive days. Please remember competitive exams do not define your worth. Professional support is completely free and anonymous:',
    resources: [
      {
        name: 'Vandrevala Foundation Helpline',
        phone: '+91 9999 666 555',
        descr: 'Mental health and exam counseling available 24/7/365.',
        url: 'https://vandrevalafoundation.com',
      },
      {
        name: 'iCall (TISS Helpline)',
        phone: '9152987821',
        descr: 'Professional mental health services; Monday to Saturday, 10 AM to 8 PM.',
        url: 'https://icallhelpline.org',
      },
      {
        name: 'Kiran Helpline (Govt of India)',
        phone: '1800-599-0019',
        descr: 'Mental health support and rehabilitation helpline service.',
        url: 'https://kiranhelpline.org',
      }
    ],
    tipsTitle: 'Exam-Oriented Micro-Tips & Exercises',
    tips: {
      breathing: {
        title: '4-7-8 Breathing Exercise',
        content: 'Calm the immediate "blank-out" panic during mock test series. Breathe in for 4s, hold for 7s, exhale for 8s to regain mental clarity.',
      },
      pomodoro: {
        title: 'Aspirant Pomodoro Shifts',
        content: 'Break rigorous syllabus (NCERT/UPSC/GATE) into 25-minute deep focus sprints followed by a 5-minute offline pause. Recharge your brains!',
      },
      sleep: {
        title: 'Memory Consolidation & Sleep',
        content: 'Crucial for formula/vocabulary retention in JEE/NEET/Board Prep. Commit to 7 hours of sleep to avoid midnight anxiety loops.',
      }
    },
    report: {
      title: 'Aspirant Deep Insights Report',
      weeklyTrend: 'Weekly Mood Trend',
      suggestionsTitle: 'Personalized Academic Improvement Plan',
      lowMoodSyllabusTip: 'Syllabus backlog or result anxiety is highly correlated with low mood. Try breaking down today’s NEET/JEE/Board block into smaller 10-problem milestones.',
      lowMoodSleepTip: 'Midnight burnout is causing anxiety spikes. Consider capping late-night study sessions at 11 PM to guard performance.',
      goodMoodTip: 'Outstanding focus levels! Replicate this positive exam mindset by keeping up mock test post-analysis and brief physical wellness walks.',
      averageLabel: 'Weekly Mental Fitness Average',
      topTriggersLabel: 'Top Exam Stressor This Week',
    }
  },
  dashboard: {
    title: 'Progress Dashboard',
    period7Days: 'Last 7 Days',
    period30Days: 'Last 30 Days',
    chartMoodTrend: 'Mood Trend Analytics',
    chartTriggerFreq: 'Trigger Frequency Analysis',
    noLogsY: 'No logs recorded for this timeframe yet.',
    milestones: {
      title: 'Acheivement & Streak Milestones',
      description: 'Progress in wellness is made of small, continuous milestones.',
      badges: {
        day1: { name: 'Mindfulness Beginner', description: 'Logged your first full mood reflection.' },
        day3: { name: 'Rhythm Builder', description: 'Maintained a 3-day reflection streak.' },
        day7: { name: 'Self-Awareness Master', description: 'Completed a full week of emotional check-ins.' },
      }
    }
  },
  pwa: {
    prompt: 'Add this application to your home screen for daily quick reflection check-ins.'
  }
};
