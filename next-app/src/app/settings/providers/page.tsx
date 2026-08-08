"use client";

import React, { useState } from 'react';
import { ProviderContextProvider, useProviderContext } from '@/context/ProviderContext';
import { ProviderCard } from '@/components/ProviderCard';
import { CapabilityMatrix } from '@/components/CapabilityMatrix';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Play, Table, Download, Sparkles, Layers } from 'lucide-react';
import Link from 'next/link';

function ProviderDashboardContent() {
  const { providers, loading, refreshProviders } = useProviderContext();

  const officialProviders = providers.filter((p) => p.profile?.category === 'official');
  const communityProviders = providers.filter((p) => p.profile?.category === 'community');
  const localProviders = providers.filter((p) => p.profile?.category === 'local');
  const customProviders = providers.filter((p) => p.profile?.category === 'custom');

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" /> AI Provider Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise AI Provider Ecosystem V2 with Centralized Event Bus, Resilience Failover, & Multi-Key Security.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/settings/playground">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Play className="w-3.5 h-3.5 text-green-600" /> AI Playground
            </Button>
          </Link>
          <Link href="/settings/providers/templates">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Templates
            </Button>
          </Link>
          <Button variant="default" size="sm" className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Import Provider
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full sm:w-[500px]">
          <TabsTrigger value="all" className="text-xs">All ({providers.length})</TabsTrigger>
          <TabsTrigger value="official" className="text-xs">Official ({officialProviders.length})</TabsTrigger>
          <TabsTrigger value="community" className="text-xs">Community ({communityProviders.length})</TabsTrigger>
          <TabsTrigger value="local" className="text-xs">Local ({localProviders.length})</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs">Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.profile?.id} provider={p} onRefresh={refreshProviders} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="official" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialProviders.map((p) => (
              <ProviderCard key={p.profile?.id} provider={p} onRefresh={refreshProviders} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityProviders.map((p) => (
              <ProviderCard key={p.profile?.id} provider={p} onRefresh={refreshProviders} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localProviders.map((p) => (
              <ProviderCard key={p.profile?.id} provider={p} onRefresh={refreshProviders} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <h3 className="text-base font-semibold">Ecosystem Capability Matrix</h3>
          <CapabilityMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProviderDashboardPage() {
  return (
    <ProviderContextProvider>
      <ProviderDashboardContent />
    </ProviderContextProvider>
  );
}
