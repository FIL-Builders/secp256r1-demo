import {
  Activity,
  Archive,
  Database,
  FileStack,
  Layers3,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type RuntimeMode = 'live' | 'pending-network' | 'simulation';

export interface BalanceSummary {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'warning';
  hint?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  icon?: ReactNode;
}

export interface FileSummary {
  label: string;
  value: string;
  note?: string;
}

export interface HomePageProps {
  runtimeMode: RuntimeMode;
  networkLabel: string;
  storage: BalanceSummary;
  passkeyUpload: {
    status: string;
    detail: string;
    verified: boolean;
  };
  recentActivity: ActivityItem[];
  datasets: FileSummary[];
  files: FileSummary[];
}

const runtimeModeLabel: Record<RuntimeMode, string> = {
  live: 'Live',
  'pending-network': 'Pending network',
  simulation: 'Simulation',
};

const runtimeToneClass: Record<RuntimeMode, string> = {
  live: 'is-live',
  'pending-network': 'is-pending',
  simulation: 'is-simulation',
};

function summaryIconForIndex(index: number) {
  const icons = [FileStack, Database, Layers3, Archive];
  return icons[index % icons.length];
}

export function HomePage({
  runtimeMode,
  networkLabel,
  storage,
  passkeyUpload,
  recentActivity,
  datasets,
  files,
}: HomePageProps) {
  return (
    <main className="page page-home">
      <section className="page-header">
        <div className="page-kicker">
          <ShieldCheck size={16} />
          <span>Synapse P-256 passkey demo</span>
        </div>
        <h1 className="page-title">Home</h1>
        <p className="page-copy">
          {networkLabel} runtime is {runtimeModeLabel[runtimeMode].toLowerCase()}.
          This view is built to accept live capability data, simulation fixtures,
          and pending-network states without changing the layout.
        </p>
      </section>

      <section className="page-grid page-grid-primary">
        <article className={`info-card ${runtimeToneClass[runtimeMode]}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Activity size={16} />
              Runtime mode
            </span>
            <strong>{runtimeModeLabel[runtimeMode]}</strong>
          </div>
          <p className="info-card-copy">
            The app should stay honest about on-chain status. Pending-network and
            simulation modes are first-class, but they are not live verification.
          </p>
        </article>

        <article className={`info-card storage-${storage.tone ?? 'neutral'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Database size={16} />
              Storage balance
            </span>
            <strong>{storage.value}</strong>
          </div>
          <p className="info-card-copy">
            {storage.label}
            {storage.hint ? ` ${storage.hint}` : ''}
          </p>
        </article>

        <article className={`info-card upload-${passkeyUpload.verified ? 'verified' : 'pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Upload size={16} />
              Passkey upload
            </span>
            <strong>{passkeyUpload.status}</strong>
          </div>
          <p className="info-card-copy">
            {passkeyUpload.detail}{' '}
            {passkeyUpload.verified ? 'Verification is available.' : 'Verification is not yet live.'}
          </p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Recent activity</h2>
            <span className="panel-meta">{recentActivity.length} events</span>
          </div>
          <ul className="activity-list">
            {recentActivity.map((item) => (
              <li key={item.id} className="activity-row">
                <span className="activity-icon">
                  {item.icon ?? <ClockFallbackIcon />}
                </span>
                <div className="activity-body">
                  <div className="activity-title-line">
                    <strong>{item.title}</strong>
                    <span className="activity-time">{item.timestamp}</span>
                  </div>
                  <p>{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Datasets</h2>
            <span className="panel-meta">{datasets.length} groups</span>
          </div>
          <div className="stacked-summary">
            {datasets.map((summary, index) => {
              const Icon = summaryIconForIndex(index);
              return (
                <div key={`${summary.label}-${index}`} className="summary-row">
                  <span className="summary-icon">
                    <Icon size={16} />
                  </span>
                  <div className="summary-copy">
                    <strong>{summary.label}</strong>
                    <span>{summary.note ?? 'Ready for fixture-backed reporting.'}</span>
                  </div>
                  <div className="summary-value">{summary.value}</div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Files</h2>
          <span className="panel-meta">{files.length} items</span>
        </div>
        <div className="file-summary-grid">
          {files.map((summary, index) => {
            const Icon = summaryIconForIndex(index + 1);
            return (
              <article key={`${summary.label}-${index}`} className="file-summary">
                <span className="file-summary-icon">
                  <Icon size={16} />
                </span>
                <strong>{summary.label}</strong>
                <span className="file-summary-value">{summary.value}</span>
                {summary.note ? <p>{summary.note}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ClockFallbackIcon() {
  return <Activity size={14} />;
}
