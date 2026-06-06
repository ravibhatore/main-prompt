/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWellnessStore, getLocalDateString } from '../store/useWellnessStore';
import { TRANSLATIONS } from '../constants/translations';
import { sanitizeInput } from '../utils/sanitizer';
import { Compass, BookOpen, Flame, CheckCircle } from 'lucide-react';

/**
 * Emotion Guided Reflection component. Contains three sequential restorative journaling worksheets,
 * displays direct streak outputs, and prints earlier records of reflection.
 */
export const EmotionReflection: React.FC = () => {
  const { reflections, streakCount, addReflection } = useWellnessStore();
  const todayStr = getLocalDateString();
  const todayLoaded = reflections.find((r) => r.date === todayStr);

  const [hardToday, setHardToday] = useState<string>('');
  const [managedWell, setManagedWell] = useState<string>('');
  const [tomorrowWill, setTomorrowWill] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHard = sanitizeInput(hardToday, 500);
    const cleanManaged = sanitizeInput(managedWell, 500);
    const cleanTomorrow = sanitizeInput(tomorrowWill, 500);

    if (cleanHard && cleanManaged && cleanTomorrow) {
      addReflection(cleanHard, cleanManaged, cleanTomorrow);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setHardToday('');
      setManagedWell('');
      setTomorrowWill('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="emotion-reflection-panel">
      {/* Reflection form card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">{TRANSLATIONS.reflection.title}</h2>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{streakCount} Day Streak</span>
          </div>
        </div>

        {todayLoaded ? (
          <div className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{TRANSLATIONS.reflection.completedToday}</span>
            </p>
            <div className="space-y-3.5 text-xs text-slate-600 font-medium">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">{TRANSLATIONS.reflection.promptHard}</p>
                <p className="italic font-normal mt-0.5 mt-1">“ {todayLoaded.hardToday} ”</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">{TRANSLATIONS.reflection.promptManaged}</p>
                <p className="italic font-normal mt-0.5 mt-1">“ {todayLoaded.managedWell} ”</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">{TRANSLATIONS.reflection.promptTomorrow}</p>
                <p className="italic font-normal mt-0.5 mt-1">“ {todayLoaded.tomorrowWill} ”</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="hard-input" className="block text-xs font-medium text-slate-600 mb-1.5">{TRANSLATIONS.reflection.promptHard}</label>
              <textarea
                id="hard-input"
                required
                rows={2}
                maxLength={500}
                value={hardToday}
                onChange={(e) => setHardToday(e.target.value)}
                className="w-full text-xs p-3 border border-slate-100 rounded-xl focus:border-emerald-500 hover:border-slate-300 outline-hidden transition-all text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="managed-input" className="block text-xs font-medium text-slate-600 mb-1.5">{TRANSLATIONS.reflection.promptManaged}</label>
              <textarea
                id="managed-input"
                required
                rows={2}
                maxLength={500}
                value={managedWell}
                onChange={(e) => setManagedWell(e.target.value)}
                className="w-full text-xs p-3 border border-slate-100 rounded-xl focus:border-emerald-500 hover:border-slate-300 outline-hidden transition-all text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="tomorrow-input" className="block text-xs font-medium text-slate-600 mb-1.5">{TRANSLATIONS.reflection.promptTomorrow}</label>
              <textarea
                id="tomorrow-input"
                required
                rows={2}
                maxLength={500}
                value={tomorrowWill}
                onChange={(e) => setTomorrowWill(e.target.value)}
                className="w-full text-xs p-3 border border-slate-100 rounded-xl focus:border-emerald-500 hover:border-slate-300 outline-hidden transition-all text-slate-700"
              />
            </div>

            <button
              type="submit"
              id="submit-reflection-btn"
              className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-xl shadow-xs cursor-pointer text-center"
            >
              {saveSuccess ? '✓ Saved!' : TRANSLATIONS.reflection.submitButton}
            </button>
          </form>
        )}
      </div>

      {/* History viewer */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">{TRANSLATIONS.reflection.historyTitle}</h3>
        </div>

        {reflections.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{TRANSLATIONS.reflection.noHistory}</p>
        ) : (
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {reflections.map((r) => (
              <div key={r.id} className="p-4 border border-slate-50 hover:border-slate-100 bg-slate-50/20 rounded-xl text-xxs sm:text-xs">
                <span className="font-semibold text-slate-400 font-mono block mb-2">{r.date}</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-600">
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 uppercase block">Hardest part</span>
                    <p className="italic mt-0.5">“{r.hardToday}”</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 uppercase block">Managed well</span>
                    <p className="italic mt-0.5">“{r.managedWell}”</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 uppercase block">Tomorrow expectation</span>
                    <p className="italic mt-0.5">“{r.tomorrowWill}”</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
