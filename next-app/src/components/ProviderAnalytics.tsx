"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, RefreshCw } from 'lucide-react';

interface ProviderDiagnosticsData {
  providerId: string;
  status: string;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  failoverCount: number;
}

interface ProviderAnalyticsProps {
  providerId: string;
}

export function ProviderAnalytics({ providerId }: ProviderAnalyticsProps) {
  const [data, setData] = useState<ProviderDiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/diagnostics?providerId=${providerId}`);
      const result = await res.json();
      if (result.success && result.diagnostics) {
        setData(result.diagnostics);
      }
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiagnostics();
  }, [providerId]);

  if (loading || !data) {
    return <div className="p-4 text-xs text-muted-foreground animate-pulse">Loading provider analytics...</div>;
  }

  const estimatedCost = (data.totalTokens / 1000) * 0.002;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Real-Time Provider Analytics
        </h4>
        <button
          onClick={loadDiagnostics}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total Requests</div>
            <div className="text-lg font-bold mt-1">{data.totalRequests}</div>
            <div className="text-[10px] text-green-600 font-medium mt-0.5">{data.successRate}% Success</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Avg Latency</div>
            <div className="text-lg font-bold mt-1">{data.latencyMs} ms</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{data.status.toUpperCase()}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Tokens Processed</div>
            <div className="text-lg font-bold mt-1">{data.totalTokens.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Prompt + Completion</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Est. Cost</div>
            <div className="text-lg font-bold mt-1">${estimatedCost.toFixed(4)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{data.failoverCount} Failovers</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
