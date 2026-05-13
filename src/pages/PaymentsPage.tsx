import { AlertTriangle, CheckCircle2, CreditCard, DatabaseZap, RefreshCw, Server } from 'lucide-react';

import type { DemoRuntimeMode, StorageReadiness } from '../lib';

export interface PaymentsPageProps {
  networkLabel: string;
  nativeTokenSymbol: string;
  runtimeMode: DemoRuntimeMode;
  walletLabel: string;
  walletConnected: boolean;
  readiness: StorageReadiness | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export function PaymentsPage({
  networkLabel,
  nativeTokenSymbol,
  runtimeMode,
  walletLabel,
  walletConnected,
  readiness,
  refreshing,
  onRefresh,
}: PaymentsPageProps) {
  const provider = readiness?.provider;
  const payment = readiness?.payment;
  const ready = readiness?.state === 'available';

  return (
    <main className="page page-payments">
      <section className="page-header page-header-with-actions">
        <div>
          <div className="page-kicker">
            <CreditCard size={16} />
            <span>Payments And Readiness</span>
          </div>
          <h1 className="page-title">Storage funding</h1>
          <p className="page-copy">
            Payment, approval, and provider checks are scoped to {networkLabel} and the connected root wallet.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} />
          <span>{refreshing ? 'Checking' : 'Refresh'}</span>
        </button>
      </section>

      <section className="page-grid page-grid-primary">
        <article className={`info-card ${ready ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <CheckCircle2 size={16} />
              Upload readiness
            </span>
            <strong>{readinessLabel(readiness?.state)}</strong>
          </div>
          <p className="info-card-copy">
            {readiness?.summary ?? 'Connect a wallet to check Synapse readiness.'}
          </p>
        </article>

        <article className={`info-card ${provider?.state === 'available' ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Server size={16} />
              Providers
            </span>
            <strong>{formatCount(provider?.activeProviderCount)} active</strong>
          </div>
          <p className="info-card-copy">
            {provider?.error ??
              `${formatCount(provider?.totalProviderCount)} total providers reported by the selected network.`}
          </p>
        </article>

        <article className={`info-card ${payment?.state === 'available' ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <DatabaseZap size={16} />
              Payment account
            </span>
            <strong>{payment?.ready ? 'Ready' : 'Needs attention'}</strong>
          </div>
          <p className="info-card-copy">
            {runtimeMode === 'simulation'
              ? 'Simulation Mode uses fixture payment readiness.'
              : payment?.error ?? 'Readiness is based on USDFC deposit, lockup, and Warm Storage approval state.'}
          </p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Storage account</h2>
            <span className="panel-meta">{walletConnected ? walletLabel : 'No wallet'}</span>
          </div>
          <dl className="status-list">
            <StatusRow label={`${nativeTokenSymbol} wallet balance`} value={formatToken(payment?.walletFilBalance)} />
            <StatusRow label="USDFC wallet balance" value={formatToken(payment?.walletUsdfcBalance)} />
            <StatusRow label="Deposited funds" value={formatToken(payment?.accountFunds)} />
            <StatusRow label="Available funds" value={formatToken(payment?.availableFunds)} />
            <StatusRow label="Current lockup" value={formatToken(payment?.lockupCurrent)} />
            <StatusRow label="Lockup rate / epoch" value={formatToken(payment?.lockupRate)} />
          </dl>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Representative upload</h2>
            <span className="panel-meta">{formatBytes(readiness?.sampleUploadSizeBytes)}</span>
          </div>
          <dl className="status-list">
            <StatusRow label="Deposit needed" value={formatToken(payment?.depositNeeded)} />
            <StatusRow label="FWSS approval" value={payment?.needsServiceApproval ? 'Required' : payment ? 'Ready' : 'Unknown'} />
            <StatusRow label="Rate / epoch" value={formatToken(payment?.ratePerEpoch)} />
            <StatusRow label="Rate / month" value={formatToken(payment?.ratePerMonth)} />
            <StatusRow label="Network" value={networkLabel} />
            <StatusRow label="Mode" value={runtimeMode} />
          </dl>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Readiness blockers</h2>
          <span className="panel-meta">{readiness?.blockers.length ?? 0} active</span>
        </div>
        {readiness && readiness.blockers.length > 0 ? (
          <div className="activity-list">
            {readiness.blockers.map((item) => (
              <div className="activity-item" key={item.code}>
                <span className={`activity-icon ${item.severity === 'error' ? 'danger' : 'warning'}`}>
                  <AlertTriangle size={14} />
                </span>
                <div className="activity-body">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="panel-copy">
            {walletConnected
              ? 'No current provider or payment blockers from the latest Synapse readiness check.'
              : 'Connect a root wallet to run the Synapse readiness check.'}
          </p>
        )}
      </section>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function readinessLabel(state: StorageReadiness['state'] | undefined) {
  if (state === 'available') {
    return 'Ready';
  }

  if (state === 'error') {
    return 'Probe failed';
  }

  if (state === 'unavailable') {
    return 'Blocked';
  }

  return 'Unknown';
}

function formatCount(value: number | null | undefined) {
  return typeof value === 'number' ? value.toLocaleString() : 'Unknown';
}

function formatBytes(value: number | undefined) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }

  if (value < 1_000_000) {
    return `${Math.round(value / 1_000)} KB`;
  }

  return `${(value / 1_000_000).toFixed(2)} MB`;
}

function formatToken(value: bigint | undefined) {
  if (value == null) {
    return 'Unknown';
  }

  const whole = value / 1_000000000000000000n;
  const fraction = value % 1_000000000000000000n;
  const fractionText = fraction.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');

  return fractionText ? `${whole.toLocaleString()}.${fractionText}` : whole.toLocaleString();
}
