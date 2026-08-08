"use client";

import { V2Video, AdvancedVideoResearch } from "@/lib/types/discovery-v2";
export type { V2Video, AdvancedVideoResearch };

export interface Step3TabProps {
  videos: V2Video[];
  filteredVideos: V2Video[];
  allChannels: any[];
  activeModules: string[];
  selectedVideo: V2Video | null;
  setSelectedVideo: (v: V2Video | null) => void;
  isSelected: (id: string) => boolean;
  toggleSelection: (v: V2Video) => void;
  selectAll: () => void;
  deselectAll: () => void;
  compareMode: boolean;
  setCompareMode: (v: boolean) => void;
  expandedInsights: Record<string, boolean>;
  toggleInsights: (id: string, e: React.MouseEvent) => void;
  activeSession: any;
  updateSessionState: (updates: Record<string, any>) => Promise<void>;
}
