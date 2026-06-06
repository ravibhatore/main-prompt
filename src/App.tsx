/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MoodCheckIn } from './components/MoodCheckIn';
import { StressTriggers } from './components/StressTriggers';
import { EmotionReflection } from './components/EmotionReflection';
import { ProgressDashboard } from './components/ProgressDashboard';
import { WellnessSupport } from './components/WellnessSupport';
import { WeeklyWellnessReport } from './components/WeeklyWellnessReport';
import { BentoGridDashboard } from './components/BentoGridDashboard';
import { useWellnessStore } from './store/useWellnessStore';
import { motion } from 'motion/react';

/**
 * Main App Container.
 * Orchestrates navigation flows, coordinates global layout views, and manages state.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('bento');
  const loadFromServer = useWellnessStore((state) => state.loadFromServer);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'bento':
        return <BentoGridDashboard />;
      case 'checkin':
        return <MoodCheckIn />;
      case 'triggers':
        return <StressTriggers />;
      case 'reflection':
        return <EmotionReflection />;
      case 'stats':
        return <ProgressDashboard />;
      case 'support':
        return (
          <div className="space-y-6">
            <WeeklyWellnessReport />
            <WellnessSupport />
          </div>
        );
      default:
        return <BentoGridDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70" id="main-frame-root">
      {/* Visual Navigation controls */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main interactive window - expanded to max-w-6xl for perfect Bento rhythm */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {renderActiveView()}
        </motion.div>
      </main>
    </div>
  );
}

