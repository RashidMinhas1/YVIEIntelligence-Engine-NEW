"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database } from 'lucide-react';
import { InfoPanel } from './settings/info-panel';

export function BackupPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExportBackup = async () => {
    setExporting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/providers/backup');
      const data = await res.json();
      if (data.success && data.backup) {
        const backup = data.backup;
        setLastBackupTime(new Date(backup.timestamp).toLocaleString());

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `ai_ecosystem_backup_${backup.timestamp}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setStatusMessage('Backup exported successfully!');
      } else {
        setStatusMessage(`Export error: ${data.error || 'Failed to generate backup'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const res = await fetch('/api/providers/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });
          const data = await res.json();
          if (data.success) {
            setStatusMessage('System restored from backup successfully!');
          } else {
            setStatusMessage(`Failed to restore: ${data.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          setStatusMessage(`Import parse error: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
    }
  };

  return (
    <div className="space-y-4">
      <InfoPanel 
        title="System Backup & Restore"
        purpose="This tool acts as a secure snapshot feature for your entire AI infrastructure. It saves all your provider configurations, active API keys, model routing priorities, and workflow schemas into a single encrypted JSON file."
        example="Before testing a new community provider or making mass changes to your API keys, click 'Export Configuration Backup'. If anything breaks, you can instantly upload that JSON file using 'Restore from Backup' to instantly revert everything to its exact previous working state!"
        nextStep="dashboard_v2"
      />
      <div className="bg-card p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" /> Event-Driven Backup & System Restore
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full ecosystem serialization (Providers, Encrypted Keys, Router Config, Request Logs, Preferences).
          </p>
        </div>

        {statusMessage && (
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded">
            {statusMessage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4 text-green-600" /> Export System Backup
            </CardTitle>
            <CardDescription className="text-xs">
              Generates an encrypted JSON backup file containing your complete AI ecosystem state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border text-muted-foreground">
              <div>Automatic Event Trigger: Enabled</div>
              <div className="text-[10px] mt-1">Backups trigger automatically whenever providers, keys, or routing rules mutate.</div>
              {lastBackupTime && <div className="text-[10px] font-semibold text-green-600 mt-1">Last manual export: {lastBackupTime}</div>}
            </div>

            <Button className="w-full h-8 text-xs gap-1.5" onClick={handleExportBackup} disabled={exporting}>
              <Download className="w-3.5 h-3.5" /> {exporting ? 'Generating Backup...' : 'Export Manual Backup (.json)'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" /> Restore System State
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a previously exported backup file to restore providers, encrypted keys, and history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border text-muted-foreground">
              <div>Warning: Restoring will update provider configurations and keys.</div>
              <div className="text-[10px] mt-1">Existing keys will be safely updated without unencrypted exposure.</div>
            </div>

            <label className="flex items-center justify-center gap-2 h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" /> {importing ? 'Restoring State...' : 'Choose Backup File to Restore'}
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" disabled={importing} />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
