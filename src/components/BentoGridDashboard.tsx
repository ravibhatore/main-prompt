/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useMoodLog } from '../hooks/useMoodLog';
import { useStressTriggers } from '../hooks/useStressTriggers';
import { useWellnessReport } from '../hooks/useWellnessReport';
import { useWellnessStore, getLocalDateString } from '../store/useWellnessStore';
import { TRANSLATIONS } from '../constants/translations';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  Smile, 
  Flame, 
  ExternalLink, 
  Plus, 
  CheckCircle, 
  HelpCircle, 
  AlertCircle,
  BrainCircuit,
  Settings,
  BookOpen
} from 'lucide-react';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😀',
};

export const BentoGridDashboard: React.FC = () => {
  const { streakCount, reflections, addReflection, resetStore, selectedExams = [], setSelectedExams } = useWellnessStore();
  
  const EXAMS_LIST = ['Boards', 'NEET', 'JEE', 'CUET', 'CAT', 'GATE', 'UPSC'];

  const handleToggleExam = (exam: string) => {
    let nextExams = [...selectedExams];
    if (nextExams.includes(exam)) {
      if (nextExams.length > 1) {
        nextExams = nextExams.filter((e) => e !== exam);
      }
    } else {
      nextExams.push(exam);
    }
    setSelectedExams(nextExams);
  };
  
  // Hook Data
  const { timeOfDay, todayMoodLog, logMood, allMoodLogs } = useMoodLog();
  const { todayTriggerLog, logTriggers, heatmapData, allTriggers } = useStressTriggers();
  const { showCrisisResources, weeklyAnalytics } = useWellnessReport();

  // Mood component state
  const [selectedMood, setSelectedMood] = useState<number>(todayMoodLog?.mood || 3);
  const [journal, setJournal] = useState<string>(todayMoodLog?.journal || '');
  const [moodSaveStatus, setMoodSaveStatus] = useState<string | null>(null);

  // Triggers component state
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState<string>('');
  const [activeCustoms, setActiveCustoms] = useState<string[]>([]);
  const [triggerSaveStatus, setTriggerSaveStatus] = useState<string | null>(null);

  // Reflection component state
  const todayStr = getLocalDateString();
  const todayReflected = reflections.find((r) => r.date === todayStr);
  const [hardToday, setHardToday] = useState<string>('');
  const [managedWell, setManagedWell] = useState<string>('');
  const [tomorrowWill, setTomorrowWill] = useState<string>('');
  const [reflectionSaveSuccess, setReflectionSaveSuccess] = useState<boolean>(false);

  // Wellness Nudge panel interactive state
  const [activeNudgeKey, setActiveNudgeKey] = useState<'breathing' | 'pomodoro' | 'sleep'>('breathing');
  const [breatheState, setBreatheState] = useState<'Idle' | 'Inhale...' | 'Hold...' | 'Exhale...'>('Idle');
  const [breatheTimer, setBreatheTimer] = useState<number>(0);

  // Sync states on load or store update
  useEffect(() => {
    if (todayMoodLog) {
      setSelectedMood(todayMoodLog.mood);
      setJournal(todayMoodLog.journal || '');
    }
  }, [todayMoodLog]);

  useEffect(() => {
    if (todayTriggerLog) {
      setSelectedCats(todayTriggerLog.categories);
      const predefinedKeys = Object.keys(TRANSLATIONS.trigger.predefined);
      const customs = todayTriggerLog.categories.filter((cat) => !predefinedKeys.includes(cat));
      if (customs.length > 0) {
        setActiveCustoms((prev) => Array.from(new Set([...prev, ...customs])));
      }
    }
  }, [todayTriggerLog]);

  // Breathing timer update
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (breatheState !== 'Idle') {
      interval = setInterval(() => {
        setBreatheTimer((prev) => {
          if (prev <= 1) {
            if (breatheState === 'Inhale...') {
              setBreatheState('Hold...');
              return 7;
            } else if (breatheState === 'Hold...') {
              setBreatheState('Exhale...');
              return 8;
            } else {
              setBreatheState('Inhale...');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breatheState]);

  // Actions
  const handleMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = logMood(selectedMood, journal);
    if (res.success) {
      setMoodSaveStatus("Mood saved");
      setTimeout(() => setMoodSaveStatus(null), 3000);
    }
  };

  const handleAddCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = customInput.trim();
    if (cleanStr && !activeCustoms.includes(cleanStr)) {
      setActiveCustoms((prev) => [...prev, cleanStr]);
      setSelectedCats((prev) => [...prev, cleanStr]);
      setCustomInput('');
    }
  };

  const handleTriggerToggle = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSaveTriggers = () => {
    logTriggers(selectedCats);
    setTriggerSaveStatus("Triggers updated");
    setTimeout(() => setTriggerSaveStatus(null), 3000);
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hardToday.trim() && managedWell.trim() && tomorrowWill.trim()) {
      addReflection(hardToday.trim(), managedWell.trim(), tomorrowWill.trim());
      setReflectionSaveSuccess(true);
      setTimeout(() => setReflectionSaveSuccess(false), 3000);
      setHardToday('');
      setManagedWell('');
      setTomorrowWill('');
    }
  };

  const toggleBreathingCycle = () => {
    if (breatheState === 'Idle') {
      setBreatheState('Inhale...');
      setBreatheTimer(4);
    } else {
      setBreatheState('Idle');
      setBreatheTimer(0);
    }
  };

  const trendChartData = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return [...allMoodLogs]
      .filter((log) => log.timestamp >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        const parts = item.date.split('-');
        return {
          date: parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date,
          MoodRating: item.mood,
        };
      });
  }, [allMoodLogs]);

  const moodAverageLabel = () => {
    if (trendChartData.length === 0) return 'No Logs';
    const total = trendChartData.reduce((acc, curr) => acc + curr.MoodRating, 0);
    const avg = total / trendChartData.length;
    if (avg <= 1.8) return 'Heavy Distress';
    if (avg <= 2.8) return 'Stressed';
    if (avg <= 3.8) return 'Neutral / Calm';
    return 'Consistently Good';
  };

  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
    if (count === 1) return 'bg-emerald-100 hover:bg-emerald-200';
    if (count === 2) return 'bg-emerald-300 hover:bg-emerald-400';
    return 'bg-emerald-600 hover:bg-emerald-700 shadow-xs';
  };

  return (
    <div className="space-y-6" id="bento-grid-dashboard">
      
      {/* Crisis Warning Bar built inside the Bento workspace */}
      {showCrisisResources && (
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-5 text-slate-800 animate-pulse flex flex-col sm:flex-row gap-4 items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <AlertCircle className="w-4 h-4 text-red-600" /> Crisis Support Triggered
            </h3>
            <p className="text-xs text-red-800/90 font-medium">
              You've logged lower mood over consecutive days. Professional help is completely free and confidential:
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs font-mono font-bold text-red-950">
              <span>📞 Vandrevala: +91 9999 666 555</span>
              <span>📞 iCall TISS: 9152987821</span>
              <span>📞 Kiran Govt: 1800-599-0019</span>
            </div>
          </div>
          <a 
            href="https://vandrevalafoundation.com" 
            target="_blank" 
            rel="no-referrer" 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 justify-center shrink-0"
          >
            Get Help <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Bento Grid Core Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* EXAM PREPARATION COMPASS CARD: customized selection profile */}
        <div className="md:col-span-12 bg-linear-to-br from-emerald-500/10 via-slate-50 to-emerald-50 border border-emerald-100/80 rounded-[32px] p-6 shadow-xxs" id="bento-card-exams">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-600/10 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">Exam Profile</span>
                <span className="text-xs text-slate-400 font-mono">Active Target Customization</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                Which board or competitive examinations are you preparing for?
              </h2>
              <p className="text-slate-500 text-xs font-normal">
                Select your academic goals to specialize study burnout trackers, anxiety logs, and mindfulness worksheets.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {EXAMS_LIST.map((exam) => {
                const isSelected = selectedExams.includes(exam);
                return (
                  <button
                    key={exam}
                    onClick={() => handleToggleExam(exam)}
                    aria-pressed={isSelected}
                    aria-label={`Toggle preparation checklist for ${exam}`}
                    className={`px-4 py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-slate-900 border-slate-950 text-white shadow-sm ring-2 ring-slate-900/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-305'}`} />
                    <span>{exam}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200/50 flex flex-wrap gap-x-6 gap-y-2 items-center text-[10px] font-mono text-slate-505">
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-800 uppercase">Active Tracing:</span> 
              <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-150">
                {selectedExams.join(', ') || 'No Selection'}
              </span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">✨ Self-regulation prompts automatically adapt</span>
          </div>
        </div>

        {/* CARD 1: Mood Check-in Card (span-4, row-span-4) */}
        <div className="md:col-span-4 bg-white rounded-[32px] border border-slate-200 shadow-xs p-6 flex flex-col justify-between" id="bento-card-mood">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Daily Mood</h2>
              <span className="text-[10px] px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-500 font-mono italic">
                {timeOfDay === 'morning' ? 'Morning Prompt' : 'Evening Prompt'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 font-medium italic">
              {timeOfDay === 'morning' ? TRANSLATIONS.mood.morningPrompt : TRANSLATIONS.mood.eveningPrompt}
            </p>

            <div className="flex justify-between items-center py-2.5 gap-1 mb-4" role="radiogroup" aria-label="Daily mood selection">
              {[1, 2, 3, 4, 5].map((level) => {
                const active = selectedMood === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedMood(level)}
                    role="radio"
                    aria-checked={active}
                    aria-label={`Mood rating ${level} of 5 - ${TRANSLATIONS.mood.scale[level as 1|2|3|4|5]}`}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-all hover:scale-105 cursor-pointer ${
                      active
                        ? 'bg-emerald-50 border-2 border-emerald-500 scale-105 ring-4 ring-emerald-50'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
                    }`}
                  >
                    {MOOD_EMOJIS[level]}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label htmlFor="bento-journal" className="text-xs font-bold text-slate-400 uppercase font-mono mb-2 block">
                How are you feeling?
              </label>
              <textarea
                id="bento-journal"
                value={journal}
                maxLength={500}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Write down any stress triggers or wins..."
                className="w-full h-28 bg-slate-50 border border-slate-100/60 rounded-2xl p-4 text-xs font-normal text-slate-705 focus:outline-hidden focus:bg-white focus:border-emerald-500 transition-all resize-none placeholder-slate-350 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
            <span className="text-[10px] text-slate-400 font-mono">
              {journal.length} / 500 chars
            </span>
            <button
              onClick={handleMoodSubmit}
              className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              {moodSaveStatus ? '✓ Saved' : 'Save Entry'}
            </button>
          </div>
        </div>

        {/* CARD 2: Progress Trend (span-8, row-span-3) */}
        <div className="md:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-xs p-6 flex flex-col justify-between" id="bento-card-trend">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Mood Trend (30 Days)</h2>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-505 uppercase font-mono font-bold">
                  Average Status: {moodAverageLabel()}
                </span>
              </div>
            </div>

            {/* Recharts real chart visualization inside bento */}
            <div className="relative h-44 w-full">
              {trendChartData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <span className="text-2xl mb-1 mt-6">📊</span>
                  <p className="text-xxs font-mono uppercase tracking-widest">{TRANSLATIONS.dashboard.noLogsY}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} style={{ fontFamily: 'monospace' }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={9} style={{ fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#1e293b' }} />
                    <Line type="monotone" dataKey="MoodRating" stroke="#059669" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-3 text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
            <span>30d Trend Analysis</span>
            <span>Local Secure Graph telemetry</span>
          </div>
        </div>

        {/* CARD 3: Stress Triggers heatmap (span-4, row-span-3) */}
        <div className="md:col-span-4 bg-white rounded-[32px] border border-slate-200 shadow-xs p-6 flex flex-col justify-between" id="bento-card-heatmap">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono mb-4">Frequency Heatmap</h2>
            
            {/* Dynamic live calendar heatmap blocks mapping true state */}
            <div className="grid grid-cols-10 gap-1 mb-5">
              {heatmapData.slice(-30).map((day) => (
                <div
                  key={day.date}
                  title={`${day.dayLabel}: ${day.count} trigger(s)`}
                  className={`aspect-square rounded-md transition-all ${getHeatmapColor(day.count)}`}
                />
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4">
              <p className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1.5">Top Identified Trigger</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md text-[10px] font-bold">
                  {weeklyAnalytics.topTrigger || 'None Logged Recently'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {allTriggers.length > 0 ? `Registered ${allTriggers.length} entries` : 'Clear history'}
                </span>
              </div>
            </div>

            {/* Micro Trigger Input */}
            <div className="mt-4 pt-3 border-t border-slate-50">
              <p className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-2">Toggle today's stress elements:</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.entries(TRANSLATIONS.trigger.predefined).slice(0, 3).map(([key, label]) => {
                  const isSelected = selectedCats.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleTriggerToggle(key)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg border font-semibold truncate transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSaveTriggers}
                className="w-full bg-slate-900 hover:bg-black text-white py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-all text-center"
              >
                {triggerSaveStatus ? 'Saved Triggers ✓' : 'Save Triggers'}
              </button>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 font-mono border-t border-slate-50 pt-2 mt-4 flex justify-between">
            <span>Wellness Analytics</span>
            <span>30-Day Grid view</span>
          </div>
        </div>

        {/* CARD 4: Wellness Nudge Card (span-4, row-span-2) - Slate Dark theme! */}
        <div className="md:col-span-4 bg-slate-900 rounded-[32px] border border-slate-850 shadow-lg p-6 text-white flex flex-col justify-between" id="bento-card-support">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Wellness Nudge</h2>
              </div>
              <div className="flex bg-white/10 p-0.5 rounded-lg">
                <button 
                  onClick={() => setActiveNudgeKey('breathing')} 
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${activeNudgeKey === 'breathing' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                >
                  Breathe
                </button>
                <button 
                  onClick={() => setActiveNudgeKey('pomodoro')} 
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${activeNudgeKey === 'pomodoro' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                >
                  Work
                </button>
                <button 
                  onClick={() => setActiveNudgeKey('sleep')} 
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${activeNudgeKey === 'sleep' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                >
                  Sleep
                </button>
              </div>
            </div>

            {activeNudgeKey === 'breathing' && (
              <div className="space-y-4">
                <p className="text-xs font-light leading-relaxed text-slate-300">
                  {TRANSLATIONS.support.tips.breathing.content}
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                  <button
                    onClick={toggleBreathingCycle}
                    className="px-3.5 py-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xxs font-bold transition-all cursor-pointer select-none"
                  >
                    {breatheState === 'Idle' ? 'Start 4-7-8 Breathing' : 'Reset Guide'}
                  </button>
                  {breatheState !== 'Idle' && (
                    <div className="flex items-center gap-1.5 mr-1 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      <span className="text-[10px] font-mono text-emerald-300 font-extrabold">{breatheState} ({breatheTimer}s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeNudgeKey === 'pomodoro' && (
              <div className="space-y-3">
                <p className="text-xs font-light leading-relaxed text-slate-300">
                  {TRANSLATIONS.support.tips.pomodoro.content}
                </p>
                <div className="text-[10px] text-slate-400 font-mono bg-white/5 p-2 rounded-lg text-center">
                  ⏱ Use a physical timer for best focus alignment.
                </div>
              </div>
            )}

            {activeNudgeKey === 'sleep' && (
              <div className="space-y-3">
                <p className="text-xs font-light leading-relaxed text-slate-300">
                  {TRANSLATIONS.support.tips.sleep.content}
                </p>
                <div className="text-[10px] text-slate-400 font-mono bg-white/5 p-2 rounded-lg text-center">
                  🌙 Turn off blue screens at 10:00 PM tonight.
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-5 border-t border-white/5 pt-3">
            <span className="bg-white/10 px-2.5 py-1 rounded-full text-[9px] font-mono hover:bg-white/15 cursor-default">Coping Tips</span>
            <span className="bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full text-[9px] font-mono border border-emerald-500/20">Self-Regulation</span>
          </div>
        </div>

        {/* CARD 5: Guided Reflection Card (span-4, row-span-2) - Emerald Accent theme! */}
        <div className="md:col-span-4 bg-emerald-50 rounded-[32px] border border-emerald-150 shadow-xs p-6 flex flex-col justify-between" id="bento-card-reflection">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-800/60 font-mono">Reflection Worksheet</h2>
              <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-200/40 px-2.5 py-0.5 rounded-full">
                {streakCount}-Day Streak
              </span>
            </div>

            {todayReflected ? (
              <div className="space-y-3 text-xs text-emerald-950 bg-white/40 p-3.5 rounded-2xl border border-emerald-100">
                <p className="text-[9px] font-mono text-emerald-850 uppercase font-bold">One small thing I managed well today:</p>
                <p className="italic font-medium text-emerald-900 leading-relaxed">“ {todayReflected.managedWell} ”</p>
                <p className="text-[8px] text-emerald-700 font-mono">Done! Your daily reflection counts towards streaks.</p>
              </div>
            ) : (
              <form onSubmit={handleReflectionSubmit} className="space-y-3">
                <p className="text-xs text-emerald-900 font-medium italic mb-1.5">
                  "What is one small thing you managed well today?"
                </p>
                <textarea
                  required
                  rows={2}
                  value={managedWell}
                  onChange={(e) => setManagedWell(e.target.value)}
                  placeholder="e.g. Completed assignment, spoke with a friend, took a walk..."
                  className="w-full text-xs p-3.5 bg-white border border-emerald-200/50 rounded-2xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-emerald-950 placeholder-emerald-800/40 transition-all resize-none leading-relaxed"
                />
                
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    required
                    value={hardToday}
                    onChange={(e) => setHardToday(e.target.value)}
                    placeholder="What was hard?"
                    className="w-full text-[10px] p-2 bg-white border border-emerald-200/50 rounded-xl text-emerald-950 placeholder-emerald-800/40 outline-hidden focus:border-emerald-600 transition-all"
                  />
                  <input
                    type="text"
                    required
                    value={tomorrowWill}
                    onChange={(e) => setTomorrowWill(e.target.value)}
                    placeholder="Tomorrow expectation"
                    className="w-full text-[10px] p-2 bg-white border border-emerald-200/50 rounded-xl text-emerald-950 placeholder-emerald-800/40 outline-hidden focus:border-emerald-600 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-750 hover:bg-emerald-850 text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition-all text-center"
                >
                  {reflectionSaveSuccess ? '✓ Reflection Logged' : 'Submit Reflection'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 border-t border-emerald-150/40 pt-3 flex justify-between items-center">
            <span className="text-[10px] text-emerald-850/60 font-bold uppercase font-mono">Mindfulness Goal</span>
            <span className="text-xs font-bold text-emerald-900">10-Day Badge: {streakCount}/10</span>
          </div>
        </div>

        {/* CARD 6: General Resources / Support Links Footer (span-12, row-span-1) */}
        <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 px-8 bg-white/70 backdrop-blur-md rounded-[24px] border border-slate-200 shadow-xxs">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
              Support Resources:
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              <a 
                href="https://icallhelpline.org" 
                target="_blank" 
                rel="no-referrer" 
                className="hover:text-slate-900 font-medium transition-colors flex items-center gap-1"
              >
                iCall Helpline <ExternalLink className="w-3 h-3 text-slate-350" />
              </a>
              <a 
                href="https://vandrevalafoundation.com" 
                target="_blank" 
                rel="no-referrer" 
                className="hover:text-slate-900 font-medium transition-colors flex items-center gap-1"
              >
                Vandrevala Foundation <ExternalLink className="w-3 h-3 text-slate-350" />
              </a>
              <a 
                href="https://kiranhelpline.org" 
                target="_blank" 
                rel="no-referrer" 
                className="hover:text-slate-900 font-medium transition-colors flex items-center gap-1"
              >
                Kiran Crisis Intervention <ExternalLink className="w-3 h-3 text-slate-350" />
              </a>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <div className="h-2 w-2 rounded-full bg-slate-200"></div>
            <div className="h-2 w-2 rounded-full bg-slate-200"></div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

      </div>

      {/* Global state reset in settings capsule */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear your local database files? All logs, streaks, and reflections will be cleared.")) {
              resetStore();
            }
          }}
          className="text-[10px] text-slate-400 uppercase tracking-widest font-bold hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Settings className="w-3 h-3" />
          <span>Reset Database Records</span>
        </button>
      </div>

    </div>
  );
};
