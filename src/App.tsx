import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Sidebar, TopNavbar, type SidebarItemId } from './components/shell';
import { WalletControls } from './components/wallet';
import {
  HomePage,
  ActivityPage,
  DatasetsPage,
  FilesPage,
  NetworkStatesPage,
  PasskeySessionPage,
  PaymentsPage,
  SettingsPage,
  UploadPage,
  type ActivityItem,
  type FileSummary as PageSummary,
  type NetworkStateCard,
} from './pages';
import {
  createRuntimeAdapters,
  clearStoredPreferences,
  createWalletViewState,
  createPasskeyCredential,
  getCapabilitiesForNetworkAndMode,
  getNetworkConfig,
  readStoredNetwork,
  readStoredRuntimeMode,
  readStoredPasskeyCredential,
  removeStoredPasskeyCredential,
  revokePasskeyAuthorization,
  getPasskeyAuthorization,
  isPasskeySupported,
  shortenAddress,
  simulatePasskeyAuthorization,
  summarizeCapabilityModel,
  testPasskeyCredential,
  type ActivityEvent,
  type CapabilityState,
  type DatasetSummary,
  type DemoNetwork,
  type DemoRuntimeMode,
  type FileSummary,
  type PasskeyAuthorizationRecord,
  type PasskeyProbeResult,
  type StorageReadiness,
  type StoredPasskeyCredential,
  writeStoredNetwork,
  writeStoredRuntimeMode,
} from './lib';

const INITIAL_NETWORK: DemoNetwork = 'calibration';
const INITIAL_MODE: DemoRuntimeMode = 'pending-network';

function formatBytes(value: number): string {
  if (value < 1_000_000) {
    return `${Math.round(value / 1_000)} KB`;
  }

  if (value < 1_000_000_000) {
    return `${(value / 1_000_000).toFixed(2)} MB`;
  }

  return `${(value / 1_000_000_000).toFixed(2)} GB`;
}

function formatTokenAmount(value: bigint | undefined): string {
  if (value == null) {
    return 'Readiness pending';
  }

  const whole = value / 1_000000000000000000n;
  const fraction = value % 1_000000000000000000n;
  const fractionText = fraction.toString().padStart(18, '0').slice(0, 3).replace(/0+$/, '');

  return fractionText ? `${whole.toLocaleString()}.${fractionText}` : whole.toLocaleString();
}

function formatShortTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function p256AvailabilityFromState(state: CapabilityState) {
  if (state === 'available') {
    return 'available';
  }

  if (state === 'error') {
    return 'unavailable';
  }

  return 'pending-network';
}

function p256StatusCopy(state: CapabilityState): {
  title: string;
  detail: string;
} {
  if (state === 'available') {
    return {
      title: 'P256VERIFY available',
      detail: 'The selected network returned 0x...01 for a valid P-256 detection vector.',
    };
  }

  if (state === 'error') {
    return {
      title: 'P256VERIFY probe failed',
      detail: 'The browser could not complete the capability probe, or the verifier returned an unexpected result.',
    };
  }

  if (state === 'unknown') {
    return {
      title: 'Checking P256VERIFY',
      detail: 'The app is probing 0x0100 with a known-good P-256 vector.',
    };
  }

  return {
    title: 'P256VERIFY unavailable',
    detail:
      'The selected network has not activated P256VERIFY at 0x0100, so passkey upload stays in Pending Network Mode.',
  };
}

function p256UploadCopy(input: {
  runtimeMode: DemoRuntimeMode;
  p256Available: boolean;
}): {
  title: string;
  detail: string;
} {
  if (input.runtimeMode === 'simulation') {
    return {
      title: 'Simulation verifier',
      detail:
        'Fixture verification is active for demo rehearsal only. This is not a live P256VERIFY result.',
    };
  }

  if (input.p256Available) {
    return {
      title: 'P256VERIFY available',
      detail: 'Verification can proceed as a live capability.',
    };
  }

  return {
    title: 'P256VERIFY unavailable',
    detail: 'P256VERIFY is not active here, so this flow must remain pending-network or simulation only.',
  };
}

function createRecentActivity(events: ActivityEvent[]): ActivityItem[] {
  return events.map((event) => ({
    id: event.eventId,
    title: event.title,
    detail: event.detail,
    timestamp: formatShortTime(event.createdAt),
    icon: event.kind === 'upload' ? <FileText size={14} /> : <ShieldCheck size={14} />,
  }));
}

function createDatasetSummaries(datasets: DatasetSummary[]): PageSummary[] {
  return datasets.map((dataset) => ({
    label: dataset.label,
    value: `${dataset.fileCount} files`,
    note: `${dataset.pieceCount} pieces from ${dataset.source} data`,
  }));
}

function createFileSummaries(files: FileSummary[]): PageSummary[] {
  return files.map((file) => ({
    label: file.name,
    value: formatBytes(file.size),
    note: `${file.mimeType} in ${file.source} mode`,
  }));
}

function createNetworkStateCards(input: {
  selectedNetwork: DemoNetwork;
  p256State: CapabilityState;
  providerState: CapabilityState;
  paymentState: CapabilityState;
  walletConnected: boolean;
  walletNetworkLabel: string;
  isWrongChain: boolean;
}): NetworkStateCard[] {
  const { selectedNetwork, p256State, providerState, paymentState, walletConnected, walletNetworkLabel, isWrongChain } = input;
  const p256Unavailable = p256State !== 'available';

  return [
    {
      variant: selectedNetwork === 'mainnet' && !p256Unavailable ? 'mainnet-ready' : 'mainnet-pending',
      title: 'Mainnet capability',
      detail:
        selectedNetwork === 'mainnet'
          ? 'Mainnet is selected. Passkey upload becomes live only after P256VERIFY and verifier deployment are available.'
          : 'Mainnet remains separately scoped. Calibration passkey authorization will not apply here.',
      status: selectedNetwork === 'mainnet' && !p256Unavailable ? 'Ready' : 'Pending',
      primaryLabel: 'Filecoin mainnet · 314',
      secondaryLabel: 'Separate passkey authorization required',
    },
    {
      variant: selectedNetwork === 'calibration' && !p256Unavailable ? 'calibration-ready' : 'calibration-pending',
      title: 'Calibration capability',
      detail:
        selectedNetwork === 'calibration'
          ? 'Calibration is the primary live target once P256VERIFY lands.'
          : 'Calibration state is available through the navbar toggle and does not leak into Mainnet.',
      status: selectedNetwork === 'calibration' && !p256Unavailable ? 'Ready' : 'Pending',
      primaryLabel: 'Filecoin testnet · 314159',
      secondaryLabel: 'Primary activation target',
    },
    {
      variant: 'wrong-chain',
      title: 'Wallet connected to wrong chain',
      detail: walletConnected
        ? `Wallet network: ${walletNetworkLabel}. Storage actions must stay disabled when the wallet chain and selected app network disagree.`
        : 'No wallet is connected. Live storage actions stay disabled until a root wallet is connected.',
      status: walletConnected ? (isWrongChain ? 'Blocked until switched' : 'Wallet matches app') : 'Wallet not connected',
      primaryLabel: 'Switch wallet network',
      secondaryLabel: 'Do not submit storage actions',
    },
    {
      variant: 'p256-unavailable',
      title: 'P256VERIFY unavailable',
      detail: p256Unavailable
        ? 'The current capability check does not return 0x...01 for a valid P-256 vector.'
        : 'The current capability check returned an available P256VERIFY result.',
      status: p256Unavailable ? 'Passkey upload disabled' : 'Available',
      primaryLabel: '0x0000000000000000000000000000000000000100',
      secondaryLabel: 'Activation gate',
    },
    {
      variant: 'provider-unavailable',
      title: providerState === 'available' ? 'Storage providers available' : 'Storage providers unavailable',
      detail:
        providerState === 'available'
          ? 'Synapse provider readiness is available for the selected network.'
          : 'Provider readiness is represented separately so upload blocking remains actionable.',
      status: providerState === 'available' ? 'Available' : providerState === 'error' ? 'Probe failed' : 'Readiness pending',
      primaryLabel: 'Synapse SDK probe',
      secondaryLabel: 'Network scoped',
    },
    {
      variant: 'insufficient-funds',
      title: paymentState === 'available' ? 'Payment account ready' : 'Payment readiness blocked',
      detail:
        paymentState === 'available'
          ? 'Payment deposit and Warm Storage approval checks passed for the selected root wallet.'
          : 'Payments and storage runway must block live uploads before the passkey prompt.',
      status: paymentState === 'available' ? 'Ready' : paymentState === 'error' ? 'Probe failed' : 'Top-up required',
      primaryLabel: 'Filecoin Pay readiness',
      secondaryLabel: 'Network scoped',
    },
  ];
}

function PlaceholderPage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="page">
      <section className="page-header">
        <p className="page-kicker">Sprint 1 placeholder</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{detail}</p>
      </section>
      <section className="callout">
        <AlertTriangle size={18} />
        <span>
          This route is intentionally present in the app shell. The full page will be implemented in later
          sprints using the same capability and adapter model.
        </span>
      </section>
    </main>
  );
}

export default function App() {
  const [network, setNetworkState] = useState<DemoNetwork>(() => readStoredNetwork(INITIAL_NETWORK));
  const [runtimeMode, setRuntimeModeState] = useState<DemoRuntimeMode>(() =>
    readStoredRuntimeMode(INITIAL_MODE),
  );
  const [activeItemId, setActiveItemId] = useState<SidebarItemId>('home');
  const [p256State, setP256State] = useState<CapabilityState>('unknown');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [storageReadiness, setStorageReadiness] = useState<StorageReadiness | null>(null);
  const [storageRefreshing, setStorageRefreshing] = useState(false);
  const [storageRefreshNonce, setStorageRefreshNonce] = useState(0);
  const [passkeyCredential, setPasskeyCredential] = useState<StoredPasskeyCredential | null>(() =>
    readStoredPasskeyCredential(),
  );
  const [passkeyAuthorization, setPasskeyAuthorization] = useState<PasskeyAuthorizationRecord | null>(null);
  const [passkeyTestResult, setPasskeyTestResult] = useState<PasskeyProbeResult | null>(null);
  const [passkeyBusyLabel, setPasskeyBusyLabel] = useState<string | undefined>();
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const account = useAccount();
  const { connect, connectors, error: connectError, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: switchPending } = useSwitchChain();

  const networkConfig = getNetworkConfig(network);
  const walletState = createWalletViewState({
    address: account.address,
    chainId: account.chainId,
    status: account.status,
    selectedNetwork: network,
  });
  const walletError = connectError?.message ?? switchError?.message ?? null;
  const walletShortAddress = shortenAddress(account.address);
  const primaryConnector = connectors[0];

  function handleNetworkChange(value: DemoNetwork) {
    setNetworkState(value);
    writeStoredNetwork(value);
  }

  function handleRuntimeModeChange(value: DemoRuntimeMode) {
    setRuntimeModeState(value);
    writeStoredRuntimeMode(value);
  }

  function handleClearLocalPreferences() {
    clearStoredPreferences();
    setNetworkState(INITIAL_NETWORK);
    setRuntimeModeState(INITIAL_MODE);
  }

  function handleConnectWallet() {
    if (!primaryConnector) {
      return;
    }

    connect({
      connector: primaryConnector,
      chainId: networkConfig.chainId,
    });
  }

  function handleSwitchNetwork() {
    switchChain({
      chainId: networkConfig.chainId,
    });
  }

  function refreshPasskeyAuthorization(credential = passkeyCredential) {
    setPasskeyAuthorization(
      getPasskeyAuthorization({
        credentialId: credential?.id,
        network,
        rootAddress: walletState.address,
      }),
    );
  }

  async function handleCreatePasskey() {
    setPasskeyBusyLabel('Creating passkey');
    setPasskeyError(null);
    try {
      const credential = await createPasskeyCredential({
        rootAddress: walletState.address,
        label: 'This device passkey',
      });
      setPasskeyCredential(credential);
      setPasskeyTestResult(null);
      refreshPasskeyAuthorization(credential);
    } catch (error) {
      setPasskeyError(error instanceof Error ? error.message : 'Unable to create passkey.');
    } finally {
      setPasskeyBusyLabel(undefined);
    }
  }

  async function handleTestPasskey() {
    if (!passkeyCredential) {
      return;
    }

    setPasskeyBusyLabel('Testing assertion');
    setPasskeyError(null);
    try {
      const result = await testPasskeyCredential({ credential: passkeyCredential });
      setPasskeyTestResult(result);
    } catch (error) {
      setPasskeyError(error instanceof Error ? error.message : 'Unable to test passkey assertion.');
    } finally {
      setPasskeyBusyLabel(undefined);
    }
  }

  function handleSimulatePasskeyAuthorization() {
    if (!passkeyCredential) {
      return;
    }

    if (!walletState.address) {
      setPasskeyError('Connect a root wallet before simulating passkey authorization.');
      return;
    }

    if (walletState.isWrongChain) {
      setPasskeyError(`Switch the wallet to ${networkConfig.label} before simulating passkey authorization.`);
      return;
    }

    setPasskeyError(null);
    const record = simulatePasskeyAuthorization({
      credential: passkeyCredential,
      network,
      rootAddress: walletState.address,
    });
    setPasskeyAuthorization(record);
  }

  function handleRevokePasskeyAuthorization() {
    if (!passkeyCredential || !walletState.address) {
      return;
    }

    const record = revokePasskeyAuthorization({
      credentialId: passkeyCredential.id,
      network,
      rootAddress: walletState.address,
    });
    setPasskeyAuthorization(record);
  }

  function handleRemovePasskey() {
    removeStoredPasskeyCredential();
    setPasskeyCredential(null);
    setPasskeyAuthorization(null);
    setPasskeyTestResult(null);
  }

  function handleRefreshStorageReadiness() {
    setStorageRefreshNonce((value) => value + 1);
  }

  const runtimeAdapters = useMemo(
    () =>
      createRuntimeAdapters({
        network,
        chainId: networkConfig.chainId,
        mode: runtimeMode,
        rpcUrl: networkConfig.rpcUrl,
      }),
    [network, networkConfig.chainId, networkConfig.rpcUrl, runtimeMode],
  );

  useEffect(() => {
    let cancelled = false;

    if (runtimeMode === 'simulation') {
      setP256State('available');
      return () => {
        cancelled = true;
      };
    }

    setP256State('unknown');

    runtimeAdapters.verifier
      .detect(networkConfig.chainId)
      .then((state) => {
        if (cancelled) {
          return;
        }

        setP256State(state);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setP256State('error');
      });

    return () => {
      cancelled = true;
    };
  }, [networkConfig.chainId, runtimeAdapters.verifier, runtimeMode]);

  useEffect(() => {
    let cancelled = false;
    const query = {
      network,
      chainId: networkConfig.chainId,
      rootAddress: walletState.address,
    };

    setStorageRefreshing(true);
    Promise.all([
      runtimeAdapters.storage.readiness(networkConfig.chainId, walletState.address),
      runtimeAdapters.storage.listDatasets(query),
      runtimeAdapters.storage.listFiles(query),
      runtimeAdapters.activity.listActivity(query),
    ])
      .then(([nextReadiness, nextDatasets, nextFiles, nextActivity]) => {
        if (cancelled) {
          return;
        }

        setStorageReadiness(nextReadiness);
        setDatasets(nextDatasets);
        setFiles(nextFiles);
        setActivity(nextActivity);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setStorageReadiness({
          network,
          chainId: networkConfig.chainId,
          state: 'error',
          simulated: false,
          blockers: [
            {
              code: 'synapse-readiness-refresh-failed',
              scope: 'storage',
              severity: 'warning',
              title: 'Synapse readiness refresh failed',
              message: 'The app could not refresh provider, payment, or dataset readiness for this network.',
            },
          ],
          checkedAt: Date.now(),
          summary: 'Synapse readiness refresh failed.',
          provider: {
            state: 'error',
            activeProviderCount: null,
            totalProviderCount: null,
            error: 'Refresh failed',
          },
          payment: {
            state: 'error',
            ready: false,
            error: 'Refresh failed',
          },
          sampleUploadSizeBytes: 1_048_576,
        });
        setDatasets([]);
        setFiles([]);
        setActivity([]);
      })
      .finally(() => {
        if (!cancelled) {
          setStorageRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [network, networkConfig.chainId, runtimeAdapters, storageRefreshNonce, walletState.address]);

  useEffect(() => {
    refreshPasskeyAuthorization(passkeyCredential);
  }, [network, passkeyCredential?.id, walletState.address]);

  const simulationMode = runtimeMode === 'simulation';
  const providerState = simulationMode ? 'available' : (storageReadiness?.provider.state ?? 'unknown');
  const paymentState = simulationMode ? 'available' : (storageReadiness?.payment.state ?? 'unknown');
  const storageState = simulationMode ? 'available' : (storageReadiness?.state ?? 'unknown');
  const capabilities = useMemo(
    () =>
      getCapabilitiesForNetworkAndMode(network, runtimeMode, {
        p256Precompile: runtimeMode === 'simulation' ? 'available' : p256State,
        fwssP256Verifier:
          runtimeMode === 'simulation' ? 'available' : p256State === 'available' ? 'unknown' : 'unavailable',
        synapseStorage: storageState,
        providers: providerState,
        payments: paymentState,
        blockers: storageReadiness?.blockers,
        checkedAt: storageReadiness?.checkedAt,
      }),
    [network, p256State, providerState, paymentState, runtimeMode, storageReadiness?.blockers, storageReadiness?.checkedAt, storageState],
  );

  const p256Copy = p256StatusCopy(p256State);
  const p256Available = p256State === 'available';
  const uploadP256Copy = p256UploadCopy({ runtimeMode, p256Available });
  const providerAvailable = providerState === 'available';
  const liveUploadFlowReady = false;
  const uploadCtaState =
    simulationMode
      ? 'simulated'
      : runtimeMode === 'live' &&
          liveUploadFlowReady &&
          p256Available &&
          providerAvailable &&
          paymentState === 'available' &&
          walletState.isConnected &&
          !walletState.isWrongChain
        ? 'live'
        : 'disabled';
  const passkeyAvailability = simulationMode ? 'simulation' : p256AvailabilityFromState(p256State);
  const showVerificationChecks = runtimeMode === 'simulation';
  const walletNotice = walletState.isConnected
    ? walletState.isWrongChain
      ? {
          title: 'Wallet chain mismatch.',
          detail: `Switch the wallet from ${walletState.connectedNetworkLabel} to ${walletState.selectedNetworkLabel} before live storage actions.`,
          tone: 'warning' as const,
        }
      : {
          title: 'Wallet network matches.',
          detail: `${walletShortAddress} is connected to ${walletState.connectedNetworkLabel}.`,
          tone: 'success' as const,
        }
    : {
        title: 'Wallet not connected.',
        detail: 'Live storage actions require a connected root wallet. Simulation Mode can still be explored.',
        tone: 'neutral' as const,
      };

  const page = (() => {
    switch (activeItemId) {
      case 'home':
        return (
          <HomePage
            runtimeMode={runtimeMode}
            networkLabel={networkConfig.label}
            walletNotice={walletNotice}
            storage={{
              label: 'USDFC storage balance',
              value: simulationMode ? '42.67' : formatTokenAmount(storageReadiness?.payment.availableFunds),
              tone: simulationMode || paymentState === 'available' ? 'positive' : 'warning',
              hint: simulationMode
                ? 'Demo data: fixture balance.'
                : storageReadiness?.summary ?? 'Connect a root wallet to check live payment readiness.',
            }}
            passkeyUpload={{
              status: simulationMode ? 'Simulation available' : p256Copy.title,
              detail: simulationMode
                ? 'Fixture verifier and storage adapters are active.'
                : summarizeCapabilityModel(capabilities),
              verified: p256Available && runtimeMode === 'live',
            }}
            recentActivity={createRecentActivity(activity)}
            datasets={createDatasetSummaries(datasets)}
            files={createFileSummaries(files)}
          />
        );
      case 'upload':
        return (
          <UploadPage
            runtimeMode={runtimeMode}
            p256Available={p256Available}
            providerAvailable={providerAvailable}
            walletConnected={walletState.isConnected}
            chainMismatch={walletState.isWrongChain}
            switchNetworkPending={switchPending}
            currentChainLabel={walletState.connectedNetworkLabel}
            expectedNetworkLabel={networkConfig.label}
            statusTitle={simulationMode ? 'Simulation flow ready' : p256Copy.title}
            statusDetail={
              simulationMode
                ? 'This upload flow uses fixture adapters and cannot claim live on-chain verification.'
                : p256Copy.detail
            }
            receiptLabel={simulationMode ? 'Simulation receipt' : 'No live receipt yet'}
            receiptState={
              simulationMode
                ? 'Demo data only'
                : p256Available && providerAvailable
                  ? 'Readiness checks available'
                  : 'Blocked'
            }
            ctaState={uploadCtaState}
            onSwitchNetwork={walletState.isConnected ? handleSwitchNetwork : undefined}
            p256StatusTitle={uploadP256Copy.title}
            p256StatusDetail={uploadP256Copy.detail}
          />
        );
      case 'network-states':
        return (
          <NetworkStatesPage
            states={createNetworkStateCards({
              selectedNetwork: network,
              p256State,
              providerState,
              paymentState,
              walletConnected: walletState.isConnected,
              walletNetworkLabel: walletState.connectedNetworkLabel,
              isWrongChain: walletState.isWrongChain,
            })}
          />
        );
      case 'datasets':
        return (
          <DatasetsPage
            networkLabel={networkConfig.label}
            chainId={networkConfig.chainId}
            runtimeMode={runtimeMode}
            walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
            walletConnected={walletState.isConnected}
            datasets={datasets}
            files={files}
            refreshing={storageRefreshing}
            explorerUrl={networkConfig.explorerUrl}
            onRefresh={handleRefreshStorageReadiness}
          />
        );
      case 'files':
        return (
          <FilesPage
            networkLabel={networkConfig.label}
            chainId={networkConfig.chainId}
            runtimeMode={runtimeMode}
            walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
            walletConnected={walletState.isConnected}
            datasets={datasets}
            files={files}
            refreshing={storageRefreshing}
            explorerUrl={networkConfig.explorerUrl}
            onRefresh={handleRefreshStorageReadiness}
            onUpload={() => setActiveItemId('upload')}
          />
        );
      case 'activity':
        return (
          <ActivityPage
            networkLabel={networkConfig.label}
            chainId={networkConfig.chainId}
            runtimeMode={runtimeMode}
            walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
            walletConnected={walletState.isConnected}
            activity={activity}
            refreshing={storageRefreshing}
            explorerUrl={networkConfig.explorerUrl}
            onRefresh={handleRefreshStorageReadiness}
          />
        );
      case 'payments':
        return (
          <PaymentsPage
            networkLabel={networkConfig.label}
            nativeTokenSymbol={networkConfig.nativeTokenSymbol}
            runtimeMode={runtimeMode}
            walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
            walletConnected={walletState.isConnected}
            readiness={storageReadiness}
            refreshing={storageRefreshing}
            onRefresh={handleRefreshStorageReadiness}
          />
        );
      case 'passkey-session':
        return (
          <PasskeySessionPage
            runtimeMode={runtimeMode}
            network={network}
            networkLabel={networkConfig.label}
            walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
            walletConnected={walletState.isConnected}
            walletReady={walletState.isConnected && !walletState.isWrongChain && Boolean(walletState.address)}
            walletRequirementDetail={
              walletState.isConnected
                ? walletState.isWrongChain
                  ? `Switch the wallet to ${networkConfig.label} before authorizing this device.`
                  : 'Root wallet is connected and scoped to this network.'
                : 'Connect a root wallet before authorizing this device.'
            }
            p256Available={p256Available}
            passkeySupported={isPasskeySupported()}
            credential={passkeyCredential}
            authorization={passkeyAuthorization}
            testResult={passkeyTestResult}
            busyLabel={passkeyBusyLabel}
            error={passkeyError}
            onCreatePasskey={handleCreatePasskey}
            onTestPasskey={handleTestPasskey}
            onSimulateAuthorize={handleSimulatePasskeyAuthorization}
            onRevokeAuthorization={handleRevokePasskeyAuthorization}
            onRemovePasskey={handleRemovePasskey}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            defaultNetwork={network}
            runtimeMode={runtimeMode}
            walletNetworkSummary={{
              walletLabel: walletState.isConnected ? walletShortAddress : 'Not connected',
              walletDetail: walletState.isConnected
                ? walletState.isWrongChain
                  ? `Wallet is on ${walletState.connectedNetworkLabel}, but the app expects ${walletState.selectedNetworkLabel}.`
                  : `Wallet is connected to ${walletState.connectedNetworkLabel}.`
                : 'No root wallet is connected. Simulation Mode does not imply wallet ownership.',
              providerLabel: simulationMode
                ? 'Simulation only'
                : providerState === 'available'
                  ? 'Live providers available'
                  : 'Live provider pending',
              currentChainLabel: walletState.connectedNetworkLabel,
              expectedNetworkLabel: walletState.selectedNetworkLabel,
              p256StatusLabel: simulationMode ? 'Simulation label' : p256Copy.title,
            }}
            onDefaultNetworkChange={handleNetworkChange}
            onRuntimeModeChange={handleRuntimeModeChange}
            onClearLocalPreferences={handleClearLocalPreferences}
          />
        );
      case 'verification-checks':
        return (
          <PlaceholderPage
            title="Verification Checks"
            detail="Developer verification checks are intentionally gated behind Simulation Mode for now."
          />
        );
    }
  })();

  return (
    <div className="app-shell">
      <Sidebar
        activeItemId={activeItemId}
        onNavigate={setActiveItemId}
        showVerificationChecks={showVerificationChecks}
        network={network}
        onNetworkChange={handleNetworkChange}
        runtimeMode={runtimeMode}
        onRuntimeModeChange={handleRuntimeModeChange}
        storageBalance={{
          value: simulationMode ? '42.67 USDFC' : `${formatTokenAmount(storageReadiness?.payment.availableFunds)} USDFC`,
          detail: simulationMode
            ? 'Demo data: fixture storage funds.'
            : storageReadiness?.summary ?? 'Connect a Root Wallet to check funds.',
        }}
        walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
        walletConnected={walletState.isConnected}
      />
      <div className="app-main">
        <TopNavbar
          network={network}
          onNetworkChange={handleNetworkChange}
          runtimeMode={runtimeMode}
          onRuntimeModeChange={handleRuntimeModeChange}
          passkeyUploadAvailability={passkeyAvailability}
          walletLabel={walletState.isConnected ? walletShortAddress : 'Not connected'}
          passkeySessionLabel={simulationMode ? 'Simulation active' : 'Pending'}
          showVerificationChecks={showVerificationChecks}
          walletControls={
            <WalletControls
              isConnected={walletState.isConnected}
              isConnecting={walletState.isConnecting || connectPending}
              isSwitchingNetwork={switchPending}
              shortAddress={walletShortAddress}
              selectedNetworkLabel={walletState.selectedNetworkLabel}
              walletNetworkLabel={walletState.connectedNetworkLabel}
              hasChainMismatch={walletState.isWrongChain}
              error={walletError}
              onConnect={handleConnectWallet}
              onDisconnect={() => disconnect()}
              onSwitchNetwork={handleSwitchNetwork}
            />
          }
        />
        {page}
      </div>
    </div>
  );
}
