import { ProviderMeta } from './types';
import providersData from './providers.json';

/**
 * Load the provider registry.
 * In future this could be swapped to fetch from a remote source.
 */
export const loadRegistry = (): ProviderMeta[] => {
  return providersData as ProviderMeta[];
};

/** Get providers filtered by category */
export const getProvidersByCategory = (category: ProviderMeta['category']): ProviderMeta[] => {
  return loadRegistry().filter((p) => p.category === category);
};

/** Find a provider by its unique id */
export const findProviderById = (id: string): ProviderMeta | undefined => {
  return loadRegistry().find((p) => p.id === id);
};
