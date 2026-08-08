import React, { useState, useEffect } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { V2Video } from "@/lib/types/discovery-v2";
import ResultsDashboard from "./step3-tabs/ResultsDashboard";
import { 
  Play, Calendar, Eye, Activity, CheckCircle, Circle, Scan, Clock, Star,
  Search, Filter, BarChart2, TrendingUp, Zap, Brain, ThumbsUp, MessageCircle,
  ExternalLink, ChevronDown, ChevronUp, Users, LayoutList, Layers, Cpu, Check, Target
} from "lucide-react";

export default function Stage3OutlierVideos() {
  const { activeSession, updateSessionState } = useSession();
  const prevStage = () => updateSessionState({ wizardStep: 2 });
  const nextStage = () => updateSessionState({ wizardStep: 4 });
  
  // Wizard state
  const [wizardSubStep, setWizardSubStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yvie_wizardSubStep');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  
  useEffect(() => {
    localStorage.setItem('yvie_wizardSubStep', wizardSubStep.toString());
  }, [wizardSubStep]);

  const [researchGoal, setResearchGoal] = useState<string>('');
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<string>('90');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedVideos, setScannedVideos] = useState<V2Video[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yvie_scannedVideos');
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  useEffect(() => {
    localStorage.setItem('yvie_scannedVideos', JSON.stringify(scannedVideos));
  }, [scannedVideos]);
  
  const [scanProgress, setScanProgress] = useState('0%');

  // Dashboard state
  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});

  const allChannels = activeSession?.filters?.seedChannels || [];

  const goals = [
    { id: 'Viral Outliers', title: 'Find Viral Outliers', description: 'Discover videos that performed significantly better than their channel average.', icon: <TrendingUp className="text-blue-500" /> },
    { id: 'Content Gaps', title: 'Identify Content Gaps', description: 'Find topics that have high demand but low competition.', icon: <LayoutList className="text-purple-500" /> },
    { id: 'Trend Analysis', title: 'Trend Analysis', description: 'Analyze what formats and hooks are currently working.', icon: <Activity className="text-orange-500" /> },
    { id: 'Custom Analysis', title: 'Custom Analysis', description: 'Manually select AI modules and configure your research.', icon: <Filter className="text-gray-500" /> },
  ];

  const presets: Record<string, string[]> = {
    'Quick Analysis': ['Outlier Score', 'Views vs Average Views', 'Virality Score'],
    'Outlier Research': ['Outlier Score', 'Views vs Average Views', 'Views Velocity', 'Virality Score', 'Opportunity Score'],
    'Content Research': ['Topic Clustering', 'Search Intent', 'Competition Score', 'Concept Saturation Score'],
    'Competitor Analysis': ['Competitor Analysis', 'Audience Demographics', 'Hook Analysis', 'Pacing Analysis'],
    'Deep AI Analysis': ['Virality Score', 'Research Priority Score', 'Emotional Arc', 'Format Analysis', 'Visual Style']
  };

  const goalPresets: Record<string, string> = {
    'Viral Outliers': 'Outlier Research',
    'Content Gaps': 'Content Research',
    'Trend Analysis': 'Deep AI Analysis'
  };

  const moduleCategories = [
    {
      id: 'performance',
      title: 'Performance Analysis',
      icon: <TrendingUp size={16} className="text-red-500" />,
      useCase: 'Use these metrics to identify videos that mathematically outperformed the channel\'s normal baseline.',
      modules: ['Views vs Average Views', 'Views vs Subscribers', 'Views Velocity', 'Outlier Score']
    },
    {
      id: 'scoring',
      title: 'AI Scoring',
      icon: <Target size={16} className="text-red-500" />,
      useCase: 'Use these AI scores to quickly identify high-value research opportunities based on predicted virality.',
      modules: ['Virality Score', 'Research Priority Score', 'Opportunity Score', 'Competition Score', 'Concept Saturation Score']
    },
    {
      id: 'semantic',
      title: 'AI Semantic Analysis',
      icon: <MessageCircle size={16} className="text-red-500" />,
      useCase: 'Deep dive into the actual content, hooks, and thumbnail text to understand WHY a video worked.',
      modules: ['Hook Analysis', 'Thumbnail OCR', 'Topic Clustering', 'Search Intent', 'Format Analysis', 'Emotional Arc', 'Sponsorship Detection', 'Call To Action Analysis', 'Visual Style']
    },
    {
      id: 'intelligence',
      title: 'Research Intelligence',
      icon: <Activity size={16} className="text-red-500" />,
      useCase: 'Extract actionable intelligence about the audience and market gaps.',
      modules: ['Competitor Analysis', 'Audience Demographics', 'Trending Keywords', 'Affiliate Link Parsing', 'Pacing Analysis', 'Content Gap Search', 'Retention Prediction']
    }
  ];

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    performance: true,
    scoring: true
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGoalSelect = (goalId: string) => {
    setResearchGoal(goalId);
  };

  const proceedFromGoal = () => {
    if (!researchGoal) return;
    if (researchGoal === 'Custom Analysis') {
      setWizardSubStep(3);
    } else {
      setWizardSubStep(2);
    }
  };

  const applyRecommendation = () => {
    const presetName = goalPresets[researchGoal];
    if (presetName && presets[presetName]) {
      setActiveModules(presets[presetName]);
    }
    setWizardSubStep(4);
  };

  const validateAndScan = async () => {
    if (allChannels.length === 0) return;
    setIsScanning(true);
    setScanProgress('Initializing...');
    
    // Simulate AI scanning progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(`Analyzing ${progress}%...`);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);

    try {
      const response = await fetch('/api/discovery-v2/outliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: allChannels })
      });
      
      if (!response.ok) throw new Error("Failed to fetch outliers");
      
      const data = await response.json();
      setScannedVideos(data.videos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  const isSelected = (id: string) => (activeSession?.filters?.outlierVideos || []).some((v: V2Video) => v.id === id);

  const toggleSelection = (video: V2Video) => {
    const current = activeSession?.filters?.outlierVideos || [];
    if (isSelected(video.id)) {
      updateSessionState({ outlierVideos: current.filter((v: V2Video) => v.id !== video.id) });
    } else {
      updateSessionState({ outlierVideos: [...current, video] });
    }
  };

  const selectAll = () => {
    const current = activeSession?.filters?.outlierVideos || [];
    const newSelections = scannedVideos.filter(v => !isSelected(v.id));
    updateSessionState({ outlierVideos: [...current, ...newSelections] });
  };

  const deselectAll = () => {
    const current = activeSession?.filters?.outlierVideos || [];
    const remaining = current.filter((v: V2Video) => !scannedVideos.some(sv => sv.id === v.id));
    updateSessionState({ outlierVideos: remaining });
  };

  const toggleInsights = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInsights(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const steps = [
    { id: 1, name: 'Goal' },
    { id: 2, name: 'Recommendation' },
    { id: 3, name: 'Analysis' },
    { id: 4, name: 'Preview' },
    { id: 5, name: 'Results' }
  ];

  const currentVisualStep = scannedVideos.length > 0 ? 5 : isScanning ? 4 : wizardSubStep;

  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 z-0"></div>
        {steps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center group">
            <button
              onClick={() => {
                if (step.id === 5 && scannedVideos.length === 0) return;
                if (step.id < 5) {
                  setScannedVideos([]);
                  setWizardSubStep(step.id);
                }
              }}
              disabled={step.id > currentVisualStep}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                currentVisualStep === step.id
                  ? 'bg-red-600 border-red-600 text-white shadow-lg'
                  : currentVisualStep > step.id
                  ? 'bg-red-100 border-red-600 text-red-600 cursor-pointer hover:bg-red-200'
                  : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600'
              }`}
            >
              {currentVisualStep > step.id ? <Check size={18} /> : step.id}
            </button>
            <span className={`mt-2 text-xs font-medium ${
              currentVisualStep === step.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'
            }`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (scannedVideos.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 3: Outlier Videos</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Analysis complete for {allChannels.length} channels.
            </p>
          </div>
          <div className="flex space-x-3">
            {scannedVideos.length > 0 && (
              <button 
                onClick={nextStage}
                disabled={(activeSession?.filters?.outlierVideos?.length || 0) === 0}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  (activeSession?.filters?.outlierVideos?.length || 0) > 0 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-red-400 cursor-not-allowed"
                }`}
              >
                Next Stage ({activeSession?.filters?.outlierVideos?.length || 0})
              </button>
            )}
          </div>
        </div>
        
        {renderStepper()}

        <ResultsDashboard
          videos={scannedVideos}
          filteredVideos={scannedVideos}
          scannedVideos={scannedVideos}
          allChannels={allChannels}
          activeModules={activeModules}
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
          isSelected={isSelected}
          toggleSelection={toggleSelection}
          selectAll={selectAll}
          deselectAll={deselectAll}
          compareMode={compareMode}
          setCompareMode={setCompareMode}
          expandedInsights={expandedInsights}
          toggleInsights={toggleInsights}
          activeSession={activeSession}
          updateSessionState={updateSessionState}
        />
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analyzing Data...</h2>
          </div>
        </div>
        {renderStepper()}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
          <Scan className="text-red-500 animate-spin mb-6" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{scanProgress}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Processing {allChannels.length} channels with {activeModules.length} AI modules active. This usually takes around {activeModules.length > 5 ? '45 seconds' : '15 seconds'}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 3: Outlier Videos</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Discover high-performing videos from your {allChannels.length} selected channels.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={prevStage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Back
          </button>
        </div>
      </div>

      {allChannels.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 text-center border border-yellow-200 dark:border-yellow-800 mb-6">
          <p className="text-yellow-700 dark:text-yellow-400 font-medium">
            You haven't selected any channels yet. Please go back to previous stages to select channels before finding outlier videos.
          </p>
        </div>
      )}

      {renderStepper()}

      {wizardSubStep === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">What would you like to discover today?</h3>
            <p className="text-gray-500 dark:text-gray-400">Choose your research objective. AI will automatically configure the best analysis for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
            {goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  researchGoal === goal.id
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="mb-4 bg-gray-50 dark:bg-gray-900 w-12 h-12 rounded-lg flex items-center justify-center">
                  {goal.icon}
                </div>
                <h4 className="font-bold text-lg mb-2">{goal.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={proceedFromGoal}
              disabled={!researchGoal}
              className={`px-8 py-3 rounded-lg font-bold transition ${
                researchGoal
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {wizardSubStep === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-right-4 duration-200 max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
              <Brain size={32} />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-center">AI Recommendation</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Based on your goal to <strong>{researchGoal}</strong>, we recommend the <strong>{goalPresets[researchGoal]}</strong> preset.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Layers size={18} className="text-gray-500" /> Included Modules:
            </h4>
            <div className="flex flex-wrap gap-2">
              {(presets[goalPresets[researchGoal]] || []).map(mod => (
                <span key={mod} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium">
                  {mod}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setWizardSubStep(3)}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Customize Analysis
            </button>
            <button
              onClick={applyRecommendation}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Use AI Recommendation
            </button>
          </div>
        </div>
      )}

      {wizardSubStep === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-right-4 duration-200 max-w-4xl mx-auto overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3">
                <div className="text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Analysis Engine</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure deep research modules for the initial scan.</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Time Range
                </label>
                <div className="flex flex-wrap gap-1">
                  {(['7', '30', '90', '180', '365', 'Lifetime'] as string[]).map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimeFilter(days)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                        timeFilter === days
                          ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                          : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                      }`}
                    >
                      {days === 'Lifetime' ? 'Lifetime' : `${days} Days`}
                    </button>
                  ))}
                  <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    Custom Range
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="mb-6 bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">1-Click Presets</div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(presets).map(([name, modules]) => (
                  <button
                    key={name}
                    onClick={() => setActiveModules(modules)}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800/50 dark:hover:text-red-400 transition shadow-sm"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {moduleCategories.map((category) => {
                const activeCount = category.modules.filter(m => activeModules.includes(m)).length;
                const isExpanded = expandedCategories[category.id];
                
                return (
                  <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                      <div className="flex items-center gap-3">
                        {category.icon}
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{category.title}</h4>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeCount > 0 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {activeCount}/{category.modules.length}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {category.modules.map(mod => {
                            const isActive = activeModules.includes(mod);
                            return (
                              <button
                                key={mod}
                                onClick={() => {
                                  if (isActive) {
                                    setActiveModules(activeModules.filter(m => m !== mod));
                                  } else {
                                    setActiveModules([...activeModules, mod]);
                                  }
                                }}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                                  isActive
                                    ? "bg-red-50/50 border-red-500 text-gray-900 dark:bg-red-900/10 dark:border-red-500 dark:text-white"
                                    : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                  isActive 
                                    ? "bg-red-500 border-red-500 text-white" 
                                    : "bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600"
                                }`}>
                                  {isActive && <Check size={12} strokeWidth={3} />}
                                </div>
                                <span className="font-medium text-xs leading-tight">{mod}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 text-xs flex gap-2 items-start">
                          <span className="font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">Use Case:</span>
                          <span className="text-blue-600 dark:text-blue-300/80">{category.useCase}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><Layers size={14} /> <strong className="text-gray-900 dark:text-white">{activeModules.length}</strong> Modules Active</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> Est. Time: <strong className="text-gray-900 dark:text-white">~{activeModules.length > 5 ? '45s' : '15s'}</strong></span>
              <span className="flex items-center gap-1.5"><Zap size={14} className="text-green-500" /> Est. API Cost: <strong className="text-gray-900 dark:text-white">${((activeModules.length * 0.002) * allChannels.length).toFixed(3)}</strong></span>
            </div>
            
            <button
              onClick={() => {
                setWizardSubStep(4);
                validateAndScan();
              }}
              disabled={activeModules.length === 0}
              className={`px-8 py-3 rounded-lg font-bold transition flex items-center gap-2 ${
                activeModules.length > 0
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
              }`}
            >
              <Search size={18} />
              Find Outlier Videos
            </button>
          </div>
        </div>
      )}

      {wizardSubStep === 4 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-right-4 duration-200 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full mb-4">
              <BarChart2 size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Analysis Preview</h3>
            <p className="text-gray-500 dark:text-gray-400">Review your configuration before starting the AI engine.</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Configuration</h4>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Channels:</span>
                  <span className="font-bold">{allChannels.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time Range:</span>
                  <span className="font-bold">{timeFilter === 'Lifetime' ? 'Lifetime' : `${timeFilter} Days`}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Modules:</span>
                  <span className="font-bold">{activeModules.length} Active</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Estimates</h4>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time to Complete:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">~{activeModules.length > 5 ? '45s' : '15s'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">AI API Calls:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{activeModules.length * allChannels.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Cost:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">${((activeModules.length * 0.002) * allChannels.length).toFixed(3)}</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={validateAndScan}
            disabled={isScanning || allChannels.length === 0}
            className="w-full py-4 rounded-xl flex items-center justify-center font-bold text-lg transition bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Zap className="mr-2" size={24} />
            🚀 Start AI Analysis
          </button>
        </div>
      )}
    </div>
  );
}
