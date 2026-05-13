import { createPublicClient, http, type Address as ViemAddress } from 'viem';
import { getBalance } from 'viem/actions';

import type {
  Address,
  CapabilityBlocker,
  CapabilityState,
  DatasetSummary,
  DemoNetwork,
  FileSummary,
  StoragePaymentReadiness,
  StorageProviderReadiness,
  StorageReadiness,
} from './types';

const DEFAULT_SAMPLE_UPLOAD_SIZE_BYTES = 1_048_576;

interface SynapseReadinessInput {
  network: DemoNetwork;
  chainId: number;
  rpcUrl: string;
  rootAddress?: Address;
  sampleUploadSizeBytes?: number;
}

function blocker(
  code: string,
  scope: CapabilityBlocker['scope'],
  severity: CapabilityBlocker['severity'],
  title: string,
  message: string,
): CapabilityBlocker {
  return {
    code,
    scope,
    severity,
    title,
    message,
  };
}

async function createReadClient(input: Pick<SynapseReadinessInput, 'network' | 'rpcUrl'>) {
  const { calibration, mainnet } = await import('@filoz/synapse-core/chains');

  return createPublicClient({
    chain: input.network === 'mainnet' ? mainnet : calibration,
    transport: http(input.rpcUrl),
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function asNumber(value: bigint | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isSafeInteger(numberValue) ? numberValue : null;
}

function unavailableReadiness(input: SynapseReadinessInput, message: string): StorageReadiness {
  return {
    network: input.network,
    chainId: input.chainId,
    state: 'unavailable',
    simulated: false,
    blockers: [
      blocker(
        'root-wallet-required',
        'storage',
        'warning',
        'Root wallet required',
        message,
      ),
    ],
    checkedAt: Date.now(),
    summary: message,
    provider: {
      state: 'unknown',
      activeProviderCount: null,
      totalProviderCount: null,
    },
    payment: {
      state: 'unknown',
      ready: false,
    },
    sampleUploadSizeBytes: input.sampleUploadSizeBytes ?? DEFAULT_SAMPLE_UPLOAD_SIZE_BYTES,
  };
}

export async function probeSynapseReadiness(input: SynapseReadinessInput): Promise<StorageReadiness> {
  const sampleUploadSizeBytes = input.sampleUploadSizeBytes ?? DEFAULT_SAMPLE_UPLOAD_SIZE_BYTES;

  if (!input.rootAddress) {
    return unavailableReadiness(
      input,
      'Connect a root wallet to check Synapse provider and payment readiness for the selected network.',
    );
  }

  const [client, spRegistry, pay, warmStorage, erc20] = await Promise.all([
    createReadClient({
      network: input.network,
      rpcUrl: input.rpcUrl,
    }),
    import('@filoz/synapse-core/sp-registry'),
    import('@filoz/synapse-core/pay'),
    import('@filoz/synapse-core/warm-storage'),
    import('@filoz/synapse-core/erc20'),
  ]);
  const rootAddress = input.rootAddress as ViemAddress;
  const chain = client.chain;

  const [activeProviderCountResult, totalProviderCountResult, accountInfoResult, filBalanceResult, usdfcBalanceResult, uploadCostsResult] =
    await Promise.allSettled([
      spRegistry.activeProviderCount(client),
      spRegistry.getProviderCount(client),
      pay.accounts(client, { address: rootAddress }),
      getBalance(client, { address: rootAddress }),
      erc20.balance(client, { address: rootAddress }),
      warmStorage.getUploadCosts(client, {
        clientAddress: rootAddress,
        dataSize: BigInt(sampleUploadSizeBytes),
        isNewDataSet: true,
        withCDN: false,
      }),
    ]);
  const serviceApprovalResult = await Promise.allSettled([
    pay.operatorApprovals(client, {
      address: rootAddress,
      operator: chain.contracts.fwss.address,
    }),
  ]).then(([result]) => result);

  const serviceApproved =
    serviceApprovalResult.status === 'fulfilled'
      ? serviceApprovalResult.value.isApproved
      : undefined;

  return createReadinessFromSettled({
    input,
    sampleUploadSizeBytes,
    activeProviderCountResult,
    totalProviderCountResult,
    accountInfoResult,
    filBalanceResult,
    usdfcBalanceResult,
    uploadCostsResult,
    serviceApproved,
    serviceApprovalError: serviceApprovalResult.status === 'rejected' ? errorMessage(serviceApprovalResult.reason) : undefined,
  });
}

type Settled<T> = PromiseSettledResult<T>;

function createReadinessFromSettled(input: {
  input: SynapseReadinessInput;
  sampleUploadSizeBytes: number;
  activeProviderCountResult: Settled<bigint>;
  totalProviderCountResult: Settled<bigint>;
  accountInfoResult: Settled<{
    funds: bigint;
    lockupCurrent: bigint;
    lockupRate: bigint;
    availableFunds: bigint;
  }>;
  filBalanceResult: Settled<bigint>;
  usdfcBalanceResult: Settled<{ value: bigint }>;
  uploadCostsResult: Settled<{
    rate: {
      perEpoch: bigint;
      perMonth: bigint;
    };
    depositNeeded: bigint;
    needsFwssMaxApproval: boolean;
    ready: boolean;
  }>;
  serviceApproved?: boolean;
  serviceApprovalError?: string;
}): StorageReadiness {
  const {
    sampleUploadSizeBytes,
    activeProviderCountResult,
    totalProviderCountResult,
    accountInfoResult,
    filBalanceResult,
    usdfcBalanceResult,
    uploadCostsResult,
    serviceApproved,
    serviceApprovalError,
  } = input;

  const activeProviderCount =
    activeProviderCountResult.status === 'fulfilled' ? asNumber(activeProviderCountResult.value) : null;
  const totalProviderCount =
    totalProviderCountResult.status === 'fulfilled' ? asNumber(totalProviderCountResult.value) : null;
  const providerError =
    activeProviderCountResult.status === 'rejected'
      ? errorMessage(activeProviderCountResult.reason)
      : totalProviderCountResult.status === 'rejected'
        ? errorMessage(totalProviderCountResult.reason)
        : undefined;
  const providerState: CapabilityState = providerError
    ? 'error'
    : activeProviderCount != null && activeProviderCount > 0
      ? 'available'
      : 'unavailable';

  const accountInfo = accountInfoResult.status === 'fulfilled' ? accountInfoResult.value : null;
  const uploadCosts = uploadCostsResult.status === 'fulfilled' ? uploadCostsResult.value : null;
  const paymentError =
    uploadCostsResult.status === 'rejected'
      ? errorMessage(uploadCostsResult.reason)
      : accountInfoResult.status === 'rejected'
        ? errorMessage(accountInfoResult.reason)
        : serviceApprovalError;
  const paymentReady = Boolean(uploadCosts?.ready);
  const paymentState: CapabilityState = paymentError ? 'error' : paymentReady ? 'available' : 'unavailable';
  const payment: StoragePaymentReadiness = {
    state: paymentState,
    ready: paymentReady,
    accountFunds: accountInfo?.funds,
    availableFunds: accountInfo?.availableFunds,
    lockupCurrent: accountInfo?.lockupCurrent,
    lockupRate: accountInfo?.lockupRate,
    walletFilBalance: filBalanceResult.status === 'fulfilled' ? filBalanceResult.value : undefined,
    walletUsdfcBalance: usdfcBalanceResult.status === 'fulfilled' ? usdfcBalanceResult.value.value : undefined,
    depositNeeded: uploadCosts?.depositNeeded,
    ratePerEpoch: uploadCosts?.rate.perEpoch,
    ratePerMonth: uploadCosts?.rate.perMonth,
    needsServiceApproval: uploadCosts?.needsFwssMaxApproval,
    serviceApproved,
    error: paymentError,
  };
  const provider: StorageProviderReadiness = {
    state: providerState,
    activeProviderCount,
    totalProviderCount,
    error: providerError,
  };
  const blockers: CapabilityBlocker[] = [];

  if (providerState === 'unavailable') {
    blockers.push(
      blocker(
        'synapse-no-active-providers',
        'providers',
        'warning',
        'No active storage providers',
        'The Synapse provider registry returned no active PDP providers for this network.',
      ),
    );
  } else if (providerState === 'error') {
    blockers.push(
      blocker(
        'synapse-provider-probe-error',
        'providers',
        'warning',
        'Provider readiness check failed',
        providerError ?? 'The provider readiness check failed.',
      ),
    );
  }

  if (paymentState === 'unavailable') {
    if (uploadCosts?.depositNeeded && uploadCosts.depositNeeded > 0n) {
      blockers.push(
        blocker(
          'synapse-payment-deposit-needed',
          'payments',
          'warning',
          'Storage payment deposit needed',
          'The payment account needs more USDFC before a representative upload can proceed.',
        ),
      );
    }

    if (uploadCosts?.needsFwssMaxApproval) {
      blockers.push(
        blocker(
          'synapse-payment-approval-needed',
          'payments',
          'warning',
          'Warm Storage approval needed',
          'The root wallet has not approved Warm Storage to manage Filecoin Pay rails.',
        ),
      );
    }
  } else if (paymentState === 'error') {
    blockers.push(
      blocker(
        'synapse-payment-probe-error',
        'payments',
        'warning',
        'Payment readiness check failed',
        paymentError ?? 'The payment readiness check failed.',
      ),
    );
  }

  const state: CapabilityState =
    providerState === 'available' && paymentState === 'available'
      ? 'available'
      : providerState === 'error' || paymentState === 'error'
        ? 'error'
        : 'unavailable';

  return {
    network: input.input.network,
    chainId: input.input.chainId,
    state,
    simulated: false,
    blockers,
    checkedAt: Date.now(),
    summary:
      state === 'available'
        ? 'Synapse provider and payment readiness checks passed for the selected root wallet.'
        : 'Synapse readiness is blocked by provider or payment state on the selected network.',
    provider,
    payment,
    sampleUploadSizeBytes,
  };
}

export async function listSynapseDatasets(input: SynapseReadinessInput): Promise<DatasetSummary[]> {
  if (!input.rootAddress) {
    return [];
  }

  const [client, warmStorage, pdpVerifier] = await Promise.all([
    createReadClient({
      network: input.network,
      rpcUrl: input.rpcUrl,
    }),
    import('@filoz/synapse-core/warm-storage'),
    import('@filoz/synapse-core/pdp-verifier'),
  ]);
  const datasets = await warmStorage.getClientDataSets(client, {
    address: input.rootAddress as ViemAddress,
    offset: 0n,
    limit: 100n,
  });

  return Promise.all(
    datasets.map(async (dataset) => {
      const datasetId = dataset.dataSetId.toString();
      const [metadataResult, pieceCountResult] = await Promise.allSettled([
        warmStorage.getAllDataSetMetadata(client, { dataSetId: dataset.dataSetId }),
        pdpVerifier.getActivePieceCount(client, { dataSetId: dataset.dataSetId }),
      ]);
      const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : {};
      const label = metadata.name ?? metadata.label ?? `Dataset ${datasetId}`;
      const pieceCount =
        pieceCountResult.status === 'fulfilled' ? asNumber(pieceCountResult.value) ?? 0 : 0;

      return {
        network: input.network,
        chainId: input.chainId,
        datasetId,
        label,
        fileCount: pieceCount,
        pieceCount,
        source: 'chain',
        createdAt: Date.now(),
      };
    }),
  );
}

export async function listSynapseFiles(): Promise<FileSummary[]> {
  return [];
}
