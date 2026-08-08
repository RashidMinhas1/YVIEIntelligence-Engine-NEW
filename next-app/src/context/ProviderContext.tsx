"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventBus } from '@/lib/events/eventBus';
import { loadRegistry, getProvidersByCategory, findProviderById } from '@/lib/providerRegistry';
import { ProviderMeta, ModelInfo } from '@/lib/providerRegistry/types';

export interface ProviderContextType {
  // Raw provider config from backend (user‑saved settings)
  providers: any[];
  // Categorised providers from the static registry (read‑only)
  officialProviders: ProviderMeta[];
  communityProviders: ProviderMeta[];
  localProviders: ProviderMeta[];
  // Dynamically discovered models per provider id
  discoveredModels: Record<string, ModelInfo[]>;
  loading: boolean;
  // Backend reload of user saved providers
  refreshProviders: () => Promise<void>;
  // Core actions – keep existing signatures for backward compatibility
  toggleProviderEnabled: (providerId: string, enabled: boolean) => Promise<void>;
  deleteProvider: (providerId: string) => Promise<void>;
  // New ecosystem actions
  connectProvider: (providerId: string, apiKey: string) => Promise<void>;
  discoverModels: (providerId: string) => Promise<void>;
  rotateKey: (providerId: string) => Promise<void>;
  updateHealth: (providerId: string, status: ProviderMeta['healthStatus']) => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderContextProvider({ children }: { children: React.ReactNode }) {
  const [providers, setProviders] = useState<any[]>([]); // user‑saved configs
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<ProviderMeta[]>([]);
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, ModelInfo[]>>({});

  // ---------------------------------------------------------------------
  // Load static provider registry (official / community / local)
  // ---------------------------------------------------------------------
  const loadProviderRegistry = () => {
    const reg = loadRegistry();
    setRegistry(reg);
  };

  // ---------------------------------------------------------------------
  // Fetch user‑saved providers from backend (existing API)
  // ---------------------------------------------------------------------
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/providers'); // new endpoint – will return same shape as before
      const data = await res.json();
      if (data.success && Array.isArray(data.providers)) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('[ProviderContext] Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Initialise – load registry and backend providers, then subscribe to events
  // ---------------------------------------------------------------------
  useEffect(() => {
    loadProviderRegistry();
    void fetchProviders();

    const sub1 = eventBus.subscribe('provider:added', () => void fetchProviders());
    const sub2 = eventBus.subscribe('provider:updated', () => void fetchProviders());
    const sub3 = eventBus.subscribe('provider:removed', () => void fetchProviders());
    const sub4 = eventBus.subscribe('provider:enabled', () => void fetchProviders());
    const sub5 = eventBus.subscribe('provider:disabled', () => void fetchProviders());

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
      sub4.unsubscribe();
      sub5.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------
  // Helpers to split the static registry into categories (read‑only)
  // ---------------------------------------------------------------------
  const officialProviders = registry.filter((p) => p.category === 'official');
  const communityProviders = registry.filter((p) => p.category === 'community');
  const localProviders = registry.filter((p) => p.category === 'local');

  // ---------------------------------------------------------------------
  // Existing actions (optimistic UI updates) – kept unchanged for backwards compatibility
  // ---------------------------------------------------------------------
  const toggleProviderEnabled = async (providerId: string, enabled: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.profile?.id === providerId ? { ...p, enabled } : p))
    );
    // TODO: persist to backend (POST /api/providers/:id/enable)
  };

  const deleteProvider = async (providerId: string) => {
    setProviders((prev) => prev.filter((p) => p.profile?.id !== providerId));
    // TODO: persist delete to backend
  };

  // ---------------------------------------------------------------------
  // New ecosystem actions – minimal implementations for now (will be expanded later)
  // ---------------------------------------------------------------------
  const connectProvider = async (providerId: string, apiKey: string) => {
    // Store the API key locally (optimistic) – backend persistence can be added later
    setProviders((prev) =>
      prev.map((p) =>
        p.profile?.id === providerId ? { ...p, apiKey, enabled: true } : p
      )
    );
    // Trigger a model discovery after connection
    await discoverModels(providerId);
  };

  const discoverModels = async (providerId: string) => {
    const provider = findProviderById(providerId);
    if (!provider) return;
    try {
      const url = `${provider.baseUrl}${provider.endpoints.models}`;
      const headers: Record<string, string> = {};
      if (provider.authMethod === 'apiKey') {
        const key = providers.find((p) => p.profile?.id === providerId)?.apiKey;
        if (key) headers['Authorization'] = `Bearer ${key}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Model discovery failed');
      const data = await res.json();
      const models: ModelInfo[] = (data.models || []).map((m: any) => ({
        id: m.id ?? m.name,
        name: m.name ?? m.id,
        description: m.description,
        capabilities: m.capabilities,
      }));
      setDiscoveredModels((prev) => ({ ...prev, [providerId]: models }));
      await updateHealth(providerId, 'online');
    } catch (err) {
      console.error('[ProviderContext] discoverModels error', err);
      await updateHealth(providerId, 'authFailed');
    }
  };

  const rotateKey = async (providerId: string) => {
    const prov = providers.find((p) => p.profile?.id === providerId);
    if (!prov || !Array.isArray(prov.apiKeys) || prov.apiKeys.length < 2) return;
    const [current, ...rest] = prov.apiKeys;
    prov.apiKeys = [...rest, current]; // rotate
    setProviders((prev) =>
      prev.map((p) => (p.profile?.id === providerId ? { ...p, apiKeys: prov.apiKeys } : p))
    );
  };

  const updateHealth = async (providerId: string, status: ProviderMeta['healthStatus']) => {
    setRegistry((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, healthStatus: status } : p))
    );
    // TODO: persist health status if needed
  };

  return (
    <ProviderContext.Provider
      value={{
        providers,
        officialProviders,
        communityProviders,
        localProviders,
        discoveredModels,
        loading,
        refreshProviders: fetchProviders,
        toggleProviderEnabled,
        deleteProvider,
        connectProvider,
        discoverModels,
        rotateKey,
        updateHealth,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  const ctx = useContext(ProviderContext);
  if (!ctx) {
    throw new Error('useProviderContext must be used within a ProviderContextProvider');
  }
  return ctx;
}
