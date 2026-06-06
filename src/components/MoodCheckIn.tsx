/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMoodLog } from '../hooks/useMoodLog';
import { TRANSLATIONS } from '../constants/translations';
import { Smile, CheckCircle, Clock } from 'lucide-react';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😀',
};

/**
 * Daily mood logging panel. Handles emoji scale selecting, optional free-text typing,
 * character counting limits, and logs with visual feedback.
 */
export const MoodCheckIn: React.FC = () => {
  const { timeOfDay, todayMoodLog, logMood } = useMoodLog();
  const [selectedMood, setSelectedMood] = useState<number>(todayMoodLog?.mood || 3);
  const [journal, setJournal] = useState<string>(todayMoodLog?.journal || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (todayMoodLog) {
      setSelectedMood(todayMoodLog.mood);
      setJournal(todayMoodLog.journal || '');
    }
  }, [todayMoodLog]);

  /**
   * Responds to form submission by validating and invoking the mood logging hook trigger.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = logMood(selectedMood, journal);
    if (result.success) {
      setSaveStatus(TRANSLATIONS.mood.successMsg);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const currentPrompt = timeOfDay === 'morning' 
    ? TRANSLATIONS.mood.morningPrompt 
    : TRANSLATIONS.mood.eveningPrompt;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto" id="mood-checkin-panel">
      <div className="flex items-center gap-2 mb-4">
        <Smile className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-slate-800">{TRANSLATIONS.mood.title}</h2>
      </div>

      <div className="mb-5 p-4 bg-emerald-50/50 rounded-xl flex items-start gap-2.5 border border-emerald-50">
        <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm text-emerald-800 font-medium">{currentPrompt}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood select list */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-3">
            Select Your Overall Vibe
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((level) => {
              const active = selectedMood === level;
              return (
                <button
                  key={level}
                  type="button"
                  id={`mood-btn-${level}`}
                  onClick={() => setSelectedMood(level)}
                  className={`py-3.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    active
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 scale-102 shadow-xs'
                      : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl" role="img" aria-label={TRANSLATIONS.mood.scale[level as 1|2|3|4|5]}>
                    {MOOD_EMOJIS[level]}
                  </span>
                  <span className="text-xxs sm:text-xs font-medium text-center truncate w-full px-0.5">
                    {TRANSLATIONS.mood.scale[level as 1|2|3|4|5]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Free text input area */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="journal-text" className="block text-xs font-mono font-semibold uppercase text-slate-400">
              {TRANSLATIONS.mood.journalLabel}
            </label>
            <span className={`text-xxs font-mono ${journal.length > 450 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
              {journal.length} / 500 {TRANSLATIONS.mood.charCount}
            </span>
          </div>
          <textarea
            id="journal-text"
            rows={4}
            value={journal}
            maxLength={500}
            onChange={(e) => setJournal(e.target.value)}
            placeholder={TRANSLATIONS.mood.journalPlaceholder}
            className="w-full p-3.5 border border-slate-100 bg-slate-50/10 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-sm text-slate-700 outline-hidden transition-all resize-none"
          />
        </div>

        {/* Submit Area */}
        <div className="flex items-center justify-between gap-4 pt-1">
          {saveStatus ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>{saveStatus}</span>
            </div>
          ) : (
            <div className="text-xxs text-slate-400">
              {todayMoodLog ? '💡 Checked in already. Saving again updates today‘s log.' : '🌸 Take a second to self-reflect.'}
            </div>
          )}

          <button
            type="submit"
            id="submit-mood-btn"
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {TRANSLATIONS.mood.logButton}
          </button>
        </div>
      </form>
    </div>
  );
};
