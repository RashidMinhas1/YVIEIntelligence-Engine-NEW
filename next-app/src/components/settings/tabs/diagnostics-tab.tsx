"use client";

import { useState } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export function DiagnosticsTab() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const res = await fetch("/api/settings/ai/diagnostics", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResults(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Diagnostics"
        purpose="Verify API health and troubleshoot connection issues."
        example="Identify exactly why OpenRouter is returning a 401 Unauthorized."
        nextStep="Telemetry"
      />
      
      {!results ? (
        <div className="flex flex-col items-center justify-center border rounded-xl p-12 bg-muted/5">
          <Activity className={`w-16 h-16 text-muted-foreground mb-4 opacity-50 ${isRunning ? 'animate-pulse text-blue-500' : ''}`} />
          <h3 className="text-lg font-medium mb-4">Run Full System Diagnostics</h3>
          <Button size="lg" onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Activity className="w-5 h-5 mr-2" />}
            {isRunning ? "Running Tests..." : "Start Diagnostics"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Diagnostic Report</h3>
            <Button variant="outline" onClick={runDiagnostics} disabled={isRunning}>
              {isRunning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Re-run
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {results.map((res, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {res.status === 'PASS' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-yellow-500" />}
                    {res.providerId.toUpperCase()} {res.type ? `(${res.type})` : ''}
                  </h4>
                  {res.latency && <span className="text-sm text-muted-foreground">{res.latency}ms</span>}
                </div>
                {res.message ? (
                  <p className="text-sm text-muted-foreground">{res.message}</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-sm">
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="text-muted-foreground">DNS</span>
                      <span className="font-medium text-green-600">{res.checks.dns}</span>
                    </div>
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="text-muted-foreground">SSL</span>
                      <span className="font-medium text-green-600">{res.checks.ssl}</span>
                    </div>
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="text-muted-foreground">Auth</span>
                      <span className={`font-medium ${res.checks.auth === 'PASS' ? 'text-green-600' : 'text-yellow-600'}`}>{res.checks.auth}</span>
                    </div>
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="text-muted-foreground">Quota</span>
                      <span className="font-medium text-green-600">{res.checks.quota}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
