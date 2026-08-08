import React, { useState, useEffect } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { V2Channel } from "@/lib/types/discovery-v2";
import { Loader2, Search, CheckCircle2, History, ExternalLink, BadgeCheck, Save } from "lucide-react";
import { toast } from "sonner";

export default function Stage1ChannelDiscovery() {
  const { activeSession, updateSessionState } = useSession();
  
  // Safely extract state from session filters
  const seedChannels: any[] = activeSession?.filters?.seedChannels || [];
  const searchHistory: string[] = activeSession?.filters?.searchHistory || [];

  const nextStage = () => {
    updateSessionState({ wizardStep: 2 });
  };

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<V2Channel[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [minAvgViews, setMinAvgViews] = useState("");
  const [minRecentViews, setMinRecentViews] = useState("");
  const [recentVideoCount, setRecentVideoCount] = useState("");
  const [maxChannelAge, setMaxChannelAge] = useState("");
  const [maxChannelAgeUnit, setMaxChannelAgeUnit] = useState("years");
  const [minTotalVideos, setMinTotalVideos] = useState("");
  const [maxTotalVideos, setMaxTotalVideos] = useState("");
  const [uploadFrequency, setUploadFrequency] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [shortsOnly, setShortsOnly] = useState(false);
  const [longFormOnly, setLongFormOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");

  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("discovery_presets");
    if (saved) setPresets(JSON.parse(saved));
  }, []);

  const savePreset = () => {
    const name = window.prompt("Enter a name for this preset:");
    if (!name) return;
    const newPreset = {
      name,
      filters: { minSubs, maxSubs, country, language, minAvgViews, minRecentViews, recentVideoCount, maxChannelAge, maxChannelAgeUnit, minTotalVideos, maxTotalVideos, uploadFrequency, verifiedOnly, shortsOnly, longFormOnly, apiKey, sortBy }
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("discovery_presets", JSON.stringify(updated));
  };

  const loadPreset = (preset: any) => {
    if (!preset) return;
    setMinSubs(preset.filters.minSubs || "");
    setMaxSubs(preset.filters.maxSubs || "");
    setCountry(preset.filters.country || "");
    setLanguage(preset.filters.language || "");
    setMinAvgViews(preset.filters.minAvgViews || "");
    setMinRecentViews(preset.filters.minRecentViews || "");
    setRecentVideoCount(preset.filters.recentVideoCount || "");
    setMaxChannelAge(preset.filters.maxChannelAge || "");
    setMaxChannelAgeUnit(preset.filters.maxChannelAgeUnit || "years");
    setMinTotalVideos(preset.filters.minTotalVideos || "");
    setMaxTotalVideos(preset.filters.maxTotalVideos || "");
    setUploadFrequency(preset.filters.uploadFrequency || "");
    setApiKey(preset.filters.apiKey || "");
    setVerifiedOnly(preset.filters.verifiedOnly || false);
    setShortsOnly(preset.filters.shortsOnly || false);
    setLongFormOnly(preset.filters.longFormOnly || false);
    if (preset.filters.sortBy) setSortBy(preset.filters.sortBy);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery, sortBy, verifiedOnly, shortsOnly, longFormOnly]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL("/api/discovery/channels", window.location.origin);
      url.searchParams.set("query", searchQuery);
      if (minSubs) url.searchParams.set("minSubs", minSubs);
      if (maxSubs) url.searchParams.set("maxSubs", maxSubs);
      if (country) url.searchParams.set("country", country);
      if (language) url.searchParams.set("language", language);
      if (minAvgViews) url.searchParams.set("minAvgViews", minAvgViews);
      if (minRecentViews) url.searchParams.set("minRecentViews", minRecentViews);
      if (recentVideoCount) url.searchParams.set("recentVideoCount", recentVideoCount);
      if (maxChannelAge) {
        url.searchParams.set("maxChannelAge", maxChannelAge);
        url.searchParams.set("maxChannelAgeUnit", maxChannelAgeUnit);
      }
      if (minTotalVideos) url.searchParams.set("minTotalVideos", minTotalVideos);
      if (maxTotalVideos) url.searchParams.set("maxTotalVideos", maxTotalVideos);
      if (uploadFrequency) url.searchParams.set("uploadFrequency", uploadFrequency);
      if (apiKey) url.searchParams.set("apiKey", apiKey);
      if (verifiedOnly) url.searchParams.set("verified", "true");
      if (shortsOnly) url.searchParams.set("shorts", "true");
      if (longFormOnly) url.searchParams.set("longForm", "true");
      if (sortBy) url.searchParams.set("sort", sortBy);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to search channels");
      }
      
      // Ensure we always have an array
      const channelsArray = Array.isArray(data) ? data : data.channels || data.data || data.items || [];
      setResults(channelsArray);
      
      // Update history
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
      updateSessionState({ searchHistory: newHistory });
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (channel: any) => {
    const isSelected = seedChannels.some(c => (c.channelId && c.channelId === channel.channelId) || (c.id && c.id === channel.id));
    let nextSeeds;
    if (isSelected) {
      nextSeeds = seedChannels.filter(c => c.channelId !== channel.channelId && c.id !== channel.id);
    } else {
      nextSeeds = [...seedChannels, channel];
    }
    updateSessionState({ seedChannels: nextSeeds });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="bg-card border border-border shadow-sm rounded-2xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Discover Channels</h2>
            <p className="text-muted-foreground">Search by Channel Username, Handle, URL, or Niche to begin your research.</p>
          </div>
          <Button 
            onClick={nextStage} 
            disabled={seedChannels.length === 0}
            className="font-bold bg-primary text-primary-foreground h-12 px-8"
          >
            Continue with {seedChannels.length} Channels →
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by Channel Username, Handle, URL, or Niche..." 
              className="pl-12 h-12 text-lg rounded-xl shadow-sm border-primary/20 focus-visible:ring-primary focus-visible:border-primary transition-all bg-white"
            />
          </div>
          <Button onClick={() => handleSearch()} size="lg" className="h-12 px-8 rounded-xl text-md font-bold shadow-md hover:shadow-lg">{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}</Button>
        </div>
        
        <div className="flex gap-3 justify-end mt-2 items-center">
          <Button variant="outline" size="sm" onClick={savePreset} className="text-xs h-8">
            <Save className="w-3 h-3 mr-1" /> Save Preset
          </Button>
          {presets.length > 0 && (
            <Select onValueChange={(v) => loadPreset(presets[Number(v)])}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Load Preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p, i) => (
                  <SelectItem key={i} value={i.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="growth">Fastest Growing</SelectItem>
                <SelectItem value="subs_desc">Highest Subs</SelectItem>
                <SelectItem value="avg_views_desc">Highest Avg Views</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Min Subs" 
              className="w-[100px] h-9" 
              value={minSubs} 
              onChange={e => setMinSubs(e.target.value)}
              onBlur={() => handleSearch()} 
            />
            <Input 
              placeholder="Max Subs" 
              className="w-[100px] h-9" 
              value={maxSubs} 
              onChange={e => setMaxSubs(e.target.value)}
              onBlur={() => handleSearch()} 
            />
            <Input 
              placeholder="Min Avg Views" 
              className="w-[120px] h-9" 
              value={minAvgViews} 
              onChange={e => setMinAvgViews(e.target.value)}
              onBlur={() => handleSearch()} 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Latest Videos Views:</span>
            <Input 
              placeholder="# of Videos" 
              className="w-[90px] h-9" 
              value={recentVideoCount} 
              onChange={e => setRecentVideoCount(e.target.value)}
              onBlur={() => handleSearch()} 
              title="Number of latest videos to check (e.g. 5)"
            />
            <span className="text-muted-foreground text-sm">avg</span>
            <Input 
              placeholder="Min Views" 
              className="w-[100px] h-9" 
              value={minRecentViews} 
              onChange={e => setMinRecentViews(e.target.value)}
              onBlur={() => handleSearch()} 
              title="Minimum average views across those latest videos"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input 
              placeholder="Min Videos" 
              className="w-[100px] h-9" 
              value={minTotalVideos} 
              onChange={e => setMinTotalVideos(e.target.value)}
              onBlur={() => handleSearch()} 
              title="Minimum total video uploads"
            />
            <Input 
              placeholder="Max Videos" 
              className="w-[100px] h-9" 
              value={maxTotalVideos} 
              onChange={e => setMaxTotalVideos(e.target.value)}
              onBlur={() => handleSearch()} 
              title="Maximum total video uploads"
            />
            <Select value={uploadFrequency} onValueChange={(v) => { setUploadFrequency(v === "any" ? "" : v); handleSearch(); }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Upload Freq" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Freq</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Input 
                placeholder="Max Age" 
                className="w-[80px] h-9 rounded-r-none border-r-0" 
                value={maxChannelAge} 
                onChange={e => setMaxChannelAge(e.target.value)}
                onBlur={() => handleSearch()} 
                title="Maximum channel age"
              />
              <Select value={maxChannelAgeUnit} onValueChange={(v) => { setMaxChannelAgeUnit(v); handleSearch(); }}>
                <SelectTrigger className="w-[85px] h-9 rounded-l-none bg-muted/30 px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="verified" checked={verifiedOnly} onCheckedChange={(c) => setVerifiedOnly(!!c)} />
            <Label htmlFor="verified" className="text-sm font-medium">Verified Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="shorts" checked={shortsOnly} onCheckedChange={(c) => setShortsOnly(!!c)} />
            <Label htmlFor="shorts" className="text-sm font-medium">Shorts Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="longform" checked={longFormOnly} onCheckedChange={(c) => setLongFormOnly(!!c)} />
            <Label htmlFor="longform" className="text-sm font-medium">Long-form Only</Label>
          </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold mb-3">
              <History className="w-4 h-4" /> Recent Searches
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((h, i) => (
                <button 
                  key={i} 
                  onClick={() => { setQuery(h); handleSearch(h); }}
                  className="px-3 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-lg text-sm transition-colors border border-border"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key text-primary"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
            API Key:
          </div>
          <Input 
            type="password"
            placeholder="Custom YouTube API Key (Optional) - Solves Search Quota Issues" 
            className="h-9 w-3/4 max-w-md bg-card border-primary/50 focus-visible:ring-primary" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)}
            onBlur={() => handleSearch()} 
            title="Paste your custom API key to avoid 429 Quota Exceeded errors on Broad/Niche searches."
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-lg mb-2">API Error</h3>
          <p>{error}</p>
          <Button variant="outline" onClick={() => handleSearch()} className="mt-4 border-red-200 text-red-700 hover:bg-red-50">Retry Search</Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Searching Channels...</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-2xl overflow-hidden bg-card">
                <Skeleton className="h-24 w-full rounded-none" />
                <div className="p-5 relative">
                  <Skeleton className="w-16 h-16 rounded-full absolute -top-8 border-4 border-card" />
                  <div className="mt-8 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-4 pt-4">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && debouncedQuery && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <h3 className="text-xl font-bold mb-2">No channels found</h3>
          <p className="text-muted-foreground">Try adjusting your search query or filters.</p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Search Results ({results.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((channel) => {
              const isSelected = seedChannels.some(c => (c.id && c.id === channel.id));
              return (
                <div 
                  key={channel.id} 
                  className={`border rounded-2xl overflow-hidden flex flex-col bg-card transition-all ${isSelected ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary))] bg-primary/5" : "border-border hover:border-primary/50 hover:shadow-md"}`}
                >
                  {/* Banner */}
                  <div className="h-24 bg-muted w-full relative overflow-hidden">
                    {(channel as any).bannerUrl || channel.banner ? (
                      <img src={(channel as any).bannerUrl || channel.banner} alt="Banner" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40" />
                    )}
                  </div>
                  
                  <div className="p-5 pt-0 relative flex-1 flex flex-col">
                    {/* Thumbnail */}
                    <div className="absolute -top-8 left-5 border-4 border-card rounded-full bg-card">
                      <img src={(channel as any).thumbnailUrl || channel.thumbnail} alt={channel.title} className="w-16 h-16 rounded-full object-cover bg-muted" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.title || 'Channel')}&background=random`; }} />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-primary bg-background rounded-full p-0.5">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="mt-10 mb-3">
                      <h4 className="font-bold text-lg truncate flex items-center gap-1.5">
                        {channel.title}
                        {(channel.isVerified || channel.verified) && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{channel.customUrl || "Channel"}</span>
                        {channel.country && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{channel.country}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Subs</span>
                        <span className="font-mono text-sm font-semibold">{Number(channel.subscriberCount).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Videos</span>
                        <span className="font-mono text-sm font-semibold">{Number(channel.videoCount).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Views</span>
                        <span className="font-mono text-sm font-semibold">{channel.averageViews ? channel.averageViews.toLocaleString() : "-"}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-5 flex-1">
                      {channel.description || "No description available."}
                    </p>
                    
                    <div className="flex gap-3 mt-auto">
                      <Button 
                        variant={isSelected ? "default" : "outline"} 
                        className="flex-1 font-bold"
                        onClick={() => toggleSelect(channel)}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                      <Button variant="secondary" size="icon" asChild>
                        <a href={`https://youtube.com/${(channel as any).handle || channel.customUrl}`} target="_blank" rel="noopener noreferrer" title="Open in YouTube">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
