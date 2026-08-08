const fs = require('fs');
const file = 'C:\\Users\\HC\\Desktop\\viral clip\\YouTube-Viral-Intelligence\\next-app\\src\\components\\discovery-v2\\stages\\Stage3OutlierVideos.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace('import { Switch } from "@/components/ui/switch";', 'import { Switch } from "@/components/ui/switch";\nimport ResultsDashboard from \'./step3-tabs/ResultsDashboard\';');

// Add state
content = content.replace('const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});', 'const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});\n  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(null);');

// Replace advanced filter panel to end of scanned videos
const startMarker = '      {/* --- Advanced Filters Panel --- */}';
const endMarker = '      {scannedVideos.length === 0 && !isScanning && allChannels.length > 0 && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      {scannedVideos.length > 0 && (
        <ResultsDashboard
          videos={scannedVideos}
          filteredVideos={filteredVideos}
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
      )}\n      \n`;
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(file, content);
  console.log("File updated successfully.");
} else {
  console.log("Markers not found! Start:", startIndex, "End:", endIndex);
}
