import { Database, FolderOpen, LockKeyhole, RefreshCw, Search, ShieldCheck, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { DatasetSummary, DemoRuntimeMode, FileSummary } from '../lib';
import {
  createExplorerMessageUrl,
  formatBytes,
  formatDate,
  formatRelativeTime,
  paymentRailLabel,
  paymentRailTone,
  shortId,
  sourceLabel,
  sourceTone,
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
  walletLabel,
  walletConnected,
  datasets,
  files,
  refreshing,
  explorerUrl,
  onRefresh,
}: DatasetsPageProps) {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'chain' | 'simulation'>('all');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
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
  const selectedDataset =
    filteredDatasets.find((dataset) => dataset.datasetId === selectedDatasetId) ??
    filteredDatasets[0];
  const totalSize = datasets.reduce(
    (sum, dataset) => sum + (dataset.totalSize ?? datasetSizes.get(dataset.datasetId) ?? 0),
    0,
  );
  const providerCount = new Set(datasets.map((dataset) => dataset.provider).filter(Boolean)).size;
  const verifiedCount = datasets.filter((dataset) => dataset.proofStatus === 'verified').length;

  return (
    <main className="page page-datasets">
      <section className="page-header page-header-with-actions">
        <div>
          <div className="page-kicker">
            <Database size={16} />
            <span>Datasets</span>
          </div>
          <h1 className="page-title">Datasets</h1>
          <p className="page-copy">
            {runtimeMode === 'simulation' ? 'Simulation dataset state' : 'Chain-backed dataset state'} for{' '}
            {walletConnected ? walletLabel : 'the selected Root Wallet'} on {networkLabel}.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} />
          <span>{refreshing ? 'Refreshing' : 'Refresh from chain'}</span>
        </button>
      </section>

      <section className="page-grid page-grid-primary">
        <MetricCard label="Datasets" value={datasets.length.toLocaleString()} icon={<FolderOpen size={16} />} />
        <MetricCard label="Files" value={datasets.reduce((sum, dataset) => sum + dataset.fileCount, 0).toLocaleString()} icon={<Database size={16} />} />
        <MetricCard label="Total size" value={formatBytes(totalSize)} icon={<WalletCards size={16} />} />
        <MetricCard label="Providers" value={providerCount.toLocaleString()} icon={<ShieldCheck size={16} />} />
      </section>

      <section className={`callout ${runtimeMode === 'simulation' ? '' : walletConnected ? 'success' : 'warning'}`}>
        <ShieldCheck size={18} />
        <span>
          <strong>{runtimeMode === 'simulation' ? 'Simulation data is labeled.' : 'Local storage is not the source of truth.'}</strong>{' '}
          {runtimeMode === 'simulation'
            ? 'These rows are fixture data for presenter mode and are ready to be replaced by live Synapse reads.'
            : 'This page is populated from Synapse and Filecoin reads for the selected network and Root Wallet.'}
        </span>
      </section>

      <section className="content-with-rail">
        <article className="panel">
          <div className="data-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search datasets, providers, or IDs"
              />
            </label>
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
          </div>

          <div className="resource-table resource-table--datasets">
            <div className="resource-table-header">
              <span>Dataset</span>
              <span>Provider</span>
              <span>Pieces</span>
              <span>Payment Rail</span>
              <span>Proof</span>
              <span>Last activity</span>
            </div>
            {filteredDatasets.map((dataset) => (
              <button
                type="button"
                key={dataset.datasetId}
                className={`resource-table-row ${selectedDataset?.datasetId === dataset.datasetId ? 'resource-table-row--selected' : ''}`}
                onClick={() => setSelectedDatasetId(dataset.datasetId)}
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
        </article>

        <aside className="detail-rail">
          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Selected dataset</h2>
              <span className={`badge ${selectedDataset ? sourceTone(selectedDataset.source) : 'warning'}`}>
                {selectedDataset ? sourceLabel(selectedDataset.source) : 'None'}
              </span>
            </div>

            {selectedDataset ? (
              <>
                <div className="detail-hero">
                  <span className="detail-hero-icon">
                    <FolderOpen size={22} />
                  </span>
                  <div>
                    <strong>{selectedDataset.label}</strong>
                    <p>{selectedDataset.fileCount.toLocaleString()} files across {selectedDataset.pieceCount.toLocaleString()} pieces</p>
                  </div>
                </div>
                <dl className="status-list">
                  <StatusRow label="Network" value={`${networkLabel} (${chainId})`} />
                  <StatusRow label="Dataset ID" value={shortId(selectedDataset.datasetId, 10, 8)} />
                  <StatusRow label="Client dataset ID" value={selectedDataset.clientDatasetId ?? 'Unknown'} />
                  <StatusRow label="Provider" value={selectedDataset.provider ?? 'Unknown'} />
                  <StatusRow label="Payment Rail" value={paymentRailLabel(selectedDataset.paymentRailStatus)} />
                  <StatusRow label="Proof status" value={verificationLabel(selectedDataset.proofStatus)} />
                  <StatusRow label="Last activity" value={formatDate(selectedDataset.lastActivityAt ?? selectedDataset.createdAt)} />
                </dl>
                <div className="button-stack">
                  <button type="button" className="primary-action is-disabled" disabled>
                    <LockKeyhole size={16} />
                    <span>Add files requires live upload</span>
                  </button>
                  {createExplorerMessageUrl(explorerUrl, selectedDataset.transactionHash) ? (
                    <a className="secondary-button" href={createExplorerMessageUrl(explorerUrl, selectedDataset.transactionHash)} target="_blank" rel="noreferrer">
                      View on explorer
                    </a>
                  ) : (
                    <button type="button" className="secondary-button" disabled>
                      Explorer link unavailable
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="panel-copy">No dataset is selected.</p>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Advanced details</h2>
              <span className="panel-meta">Protocol fields</span>
            </div>
            {selectedDataset ? (
              <dl className="status-list">
                <StatusRow label="Provider address" value={shortId(selectedDataset.providerAddress, 10, 8)} />
                <StatusRow label="Transaction" value={shortId(selectedDataset.transactionHash, 10, 8)} />
                <StatusRow label="Visibility" value={selectedDataset.visibility ?? 'Unknown'} />
                {Object.entries(selectedDataset.metadata ?? {}).map(([key, value]) => (
                  <StatusRow key={key} label={key} value={String(value)} />
                ))}
              </dl>
            ) : (
              <p className="panel-copy">Select a dataset to inspect protocol details.</p>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Data source</h2>
              <span className="panel-meta">{verifiedCount} verified</span>
            </div>
            <p className="panel-copy">
              Chain mode reconstructs datasets from Synapse and Filecoin contracts. Simulation mode uses explicit fixture rows for demo rehearsal only.
            </p>
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
