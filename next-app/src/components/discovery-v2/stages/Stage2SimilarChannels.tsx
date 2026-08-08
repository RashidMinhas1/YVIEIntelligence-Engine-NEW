"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { Button } from "@/components/ui/button";
import { V2Channel } from "@/lib/types/discovery-v2";
import { 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  BrainCircuit, 
  ExternalLink,
  Filter,
  BarChart2,
  RefreshCw,
  Info,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FilterSelect = ({ value, onChange, options, placeholder, type = "text" }: any) => {
    const isCustomOption = value !== "" && !options.some((o: any) => o.value === value);
    const [isCustomMode, setIsCustomMode] = useState(isCustomOption);

    useEffect(() => {
        if (value !== "" && !options.some((o: any) => o.value === value)) {
            setIsCustomMode(true);
        } else if (value === "") {
            setIsCustomMode(false);
        }
    }, [value, options]);

    if (isCustomMode) {
        return (
            <div className="relative w-full">
                <Input 
                    type={type} 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder={`Custom ${placeholder}...`} 
                    className="h-10 pr-8 bg-background w-full"
                    autoFocus
                />
                <button 
                    onClick={() => { setIsCustomMode(false); onChange(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                    title="Clear"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <select 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full" 
            value={value} 
            onChange={e => {
                if (e.target.value === "__CUSTOM__") {
                    setIsCustomMode(true);
                    onChange("");
                } else {
                    onChange(e.target.value);
                }
            }}
        >
            <option value="">{placeholder} (Any)</option>
            {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            <option value="__CUSTOM__">Custom...</option>
        </select>
    );
};

const ChannelCard = ({ channel, isSelected, isOriginalSeed, toggleSelect, isCompareMode = false }: any) => {
    const bullets = channel.whyMatchedBullets || [];
    
    return (
        <div 
            key={channel.channelId || channel.id} 
            className={`relative border-2 rounded-2xl overflow-hidden transition-all bg-card flex flex-col group ${isSelected ? "border-primary shadow-[0_4px_20px_-5px_hsl(var(--primary))] bg-primary/5" : "border-border hover:border-primary/40 hover:shadow-lg"} ${isCompareMode ? "mb-4" : ""}`}
        >
            {/* Subtle Banner Background */}
            {channel.banner && (
                <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none">
                    <img src={channel.banner} alt="banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                </div>
            )}

            <div className="relative z-10 flex flex-col w-full p-4 gap-4">
                
                {/* Header: Identity & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full border-b border-border/50 pb-4">
                    <div className="flex items-center gap-4">
                        <img src={channel.thumbnail} alt={channel.title} className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-sm bg-muted shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg truncate w-full" title={channel.title}>{channel.title}</h4>
                                {(isOriginalSeed || isSelected) && isCompareMode && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ${isOriginalSeed ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground'}`}>
                                        {isOriginalSeed ? 'Seed' : 'Selected'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate w-full">{channel.handle || channel.customUrl || "YouTube Channel"}</p>
                            <a 
                                href={`https://youtube.com/${channel.handle || channel.customUrl}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="mt-1 flex items-center gap-1 text-xs font-bold text-primary hover:underline w-fit"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-3 h-3" /> View on YouTube
                            </a>
                        </div>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto">
                        <Button 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleSelect(channel)}
                            className={`w-full sm:w-32 h-10 ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-md" : "hover:border-primary hover:text-primary"}`}
                        >
                            {isSelected ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Selected</> : "Select Channel"}
                        </Button>
                    </div>
                </div>
                
                {/* Data Metrics Grid (Full Width) */}
                <div className="w-full">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full">
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-0.5">
                                <BrainCircuit className="w-3 h-3 text-primary" /> AI Match
                            </div>
                            <div className="font-mono text-sm font-bold text-primary">{channel.similarityScore || 0}%</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Subscribers</div>
                            <div className="font-mono text-sm font-bold">{Number(channel.subscriberCount || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Avg Views</div>
                            <div className="font-mono text-sm font-bold">{Number(channel.averageViews || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Views/Sub</div>
                            <div className="font-mono text-sm font-bold">{channel.viewsPerSubRatio || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Total Videos</div>
                            <div className="font-mono text-sm font-bold">{Number(channel.videoCount || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Upload Freq</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.estimatedUploadFrequency || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Format Ratio</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.shortsVsLongRatio || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Growth Trend</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.growthStatus || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Niche</div>
                            <div className="text-xs font-bold truncate text-foreground/90" title={channel.primaryNiche}>{channel.primaryNiche || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Country</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.country || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Language</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.language || "-"}</div>
                        </div>
                        <div className="bg-background/60 border border-border/30 rounded-lg p-2 flex flex-col justify-center">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Age (Months)</div>
                            <div className="text-xs font-bold truncate text-foreground/90">{channel.channelAgeMonths || "-"}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Bullets Row (Bottom, Optional) */}
            {bullets && bullets.length > 0 && !isCompareMode && (
                <div className="relative z-10 bg-primary/5 border-t border-primary/10 p-3 px-4 flex gap-4 overflow-x-auto text-xs text-primary/80 font-medium">
                    <div className="flex items-center gap-1 font-bold text-primary shrink-0 mr-2">
                        <Sparkles className="w-4 h-4" /> Why AI Picked This:
                    </div>
                    {bullets.slice(0, 3).map((bullet: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 shrink-0 bg-background/50 px-3 py-1 rounded-full border border-primary/20">
                            {bullet}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Stage2SimilarChannels() {
  const { activeSession, updateSessionState } = useSession();
  const seedChannels: V2Channel[] = activeSession?.filters?.seedChannels || [];

  const prevStage = () => updateSessionState({ wizardStep: 1 });
  const nextStage = () => updateSessionState({ wizardStep: 3 });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch from activeSession if it exists
  const similarChannels: V2Channel[] = activeSession?.filters?.similarChannels || [];

  // Keep track of the original Step 1 seeds so we don't accidentally remove them
  const initialSeedsRef = useRef<V2Channel[]>([]);
  useEffect(() => {
      if (initialSeedsRef.current.length === 0 && seedChannels.length > 0) {
          initialSeedsRef.current = seedChannels;
      }
  }, [seedChannels]);

  // View States
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  // Filters - Basic
  const [minSimilarity, setMinSimilarity] = useState("");
  const [minSubs, setMinSubs] = useState("");
  const [minAvgViews, setMinAvgViews] = useState("");
  const [uploadFrequency, setUploadFrequency] = useState("");
  const [lastUploadDate, setLastUploadDate] = useState("");

  // Filters - Advanced AI
  const [minTopicMatch, setMinTopicMatch] = useState("");
  const [minIntentMatch, setMinIntentMatch] = useState("");
  const [minAudienceMatch, setMinAudienceMatch] = useState("");
  const [minContentStyleMatch, setMinContentStyleMatch] = useState("");
  const [minStorytellingMatch, setMinStoryMatch] = useState("");
  const [minTitleFormulaMatch, setMinTitleFormulaMatch] = useState("");

  // Filters - Advanced Stats
  const [maxSubs, setMaxSubs] = useState("");
  const [maxAvgViews, setMaxAvgViews] = useState("");
  const [minTotalVideos, setMinTotalVideos] = useState("");
  const [minViewsPerSub, setMinViewsPerSub] = useState("");

  // Filters - Content
  const [contentType, setContentType] = useState(""); // Long, Shorts, Mixed
  const [language, setLanguage] = useState("");
  const [country, setCountry] = useState("");
  const [growthStatus, setGrowthStatus] = useState("");
  const [engagementLevel, setEngagementLevel] = useState("");

  // Filters - Age
  const [channelAgeBracket, setChannelAgeBracket] = useState(""); // Last 3 Months, 6 Months, 12 Months, 1-2 Years, 2-5 Years, 5+ Years

  const [sortBy, setSortBy] = useState("Highest Similarity");
  const [maxResults, setMaxResults] = useState("20");

  // PRESETS
  const [presets, setPresets] = useState<{name: string, filters: any}[]>([]);
  useEffect(() => {
      const saved = localStorage.getItem("yt_intelligence_presets");
      if (saved) {
          try { setPresets(JSON.parse(saved)); } catch(e) {}
      }
  }, []);
  
  const savePreset = () => {
      const name = window.prompt("Enter a name for this preset:");
      if (!name) return;
      const filters = {
          minSimilarity, minSubs, maxSubs, minAvgViews, maxAvgViews, uploadFrequency, lastUploadDate,
          minTopicMatch, minIntentMatch, minAudienceMatch, minContentStyleMatch, minStorytellingMatch, minTitleFormulaMatch,
          minTotalVideos, minViewsPerSub, contentType, language, country, growthStatus, engagementLevel, channelAgeBracket
      };
      const updated = [...presets, { name, filters }];
      setPresets(updated);
      localStorage.setItem("yt_intelligence_presets", JSON.stringify(updated));
      toast.success(`Preset "${name}" saved!`);
  };

  const loadPreset = (e: any) => {
      const pName = e.target.value;
      if (!pName) return;
      const preset = presets.find(p => p.name === pName);
      if (preset) {
          const f = preset.filters;
          setMinSimilarity(f.minSimilarity || "");
          setMinSubs(f.minSubs || "");
          setMaxSubs(f.maxSubs || "");
          setMinAvgViews(f.minAvgViews || "");
          setMaxAvgViews(f.maxAvgViews || "");
          setUploadFrequency(f.uploadFrequency || "");
          setLastUploadDate(f.lastUploadDate || "");
          setMinTopicMatch(f.minTopicMatch || "");
          setMinIntentMatch(f.minIntentMatch || "");
          setMinAudienceMatch(f.minAudienceMatch || "");
          setMinContentStyleMatch(f.minContentStyleMatch || "");
          setMinStoryMatch(f.minStorytellingMatch || "");
          setMinTitleFormulaMatch(f.minTitleFormulaMatch || "");
          setMinTotalVideos(f.minTotalVideos || "");
          setMinViewsPerSub(f.minViewsPerSub || "");
          setContentType(f.contentType || "");
          setLanguage(f.language || "");
          setCountry(f.country || "");
          setGrowthStatus(f.growthStatus || "");
          setEngagementLevel(f.engagementLevel || "");
          setChannelAgeBracket(f.channelAgeBracket || "");
          toast.success(`Preset "${pName}" loaded!`);
      }
      e.target.value = ""; // Reset dropdown
  };
  useEffect(() => {
    // Only fetch if we have seeds and haven't fetched similar channels yet
    if (initialSeedsRef.current.length > 0 && similarChannels.length === 0 && !isLoading && !error) {
      handleFindSimilar(false);
    }
  }, [initialSeedsRef.current]);

  const handleFindSimilar = async (forceRefresh = false) => {
    if (initialSeedsRef.current.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL("/api/discovery-v2/similar", window.location.origin);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            seeds: initialSeedsRef.current.map(c => c.channelId || c.id),
            forceRefresh,
            maxResults: parseInt(maxResults) || 20
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to find similar channels");
      }
      
      // Save it to session context so it persists on refresh
      updateSessionState({ similarChannels: data.channels || [] });
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (channel: V2Channel) => {
    const isAlreadySeed = initialSeedsRef.current.some(c => (c.channelId || c.id) === (channel.channelId || channel.id));
    if (isAlreadySeed) {
        toast.error("You cannot remove an original seed channel from Step 1.");
        return;
    }

    const isCurrentlySelected = seedChannels.some(c => (c.channelId || c.id) === (channel.channelId || channel.id));
    let nextSeeds;
    
    if (isCurrentlySelected) {
      nextSeeds = seedChannels.filter(c => (c.channelId || c.id) !== (channel.channelId || channel.id));
    } else {
      nextSeeds = [...seedChannels, channel];
    }
    updateSessionState({ seedChannels: nextSeeds });
  };

  const processedChannels = useMemo(() => {
      let result = [...similarChannels];
      
      if (minSimilarity) {
          result = result.filter(c => (c.similarityScore || 0) >= parseInt(minSimilarity));
      }
      
      // Fuzzy matching: allow 20% tolerance
      const tolerance = 0.8; 

      if (minSubs) {
          result = result.filter(c => parseInt(c.subscriberCount || "0") >= (parseInt(minSubs) * tolerance));
      }
      if (maxSubs) {
          result = result.filter(c => parseInt(c.subscriberCount || "0") <= parseInt(maxSubs));
      }
      if (minAvgViews) {
          result = result.filter(c => (c.averageViews || 0) >= (parseInt(minAvgViews) * tolerance));
      }
      if (maxAvgViews) {
          result = result.filter(c => (c.averageViews || 0) <= parseInt(maxAvgViews));
      }
      if (minTotalVideos) {
          result = result.filter(c => parseInt(c.videoCount || "0") >= (parseInt(minTotalVideos) * tolerance));
      }
      if (minViewsPerSub) {
          result = result.filter(c => ((c as any).viewsPerSubRatio || 0) >= parseFloat(minViewsPerSub));
      }

      // Advanced AI Match
      if (minTopicMatch) result = result.filter(c => ((c as any).topicMatchScore || 0) >= parseInt(minTopicMatch));
      if (minIntentMatch) result = result.filter(c => ((c as any).intentMatchScore || 0) >= parseInt(minIntentMatch));
      if (minAudienceMatch) result = result.filter(c => ((c as any).audienceMatchScore || 0) >= parseInt(minAudienceMatch));
      if (minContentStyleMatch) result = result.filter(c => ((c as any).contentStyleMatchScore || 0) >= parseInt(minContentStyleMatch));
      if (minStorytellingMatch) result = result.filter(c => ((c as any).storytellingMatchScore || 0) >= parseInt(minStorytellingMatch));
      if (minTitleFormulaMatch) result = result.filter(c => ((c as any).titleFormulaMatchScore || 0) >= parseInt(minTitleFormulaMatch));

      // Content
      if (contentType) result = result.filter(c => (c as any).contentType === contentType);
      if (language) result = result.filter(c => (c as any).language?.toLowerCase().includes(language.toLowerCase()));
      if (country) result = result.filter(c => (c as any).country?.toLowerCase().includes(country.toLowerCase()));
      if (growthStatus) result = result.filter(c => (c as any).growthStatus?.toLowerCase().includes(growthStatus.toLowerCase()));
      if (engagementLevel) result = result.filter(c => (c as any).engagementLevel?.toLowerCase().includes(engagementLevel.toLowerCase()));
      if (uploadFrequency) result = result.filter(c => (c as any).estimatedUploadFrequency?.toLowerCase().includes(uploadFrequency.toLowerCase()));
      
      // Last Upload
      if (lastUploadDate) {
          const days = parseInt(lastUploadDate);
          if (!isNaN(days)) {
              const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
              result = result.filter(c => new Date((c as any).lastUploadAt) >= cutoff);
          }
      }

      // Channel Age
      if (channelAgeBracket) {
          const now = Date.now();
          result = result.filter(c => {
             const ageMonths = (c as any).channelAgeMonths || 
                               (c.publishedAt ? (now - new Date(c.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30) : 999);
             if (channelAgeBracket === "Last 3 Months") return ageMonths <= 3;
             if (channelAgeBracket === "6 Months") return ageMonths <= 6;
             if (channelAgeBracket === "12 Months") return ageMonths <= 12;
             if (channelAgeBracket === "1-2 Years") return ageMonths > 12 && ageMonths <= 24;
             if (channelAgeBracket === "2-5 Years") return ageMonths > 24 && ageMonths <= 60;
             if (channelAgeBracket === "5+ Years") return ageMonths > 60;
             return true;
          });
      }

      result.sort((a, b) => {
          if (sortBy === "Highest Similarity") {
              return (b.similarityScore || 0) - (a.similarityScore || 0);
          } else if (sortBy === "Highest Average Views") {
              return (b.averageViews || 0) - (a.averageViews || 0);
          } else if (sortBy === "Highest Subscribers") {
              return parseInt(b.subscriberCount || "0") - parseInt(a.subscriberCount || "0");
          }
          return 0;
      });

      return result;
  }, [
      similarChannels, minSimilarity, minSubs, maxSubs, minAvgViews, maxAvgViews, 
      minTotalVideos, minViewsPerSub, minTopicMatch, minIntentMatch, minAudienceMatch, 
      minContentStyleMatch, minStorytellingMatch, minTitleFormulaMatch, contentType, 
      language, country, growthStatus, engagementLevel, uploadFrequency, lastUploadDate, 
      channelAgeBracket, sortBy
  ]);

  const selectedSimilarCount = seedChannels.length - initialSeedsRef.current.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-card border border-border shadow-sm rounded-2xl p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Similar Channels Analysis</h2>
            <p className="text-muted-foreground text-lg">
              Expanding your seed cluster from Step 1 with AI-matched competitors.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={prevStage} className="font-bold">
               ← Back
             </Button>
             <Button onClick={nextStage} className="font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg">
                Continue with {seedChannels.length} Channels →
             </Button>
          </div>
        </div>
        
        {/* Target Profile Summary */}
        <div className="mb-8 bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    Seed Cluster Analysis ({initialSeedsRef.current.length} channels)
                </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {initialSeedsRef.current.map(c => (
                    <div key={c.id} className="relative rounded-xl overflow-hidden border border-border shadow-sm group">
                        <div className="h-16 w-full bg-muted">
                            {(c as any).bannerUrl || c.banner ? (
                                <img src={(c as any).bannerUrl || c.banner} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Banner" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40" />
                            )}
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2">
                            <img 
                                src={(c as any).thumbnailUrl || c.thumbnail} 
                                alt={c.title} 
                                className="w-12 h-12 rounded-full border-2 border-background shadow-md object-cover bg-background" 
                            />
                        </div>
                        <div className="pt-6 pb-3 px-3 text-center bg-background">
                            <div className="font-bold text-sm truncate w-full" title={c.title}>{c.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{c.primaryNiche || "Unknown Niche"}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col mb-6 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full gap-4">
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                   <h3 className="text-lg font-bold text-foreground flex items-center gap-2 whitespace-nowrap">
                       <Filter className="w-5 h-5 text-primary shrink-0" />
                       Intelligence Filters
                   </h3>
                   <div className="flex items-center gap-2 sm:ml-4 sm:border-l border-border sm:pl-4">
                        <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" onChange={loadPreset} defaultValue="">
                            <option value="" disabled>Load Preset...</option>
                            {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={savePreset}>Save</Button>
                   </div>
               </div>
               <div className="flex flex-wrap gap-3 items-center lg:justify-end w-full lg:w-auto">
                   <select 
                      className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                   >
                       <option>Highest Similarity</option>
                       <option>Highest Average Views</option>
                       <option>Highest Subscribers</option>
                   </select>
                   <FilterSelect 
                      value={maxResults} 
                      onChange={setMaxResults} 
                      placeholder="Fetch Channels" 
                      type="number" 
                      options={[
                        { label: "Fetch 10 Channels", value: "10" },
                        { label: "Fetch 20 Channels", value: "20" },
                        { label: "Fetch 30 Channels", value: "30" },
                        { label: "Fetch 40 Channels", value: "40" },
                        { label: "Fetch 50 Channels", value: "50" }
                      ]}
                   />
                   <Button 
                       variant={isCompareMode ? "default" : "outline"}
                       onClick={() => setIsCompareMode(!isCompareMode)}
                       className="font-bold flex-1 sm:flex-none"
                   >
                       <BarChart2 className="w-4 h-4 mr-2" />
                       {isCompareMode ? "Exit Compare Mode" : "Compare Selected"}
                   </Button>
                   <Button 
                       variant="outline" 
                       onClick={() => handleFindSimilar(true)} 
                       disabled={isLoading}
                       className="text-primary border-primary/20 hover:bg-primary/10 flex-1 sm:flex-none"
                   >
                       {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                       Force AI Refresh
                   </Button>
               </div>
           </div>
           
           <div className="w-full mt-4 pt-4 border-t border-border/50">
                <div className="space-y-6">
                        
                        {/* AI Match Scores */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground uppercase mb-3 flex items-center gap-2">
                                AI Match Scores
                                <span className="text-xs font-normal text-muted-foreground normal-case">(Find channels with the exact same vibe, audience, and narrative)</span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                <FilterSelect value={minSimilarity} onChange={setMinSimilarity} placeholder="Overall Similarity" type="number" options={[
                                    { value: "90", label: "> 90% (Near Clone)" }, { value: "80", label: "> 80% (Highly Similar)" }, { value: "70", label: "> 70% (Related)" }
                                ]} />
                                <FilterSelect value={minTopicMatch} onChange={setMinTopicMatch} placeholder="Topic Match" type="number" options={[
                                    { value: "90", label: "> 90% (Exact Niche)" }, { value: "75", label: "> 75% (Broad Niche)" }, { value: "50", label: "> 50% (Related)" }
                                ]} />
                                <FilterSelect value={minIntentMatch} onChange={setMinIntentMatch} placeholder="Intent Match" type="number" options={[
                                    { value: "90", label: "> 90% (Exact Angle)" }, { value: "70", label: "> 70% (Similar Goal)" }
                                ]} />
                                <FilterSelect value={minAudienceMatch} onChange={setMinAudienceMatch} placeholder="Audience Match" type="number" options={[
                                    { value: "90", label: "> 90% (Same Viewer)" }, { value: "70", label: "> 70% (Overlap)" }
                                ]} />
                                <FilterSelect value={minContentStyleMatch} onChange={setMinContentStyleMatch} placeholder="Content Style" type="number" options={[
                                    { value: "80", label: "> 80% (Similar Pacing)" }
                                ]} />
                                <FilterSelect value={minStorytellingMatch} onChange={setMinStoryMatch} placeholder="Storytelling" type="number" options={[
                                    { value: "80", label: "> 80% (Similar Arc)" }
                                ]} />
                                <FilterSelect value={minTitleFormulaMatch} onChange={setMinTitleFormulaMatch} placeholder="Title Formula" type="number" options={[
                                    { value: "80", label: "> 80% (Same Hook)" }
                                ]} />
                            </div>
                        </div>

                        {/* Advanced Stats & Age */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground uppercase mb-3 flex items-center gap-2">
                                Advanced Stats & Age
                                <span className="text-xs font-normal text-muted-foreground normal-case">(Filter by size, views, and channel history to find outliers)</span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                <FilterSelect value={minSubs} onChange={setMinSubs} placeholder="Min Subs" type="number" options={[
                                    { value: "1000", label: "> 1k" }, { value: "10000", label: "> 10k" }, { value: "100000", label: "> 100k" }, { value: "1000000", label: "> 1M" }
                                ]} />
                                <FilterSelect value={maxSubs} onChange={setMaxSubs} placeholder="Max Subs" type="number" options={[
                                    { value: "10000", label: "< 10k (Micro)" }, { value: "100000", label: "< 100k (Small)" }, { value: "1000000", label: "< 1M (Mid)" }, { value: "10000000", label: "< 10M (Large)" }
                                ]} />
                                <FilterSelect value={minAvgViews} onChange={setMinAvgViews} placeholder="Min Avg Views" type="number" options={[
                                    { value: "1000", label: "> 1k" }, { value: "10000", label: "> 10k" }, { value: "50000", label: "> 50k" }, { value: "100000", label: "> 100k" }, { value: "500000", label: "> 500k" }
                                ]} />
                                <FilterSelect value={maxAvgViews} onChange={setMaxAvgViews} placeholder="Max Avg Views" type="number" options={[
                                    { value: "10000", label: "< 10k" }, { value: "50000", label: "< 50k" }, { value: "100000", label: "< 100k" }, { value: "500000", label: "< 500k" }
                                ]} />
                                <FilterSelect value={minTotalVideos} onChange={setMinTotalVideos} placeholder="Min Videos" type="number" options={[
                                    { value: "10", label: "> 10" }, { value: "30", label: "> 30" }, { value: "100", label: "> 100" }
                                ]} />
                                <FilterSelect value={minViewsPerSub} onChange={setMinViewsPerSub} placeholder="Views/Sub" type="number" options={[
                                    { value: "0.1", label: "> 0.1 (Normal)" }, { value: "0.5", label: "> 0.5 (Good)" }, { value: "1.0", label: "> 1.0 (Viral)" }, { value: "2.0", label: "> 2.0 (Outlier)" }
                                ]} />
                                <FilterSelect value={channelAgeBracket} onChange={setChannelAgeBracket} placeholder="Channel Age" options={[
                                    { value: "Last 3 Months", label: "Last 3 Months (New)" }, { value: "6 Months", label: "6 Months" }, { value: "12 Months", label: "12 Months" }, { value: "1-2 Years", label: "1-2 Years" }, { value: "2-5 Years", label: "2-5 Years (Established)" }, { value: "5+ Years", label: "5+ Years (Veteran)" }
                                ]} />
                            </div>
                        </div>

                        {/* Content & Audience */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground uppercase mb-3 flex items-center gap-2">
                                Content Attributes
                                <span className="text-xs font-normal text-muted-foreground normal-case">(Filter by upload frequency, format, and demographics)</span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                <FilterSelect value={contentType} onChange={setContentType} placeholder="Content Type" options={[
                                    { value: "Long", label: "Long" }, { value: "Shorts", label: "Shorts" }, { value: "Mixed", label: "Mixed" }
                                ]} />
                                <FilterSelect value={uploadFrequency} onChange={setUploadFrequency} placeholder="Upload Freq" options={[
                                    { value: "Daily", label: "Daily" }, { value: "Weekly", label: "Weekly" }, { value: "Monthly", label: "Monthly" }, { value: "Sporadic", label: "Sporadic" }
                                ]} />
                                <FilterSelect value={lastUploadDate} onChange={setLastUploadDate} placeholder="Last Upload" type="number" options={[
                                    { value: "7", label: "Within 7 Days (Active)" }, { value: "30", label: "Within 30 Days" }, { value: "90", label: "Within 90 Days" }
                                ]} />
                                <FilterSelect value={language} onChange={setLanguage} placeholder="Language" options={[
                                    { value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "hi", label: "Hindi" }, { value: "fr", label: "French" }
                                ]} />
                                <FilterSelect value={country} onChange={setCountry} placeholder="Country" options={[
                                    { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" }, { value: "in", label: "India" }, { value: "ca", label: "Canada" }, { value: "au", label: "Australia" }
                                ]} />
                                <FilterSelect value={growthStatus} onChange={setGrowthStatus} placeholder="Growth Status" options={[
                                    { value: "Breakout", label: "Breakout" }, { value: "Steady", label: "Steady" }, { value: "Declining", label: "Declining" }
                                ]} />
                                <FilterSelect value={engagementLevel} onChange={setEngagementLevel} placeholder="Engagement Level" options={[
                                    { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }
                                ]} />
                            </div>
                        </div>
                </div>
           </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center text-center mb-6">
            <Info className="w-8 h-8 mb-2" />
            <h3 className="font-bold text-lg mb-2">Analysis Failed</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => handleFindSimilar(true)} className="mt-4 border-red-200 text-red-700 hover:bg-red-50">Retry Analysis</Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-16 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-2xl">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Channel Genome</h3>
            <p className="font-mono text-sm max-w-md text-center">
                Running semantic analysis against 40+ competitor channels. Generating insights and calculating match scores...
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && similarChannels.length > 0 && (
          <div className="space-y-6">
            
            {isCompareMode ? (
                // --- COMPARE MODE ---
                <div className="space-y-8">
                    {/* Seed/Selected Channels */}
                    <div>
                        <h4 className="text-sm font-bold text-foreground uppercase mb-4 px-1 border-b border-border/50 pb-2">
                            Selected Channels
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {seedChannels.map(channel => {
                                const isOriginalSeed = initialSeedsRef.current.some(c => c.id === channel.id);
                                return (
                                    <ChannelCard 
                                        key={`seed-${channel.id}`}
                                        channel={channel}
                                        isSelected={true}
                                        isOriginalSeed={isOriginalSeed}
                                        toggleSelect={toggleSelect}
                                        isCompareMode={true}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Filtered Candidate Channels */}
                    <div>
                        <h4 className="text-sm font-bold text-foreground uppercase mb-4 px-1 border-b border-border/50 pb-2 flex items-center justify-between">
                            <span>Similar Candidates</span>
                            <span className="text-xs font-normal text-muted-foreground normal-case bg-muted px-2 py-1 rounded-full">
                                {processedChannels.filter(c => !seedChannels.some(sc => sc.id === c.id)).length} channels
                            </span>
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {processedChannels.filter(c => !seedChannels.some(sc => sc.id === c.id)).map(channel => (
                                <ChannelCard 
                                    key={`cand-${channel.id}`}
                                    channel={channel}
                                    isSelected={false}
                                    isOriginalSeed={false}
                                    toggleSelect={toggleSelect}
                                    isCompareMode={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // --- LIST MODE ---
                <div className="grid grid-cols-1 gap-6">
                {processedChannels.map((channel) => {
                    const isSelected = seedChannels.some(c => (c.channelId || c.id) === (channel.channelId || channel.id));
                    const isOriginalSeed = initialSeedsRef.current.some(c => (c.channelId || c.id) === (channel.channelId || channel.id));
                    
                    if (isOriginalSeed) return null; // Don't show original seeds in the Similar list

                    return (
                        <ChannelCard 
                            key={`list-${channel.id}`}
                            channel={channel}
                            isSelected={isSelected}
                            isOriginalSeed={isOriginalSeed}
                            toggleSelect={toggleSelect}
                            isCompareMode={false}
                        />
                    );
                })}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
