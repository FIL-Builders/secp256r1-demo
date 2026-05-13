import type { DemoNetwork, DemoRuntimeMode } from './types';
import { isDemoNetwork } from './network';

const SELECTED_NETWORK_KEY = 'synapse-demo:selected-network';
const RUNTIME_MODE_KEY = 'synapse-demo:runtime-mode';

function isRuntimeMode(value: string | null): value is DemoRuntimeMode {
  return value === 'live' || value === 'pending-network' || value === 'simulation';
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local preferences are optional. Ignore storage failures.
  }
}

export function readStoredNetwork(fallback: DemoNetwork): DemoNetwork {
  const value = readStorage(SELECTED_NETWORK_KEY);
  return value && isDemoNetwork(value) ? value : fallback;
}

export function writeStoredNetwork(value: DemoNetwork): void {
  writeStorage(SELECTED_NETWORK_KEY, value);
}

export function readStoredRuntimeMode(fallback: DemoRuntimeMode): DemoRuntimeMode {
  const value = readStorage(RUNTIME_MODE_KEY);
  return isRuntimeMode(value) ? value : fallback;
}

export function writeStoredRuntimeMode(value: DemoRuntimeMode): void {
  writeStorage(RUNTIME_MODE_KEY, value);
}

export function clearStoredPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SELECTED_NETWORK_KEY);
    window.localStorage.removeItem(RUNTIME_MODE_KEY);
  } catch {
    // Local preferences are optional. Ignore storage failures.
  }
}
