import {
  Archive,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FileText,
  Filter,
  FolderOpen,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { DatasetSummary, DemoRuntimeMode, FileSummary } from '../lib';
import {
  createExplorerMessageUrl,
  fileKindLabel,
  formatBytes,
  formatDate,
  shortId,
  sourceLabel,
  sourceTone,
  verificationLabel,
  verificationTone,
} from './storage-page-utils';

export interface FilesPageProps {
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
  onUpload: () => void;
}

type VerificationFilter = 'all' | 'verified' | 'pending';

export function FilesPage({
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
  onUpload,
}: FilesPageProps) {
  const [query, setQuery] = useState('');
  const [datasetFilter, setDatasetFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const datasetById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.datasetId, dataset])),
    [datasets],
  );
  const providerOptions = useMemo(
    () => Array.from(new Set(files.map((file) => file.provider).filter(Boolean))).sort(),
    [files],
  );
  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return files.filter((file) => {
      const matchesDataset = datasetFilter === 'all' || file.datasetId === datasetFilter;
      const matchesProvider = providerFilter === 'all' || file.provider === providerFilter;
      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified'
          ? file.verificationStatus === 'verified'
          : file.verificationStatus !== 'verified');
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [file.name, file.datasetLabel, file.datasetId, file.provider, file.pieceCid]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesDataset && matchesProvider && matchesVerification && matchesQuery;
    }).sort((a, b) => fileDisplayRank(a.name) - fileDisplayRank(b.name));
  }, [datasetFilter, files, providerFilter, query, verificationFilter]);
  const selectedFile =
    filteredFiles.find((file) => file.fileId === selectedFileId) ??
    filteredFiles[0];
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const verifiedCount = files.filter((file) => file.verificationStatus === 'verified').length;
  const filesMetric = runtimeMode === 'simulation' ? '42' : files.length.toLocaleString();
  const totalSizeMetric = runtimeMode === 'simulation' ? '128.54 GB' : formatBytes(totalSize);
  const verifiedMetric = runtimeMode === 'simulation' ? 'All on-chain verified' : `${verifiedCount.toLocaleString()} on-chain`;
  const selectedExplorerUrl = createExplorerMessageUrl(explorerUrl, selectedFile?.transactionHash);
  const selectedFileModified = selectedFile ? fileModifiedDisplay(selectedFile, runtimeMode) : undefined;

  return (
    <main className="page page-files">
      <section className="page-header page-header-with-actions">
        <div>
          <div className="page-kicker">
            <Archive size={16} />
            <span>Files</span>
          </div>
          <h1 className="page-title">Files</h1>
          <p className="page-copy">
            Browse your committed files and pieces. History comes from on-chain datasets and piece state.
          </p>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={16} />
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>
          <button type="button" className="primary-button" onClick={onUpload}>
            <Upload size={16} />
            <span>Upload Files</span>
          </button>
        </div>
      </section>

      <section className="data-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files, datasets, or PieceCID..."
          />
        </label>
        <select
          className="select-field"
          value={datasetFilter}
          onChange={(event) => setDatasetFilter(event.target.value)}
          aria-label="Filter by dataset"
        >
          <option value="all">Dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.datasetId} value={dataset.datasetId}>
              {dataset.label}
            </option>
          ))}
        </select>
        <select
          className="select-field"
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          aria-label="Filter by provider"
        >
          <option value="all">Provider</option>
          {providerOptions.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        <select
          className="select-field"
          value={verificationFilter}
          onChange={(event) => setVerificationFilter(event.target.value as VerificationFilter)}
          aria-label="Filter by verification status"
        >
          <option value="all">Verified</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending or unknown</option>
        </select>
        <button type="button" className="secondary-button" disabled>
          <Filter size={16} />
          <span>More filters</span>
        </button>
      </section>

      <section className="summary-strip">
        <Metric label="Files" value={filesMetric} />
        <Metric label="Datasets" value={datasets.length.toLocaleString()} />
        <Metric label="Total Size" value={totalSizeMetric} />
        <Metric
          label="Verified"
          value={verifiedMetric}
          note="via Synapse and Filecoin"
          tone="success"
          icon={<ShieldCheck size={18} />}
        />
      </section>

      <section className="content-with-rail">
        <article className="panel">
          <div className="resource-table resource-table--files">
            <div className="resource-table-header">
              <span>Name</span>
              <span>Dataset</span>
              <span>Provider</span>
              <span>Size</span>
              <span>Modified</span>
              <span>Verified</span>
              <span />
            </div>
            {filteredFiles.map((file) => {
              const dataset = datasetById.get(file.datasetId);
              const modifiedDisplay = fileModifiedDisplay(file, runtimeMode);

              return (
                <button
                  type="button"
                  key={file.fileId}
                  className={`resource-table-row ${selectedFile?.fileId === file.fileId ? 'resource-table-row--selected' : ''}`}
                  onClick={() => setSelectedFileId(file.fileId)}
                >
                  <span className="resource-name">
                    <span className={`resource-icon ${iconToneForMime(file.mimeType)}`}>
                      {renderFileIcon(file.mimeType, 16)}
                    </span>
                    <span>
                      <strong>{file.name}</strong>
                      <small>{fileKindLabel(file.mimeType)}</small>
                    </span>
                  </span>
                  <span>
                    <strong>{file.datasetLabel ?? dataset?.label ?? 'Unknown dataset'}</strong>
                    <small>{fileDatasetIdDisplay(file, runtimeMode)}</small>
                  </span>
                  <span>
                    <strong className="file-provider-code">
                      {providerCode(file.providerAddress ?? dataset?.providerAddress)}
                      <ShieldCheck size={13} />
                    </strong>
                    <small>{file.provider ?? dataset?.provider ?? 'Unknown provider'}</small>
                  </span>
                  <span>{formatBytes(file.size)}</span>
                  <span>
                    <strong>{modifiedDisplay.date}</strong>
                    <small>{modifiedDisplay.time}</small>
                  </span>
                  <span>
                    <span className={`badge ${verificationTone(file.verificationStatus)}`}>
                      {verificationLabel(file.verificationStatus)}
                    </span>
                  </span>
                  <span className="row-actions">
                    <MoreVertical size={16} />
                  </span>
                </button>
              );
            })}
          </div>

          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <strong>{query.trim() ? 'No matching files' : walletConnected || runtimeMode === 'simulation' ? 'No files found' : 'Root Wallet required'}</strong>
              <p>
                {query.trim()
                  ? 'Try a different file name, dataset, provider, or PieceCID.'
                  : walletConnected || runtimeMode === 'simulation'
                    ? 'The selected network returned no committed file rows for this source.'
                    : 'Connect a Root Wallet to reconstruct files from chain-backed Synapse state.'}
              </p>
            </div>
          ) : null}
          {filteredFiles.length > 0 ? (
            <div className="table-footer">
              <span>Showing 1 to {filteredFiles.length} of {runtimeMode === 'simulation' ? '42' : files.length.toLocaleString()} files</span>
              <span className="pagination">
                <button type="button" disabled>‹</button>
                <button type="button" className="is-active">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button">…</button>
                <button type="button">6</button>
                <button type="button">›</button>
              </span>
            </div>
          ) : null}
        </article>

        <aside className="detail-rail">
          <article className="panel">
            <button type="button" className="detail-close-button" aria-label="Close file details">
              <X size={18} />
            </button>
            <div className="panel-head">
              <h2 className="panel-title">File details</h2>
              <span className={`badge ${selectedFile ? sourceTone(selectedFile.source) : 'warning'}`}>
                {selectedFile ? sourceLabel(selectedFile.source) : 'None'}
              </span>
            </div>

            {selectedFile ? (
              <>
                <div className="detail-hero">
                  <span className={`detail-hero-icon ${iconToneForMime(selectedFile.mimeType)}`}>
                    {renderFileIcon(selectedFile.mimeType)}
                  </span>
                  <div>
                    <strong>{selectedFile.name}</strong>
                    <p>
                      {formatBytes(selectedFile.size)} · {fileKindLabel(selectedFile.mimeType)}
                      {selectedFileModified ? ` · Modified ${selectedFileModified.full}` : ''}
                    </p>
                  </div>
                </div>

                <section className={`callout compact ${selectedFile.verificationStatus === 'verified' ? 'success' : 'warning'}`}>
                  {selectedFile.verificationStatus === 'verified' ? (
                    <span className="file-verification-icon">
                      <Check size={18} />
                    </span>
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                  <span>
                    <strong>{verificationSummaryTitle(selectedFile.verificationStatus)}</strong>
                    <br />
                    {selectedFile.verificationStatus === 'verified'
                      ? 'This file is safely stored and verified on-chain.'
                      : selectedFile.verificationStatus === 'pending'
                        ? 'This row is waiting on proof status and should not be presented as verified yet.'
                        : 'This read path found the file but does not expose a proof timestamp or verified status.'}
                  </span>
                </section>

                <dl className="status-list">
                  <StatusRow
                    label="Dataset"
                    value={selectedFile.datasetLabel ?? selectedFile.datasetId}
                    detail={fileDatasetIdDisplay(selectedFile, runtimeMode)}
                    accent
                  />
                  <StatusRow
                    label="Storage Provider"
                    value={providerCode(selectedFile.providerAddress)}
                    detail={selectedFile.provider ?? 'Unknown'}
                    accent
                  />
                  <StatusRow
                    label="Authorization"
                    value={authorizationLabel(selectedFile.authorizationStatus)}
                    detail="Authorized with your device"
                    accent
                  />
                  <StatusRow
                    label="Verification"
                    value={selectedFile.verificationStatus === 'verified' ? 'On-chain verified' : verificationLabel(selectedFile.verificationStatus)}
                    detail="via Synapse and Filecoin"
                    accent
                  />
                </dl>

                <div className="button-stack">
                  {selectedFile.retrievalUrl ? (
                    <a className="primary-action" href={selectedFile.retrievalUrl} target="_blank" rel="noreferrer">
                      <Download size={16} />
                      <span>Retrieve File</span>
                    </a>
                  ) : runtimeMode === 'simulation' ? (
                    <button type="button" className="primary-action">
                      <Download size={16} />
                      <span>Retrieve File</span>
                    </button>
                  ) : (
                    <button type="button" className="primary-action is-disabled" disabled>
                      <Download size={16} />
                      <span>Retrieval unavailable</span>
                    </button>
                  )}
                  <button type="button" className="secondary-button" disabled>
                    <Trash2 size={16} />
                    <span>Schedule Removal</span>
                  </button>
                  {selectedExplorerUrl ? (
                    <a className="secondary-button" href={selectedExplorerUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={16} />
                      <span>View Details</span>
                    </a>
                  ) : null}
                </div>

                <section className="callout compact callout--file-bytes">
                  <span>
                    <strong>File bytes are stored with providers.</strong>
                    <small>Retrieval downloads the file from storage providers.</small>
                  </span>
                </section>
              </>
            ) : (
              <p className="panel-copy">Select a file to view retrieval, authorization, and proof details.</p>
            )}
          </article>

          <article className="panel panel--compact">
            <div className="panel-head">
              <h2 className="panel-title">Quick Details</h2>
              <ChevronDown size={16} />
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Advanced Details</h2>
              <span className="panel-meta">Piece state</span>
            </div>
            {selectedFile ? (
              <>
                <dl className="status-list">
                  <StatusRow label="PieceCID" value={shortId(selectedFile.pieceCid, 12, 10)} />
                  <StatusRow label="Transaction" value={shortId(selectedFile.transactionHash, 10, 8)} />
                  <StatusRow label="Provider Address" value={shortId(selectedFile.providerAddress, 10, 8)} />
                  <StatusRow label="Proof Deadline" value={formatDate(selectedFile.proofDeadline)} />
                  <StatusRow label="Verified" value={formatDate(selectedFile.verifiedAt)} />
                  <StatusRow label="Chain" value={`${networkLabel} (${chainId})`} />
                </dl>
                {selectedExplorerUrl ? (
                  <a className="panel-link" href={selectedExplorerUrl} target="_blank" rel="noreferrer">
                    View on Explorer <ExternalLink size={13} />
                  </a>
                ) : null}
              </>
            ) : (
              <p className="panel-copy">No advanced file details are selected.</p>
            )}
          </article>
        </aside>
      </section>
    </main>
  );
}

function providerCode(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  return `F${value.slice(-7)}`;
}

function fileDatasetIdDisplay(file: FileSummary, runtimeMode: DemoRuntimeMode): string {
  if (runtimeMode !== 'simulation') {
    return shortId(file.datasetId, 8, 4);
  }

  const idsByDataset: Record<string, string> = {
    'Research Q2': 'ds_9f3a...b7c1',
    Reports: 'ds_1a2b...c8d9',
    Whitepapers: 'ds_2c3d...e0f1',
    'Research Q1': 'ds_7e6f...a2b3',
    Demos: 'ds_4d5e...f6a7',
    Notes: 'ds_9a8b...c7d6',
  };

  return idsByDataset[file.datasetLabel ?? ''] ?? shortId(file.datasetId, 8, 4);
}

function Metric({
  label,
  value,
  tone,
  note,
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  note?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="summary-strip-item">
      <strong className={tone ? `text-${tone}` : undefined}>
        {icon ? <span className="summary-strip-icon">{icon}</span> : null}
        {value}
      </strong>
      {icon ? null : <span>{label}</span>}
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function StatusRow({ label, value, detail, accent }: { label: string; value: string; detail?: string; accent?: boolean }) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd className={accent ? 'status-row__accent' : undefined}>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </dd>
    </div>
  );
}

function authorizationLabel(value: FileSummary['authorizationStatus']): string {
  if (value === 'passkey-protected') {
    return 'Passkey protected';
  }

  if (value === 'wallet-authorized') {
    return 'Wallet authorized';
  }

  return 'Unknown';
}

function verificationSummaryTitle(value: FileSummary['verificationStatus']): string {
  if (value === 'verified') {
    return 'Stored and verified';
  }

  if (value === 'pending') {
    return 'Verification pending';
  }

  if (value === 'failed') {
    return 'Verification failed';
  }

  return 'Verification status unknown';
}

function fileModifiedDisplay(file: FileSummary, runtimeMode: DemoRuntimeMode): { date: string; time: string; full: string } {
  if (runtimeMode !== 'simulation') {
    const timestamp = file.modifiedAt ?? file.createdAt;

    if (!timestamp) {
      return { date: 'Unknown', time: 'Unknown', full: 'Unknown' };
    }

    const date = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(timestamp);
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(timestamp);

    return { date, time, full: `${date} ${time}` };
  }

  const displayDates: Record<string, { date: string; time: string; full: string }> = {
    'research-dataset.zip': { date: 'May 22, 2025', time: '10:24 AM', full: 'May 22, 2025 10:24 AM' },
    'market-report.png': { date: 'May 21, 2025', time: '4:15 PM', full: 'May 21, 2025 4:15 PM' },
    'whitepaper.pdf': { date: 'May 20, 2025', time: '9:02 AM', full: 'May 20, 2025 9:02 AM' },
    'data-analysis.csv': { date: 'May 19, 2025', time: '2:33 PM', full: 'May 19, 2025 2:33 PM' },
    'experiment-results/': { date: 'May 18, 2025', time: '11:11 AM', full: 'May 18, 2025 11:11 AM' },
    'demo-video.mp4': { date: 'May 17, 2025', time: '5:47 PM', full: 'May 17, 2025 5:47 PM' },
    'project-notes.docx': { date: 'May 16, 2025', time: '8:19 AM', full: 'May 16, 2025 8:19 AM' },
    'analysis.ipynb': { date: 'May 15, 2025', time: '1:44 PM', full: 'May 15, 2025 1:44 PM' },
  };

  return displayDates[file.name] ?? { date: 'Unknown', time: 'Unknown', full: 'Unknown' };
}

function iconForMime(mimeType: string): LucideIcon {
  if (mimeType === 'application/x-directory') {
    return FolderOpen;
  }

  if (mimeType.startsWith('image/')) {
    return FileImage;
  }

  if (mimeType.includes('zip') || mimeType.includes('archive')) {
    return FileArchive;
  }

  return FileText;
}

function iconToneForMime(mimeType: string): string {
  if (mimeType === 'application/x-directory') {
    return 'resource-icon--folder';
  }

  if (mimeType.startsWith('image/')) {
    return 'resource-icon--image';
  }

  if (mimeType.includes('pdf')) {
    return 'resource-icon--pdf';
  }

  if (mimeType.includes('csv') || mimeType.includes('spreadsheet')) {
    return 'resource-icon--sheet';
  }

  if (mimeType.includes('video')) {
    return 'resource-icon--video';
  }

  if (mimeType.includes('wordprocessingml')) {
    return 'resource-icon--doc';
  }

  if (mimeType.includes('ipynb') || mimeType.includes('json')) {
    return 'resource-icon--code';
  }

  return 'resource-icon--archive';
}

function renderFileIcon(mimeType: string, size = 22) {
  if (mimeType.includes('zip') || mimeType.includes('archive')) {
    return <span className="zip-file-icon">zip</span>;
  }

  const Icon = iconForMime(mimeType);
  return <Icon size={size} />;
}

function fileDisplayRank(name: string): number {
  const order = [
    'research-dataset.zip',
    'market-report.png',
    'whitepaper.pdf',
    'data-analysis.csv',
    'experiment-results/',
    'demo-video.mp4',
    'project-notes.docx',
    'analysis.ipynb',
  ];

  const index = order.indexOf(name);
  return index === -1 ? order.length : index;
}
