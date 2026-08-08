"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';

interface DiagnosticError {
  timestamp: number;
  code: string;
  message: string;
}

interface ProviderDiagnosticsData {
  providerId: string;
  status: string;
  latencyMs: number;
  failoverCount: number;
  recentErrors: DiagnosticError[];
}

interface ProviderDiagnosticsProps {
  providerId: string;
}

export function ProviderDiagnostics({ providerId }: ProviderDiagnosticsProps) {
  const [data, setData] = useState<ProviderDiagnosticsData | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/providers/diagnostics?providerId=${providerId}`);
      const result = await res.json();
      if (result.success && result.diagnostics) {
        setData(result.diagnostics);
      }
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [providerId]);

  const handlePingHealth = async () => {
    setTestingHealth(true);
    try {
      const res = await fetch('/api/providers/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const result = await res.json();
      if (result.success && result.diagnostics) {
        setData(result.diagnostics);
      }
    } finally {
      setTestingHealth(false);
    }
  };

  if (!data) return <div className="p-3 text-xs text-muted-foreground animate-pulse">Loading live diagnostics...</div>;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-xs">Live Health & Diagnostic Monitor</span>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={handlePingHealth} disabled={testingHealth}>
          <RefreshCw className={`w-3 h-3 ${testingHealth ? 'animate-spin' : ''}`} /> Ping Status
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border">
          <div className="text-[10px] text-muted-foreground">Connection Status</div>
          <div className="font-bold flex items-center gap-1 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${data.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="capitalize">{data.status}</span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border">
          <div className="text-[10px] text-muted-foreground">Response Latency</div>
          <div className="font-bold mt-0.5">{data.latencyMs} ms</div>
        </div>

        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border">
          <div className="text-[10px] text-muted-foreground">Failover History</div>
          <div className="font-bold mt-0.5 text-amber-600">{data.failoverCount} Triggers</div>
        </div>
      </div>

      {data.recentErrors && data.recentErrors.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-red-600">Recent Diagnostic Errors</div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {data.recentErrors.slice(0, 3).map((err, idx) => (
              <div key={idx} className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 text-[10px] rounded border border-red-200">
                [{new Date(err.timestamp).toLocaleTimeString()}] {err.code}: {err.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
