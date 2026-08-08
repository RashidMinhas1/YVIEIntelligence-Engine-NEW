"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, CheckCircle2, XCircle, Database, Clock, TrendingUp } from "lucide-react";

export default function AIAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/ai/analytics")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setData(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-muted-foreground font-mono">Loading Analytics...</div>;
  if (!data || !data.analytics) return <div className="p-8 text-destructive">Failed to load analytics</div>;

  const { analytics, health, cacheStats } = data;
  const successRate = analytics.totalRequests > 0 ? (analytics.successCount / analytics.totalRequests) * 100 : 100;
  const avgLatency = analytics.successCount > 0 ? analytics.totalLatencyMs / analytics.successCount : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Analytics Dashboard</h2>
        <p className="text-muted-foreground mt-1">Enterprise Telemetry & Health Monitoring</p>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Global AI requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{analytics.successCount} successful</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgLatency / 1000).toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground mt-1">Per successful request</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (Est)</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalCost.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">{analytics.totalTokens.toLocaleString()} tokens</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Health / Circuit Breakers */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Circuit Breaker Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health.map((h: any, i: number) => {
                const sRate = h.successCount + h.failureCount > 0 ? (h.successCount / (h.successCount + h.failureCount)) * 100 : 100;
                return (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {h.provider} - {h.model}
                        <Badge variant={h.state === "CLOSED" ? "default" : (h.state === "HALF_OPEN" ? "secondary" : "destructive")}>
                          {h.state}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        Key: {h.apiKey.substring(0, 8)}... | Success: {sRate.toFixed(1)}% | Errors: {h.failureCount}
                      </div>
                    </div>
                    {h.state === "CLOSED" ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-destructive" />}
                  </div>
                );
              })}
              {health.length === 0 && <div className="text-muted-foreground text-sm">No health telemetry collected yet.</div>}
            </div>
          </CardContent>
        </Card>

        {/* Cache Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span>Cache Hits:</span>
                <span className="font-bold text-emerald-500">{analytics.cacheHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Cached Items (Mem):</span>
                <span>{cacheStats?.inMemoryItems || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Size (Disk):</span>
                <span>{cacheStats?.sqliteSizeMb || 0} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {Object.entries(analytics.errorsByType || {}).map(([err, count]: any) => (
                <div key={err} className="flex justify-between items-center">
                  <Badge variant="outline">{err}</Badge>
                  <span className="font-mono text-destructive">{count}</span>
                </div>
              ))}
              {Object.keys(analytics.errorsByType || {}).length === 0 && (
                <div className="text-muted-foreground">No errors recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
