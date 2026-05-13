import {
  SIMULATED_ACTIVITY,
  SIMULATED_DATASETS,
  SIMULATED_FILES,
  SIMULATED_UPLOAD_RECEIPT,
} from '../data/demo-fixtures';
import type {
  ActivityEvent,
  CapabilityBlocker,
  ChainScopedQuery,
  DatasetSummary,
  DemoNetwork,
  FileSummary,
  StorageReadiness,
  StorageUploadInput,
  StorageUploadReceipt,
  StorageAdapter,
  ActivityAdapter,
  P256VerifierAdapter,
} from './types';
import {
  createRpcP256VerifierAdapter,
  createSimulatedP256VerifierAdapter,
  type RpcP256VerifierAdapterOptions,
} from './p256-detection';

function cloneList<T>(items: readonly T[]): T[] {
  return items.map((item) => ({ ...item }));
}

function capabilityBlocker(
  code: string,
  scope: CapabilityBlocker['scope'],
  severity: CapabilityBlocker['severity'],
  title: string,
  message: string,
): CapabilityBlocker {
  return { code, scope, severity, title, message };
}

export function createSimulatedStorageAdapter(): StorageAdapter {
  return {
    async readiness(chainId: number, rootAddress: string): Promise<StorageReadiness> {
      return {
        network: chainId === 314 ? 'mainnet' : 'calibration',
        chainId,
        state: 'available',
        simulated: true,
        blockers: [
          capabilityBlocker(
            'simulation-storage',
            'storage',
            'info',
            'Simulation storage ready',
            `Demo data: storage readiness is simulated for ${rootAddress}.`,
          ),
        ],
        checkedAt: Date.now(),
        summary: 'Demo data: simulated storage readiness returned successfully.',
      };
    },

    async upload(input: StorageUploadInput): Promise<StorageUploadReceipt> {
      return {
        ...SIMULATED_UPLOAD_RECEIPT,
        network: input.network,
        chainId: input.chainId,
        createdAt: Date.now(),
        summary: `Demo data: simulated upload for ${input.datasetLabel}.`,
        labels: ['Simulation', 'Demo data', input.mode],
      };
    },

    async listDatasets(input: ChainScopedQuery): Promise<DatasetSummary[]> {
      return cloneList(
        SIMULATED_DATASETS.filter(
          (dataset) => dataset.chainId === input.chainId && dataset.network === input.network,
        ),
      );
    },

    async listFiles(input: ChainScopedQuery): Promise<FileSummary[]> {
      return cloneList(
        SIMULATED_FILES.filter((file) => file.chainId === input.chainId && file.network === input.network),
      );
    },
  };
}

export function createChainBackedActivityAdapter(events: readonly ActivityEvent[]): ActivityAdapter {
  return {
    async listActivity(input: ChainScopedQuery): Promise<ActivityEvent[]> {
      return events
        .filter((event) => event.chainId === input.chainId && event.network === input.network)
        .map((event) => ({ ...event }));
    },
  };
}

export function createSimulatedActivityAdapter(): ActivityAdapter {
  return createChainBackedActivityAdapter(SIMULATED_ACTIVITY);
}

export function createFixtureStorageAdapter(): StorageAdapter {
  return createSimulatedStorageAdapter();
}

export function createFixtureActivityAdapter(): ActivityAdapter {
  return createSimulatedActivityAdapter();
}

export function createUnavailableStorageAdapter(options: {
  network: DemoNetwork;
  chainId: number;
  summary?: string;
}): StorageAdapter {
  return {
    async readiness(): Promise<StorageReadiness> {
      return {
        network: options.network,
        chainId: options.chainId,
        state: 'unknown',
        simulated: false,
        blockers: [
          capabilityBlocker(
            'storage-adapter-not-wired',
            'storage',
            'warning',
            'Live storage adapter is not wired',
            options.summary ?? 'Synapse SDK readiness is scheduled for a later sprint.',
          ),
        ],
        checkedAt: Date.now(),
        summary: options.summary ?? 'Live Synapse storage readiness has not been implemented yet.',
      };
    },

    async upload(): Promise<StorageUploadReceipt> {
      throw new Error('Live Synapse upload adapter is not wired yet.');
    },

    async listDatasets(): Promise<DatasetSummary[]> {
      return [];
    },

    async listFiles(): Promise<FileSummary[]> {
      return [];
    },
  };
}

export function createUnavailableActivityAdapter(): ActivityAdapter {
  return {
    async listActivity(): Promise<ActivityEvent[]> {
      return [];
    },
  };
}

export function createLiveVerifierAdapter(options: RpcP256VerifierAdapterOptions): P256VerifierAdapter {
  return createRpcP256VerifierAdapter(options);
}

export function createSimulatedVerifierAdapter(): P256VerifierAdapter {
  return createSimulatedP256VerifierAdapter();
}

export function createRuntimeAdapters(options: {
  network: DemoNetwork;
  chainId: number;
  mode: 'live' | 'pending-network' | 'simulation';
  rpcUrl?: string;
  fetchImpl?: typeof fetch;
}): {
  verifier: P256VerifierAdapter;
  storage: StorageAdapter;
  activity: ActivityAdapter;
} {
  const verifier =
    options.rpcUrl
      ? createLiveVerifierAdapter({
          network: options.network,
          chainId: options.chainId,
          rpcUrl: options.rpcUrl,
          fetchImpl: options.fetchImpl,
        })
      : createSimulatedVerifierAdapter();

  const storage =
    options.mode === 'simulation'
      ? createFixtureStorageAdapter()
      : createUnavailableStorageAdapter({
          network: options.network,
          chainId: options.chainId,
          summary: 'Live Synapse SDK storage adapter is pending; fixture data is only shown in Simulation Mode.',
        });
  const activity =
    options.mode === 'simulation' ? createFixtureActivityAdapter() : createUnavailableActivityAdapter();

  return {
    verifier,
    storage,
    activity,
  };
}
