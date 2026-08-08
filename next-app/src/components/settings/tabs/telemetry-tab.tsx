"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, AlertCircle } from "lucide-react";

export function TelemetryTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [featureMap, setFeatureMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async (background = false) => {
    if (!background) setIsRefreshing(true);
    try {
      const [telemetryRes, featRes] = await Promise.all([
        fetch("/api/settings/ai/telemetry"),
        !Object.keys(featureMap).length ? fetch("/api/settings/ai/features") : Promise.resolve(null)
      ]);
      
      const data = await telemetryRes.json();
      if (data.success) {
        setLogs(data.logs);
        setActiveRequests(data.activeRequests || []);
      }

      if (featRes) {
        const featData = await featRes.json();
        if (featData.success) {
          const map: Record<string, string> = {};
          featData.modules.forEach((mod: any) => {
            mod.features.forEach((f: any) => {
              map[f.key] = `${mod.name} / ${f.name}`;
            });
          });
          setFeatureMap(map);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 2 seconds for real-time dashboard feel
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const totalRequests = logs.length;
  const totalDuration = logs.reduce((acc, l) => acc + (l.duration || 0), 0);
  const avgLatency = totalRequests ? Math.round(totalDuration / totalRequests) : 0;
  const failures = logs.filter(l => l.error).length;
  const successRate = totalRequests ? Math.round(((totalRequests - failures) / totalRequests) * 100) : 100;

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Real-Time Telemetry"
        purpose="This tab offers a live stream of diagnostic data straight from your AI Event Bus. It is perfect for visually debugging backend routing chains, spotting API rate limits, or monitoring live streaming generations without checking server logs."
        example="Keep this tab open while your application generates a long script. You will see live heartbeat events and token chunks streaming in real-time, giving you absolute visibility into the engine's internal processes!"
        nextStep="Diagnostics"
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          System Analytics
        </h2>
        <Button onClick={() => fetchLogs(false)} variant="outline" size="sm" className="h-8">
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Live Sync On'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Requests</h4>
          <span className="text-3xl font-bold">{isLoading ? "--" : totalRequests}</span>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Avg Latency (ms)</h4>
          <span className="text-3xl font-bold">{isLoading ? "--" : avgLatency}</span>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Failures</h4>
          <span className={`text-3xl font-bold ${failures > 0 ? 'text-red-600' : ''}`}>
            {isLoading ? "--" : failures}
          </span>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Success Rate</h4>
          <span className={`text-3xl font-bold ${successRate < 100 ? 'text-orange-500' : 'text-green-600'}`}>
            {isLoading ? "--" : `${successRate}%`}
          </span>
        </div>
      </div>
      
      <div className="mt-8 border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Live Request Stream</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Listening for events...
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Latency (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeRequests.map((req, i) => (
                <tr key={`active-${i}`} className="hover:bg-muted/10 transition-colors bg-blue-50/20">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                    {new Date(req.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-blue-600">
                    {req.feature ? (featureMap[req.feature] ? featureMap[req.feature].toUpperCase() : req.feature.replace(/-/g, ' ').toUpperCase()) : "API / GLOBAL"}
                  </td>
                  <td className="px-4 py-3 font-medium">{req.provider.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs border">{req.model}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> 
                        {req.status === 'retrying' ? `Retrying (Attempt ${req.attempt})` : 'Processing'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">
                    Pending...
                  </td>
                </tr>
              ))}
              {logs.slice(0, 30).map((log, i) => (
                <tr key={i} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-blue-600">
                    {log.feature ? (featureMap[log.feature] ? featureMap[log.feature].toUpperCase() : log.feature.replace(/-/g, ' ').toUpperCase()) : "API / GLOBAL"}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.provider.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs border">{log.model}</span>
                  </td>
                  <td className="px-4 py-3">
                    {!log.error ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        Success
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 self-start">
                          Failed
                        </span>
                        <span className="text-[10px] text-red-600 font-mono truncate" title={log.error}>
                          {log.error}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.duration}ms
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No telemetry data recorded yet.<br/>Run a prompt in the Playground or Arena to see live events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
