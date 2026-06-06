/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useWellnessReport } from '../hooks/useWellnessReport';
import { useWellnessStore } from '../store/useWellnessStore';
import { TRANSLATIONS } from '../constants/translations';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, CalendarRange, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Weekly Wellness Report widget. Distills recent logging telemetry into standard averages
 * and highlights trigger relationships.
 */
export const WeeklyWellnessReport: React.FC = () => {
  const { weeklyAnalytics } = useWellnessReport();
  const { moodLogs } = useWellnessStore();

  const chartData = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // Filter matching, sort chronologically ascending
    const recent = moodLogs
      .filter((log) => log.timestamp >= oneWeekAgo)
      .sort((a, b) => a.date.localeCompare(b.date));

    return recent.map((item) => {
      const parts = item.date.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
      return {
        label,
        Mood: item.mood,
      };
    });
  }, [moodLogs]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6 animate-fade-in" id="weekly-wellness-report">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">{TRANSLATIONS.support.report.title}</h2>
        </div>
        <span className="text-xxs font-mono text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-md flex items-center gap-1">
          <CalendarRange className="w-3 h-3" /> Last 7 Days
        </span>
      </div>

      {chartData.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">Log some moods in Daily Check-In to generate your trend graph.</p>
      ) : (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-50/50">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block mb-1">
                {TRANSLATIONS.support.report.averageLabel}
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {weeklyAnalytics.avgMood ? `${weeklyAnalytics.avgMood} / 5` : '--'}
              </span>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block mb-1">
                {TRANSLATIONS.support.report.topTriggersLabel}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-700 block truncate">
                {weeklyAnalytics.topTrigger}
              </span>
            </div>
          </div>

          {/* Trend Line Chart */}
          <div>
            <h3 className="text-xxs font-mono font-semibold uppercase text-slate-400 mb-2">
              {TRANSLATIONS.support.report.weeklyTrend}
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} style={{ fontFamily: 'monospace' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={10} style={{ fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #f1f5f9' }} />
                  <Area type="monotone" dataKey="Mood" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI/Rule Suggestion Box */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-2.5 items-start">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-800 mb-0.5">
                {TRANSLATIONS.support.report.suggestionsTitle}
              </h4>
              <p className="text-xxs sm:text-xs text-amber-900/85 leading-relaxed font-medium">
                {weeklyAnalytics.suggestion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
