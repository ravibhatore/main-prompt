/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useWellnessStore } from '../store/useWellnessStore';
import { TRANSLATIONS } from '../constants/translations';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Activity, Award, Trophy } from 'lucide-react';

/**
 * Main dashboard telemetry visualization. Handles 7/30-day analytics toggles,
 * stressor aggregations, and earned milestone indicators.
 */
export const ProgressDashboard: React.FC = () => {
  const { moodLogs, loggedTriggers, streakCount } = useWellnessStore();
  const [timeframe, setTimeframe] = useState<'7' | '30'>('7');

  // Calculates chronological trend coordinates
  const moodTrendData = useMemo(() => {
    const limitDays = timeframe === '7' ? 7 : 30;
    const cutoff = Date.now() - limitDays * 24 * 60 * 60 * 1000;

    return [...moodLogs]
      .filter((log) => log.timestamp >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        const parts = item.date.split('-');
        return {
          date: parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date,
          MoodRating: item.mood,
        };
      });
  }, [moodLogs, timeframe]);

  // Aggregates stressor categories relative to timeframes
  const triggerStats = useMemo(() => {
    const limitDays = timeframe === '7' ? 7 : 30;
    const cutoff = Date.now() - limitDays * 24 * 60 * 60 * 1000;
    const totals: Record<string, number> = {};

    loggedTriggers
      .filter((t) => t.timestamp >= cutoff)
      .forEach((log) => {
        log.categories.forEach((cat) => {
          totals[cat] = (totals[cat] || 0) + 1;
        });
      });

    return Object.entries(totals).map(([key, value]) => {
      let name = key;
      if (key in TRANSLATIONS.trigger.predefined) {
        name = TRANSLATIONS.trigger.predefined[key as keyof typeof TRANSLATIONS.trigger.predefined];
      }
      return { name, count: value };
    });
  }, [loggedTriggers, timeframe]);

  const earnedBadges = useMemo(() => {
    return {
      day1: moodLogs.length >= 1,
      day3: streakCount >= 3,
      day7: streakCount >= 7,
    };
  }, [moodLogs, streakCount]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="progress-dashboard-panel">
      {/* Timeframe toggle header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Dashboard Context</span>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setTimeframe('7')}
            className={`px-3 py-1 text-xxs font-bold rounded-md transition-colors cursor-pointer ${
              timeframe === '7' ? 'bg-white text-slate-800 shadow-xxs' : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            {TRANSLATIONS.dashboard.period7Days}
          </button>
          <button
            onClick={() => setTimeframe('30')}
            className={`px-3 py-1 text-xxs font-bold rounded-md transition-colors cursor-pointer ${
              timeframe === '30' ? 'bg-white text-slate-800 shadow-xxs' : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            {TRANSLATIONS.dashboard.period30Days}
          </button>
        </div>
      </div>

      {/* Main charts display */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            📈 {TRANSLATIONS.dashboard.chartMoodTrend}
          </h3>
          <div className="h-44 w-full">
            {moodTrendData.length === 0 ? (
              <p className="text-xxs text-slate-400 text-center py-16">{TRANSLATIONS.dashboard.noLogsY}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} style={{ fontFamily: 'monospace' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={9} style={{ fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }} />
                  <Line type="monotone" dataKey="MoodRating" stroke="#059669" strokeWidth={2.5} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border-t border-slate-50 pt-6">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <BarChart3 className="w-4 h-4 text-emerald-600" /> {TRANSLATIONS.dashboard.chartTriggerFreq}
          </h3>
          <div className="h-44 w-full">
            {triggerStats.length === 0 ? (
              <p className="text-xxs text-slate-400 text-center py-16">{TRANSLATIONS.dashboard.noLogsY}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={triggerStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }} />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Badges and milestones */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-600" /> {TRANSLATIONS.dashboard.milestones.title}
        </h3>
        <p className="text-xxs text-slate-450 mb-4">{TRANSLATIONS.dashboard.milestones.description}</p>

        <div className="space-y-2.5">
          {Object.entries(TRANSLATIONS.dashboard.milestones.badges).map(([key, value]) => {
            const isEarned = earnedBadges[key as keyof typeof earnedBadges];
            return (
              <div
                key={key}
                id={`milestone-${key}`}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  isEarned
                    ? 'bg-emerald-50/40 border-emerald-100'
                    : 'bg-slate-50/20 border-slate-100 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-lg ${isEarned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{value.name}</h4>
                  <p className="text-xxs text-slate-400 mt-0.5">{value.description}</p>
                </div>
                {isEarned && (
                  <span className="ml-auto text-xxs font-bold text-emerald-700 font-mono bg-emerald-100/50 px-2 py-0.5 rounded-md">
                    ✓ Earned
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
