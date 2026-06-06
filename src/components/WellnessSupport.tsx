/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWellnessReport } from '../hooks/useWellnessReport';
import { TRANSLATIONS } from '../constants/translations';
import { HeartHandshake, PhoneCall, BrainCircuit, ExternalLink, Moon, Timer } from 'lucide-react';

/**
 * Personal Wellness Coping panel with helpline triggers (Vandrevala Foundation, iCall),
 * static nudges, and an interactive 4-7-8 deep breathing guide.
 */
export const WellnessSupport: React.FC = () => {
  const { showCrisisResources } = useWellnessReport();
  const [activeTip, setActiveTip] = useState<'breathing' | 'pomodoro' | 'sleep'>('breathing');
  
  // Interactive breathing guide helpers
  const [breatheState, setBreatheState] = useState<'Idle' | 'Inhale...' | 'Hold...' | 'Exhale...'>('Idle');
  const [breatheTimer, setBreatheTimer] = useState<number>(0);

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

  const triggerBreathing = () => {
    if (breatheState === 'Idle') {
      setBreatheState('Inhale...');
      setBreatheTimer(4);
    } else {
      setBreatheState('Idle');
      setBreatheTimer(0);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="wellness-support-panel">
      {/* Crisis Warning System */}
      {showCrisisResources && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs text-xs animate-pulse" id="crisis-resources-alert">
          <div className="flex items-center gap-2 mb-2">
            <PhoneCall className="w-4 h-4 text-red-600 font-bold" />
            <h3 className="text-sm font-bold text-red-900">{TRANSLATIONS.support.crisisTitle}</h3>
          </div>
          <p className="text-red-800 mb-4">{TRANSLATIONS.support.crisisDescription}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TRANSLATIONS.support.resources.map((phone) => (
              <a
                key={phone.name}
                href={phone.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-red-100/50 rounded-xl border border-red-100 flex flex-col justify-between gap-1 transition-all"
              >
                <div className="font-bold text-red-950 flex items-center justify-between gap-2">
                  <span>{phone.name}</span>
                  <ExternalLink className="w-3 h-3 text-red-400" />
                </div>
                <span className="font-mono text-red-600 font-bold text-sm">{phone.phone}</span>
                <span className="text-[10px] text-red-700">{phone.descr}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Routine tips selector */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">{TRANSLATIONS.support.tipsTitle}</h2>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTip('breathing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTip === 'breathing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Breathe
          </button>
          <button
            onClick={() => setActiveTip('pomodoro')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTip === 'pomodoro' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Timer className="w-4 h-4" />
            Pomodoro
          </button>
          <button
            onClick={() => setActiveTip('sleep')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTip === 'sleep' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-4 h-4" />
            Sleep
          </button>
        </div>

        <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100 min-h-40 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {TRANSLATIONS.support.tips[activeTip].title}
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              {TRANSLATIONS.support.tips[activeTip].content}
            </p>
          </div>

          {activeTip === 'breathing' && (
            <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                id="toggle-breathing-anim"
                onClick={triggerBreathing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                {breatheState === 'Idle' ? 'Start Guided Exersise' : 'Reset Cycle'}
              </button>

              {breatheState !== 'Idle' && (
                <div id="breathe-focus-tracker" className="flex items-center gap-4">
                  {/* Expanding sphere representation of lung capacity */}
                  <div
                    className={`w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center transition-all duration-1000 ${
                      breatheState === 'Inhale...' ? 'scale-150 opacity-90' : breatheState === 'Hold...' ? 'scale-150 bg-amber-500' : 'scale-90 opacity-60'
                    }`}
                  >
                    <span className="text-white text-[9px] font-bold font-mono">{breatheTimer}s</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 font-mono italic animate-pulse">{breatheState}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
