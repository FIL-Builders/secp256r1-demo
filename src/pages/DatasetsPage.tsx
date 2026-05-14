import {
  Database,
  ExternalLink,
  Filter,
  FolderOpen,
  Info,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { DatasetSummary, DemoRuntimeMode, FileSummary } from '../lib';
import {
  formatBytes,
  formatDate,
  formatRelativeTime,
  paymentRailLabel,
  paymentRailTone,
  shortId,
  verificationLabel,
  verificationTone,
} from './storage-page-utils';

const DEMO_DATASET_ROWS = [
  ['Research Dataset', 'Private', 'Glif', 'f01234', '128', '8.4 GB', 'paid', 'Up to date', 'verified', 'On-chain', '2h ago', 'May 14, 2025'],
  ['Climate Data Collection', 'Private', 'Estuary', 'f04567', '96', '24.7 GB', 'paid', 'Up to date', 'verified', 'On-chain', '1d ago', 'May 13, 2025'],
  ['Public Images', 'Public', 'Boost', 'f07890', '42', '3.1 GB', 'paid', 'Up to date', 'verified', 'On-chain', '2d ago', 'May 12, 2025'],
  ['Video Archive 2024', 'Private', 'Glif', 'f01234', '210', '92.3 GB', 'paid', 'Up to date', 'verified', 'On-chain', '3d ago', 'May 11, 2025'],
  ['Sensor Readings', 'Private', 'Estuary', 'f04567', '18', '1.8 GB', 'due-soon', 'Due in 3 days', 'verified', 'On-chain', '4d ago', 'May 10, 2025'],
  ['Team Documents', 'Private', 'Boost', 'f07890', '32', '2.5 GB', 'past-due', 'Overdue', 'failed', 'No proof', '5d ago', 'May 9, 2025'],
] as const;

export interface DatasetsPageProps {
  networkLabel: string;
  chainId: number;
  runtimeMode: DemoRuntimeMode;
  walletLabel: string;
  walletConnected: boolean;
  datasets: DatasetSummary[];
  files: FileSummary[];
  refreshing: boolean;
  explorerUrl: string;
  onRefresh: () => void;
}

export function DatasetsPage({
  networkLabel,
  chainId,
  runtimeMode,
  walletConnected,
  datasets,
  files,
  refreshing,
  explorerUrl,
  onRefresh,
}: DatasetsPageProps) {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'chain' | 'simulation'>('all');
  const datasetSizes = useMemo(() => {
    const sizes = new Map<string, number>();

    for (const file of files) {
      sizes.set(file.datasetId, (sizes.get(file.datasetId) ?? 0) + file.size);
    }

    return sizes;
  }, [files]);
  const filteredDatasets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return datasets.filter((dataset) => {
      const matchesSource = sourceFilter === 'all' || dataset.source === sourceFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [dataset.label, dataset.datasetId, dataset.clientDatasetId, dataset.provider]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesSource && matchesQuery;
    });
  }, [datasets, query, sourceFilter]);
  const totalSize = datasets.reduce(
    (sum, dataset) => sum + (dataset.totalSize ?? datasetSizes.get(dataset.datasetId) ?? 0),
    0,
  );
  const providerCount = new Set(datasets.map((dataset) => dataset.provider).filter(Boolean)).size;
  const verifiedCount = datasets.filter((dataset) => dataset.proofStatus === 'verified').length;
  const totalDatasetsMetric = runtimeMode === 'simulation' ? '24' : datasets.length.toLocaleString();
  const totalFilesMetric =
    runtimeMode === 'simulation'
      ? '312'
      : datasets.reduce((sum, dataset) => sum + dataset.fileCount, 0).toLocaleString();
  const totalSizeMetric = runtimeMode === 'simulation' ? '196.8 GB' : formatBytes(totalSize);
  const providerCountMetric = runtimeMode === 'simulation' ? '6' : providerCount.toLocaleString();

  return (
    <main className="page page-datasets">
      <section className="page-header">
        <div>
          <div className="page-kicker">
            <Database size={16} />
            <span>Datasets</span>
          </div>
          <h1 className="page-title">Datasets</h1>
          <p className="page-copy">
            Chain-backed datasets for your root wallet on {networkLabel}.
          </p>
        </div>
      </section>

      <section className="page-grid page-grid-primary">
        <MetricCard label="Total Datasets" value={totalDatasetsMetric} icon={<FolderOpen size={16} />} />
        <MetricCard label="Total Files" value={totalFilesMetric} icon={<Database size={16} />} />
        <MetricCard label="Total Size" value={totalSizeMetric} icon={<WalletCards size={16} />} />
        <MetricCard label="Providers" value={providerCountMetric} icon={<ShieldCheck size={16} />} />
      </section>

      <section className="content-with-rail content-with-rail--datasets">
        <div className="dataset-main-column">
          <section className="callout callout--dataset-proof">
            <ShieldCheck size={24} />
            <span>
              <strong>All dataset information is reconstructed from on-chain Synapse, FWSS, and PDP queries.</strong>
              <small>No local storage is required to view this data.</small>
            </span>
            <a href="https://docs.filecoin.io/" target="_blank" rel="noreferrer">
              Learn more <ExternalLink size={13} />
            </a>
          </section>

          <div className="data-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search datasets by name or ID..."
              />
            </label>
            <span className="data-toolbar__spacer" />
            <select
              className="select-field"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
              aria-label="Filter by data source"
            >
              <option value="all">All Datasets</option>
              <option value="chain">Chain-backed</option>
              <option value="simulation">Simulation</option>
            </select>
            <button type="button" className="secondary-button">
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <button type="button" className="secondary-button secondary-button--icon" onClick={onRefresh} disabled={refreshing} aria-label="Refresh from chain">
              <RefreshCw size={16} />
            </button>
          </div>

          <article className="panel dataset-table-panel">
          <div className="resource-table resource-table--datasets">
            <div className="resource-table-header">
              <span>Dataset</span>
              <span>Provider</span>
              <span>Pieces</span>
              <span>Payment Rail</span>
              <span>Proof</span>
              <span>Last activity</span>
              <span>Actions</span>
            </div>
            {filteredDatasets.map((dataset, index) => {
              const display = datasetDisplay(dataset, index, runtimeMode, datasetSizes);

              return (
                <button
                  type="button"
                  key={dataset.datasetId}
                  className="resource-table-row"
                >
                  <span className="resource-name">
                    <span className="resource-icon">
                      <FolderOpen size={16} />
                    </span>
                    <span>
                      <strong>{display.label}</strong>
                      <small>{display.meta}</small>
                      <small className="dataset-identifiers">
                        <span>ID&nbsp;&nbsp;{datasetIdentifierDisplay(dataset, index, runtimeMode)}</span>
                        <span>Client&nbsp;&nbsp;{clientIdentifierDisplay(dataset, index, runtimeMode)}</span>
                      </small>
                    </span>
                  </span>
                  <span className="provider-cell">
                    <ProviderMark provider={display.provider} />
                    <span>
                      <strong>{display.provider}</strong>
                      <small>{display.providerId}</small>
                    </span>
                  </span>
                  <span>
                    <strong>{display.pieces}</strong>
                    <small>{display.size}</small>
                  </span>
                  <span>
                    <span className={`badge ${paymentRailTone(display.paymentStatus)}`}>
                      {paymentRailLabel(display.paymentStatus)}
                    </span>
                    <small>{display.paymentNote}</small>
                  </span>
                  <span>
                    <span className={`badge ${verificationTone(display.proofStatus)}`}>
                      {runtimeMode === 'simulation' && display.proofStatus === 'failed'
                        ? 'Unverified'
                        : verificationLabel(display.proofStatus)}
                    </span>
                    <small>{display.proofNote}</small>
                  </span>
                  <span>
                    <strong>{display.lastRelative}</strong>
                    <small>{display.lastDate}</small>
                  </span>
                  <span className="row-actions">
                    <span className="open-button">Open</span>
                    <MoreVertical size={16} />
                  </span>
                </button>
              );
            })}
          </div>

          {filteredDatasets.length === 0 ? (
            <EmptyState
              walletConnected={walletConnected}
              runtimeMode={runtimeMode}
              query={query}
            />
          ) : null}
          <div className="table-footer">
            <span>Showing 1-6 of {runtimeMode === 'simulation' ? '24' : datasets.length.toLocaleString()} datasets</span>
            <span className="pagination">
              <button type="button" disabled>‹</button>
              <button type="button" className="is-active">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">4</button>
              <button type="button">›</button>
            </span>
            <label>
              <span>Rows per page</span>
              <select className="select-field" defaultValue="10" aria-label="Rows per page">
                <option>10</option>
                <option>25</option>
              </select>
            </label>
          </div>
          </article>
        </div>

        <aside className="detail-rail">
          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title"><Info size={17} /> About Datasets</h2>
            </div>
            <p className="panel-copy">
              Datasets represent groups of files stored with one or more providers. Each dataset is committed on-chain and verified.
            </p>
            <a className="panel-link" href="https://docs.filecoin.io/" target="_blank" rel="noreferrer">Learn more</a>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Quick Actions</h2>
            </div>
            <div className="quick-action-list">
              <button type="button"><Plus size={16} /> Create Dataset</button>
              <button type="button"><Database size={16} /> Import Existing Dataset</button>
              <button type="button" onClick={onRefresh}><RefreshCw size={16} /> Refresh from Chain</button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Network Status</h2>
            </div>
            <dl className="status-list">
              <StatusRow label={networkLabel} value={String(chainId)} />
              <StatusRow label="P256VERIFY" value="Available" />
              <StatusRow label="0x0100" value={`${verifiedCount} verified`} />
            </dl>
            <a className="panel-link" href={explorerUrl} target="_blank" rel="noreferrer">View Network Details</a>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Data Source</h2>
            </div>
            <p className="panel-copy">
              This data is reconstructed from on-chain queries to Synapse, FWSS, and PDP contracts.
            </p>
            <div className="panel-foot">Last updated: 1 min ago <RefreshCw size={13} /></div>
          </article>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <article className="info-card">
      <div className="info-card-head">
        <span className="info-card-label">
          {icon}
          {label}
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

function ProviderMark({ provider }: { provider: string }) {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '-');
  const label = provider === 'Glif' ? 'f' : provider === 'Estuary' ? '' : provider.slice(0, 1);

  return <span className={`provider-mark provider-mark--${normalizedProvider}`}>{label}</span>;
}

function datasetIdentifierDisplay(dataset: DatasetSummary, index: number, runtimeMode: DemoRuntimeMode): string {
  if (runtimeMode !== 'simulation') {
    return shortId(dataset.datasetId, 8, 4);
  }

  const ids = ['dset_3k8...7m2p', 'dset_9f1...2a7b', 'dset_0a9...b8c3', 'dset_7d6...z9y1', 'dset_5e3...k4l0', 'dset_1b2...m5n6'];

  return ids[index % ids.length];
}

function clientIdentifierDisplay(dataset: DatasetSummary, index: number, runtimeMode: DemoRuntimeMode): string {
  if (runtimeMode !== 'simulation') {
    return dataset.clientDatasetId ? shortId(dataset.clientDatasetId, 8, 4) : 'unavailable';
  }

  const ids = ['client_a1b2', 'client_c3d4', 'client_ef56', 'client_gh78', 'client_ij90', 'client_kl12'];

  return ids[index % ids.length];
}

function datasetDisplay(
  dataset: DatasetSummary,
  index: number,
  runtimeMode: DemoRuntimeMode,
  datasetSizes: Map<string, number>,
) {
  if (runtimeMode === 'simulation') {
    const [
      label,
      meta,
      provider,
      providerId,
      pieces,
      size,
      paymentStatus,
      paymentNote,
      proofStatus,
      proofNote,
      lastRelative,
      lastDate,
    ] = DEMO_DATASET_ROWS[index % DEMO_DATASET_ROWS.length];

    return {
      label,
      meta,
      provider,
      providerId,
      pieces,
      size,
      paymentStatus,
      paymentNote,
      proofStatus,
      proofNote,
      lastRelative,
      lastDate,
    };
  }

  return {
    label: dataset.label,
    meta: `${shortId(dataset.datasetId)} · ${dataset.visibility ?? 'unknown'}`,
    provider: dataset.provider ?? 'Unknown provider',
    providerId: providerCode(dataset.providerAddress),
    pieces: dataset.pieceCount.toLocaleString(),
    size: formatBytes(dataset.totalSize ?? datasetSizes.get(dataset.datasetId)),
    paymentStatus: dataset.paymentRailStatus,
    paymentNote: 'Up to date',
    proofStatus: dataset.proofStatus,
    proofNote: dataset.proofStatus === 'verified' ? 'On-chain' : 'No proof',
    lastRelative: formatRelativeTime(dataset.lastActivityAt ?? dataset.createdAt),
    lastDate: formatDate(dataset.lastActivityAt ?? dataset.createdAt),
  };
}

function providerCode(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  if (value.startsWith('f') || value.startsWith('t')) {
    return value;
  }

  return `f${value.slice(-5)}`;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyState({
  walletConnected,
  runtimeMode,
  query,
}: {
  walletConnected: boolean;
  runtimeMode: DemoRuntimeMode;
  query: string;
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="empty-state">
      <strong>{hasQuery ? 'No matching datasets' : walletConnected || runtimeMode === 'simulation' ? 'No datasets found' : 'Root Wallet required'}</strong>
      <p>
        {hasQuery
          ? 'Try a different dataset name, provider, or identifier.'
          : walletConnected || runtimeMode === 'simulation'
            ? 'The selected network returned no datasets for this source.'
            : 'Connect a Root Wallet to read chain-backed dataset state.'}
      </p>
    </div>
  );
}
