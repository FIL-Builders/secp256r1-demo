import type {
  CapabilityBlocker,
  CapabilityOverrides,
  CapabilityState,
  DemoNetwork,
  DemoRuntimeMode,
  NetworkCapabilities,
} from './types';
import { getNetworkConfig } from './network';

const now = () => Date.now();

function createBlocker(
  code: string,
  scope: CapabilityBlocker['scope'],
  severity: CapabilityBlocker['severity'],
  title: string,
  message: string,
  simulated?: boolean,
): CapabilityBlocker {
  return {
    code,
    scope,
    severity,
    title,
    message,
    simulated,
  };
}

type CapabilityKey = 'p256Precompile' | 'fwssP256Verifier' | 'synapseStorage' | 'providers' | 'payments';

function defaultStateForMode(mode: DemoRuntimeMode, capability: CapabilityKey): CapabilityState {
  if (mode === 'simulation') {
    return 'available';
  }

  if (mode === 'pending-network') {
    if (capability === 'p256Precompile' || capability === 'fwssP256Verifier') {
      return 'unavailable';
    }
    return 'unknown';
  }

  return 'unknown';
}

function severityPriority(severity: CapabilityBlocker['severity']): number {
  switch (severity) {
    case 'error':
      return 0;
    case 'warning':
      return 1;
    case 'info':
      return 2;
    default:
      return 3;
  }
}

function summarizeCapabilityStates(capabilities: NetworkCapabilities): CapabilityBlocker[] {
  const blockers: CapabilityBlocker[] = [];

  if (capabilities.mode === 'simulation') {
    blockers.push(
      createBlocker(
        'simulation-mode',
        'runtime',
        'info',
        'Simulation mode enabled',
        'The app is using simulated verifier, storage, and activity adapters with clearly labeled fixture data.',
        true,
      ),
    );
  }

  if (capabilities.p256Precompile === 'unavailable') {
    blockers.push(
      createBlocker(
        'p256-precompile-unavailable',
        'precompile',
        'error',
        'P256VERIFY is not active',
        'The selected network does not yet expose P256VERIFY at 0x0000000000000000000000000000000000000100, so passkey-backed live verification stays disabled.',
      ),
    );
  } else if (capabilities.p256Precompile === 'error') {
    blockers.push(
      createBlocker(
        'p256-precompile-error',
        'precompile',
        'error',
        'P256VERIFY probe failed',
        'The precompile probe could not complete, so the app should fall back to pending-network or simulation mode.',
      ),
    );
  }

  if (capabilities.fwssP256Verifier === 'unavailable') {
    blockers.push(
      createBlocker(
        'fwss-verifier-unavailable',
        'verifier',
        'warning',
        'FWSS P-256 verifier is unavailable',
        'The selected network cannot complete the passkey proof path through the verifier contract yet.',
      ),
    );
  }

  if (capabilities.synapseStorage === 'unavailable') {
    blockers.push(
      createBlocker(
        'storage-unavailable',
        'storage',
        'warning',
        'Storage readiness is blocked',
        'The storage surface is not ready for passkey-backed upload or readback.',
      ),
    );
  }

  if (capabilities.providers === 'unavailable') {
    blockers.push(
      createBlocker(
        'providers-unavailable',
        'providers',
        'warning',
        'No provider readiness',
        'Provider availability is not ready for live uploads on the selected network.',
      ),
    );
  }

  if (capabilities.payments === 'unavailable') {
    blockers.push(
      createBlocker(
        'payments-unavailable',
        'payments',
        'warning',
        'Payment readiness is blocked',
        'The selected network cannot complete the payment flow required for live storage actions.',
      ),
    );
  }

  return blockers;
}

export function getCapabilitiesForNetworkAndMode(
  network: DemoNetwork,
  mode: DemoRuntimeMode,
  overrides: CapabilityOverrides = {},
): NetworkCapabilities {
  const config = getNetworkConfig(network);
  const checkedAt = overrides.checkedAt ?? now();

  const capability: NetworkCapabilities = {
    chainId: config.chainId,
    network,
    mode,
    p256Precompile: overrides.p256Precompile ?? defaultStateForMode(mode, 'p256Precompile'),
    fwssP256Verifier: overrides.fwssP256Verifier ?? defaultStateForMode(mode, 'fwssP256Verifier'),
    synapseStorage: overrides.synapseStorage ?? defaultStateForMode(mode, 'synapseStorage'),
    providers: overrides.providers ?? defaultStateForMode(mode, 'providers'),
    payments: overrides.payments ?? defaultStateForMode(mode, 'payments'),
    blockers: [],
    checkedAt,
  };

  const blockers = [
    ...(overrides.blockers ? [...overrides.blockers] : []),
    ...summarizeCapabilityStates(capability),
  ];

  capability.blockers = blockers.sort((left, right) => severityPriority(left.severity) - severityPriority(right.severity));
  return capability;
}

export function isCapabilityReady(state: CapabilityState): boolean {
  return state === 'available';
}

export function isLiveCapabilityModel(capabilities: NetworkCapabilities): boolean {
  return (
    capabilities.mode === 'live' &&
    capabilities.p256Precompile === 'available' &&
    capabilities.fwssP256Verifier === 'available' &&
    capabilities.synapseStorage === 'available' &&
    capabilities.providers === 'available' &&
    capabilities.payments === 'available'
  );
}

export function summarizeCapabilityModel(capabilities: NetworkCapabilities): string {
  if (capabilities.mode === 'simulation') {
    return 'Simulation mode with fixture verifier, storage, and activity adapters.';
  }

  if (capabilities.p256Precompile === 'unavailable') {
    return 'Pending network mode because the selected chain does not yet expose P256VERIFY.';
  }

  if (capabilities.blockers.length === 0) {
    return 'Live capability model with no current blockers.';
  }

  return capabilities.blockers[0]?.message ?? 'Capabilities require attention.';
}
