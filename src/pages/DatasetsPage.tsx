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
        <MetricCard label="Total Datasets" value={datasets.length.toLocaleString()} icon={<FolderOpen size={16} />} />
        <MetricCard label="Total Files" value={datasets.reduce((sum, dataset) => sum + dataset.fileCount, 0).toLocaleString()} icon={<Database size={16} />} />
        <MetricCard label="Total Size" value={formatBytes(totalSize)} icon={<WalletCards size={16} />} />
        <MetricCard label="Providers" value={providerCount.toLocaleString()} icon={<ShieldCheck size={16} />} />
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
                placeholder="Search datasets, providers, or IDs"
              />
            </label>
            <span className="data-toolbar__spacer" />
            <select
              className="select-field"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
              aria-label="Filter by data source"
            >
              <option value="all">All datasets</option>
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
            {filteredDatasets.map((dataset) => (
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
                    <strong>{dataset.label}</strong>
                    <small>
                      {shortId(dataset.datasetId)} · {dataset.visibility ?? 'unknown'}
                    </small>
                  </span>
                </span>
                <span>
                  <strong>{dataset.provider ?? 'Unknown provider'}</strong>
                  <small>{shortId(dataset.providerAddress)}</small>
                </span>
                <span>
                  <strong>{dataset.pieceCount.toLocaleString()}</strong>
                  <small>{formatBytes(dataset.totalSize ?? datasetSizes.get(dataset.datasetId))}</small>
                </span>
                <span>
                  <span className={`badge ${paymentRailTone(dataset.paymentRailStatus)}`}>
                    {paymentRailLabel(dataset.paymentRailStatus)}
                  </span>
                </span>
                <span>
                  <span className={`badge ${verificationTone(dataset.proofStatus)}`}>
                    {verificationLabel(dataset.proofStatus)}
                  </span>
                </span>
                <span>
                  <strong>{formatRelativeTime(dataset.lastActivityAt ?? dataset.createdAt)}</strong>
                  <small>{formatDate(dataset.lastActivityAt ?? dataset.createdAt)}</small>
                </span>
                <span className="row-actions">
                  <span className="open-button">Open</span>
                  <MoreVertical size={16} />
                </span>
              </button>
            ))}
          </div>

          {filteredDatasets.length === 0 ? (
            <EmptyState
              walletConnected={walletConnected}
              runtimeMode={runtimeMode}
              query={query}
            />
          ) : null}
          <div className="table-footer">
            <span>Showing 1-6 of {datasets.length.toLocaleString()} datasets</span>
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
