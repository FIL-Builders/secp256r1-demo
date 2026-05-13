export type Hex = `0x${string}`;

export type Address = Hex;

export type DemoNetwork = 'mainnet' | 'calibration';

export type DemoRuntimeMode = 'live' | 'pending-network' | 'simulation';

export type CapabilityState = 'unknown' | 'available' | 'unavailable' | 'error';

export type CapabilitySeverity = 'info' | 'warning' | 'error';

export type CapabilityScope =
  | 'runtime'
  | 'network'
  | 'precompile'
  | 'verifier'
  | 'storage'
  | 'activity'
  | 'payments'
  | 'providers';

export interface CapabilityBlocker {
  code: string;
  scope: CapabilityScope;
  severity: CapabilitySeverity;
  title: string;
  message: string;
  simulated?: boolean;
}

export interface NetworkConfig {
  key: DemoNetwork;
  label: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  p256VerifierAddress: Address;
  nativeTokenSymbol: string;
}

export interface NetworkCapabilities {
  chainId: number;
  network: DemoNetwork;
  mode: DemoRuntimeMode;
  p256Precompile: CapabilityState;
  fwssP256Verifier: CapabilityState;
  synapseStorage: CapabilityState;
  providers: CapabilityState;
  payments: CapabilityState;
  blockers: CapabilityBlocker[];
  checkedAt: number;
}

export interface CapabilityOverrides {
  checkedAt?: number;
  p256Precompile?: CapabilityState;
  fwssP256Verifier?: CapabilityState;
  synapseStorage?: CapabilityState;
  providers?: CapabilityState;
  payments?: CapabilityState;
  blockers?: readonly CapabilityBlocker[];
}

export interface P256DetectionVector {
  message: string;
  messageHash: Hex;
  validCalldata: Hex;
  invalidCalldata: Hex;
  publicKey: {
    x: Hex;
    y: Hex;
  };
  signature: {
    r: Hex;
    s: Hex;
  };
}

export interface P256PrecompileDetectionResult {
  chainId: number;
  network: DemoNetwork;
  rpcUrl: string;
  precompileAddress: Address;
  checkedAt: number;
  observedChainId: number | null;
  validResult: Hex;
  invalidResult: Hex;
  state: CapabilityState;
  summary: string;
  vector: P256DetectionVector;
}

export interface P256VerifyInput {
  chainId: number;
  network: DemoNetwork;
  calldata: Hex;
  blockTag?: 'latest' | Hex;
  label?: string;
}

export type P256VerifyOutcome =
  | 'verified'
  | 'rejected'
  | 'simulated-verified'
  | 'simulated-rejected'
  | 'error';

export interface P256VerifyResult {
  chainId: number;
  network: DemoNetwork;
  outcome: P256VerifyOutcome;
  accepted: boolean;
  simulated: boolean;
  rawResult: Hex;
  checkedAt: number;
  summary: string;
  details?: string;
}

export interface P256VerifierAdapter {
  detect(chainId: number): Promise<CapabilityState>;
  verify(input: P256VerifyInput): Promise<P256VerifyResult>;
}

export interface ChainScopedQuery {
  network: DemoNetwork;
  chainId: number;
  rootAddress?: Address;
  datasetId?: string;
}

export interface StorageReadiness {
  network: DemoNetwork;
  chainId: number;
  state: CapabilityState;
  simulated: boolean;
  blockers: CapabilityBlocker[];
  checkedAt: number;
  summary: string;
  provider: StorageProviderReadiness;
  payment: StoragePaymentReadiness;
  sampleUploadSizeBytes: number;
}

export interface StorageProviderReadiness {
  state: CapabilityState;
  activeProviderCount: number | null;
  totalProviderCount: number | null;
  error?: string;
}

export interface StoragePaymentReadiness {
  state: CapabilityState;
  ready: boolean;
  accountFunds?: bigint;
  availableFunds?: bigint;
  lockupCurrent?: bigint;
  lockupRate?: bigint;
  walletFilBalance?: bigint;
  walletUsdfcBalance?: bigint;
  depositNeeded?: bigint;
  ratePerEpoch?: bigint;
  ratePerMonth?: bigint;
  needsServiceApproval?: boolean;
  serviceApproved?: boolean;
  error?: string;
}

export interface StorageUploadFile {
  name: string;
  size: number;
  mimeType?: string;
  pieceCid?: string;
}

export interface StorageUploadInput {
  network: DemoNetwork;
  chainId: number;
  rootAddress: Address;
  datasetLabel: string;
  files: readonly StorageUploadFile[];
  mode: DemoRuntimeMode;
  memo?: string;
}

export interface StorageUploadReceipt {
  network: DemoNetwork;
  chainId: number;
  receiptMode: 'on-chain' | 'simulation';
  simulated: boolean;
  datasetId: string;
  pieceCids: readonly string[];
  provider: string;
  transactionHash?: Hex;
  title: string;
  summary: string;
  createdAt: number;
  labels: readonly string[];
}

export type ChainDataSource = 'chain' | 'simulation';

export type VerificationStatus = 'verified' | 'pending' | 'failed' | 'unknown';

export type PaymentRailStatus = 'paid' | 'due-soon' | 'past-due' | 'unknown' | 'not-applicable';

export interface StorageAdapter {
  readiness(chainId: number, rootAddress?: Address): Promise<StorageReadiness>;
  upload(input: StorageUploadInput): Promise<StorageUploadReceipt>;
  listDatasets(input: ChainScopedQuery): Promise<DatasetSummary[]>;
  listFiles(input: ChainScopedQuery): Promise<FileSummary[]>;
}

export interface DatasetSummary {
  network: DemoNetwork;
  chainId: number;
  datasetId: string;
  label: string;
  fileCount: number;
  pieceCount: number;
  source: ChainDataSource;
  createdAt: number;
  clientDatasetId?: string;
  visibility?: 'private' | 'public' | 'unknown';
  provider?: string;
  providerAddress?: Address;
  totalSize?: number;
  paymentRailStatus?: PaymentRailStatus;
  proofStatus?: VerificationStatus;
  lastActivityAt?: number;
  transactionHash?: Hex;
  explorerUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface FileSummary {
  network: DemoNetwork;
  chainId: number;
  fileId: string;
  datasetId: string;
  name: string;
  size: number;
  mimeType: string;
  source: ChainDataSource;
  createdAt: number;
  datasetLabel?: string;
  provider?: string;
  providerAddress?: Address;
  pieceCid?: string;
  transactionHash?: Hex;
  explorerUrl?: string;
  retrievalUrl?: string;
  verificationStatus?: VerificationStatus;
  authorizationStatus?: 'passkey-protected' | 'wallet-authorized' | 'unknown';
  proofDeadline?: number;
  verifiedAt?: number;
  modifiedAt?: number;
  metadata?: Record<string, string | number | boolean>;
}

export type ActivityKind =
  | 'upload'
  | 'verification'
  | 'verification-failed'
  | 'readback-incomplete'
  | 'dataset-created'
  | 'dataset-indexed'
  | 'piece-added'
  | 'file-indexed'
  | 'session-authorized'
  | 'session-revoked'
  | 'payment-approved'
  | 'network-switched';

export interface ActivityEvent {
  network: DemoNetwork;
  chainId: number;
  eventId: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  simulated: boolean;
  source: ChainDataSource;
  createdAt: number;
  datasetId?: string;
  fileId?: string;
  pieceCid?: string;
  provider?: string;
  providerAddress?: Address;
  transactionHash?: Hex;
  explorerUrl?: string;
  amountLabel?: string;
  actor?: string;
  severity?: CapabilitySeverity;
  metadata?: Record<string, string | number | boolean>;
}

export interface ActivityAdapter {
  listActivity(input: ChainScopedQuery): Promise<ActivityEvent[]>;
}
