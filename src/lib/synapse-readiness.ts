import { createPublicClient, http, type Address as ViemAddress } from 'viem';
import { getBalance } from 'viem/actions';

import type {
  Address,
  ActivityEvent,
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

function providerLabel(providerId: bigint | number | string, name?: string): string {
  return name && name.trim().length > 0 ? name : `Provider ${providerId.toString()}`;
}

function metadataLabel(metadata: Record<string, string>, fallback: string): string {
  return metadata.name ?? metadata.label ?? metadata.title ?? fallback;
}

function parseMetadataSize(metadata: Record<string, string>): number {
  const rawValue = metadata.size ?? metadata.fileSize ?? metadata.contentLength ?? '0';
  const parsed = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

  const [client, warmStorage] = await Promise.all([
    createReadClient({
      network: input.network,
      rpcUrl: input.rpcUrl,
    }),
    import('@filoz/synapse-core/warm-storage'),
  ]);
  const datasets = await warmStorage.getPdpDataSets(client, {
    address: input.rootAddress as ViemAddress,
    offset: 0n,
    limit: 100n,
  });

  return datasets.map((dataset) => {
    const datasetId = dataset.dataSetId.toString();
    const pieceCount = asNumber(dataset.activePieceCount) ?? 0;
    const provider = providerLabel(dataset.providerId, dataset.provider.name);

    return {
      network: input.network,
      chainId: input.chainId,
      datasetId,
      clientDatasetId: dataset.clientDataSetId.toString(),
      label: metadataLabel(dataset.metadata, `Dataset ${datasetId}`),
      fileCount: pieceCount,
      pieceCount,
      source: 'chain',
      createdAt: 0,
      visibility: dataset.metadata.visibility === 'public' ? 'public' : 'private',
      provider,
      providerAddress: dataset.provider.serviceProvider as Address,
      paymentRailStatus: 'unknown',
      proofStatus: dataset.live ? 'unknown' : 'pending',
      metadata: dataset.metadata,
    };
  });
}

export async function listSynapseFiles(input: SynapseReadinessInput): Promise<FileSummary[]> {
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
  const datasets = await warmStorage.getPdpDataSets(client, {
    address: input.rootAddress as ViemAddress,
    offset: 0n,
    limit: 100n,
  });
  const datasetRows = await Promise.allSettled(
    datasets.map(async (dataset) => {
      const provider = providerLabel(dataset.providerId, dataset.provider.name);
      const pieces = await pdpVerifier.getPiecesWithMetadata(client, {
        dataSet: dataset,
        address: input.rootAddress as ViemAddress,
        offset: 0n,
        limit: 100n,
      });

      return pieces.pieces.map((piece) => {
        const pieceCid = piece.cid.toString();
        const metadata = piece.metadata;
        const fileName = metadataLabel(metadata, pieceCid);

        return {
          network: input.network,
          chainId: input.chainId,
          fileId: `${dataset.dataSetId.toString()}-${piece.id.toString()}`,
          datasetId: dataset.dataSetId.toString(),
          datasetLabel: metadataLabel(dataset.metadata, `Dataset ${dataset.dataSetId.toString()}`),
          name: fileName,
          size: parseMetadataSize(metadata),
          mimeType: metadata.mimeType ?? metadata.type ?? 'application/octet-stream',
          source: 'chain' as const,
          createdAt: 0,
          provider,
          providerAddress: dataset.provider.serviceProvider as Address,
          pieceCid,
          retrievalUrl: piece.url,
          verificationStatus: dataset.live ? ('unknown' as const) : ('pending' as const),
          authorizationStatus: 'wallet-authorized' as const,
          metadata,
        };
      });
    }),
  );

  return datasetRows.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

export async function listSynapseActivity(input: SynapseReadinessInput): Promise<ActivityEvent[]> {
  if (!input.rootAddress) {
    return [];
  }

  const observedAt = Date.now();
  const [datasetsResult, filesResult] = await Promise.allSettled([
    listSynapseDatasets(input),
    listSynapseFiles(input),
  ]);
  const events: ActivityEvent[] = [];

  if (datasetsResult.status === 'fulfilled') {
    for (const dataset of datasetsResult.value) {
      events.push({
        network: input.network,
        chainId: input.chainId,
        eventId: `chain-dataset-indexed-${dataset.datasetId}`,
        kind: 'dataset-indexed',
        title: 'Dataset indexed from chain',
        detail:
          `Readback found ${dataset.label}. Original creation time is not exposed by this read path, so the timestamp is the refresh time.`,
        simulated: false,
        source: 'chain',
        createdAt: observedAt,
        datasetId: dataset.datasetId,
        provider: dataset.provider,
        providerAddress: dataset.providerAddress,
        severity: 'info',
        metadata: {
          timestamp: 'refresh-observed',
          proofStatus: dataset.proofStatus ?? 'unknown',
          paymentRailStatus: dataset.paymentRailStatus ?? 'unknown',
        },
      });
    }
  }

  if (filesResult.status === 'fulfilled') {
    for (const file of filesResult.value) {
      events.push({
        network: input.network,
        chainId: input.chainId,
        eventId: `chain-file-indexed-${file.fileId}`,
        kind: 'file-indexed',
        title: 'File indexed from chain',
        detail:
          `Readback found ${file.name}. Original commit time is not exposed by this read path, so the timestamp is the refresh time.`,
        simulated: false,
        source: 'chain',
        createdAt: observedAt,
        datasetId: file.datasetId,
        fileId: file.fileId,
        pieceCid: file.pieceCid,
        provider: file.provider,
        providerAddress: file.providerAddress,
        severity: 'info',
        metadata: {
          timestamp: 'refresh-observed',
          verificationStatus: file.verificationStatus ?? 'unknown',
        },
      });
    }
  }

  if (datasetsResult.status === 'rejected' || filesResult.status === 'rejected') {
    events.push({
      network: input.network,
      chainId: input.chainId,
      eventId: `chain-readback-warning-${observedAt}`,
      kind: 'readback-incomplete',
      title: 'Chain readback incomplete',
      detail: 'The app could not reconstruct every dataset or file row from the selected network during this refresh.',
      simulated: false,
      source: 'chain',
      createdAt: observedAt,
      severity: 'warning',
      metadata: {
        datasets: datasetsResult.status,
        files: filesResult.status,
      },
    });
  }

  return events.sort((left, right) => right.createdAt - left.createdAt);
}
