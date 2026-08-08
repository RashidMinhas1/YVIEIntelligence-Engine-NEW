"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Key, Activity, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { ProviderAnalytics } from './ProviderAnalytics';
import { ProviderDiagnostics } from './ProviderDiagnostics';
import { useProviderContext } from '@/context/ProviderContext';

interface ProviderCardProps {
  provider: any;
  onRefresh: () => void;
}

export function ProviderCard({ provider, onRefresh }: ProviderCardProps) {
  const { toggleProviderEnabled } = useProviderContext();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [addingKey, setAddingKey] = useState(false);

  const profile = provider.profile || {};
  const apiKeys = provider.apiKeys || [];

  const handleAddKey = async () => {
    if (!newKeyValue) return;
    setAddingKey(true);
    try {
      await fetch('/api/providers/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: profile.id,
          name: newKeyName || `Key ${apiKeys.length + 1}`,
          key: newKeyValue,
        }),
      });
      setNewKeyName('');
      setNewKeyValue('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add key', err);
    } finally {
      setAddingKey(false);
    }
  };

  const handleRemoveKey = async (keyId: string) => {
    try {
      await fetch(`/api/providers/keys?providerId=${profile.id}&keyId=${keyId}`, {
        method: 'DELETE',
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to remove key', err);
    }
  };

  const handleDeleteProvider = async () => {
    if (!confirm(`Are you sure you want to delete ${profile.name}?`)) return;
    try {
      const res = await fetch(`/api/providers?id=${profile.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete provider');
      }
    } catch (err) {
      console.error('Failed to delete provider', err);
      alert('Failed to delete provider');
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">{profile.name}</CardTitle>
              <Badge variant="outline" className="capitalize text-[10px]">
                {profile.category}
              </Badge>
              {profile.isCustom && <Badge className="bg-purple-100 text-purple-700 text-[10px]">Custom</Badge>}
            </div>
            <CardDescription className="text-xs line-clamp-1">{profile.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={handleDeleteProvider} title="Delete this Provider Connection">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
            <Switch
              checked={!!provider.enabled}
              onCheckedChange={(c) => toggleProviderEnabled(profile.id, c)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-8">
            <TabsTrigger value="keys" className="text-xs gap-1.5">
              <Key className="w-3.5 h-3.5" /> API Keys ({apiKeys.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Diagnostics & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-3 pt-3">
            <div className="space-y-2">
              {apiKeys.map((k: any) => (
                <div key={k.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-md border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-xs">{k.name}</div>
                      <div className="text-[10px] text-muted-foreground">Priority {k.priority} • Uses: {k.usageCount}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveKey(k.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}

              {apiKeys.length === 0 && profile.category !== 'local' && (
                <div className="text-center py-2 text-muted-foreground text-xs border border-dashed rounded">
                  No API keys added. Add one below.
                </div>
              )}
            </div>

            {profile.category !== 'local' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="font-medium text-xs">Add New API Key</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Key Label (e.g. Prod Key)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" className="h-8 text-xs shrink-0" onClick={handleAddKey} disabled={addingKey}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3">
            <ProviderDiagnostics providerId={profile.id} />
            <ProviderAnalytics providerId={profile.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
