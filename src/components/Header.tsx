/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { TRANSLATIONS } from '../constants/translations';
import { useWellnessStore } from '../store/useWellnessStore';
import { Sparkles, Calendar, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * Top branding and active navigation header. Shows current streaks at a glance.
 */
export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { streakCount } = useWellnessStore();

  const tabItems = [
    { id: 'bento', label: 'Bento Grid Space' },
    { id: 'checkin', label: TRANSLATIONS.tabs.checkIn },
    { id: 'triggers', label: TRANSLATIONS.tabs.triggers },
    { id: 'reflection', label: TRANSLATIONS.tabs.reflection },
    { id: 'stats', label: TRANSLATIONS.tabs.stats },
    { id: 'support', label: TRANSLATIONS.tabs.support },
  ];

  // Dynamically determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedTime = new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <header className="bg-transparent border-b border-slate-200/60 pb-5" id="app-header">
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        {/* Title branding / welcome matching Bento Design */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {TRANSLATIONS.appName}
            </span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            {getGreeting()},{" "}
            <span className="font-semibold text-slate-800">Mindful Student</span>.
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">
            Ready for your emotional reflection? You have maintained your connection streak.
          </p>
        </div>

        {/* Action center with streak status */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-200 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold tracking-wider uppercase">
              {streakCount} {TRANSLATIONS.reflection.streakSubtitle}
            </span>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">Device Sync</p>
            <p className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
              <span>{formattedTime}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">Local Encrypted</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation in rounded capsule style */}
      <nav className="max-w-6xl mx-auto px-4 mt-6" aria-label="Main Navigation">
        <div className="bg-slate-200/60 p-1 rounded-2xl inline-flex flex-wrap gap-1 w-full sm:w-auto" role="tablist">
          {tabItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="main-frame-root"
                onClick={() => setActiveTab(item.id)}
                className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

