import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, FileText, ShieldCheck } from 'lucide-react';
import { Sidebar, TopNavbar, type SidebarItemId } from './components/shell';
import {
  HomePage,
  NetworkStatesPage,
  UploadPage,
  type ActivityItem,
  type FileSummary as PageSummary,
  type NetworkStateCard,
} from './pages';
import {
  createRuntimeAdapters,
  getCapabilitiesForNetworkAndMode,
  getNetworkConfig,
  summarizeCapabilityModel,
  type ActivityEvent,
  type CapabilityState,
  type DatasetSummary,
  type DemoNetwork,
  type DemoRuntimeMode,
  type FileSummary,
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

function createNetworkStateCards(selectedNetwork: DemoNetwork, p256State: CapabilityState): NetworkStateCard[] {
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
      detail: 'Storage actions must stay disabled when the wallet chain and selected app network disagree.',
      status: 'Blocked until switched',
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
  const [network, setNetwork] = useState<DemoNetwork>(INITIAL_NETWORK);
  const [runtimeMode, setRuntimeMode] = useState<DemoRuntimeMode>(INITIAL_MODE);
  const [activeItemId, setActiveItemId] = useState<SidebarItemId>('home');
  const [p256State, setP256State] = useState<CapabilityState>('unknown');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const networkConfig = getNetworkConfig(network);
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
  }, [networkConfig.chainId, runtimeAdapters.verifier]);

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
  const providerAvailable = false;
  const uploadCtaState =
    simulationMode ? 'simulated' : runtimeMode === 'live' && p256Available && providerAvailable ? 'live' : 'disabled';
  const passkeyAvailability = simulationMode ? 'simulation' : p256AvailabilityFromState(p256State);
  const showVerificationChecks = runtimeMode === 'simulation';

  const page = (() => {
    switch (activeItemId) {
      case 'home':
        return (
          <HomePage
            runtimeMode={runtimeMode}
            networkLabel={networkConfig.label}
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
            currentChainLabel={networkConfig.label}
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
          />
        );
      case 'network-states':
        return <NetworkStatesPage states={createNetworkStateCards(network, p256State)} />;
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
          <PlaceholderPage
            title="Passkey Session"
            detail="Browser WebAuthn session creation is the next Milestone 0 probe."
          />
        );
      case 'settings':
        return (
          <PlaceholderPage
            title="Settings"
            detail="Settings will manage default network, runtime mode, local labels, and cache controls."
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
          onNetworkChange={setNetwork}
          runtimeMode={runtimeMode}
          onRuntimeModeChange={setRuntimeMode}
          passkeyUploadAvailability={passkeyAvailability}
          walletLabel={simulationMode ? 'Demo wallet' : 'Wallet pending'}
          passkeySessionLabel={simulationMode ? 'Simulation active' : 'Pending'}
          showVerificationChecks={showVerificationChecks}
        />
        {page}
      </div>
    </div>
  );
}
