import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, FileText, ShieldCheck } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Sidebar, TopNavbar, type SidebarItemId } from './components/shell';
import { WalletControls } from './components/wallet';
import {
  HomePage,
  NetworkStatesPage,
  PasskeySessionPage,
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
  walletConnected: boolean;
  walletNetworkLabel: string;
  isWrongChain: boolean;
}): NetworkStateCard[] {
  const { selectedNetwork, p256State, walletConnected, walletNetworkLabel, isWrongChain } = input;
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
      title: 'Storage providers unavailable',
      detail: 'Provider readiness is represented separately so upload blocking remains actionable.',
      status: 'Readiness pending',
      primaryLabel: 'Synapse SDK probe',
      secondaryLabel: 'Sprint 4 live integration',
    },
    {
      variant: 'insufficient-funds',
      title: 'Insufficient payment balance',
      detail: 'Payments and storage runway must block live uploads before the passkey prompt.',
      status: 'Top-up required',
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
    };

    Promise.all([
      runtimeAdapters.storage.listDatasets(query),
      runtimeAdapters.storage.listFiles(query),
      runtimeAdapters.activity.listActivity(query),
    ]).then(([nextDatasets, nextFiles, nextActivity]) => {
      if (cancelled) {
        return;
      }

      setDatasets(nextDatasets);
      setFiles(nextFiles);
      setActivity(nextActivity);
    });

    return () => {
      cancelled = true;
    };
  }, [network, networkConfig.chainId, runtimeAdapters]);

  useEffect(() => {
    refreshPasskeyAuthorization(passkeyCredential);
  }, [network, passkeyCredential?.id, walletState.address]);

  const capabilities = useMemo(
    () =>
      getCapabilitiesForNetworkAndMode(network, runtimeMode, {
        p256Precompile: runtimeMode === 'simulation' ? 'available' : p256State,
        fwssP256Verifier:
          runtimeMode === 'simulation' ? 'available' : p256State === 'available' ? 'unknown' : 'unavailable',
        synapseStorage: runtimeMode === 'simulation' ? 'available' : 'unknown',
        providers: runtimeMode === 'simulation' ? 'available' : 'unknown',
        payments: runtimeMode === 'simulation' ? 'available' : 'unknown',
      }),
    [network, p256State, runtimeMode],
  );

  const p256Copy = p256StatusCopy(p256State);
  const p256Available = p256State === 'available';
  const simulationMode = runtimeMode === 'simulation';
  const uploadP256Copy = p256UploadCopy({ runtimeMode, p256Available });
  const providerAvailable = false;
  const uploadCtaState =
    simulationMode
      ? 'simulated'
      : runtimeMode === 'live' && p256Available && providerAvailable && walletState.isConnected && !walletState.isWrongChain
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
              label: `${networkConfig.nativeTokenSymbol} storage balance`,
              value: simulationMode ? '42.67 FIL' : 'Readiness pending',
              tone: simulationMode ? 'positive' : 'warning',
              hint: simulationMode ? 'Demo data: fixture balance.' : 'Live payment probe is scheduled for Sprint 4.',
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
            receiptState={simulationMode ? 'Demo data only' : p256Available ? 'Ready for live cutover' : 'Blocked'}
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
              walletConnected: walletState.isConnected,
              walletNetworkLabel: walletState.connectedNetworkLabel,
              isWrongChain: walletState.isWrongChain,
            })}
          />
        );
      case 'datasets':
        return (
          <PlaceholderPage
            title="Datasets"
            detail="Fixture-backed datasets are part of Sprint 5; the app shell route is ready."
          />
        );
      case 'files':
        return (
          <PlaceholderPage
            title="Files"
            detail="The global committed-files browser will use the same StorageAdapter boundary."
          />
        );
      case 'activity':
        return (
          <PlaceholderPage
            title="Activity"
            detail="The activity page will read chain-backed events or explicitly labeled fixture events."
          />
        );
      case 'payments':
        return (
          <PlaceholderPage
            title="Payments"
            detail="Payment readiness is represented in the capability model and will be wired to Synapse SDK probes."
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
              providerLabel: simulationMode ? 'Simulation only' : 'Live provider pending',
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
