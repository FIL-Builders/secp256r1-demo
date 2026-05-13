import {
  AlertTriangle,
  CloudUpload,
  Construction,
  Network,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { RuntimeMode } from './HomePage';

export type UploadCtaState = 'disabled' | 'live' | 'simulated';

export interface UploadPageProps {
  runtimeMode: RuntimeMode;
  p256Available: boolean;
  providerAvailable: boolean;
  walletConnected: boolean;
  chainMismatch: boolean;
  switchNetworkPending?: boolean;
  currentChainLabel: string;
  expectedNetworkLabel: string;
  statusTitle: string;
  statusDetail: string;
  receiptLabel: string;
  receiptState: string;
  ctaState: UploadCtaState;
  onSwitchNetwork?: () => void;
  p256StatusTitle?: string;
  p256StatusDetail?: string;
}

const ctaMeta: Record<
  UploadCtaState,
  { label: string; tone: string; icon: LucideIcon; disabled: boolean }
> = {
  disabled: { label: 'Upload unavailable', tone: 'is-disabled', icon: Construction, disabled: true },
  live: { label: 'Upload to chain', tone: 'is-live', icon: CloudUpload, disabled: false },
  simulated: { label: 'Run simulation', tone: 'is-simulation', icon: Sparkles, disabled: false },
};

const runtimeCopy: Record<RuntimeMode, string> = {
  live: 'Live mode can claim on-chain verification when the capability is actually present.',
  'pending-network':
    'Pending-network mode is honest about missing P256VERIFY. It can prepare the upload flow, but it cannot promise live on-chain verification.',
  simulation:
    'Simulation mode should read as a local or fixture-backed run. It must not imply a live chain receipt.',
};

export function UploadPage({
  runtimeMode,
  p256Available,
  providerAvailable,
  walletConnected,
  chainMismatch,
  switchNetworkPending = false,
  currentChainLabel,
  expectedNetworkLabel,
  statusTitle,
  statusDetail,
  receiptLabel,
  receiptState,
  ctaState,
  onSwitchNetwork,
  p256StatusTitle,
  p256StatusDetail,
}: UploadPageProps) {
  const cta = ctaMeta[ctaState];
  const CtaIcon = cta.icon;
  const canUpload = !cta.disabled;
  const providerStatus = runtimeMode === 'simulation' ? 'Simulated' : providerAvailable ? 'Connected' : 'Unavailable';
  const providerCopy =
    runtimeMode === 'simulation'
      ? 'Fixture provider readiness is active for demo mode. No real wallet or provider connection is implied.'
      : providerAvailable
        ? 'A live provider connection is present.'
        : 'No live provider is attached, so the action should stay disabled.';

  return (
    <main className="page page-upload">
      <section className="page-header">
        <div className="page-kicker">
          <CloudUpload size={16} />
          <span>Upload</span>
        </div>
        <h1 className="page-title">Passkey upload</h1>
        <p className="page-copy">{runtimeCopy[runtimeMode]}</p>
      </section>

      <section className="page-grid page-grid-primary">
        <article className={`info-card ${cta.tone}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Network size={16} />
              Capability mode
            </span>
            <strong>{runtimeMode}</strong>
          </div>
          <p className="info-card-copy">
            Expected network: {expectedNetworkLabel}. Current chain: {currentChainLabel}.
          </p>
        </article>

        <article className="info-card">
          <div className="info-card-head">
            <span className="info-card-label">
              <ShieldAlert size={16} />
              P256VERIFY
            </span>
            <strong>{p256StatusTitle ?? (p256Available ? 'Available' : 'Unavailable')}</strong>
          </div>
          <p className="info-card-copy">
            {p256StatusDetail ??
              (p256Available
                ? 'Verification can proceed as a live capability.'
                : 'P256VERIFY is not active here, so this flow must remain pending-network or simulation only.')}
          </p>
        </article>

        <article className="info-card">
          <div className="info-card-head">
            <span className="info-card-label">
              <AlertTriangle size={16} />
              Provider
            </span>
            <strong>{providerStatus}</strong>
          </div>
          <p className="info-card-copy">{providerCopy}</p>
        </article>
      </section>

      {!walletConnected ? (
        <section className="callout warning">
          <AlertTriangle size={18} />
          <span>
            <strong>Wallet required for live uploads.</strong> Connect a root wallet before passkey-backed
            storage actions can run outside Simulation Mode.
          </span>
        </section>
      ) : null}

      {chainMismatch ? (
        <section className="callout warning">
          <AlertTriangle size={18} />
          <span>
            <strong>Wallet chain mismatch.</strong> The app is set to {expectedNetworkLabel}, but the wallet is on{' '}
            {currentChainLabel}. Storage actions remain disabled until they match.
          </span>
          {onSwitchNetwork ? (
            <button type="button" className="secondary-button" onClick={onSwitchNetwork} disabled={switchNetworkPending}>
              {switchNetworkPending ? 'Switching network' : `Switch to ${expectedNetworkLabel}`}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Status</h2>
            <span className="panel-meta">{statusTitle}</span>
          </div>
          <p className="panel-copy">{statusDetail}</p>
          <dl className="status-list">
            <div className="status-row">
              <dt>Receipt</dt>
              <dd>{receiptLabel}</dd>
            </div>
            <div className="status-row">
              <dt>State</dt>
              <dd>{receiptState}</dd>
            </div>
          </dl>
          <p className="panel-note">
            {runtimeMode === 'simulation'
              ? 'Simulation status can confirm local behavior, but it should never claim on-chain verified.'
              : 'Any verified state shown here must come from a real capability path.'}
          </p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Action</h2>
            <span className="panel-meta">{ctaState}</span>
          </div>
          <button className={`primary-action ${cta.tone}`} disabled={!canUpload}>
            <CtaIcon size={16} />
            <span>{cta.label}</span>
          </button>
          <p className="panel-note">
            {ctaState === 'disabled'
              ? 'The CTA is intentionally disabled until the required capability or provider state is present.'
              : ctaState === 'simulated'
                ? 'Simulation keeps the flow interactive while staying explicit that the result is not live on-chain verification.'
                : 'Live mode can be enabled only when the real capability path is available.'}
          </p>
        </article>
      </section>
    </main>
  );
}
