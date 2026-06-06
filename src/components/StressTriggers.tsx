/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStressTriggers } from '../hooks/useStressTriggers';
import { TRANSLATIONS } from '../constants/translations';
import { ShieldAlert, Plus, CheckCircle } from 'lucide-react';

/**
 * Panel to identify academic stressors (such as syllabus pressure), insert custom labels,
 * and view a 30-day triggers density heatmap calendar.
 */
export const StressTriggers: React.FC = () => {
  const { todayTriggerLog, logTriggers, heatmapData } = useStressTriggers();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState<string>('');
  const [activeCustoms, setActiveCustoms] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (todayTriggerLog) {
      setSelectedCats(todayTriggerLog.categories);
      // If there are categories not in the predefined list, treat them as custom categories
      const predefinedKeys = Object.keys(TRANSLATIONS.trigger.predefined);
      const customs = todayTriggerLog.categories.filter((cat) => !predefinedKeys.includes(cat));
      if (customs.length > 0) {
        setActiveCustoms((prev) => Array.from(new Set([...prev, ...customs])));
      }
    }
  }, [todayTriggerLog]);

  const toggleCategory = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = customInput.trim();
    if (cleanStr && !activeCustoms.includes(cleanStr)) {
      setActiveCustoms((prev) => [...prev, cleanStr]);
      setSelectedCats((prev) => [...prev, cleanStr]);
      setCustomInput('');
    }
  };

  const handleSaveLogs = () => {
    logTriggers(selectedCats);
    setSaveStatus(TRANSLATIONS.trigger.successMsg);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const getHeatmapColorClass = (count: number): string => {
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
    if (count === 1) return 'bg-emerald-100 hover:bg-emerald-200';
    if (count === 2) return 'bg-emerald-300 hover:bg-emerald-400';
    return 'bg-emerald-600 hover:bg-emerald-700';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="stress-triggers-panel">
      {/* Logger card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">{TRANSLATIONS.trigger.title}</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mb-5">{TRANSLATIONS.trigger.description}</p>

        {/* Categories selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {Object.entries(TRANSLATIONS.trigger.predefined).map(([key, label]) => {
            const isSelected = selectedCats.includes(key);
            return (
              <button
                key={key}
                type="button"
                id={`trigger-predefined-${key}`}
                onClick={() => toggleCategory(key)}
                aria-pressed={isSelected}
                className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-emerald-600 font-bold text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
          {activeCustoms.map((custom) => {
            const isSelected = selectedCats.includes(custom);
            return (
              <button
                key={custom}
                type="button"
                id={`trigger-custom-${custom}`}
                onClick={() => toggleCategory(custom)}
                aria-pressed={isSelected}
                className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-emerald-600 font-bold text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔧 {custom}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleAddCustom} className="flex gap-2 max-w-md mb-6">
          <input
            type="text"
            id="custom-trigger-input"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={TRANSLATIONS.trigger.customPlaceholder}
            className="flex-1 px-3 py-2 text-xs border border-slate-100 bg-slate-50/50 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-700 outline-hidden transition-all"
          />
          <button
            type="submit"
            id="add-custom-trigger-btn"
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{TRANSLATIONS.trigger.addButton}</span>
          </button>
        </form>

        {/* Save/Submit Trigger */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-4">
          {saveStatus ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>{saveStatus}</span>
            </div>
          ) : (
            <span className="text-xxs text-slate-400">📊 Choose any stressors detected today.</span>
          )}
          <button
            onClick={handleSaveLogs}
            id="save-triggers-btn"
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-xl font-medium shadow-xs cursor-pointer"
          >
            {TRANSLATIONS.trigger.logButton}
          </button>
        </div>
      </div>

      {/* Heatmap module */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">{TRANSLATIONS.trigger.heatmapTitle}</h3>
        <p className="text-xxs font-mono text-slate-400 mb-4 uppercase tracking-wider">
          Count: 1 block = 1 calendar day. Color depth shows stressors density.
        </p>

        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 justify-center">
          {heatmapData.map((day) => (
            <div
              key={day.date}
              className={`aspect-square sm:p-1.5 rounded-md flex flex-col items-center justify-center text-center transition-all group relative cursor-default ${getHeatmapColorClass(
                day.count
              )}`}
            >
              <span className={`text-[10px] font-bold ${day.count > 2 ? 'text-white' : 'text-slate-600'}`}>
                {day.count}
              </span>
              
              {/* Custom tooltip display on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-20 text-center">
                <p className="font-bold border-b border-slate-700 pb-1 mb-1">{day.dayLabel}</p>
                <p>{day.count > 0 ? `${day.count} stressor(s)` : 'Clear Day'}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3.5 mt-4 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-100 border border-slate-200 inline-block rounded-xs"></span> 0 Triggers</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 inline-block rounded-xs"></span> 1 Trigger</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-300 inline-block rounded-xs"></span> 2 Triggers</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs"></span> 3+ Triggers</div>
        </div>
      </div>
    </div>
  );
};
