"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { InfoPanel } from './settings/info-panel';

export type HistoryMode = 'disabled' | 'errors_only' | 'last_100' | 'last_500' | 'unlimited';
export type RetentionDays = 7 | 30 | 90 | 'never';

export interface RequestLogEntry {
  id: string;
  requestId: string;
  providerId: string;
  model: string;
  latencyMs: number;
  tokensUsed?: { prompt: number; completion: number; total: number };
  success: boolean;
  errorMessage?: string;
  timestamp: number;
  failoverUsed?: boolean;
}

export function RequestHistoryPanel() {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [mode, setMode] = useState<HistoryMode>('last_100');
  const [retentionDays, setRetentionDays] = useState<RetentionDays>(30);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers/history');
      const data = await res.json();
      if (data.success) {
        if (data.config) {
          setMode(data.config.mode);
          setRetentionDays(data.config.retentionDays);
        }
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to load request history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleModeChange = async (newMode: HistoryMode) => {
    setMode(newMode);
    try {
      await fetch('/api/providers/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { mode: newMode } }),
      });
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetentionChange = async (newDays: string) => {
    const days = newDays === 'never' ? 'never' : (parseInt(newDays, 10) as RetentionDays);
    setRetentionDays(days);
    try {
      await fetch('/api/providers/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { retentionDays: days } }),
      });
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all request logs?')) return;
    try {
      await fetch('/api/providers/history', { method: 'DELETE' });
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_request_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.providerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProvider = selectedProvider === 'all' || log.providerId === selectedProvider;

    return matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-4">
      <InfoPanel 
        title="AI Request History & Audit Logs"
        purpose="This is your complete AI audit trail. Every single API call made by the system is logged here. It allows you to monitor exactly how many tokens are being consumed, view the exact latency (speed) of each model, and debug any connection errors in real-time."
        example="Notice your responses are slow? Check this tab, filter by 'last 100 requests', and look at the 'Latency' column. If one model is taking over 5000ms consistently, you can jump back to the Dashboard and disable it to force a faster failover."
        nextStep="telemetry"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 border rounded-lg shadow-sm">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> AI Request History & Audit Log
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configurable log retention, error tracking, token usage audit, and JSON data export.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportJson}>
            <Download className="w-3.5 h-3.5" /> Export JSON
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={handleClearLogs}>
            <Trash2 className="w-3.5 h-3.5" /> Clear Logs
          </Button>
        </div>
      </div>

      <Card className="border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search history by model or provider..."
                  className="pl-8 h-8 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Mode:</span>
                <Select value={mode} onValueChange={(v) => handleModeChange(v as HistoryMode)}>
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="errors_only">Errors Only</SelectItem>
                    <SelectItem value="last_100">Last 100</SelectItem>
                    <SelectItem value="last_500">Last 500</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Retention:</span>
                <Select value={String(retentionDays)} onValueChange={handleRetentionChange}>
                  <SelectTrigger className="h-8 text-xs w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 text-xs">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading request logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border border-dashed rounded">
              No request history logs match your filter criteria.
            </div>
          ) : (
            <div className="divide-y max-h-[450px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <span className="capitalize">{log.providerId}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">({log.model})</span>
                        {log.failoverUsed && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                            Failover Used
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(log.timestamp).toLocaleString()} • {log.latencyMs} ms
                        {log.tokensUsed && ` • ${log.tokensUsed.total} tokens`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        log.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {log.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
