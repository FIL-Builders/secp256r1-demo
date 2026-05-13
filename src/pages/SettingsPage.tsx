import {
  Activity,
  Globe2,
  RotateCcw,
  Settings,
  Wallet,
} from 'lucide-react';

import { NetworkToggle, RuntimeModeToggle } from '../components/shell';
import type { NetworkMode, RuntimeMode } from '../components/shell/types';

export interface WalletNetworkSummary {
  walletLabel: string;
  walletDetail: string;
  providerLabel: string;
  currentChainLabel: string;
  expectedNetworkLabel: string;
  p256StatusLabel: string;
}

export interface SettingsPageProps {
  defaultNetwork: NetworkMode;
  runtimeMode: RuntimeMode;
  walletNetworkSummary: WalletNetworkSummary;
  onDefaultNetworkChange: (network: NetworkMode) => void;
  onRuntimeModeChange: (mode: RuntimeMode) => void;
  onClearLocalPreferences: () => void;
}

export function SettingsPage({
  defaultNetwork,
  runtimeMode,
  walletNetworkSummary,
  onDefaultNetworkChange,
  onRuntimeModeChange,
  onClearLocalPreferences,
}: SettingsPageProps) {
  return (
    <main className="page page-settings">
      <section className="page-header">
        <div className="page-kicker">
          <Settings size={16} />
          <span>Settings</span>
        </div>
        <h1 className="page-title">Runtime preferences</h1>
        <p className="page-copy">
          These controls update local demo preferences only. Clearing them resets
          browser-stored defaults; it does not delete chain-backed uploads,
          payments, receipts, or verification records.
        </p>
      </section>

      <section className="page-grid page-grid-primary">
        <article className="info-card">
          <div className="info-card-head">
            <span className="info-card-label">
              <Globe2 size={16} />
              Default network
            </span>
            <strong>{networkLabel(defaultNetwork)}</strong>
          </div>
          <p className="info-card-copy">
            Pick the network preference the app should use when preparing flows.
            This is separate from any live wallet chain state.
          </p>
        </article>

        <article className={runtimeCardClassName(runtimeMode)}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Activity size={16} />
              Runtime mode
            </span>
            <strong>{runtimeLabel(runtimeMode)}</strong>
          </div>
          <p className="info-card-copy">
            {runtimeMode === 'simulation'
              ? 'Simulation Mode is explicit local behavior and does not imply live wallet connection.'
              : 'Runtime mode changes how the demo presents capability state and action availability.'}
          </p>
        </article>

        <article className="info-card">
          <div className="info-card-head">
            <span className="info-card-label">
              <Wallet size={16} />
              Wallet and network
            </span>
            <strong>{walletNetworkSummary.walletLabel}</strong>
          </div>
          <p className="info-card-copy">{walletNetworkSummary.walletDetail}</p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Default network</h2>
            <span className="panel-meta">{networkLabel(defaultNetwork)}</span>
          </div>
          <NetworkToggle value={defaultNetwork} onChange={onDefaultNetworkChange} />
          <p className="panel-copy">
            Mainnet is the preferred live target when support is available.
            Calibration keeps test and pending-network flows separated from
            production data.
          </p>
          <p className="panel-note">
            This preference does not switch a connected wallet; it only stores
            the app default used when preparing demo flows.
          </p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Runtime mode</h2>
            <span className="panel-meta">{runtimeLabel(runtimeMode)}</span>
          </div>
          <RuntimeModeToggle value={runtimeMode} onChange={onRuntimeModeChange} />
          <p className="panel-copy">
            Live mode requires the real provider, chain, and P256VERIFY path.
            Pending network shows the intended path without claiming support.
          </p>
          <p className="panel-note">
            Simulation Mode is local or fixture-backed behavior. It does not
            imply a live wallet connection or a chain receipt.
          </p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">State summary</h2>
            <span className="panel-meta">Read-only</span>
          </div>
          <dl className="status-list">
            <div className="status-row">
              <dt>Provider</dt>
              <dd>{walletNetworkSummary.providerLabel}</dd>
            </div>
            <div className="status-row">
              <dt>Current chain</dt>
              <dd>{walletNetworkSummary.currentChainLabel}</dd>
            </div>
            <div className="status-row">
              <dt>Expected network</dt>
              <dd>{walletNetworkSummary.expectedNetworkLabel}</dd>
            </div>
            <div className="status-row">
              <dt>P256VERIFY</dt>
              <dd>{walletNetworkSummary.p256StatusLabel}</dd>
            </div>
          </dl>
          <p className="panel-note">
            In Simulation Mode, these labels can describe fixture state. They
            should not be read as proof of a live wallet connection.
          </p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Local preferences</h2>
            <span className="panel-meta">Browser only</span>
          </div>
          <p className="panel-copy">
            Local preferences can include the selected network, runtime mode, and
            other browser-scoped defaults. Clearing them does not remove
            chain-backed data or undo submitted transactions.
          </p>
          <button type="button" className="primary-action is-warning" onClick={onClearLocalPreferences}>
            <RotateCcw size={16} />
            <span>Clear local preferences</span>
          </button>
          <p className="panel-note">
            Chain-backed data remains governed by the network where it was
            written, independent of this browser preference reset.
          </p>
        </article>
      </section>
    </main>
  );
}

function networkLabel(value: NetworkMode) {
  return value === 'mainnet' ? 'Mainnet' : 'Calibration';
}

function runtimeLabel(value: RuntimeMode) {
  if (value === 'pending-network') {
    return 'Pending network';
  }

  return value === 'simulation' ? 'Simulation Mode' : 'Live';
}

function runtimeCardClassName(value: RuntimeMode) {
  if (value === 'live') {
    return 'info-card is-live';
  }

  return value === 'pending-network' ? 'info-card is-pending' : 'info-card is-simulation';
}
