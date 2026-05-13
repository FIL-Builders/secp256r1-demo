import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  Database,
  DollarSign,
  Fingerprint,
  Globe2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { ActivityEvent, ActivityKind, ChainDataSource, DemoRuntimeMode } from '../lib';
import {
  activityKindLabel,
  createExplorerMessageUrl,
  formatDate,
  formatRelativeTime,
  shortId,
  sourceLabel,
  sourceTone,
} from './storage-page-utils';

export interface ActivityPageProps {
  networkLabel: string;
  chainId: number;
  runtimeMode: DemoRuntimeMode;
  walletLabel: string;
  walletConnected: boolean;
  activity: ActivityEvent[];
  refreshing: boolean;
  explorerUrl: string;
  onRefresh: () => void;
}

type ActivityFilter = 'all' | 'storage' | 'payments' | 'passkey' | 'verification' | 'network';

const filterLabels: Record<ActivityFilter, string> = {
  all: 'All events',
  storage: 'Storage',
  payments: 'Payments',
  passkey: 'Passkey',
  verification: 'Verification',
  network: 'Network',
};

export function ActivityPage({
  networkLabel,
  chainId,
  activity,
  refreshing,
  explorerUrl,
  onRefresh,
}: ActivityPageProps) {
  const [query, setQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | ChainDataSource>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const filteredActivity = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activity.filter((event) => {
      const matchesType = activityFilter === 'all' || groupForKind(event.kind) === activityFilter;
      const matchesSource = sourceFilter === 'all' || event.source === sourceFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [event.title, event.detail, event.datasetId, event.fileId, event.pieceCid, event.provider, event.transactionHash]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesType && matchesSource && matchesQuery;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [activity, activityFilter, query, sourceFilter]);
  const selectedEvent =
    filteredActivity.find((event) => event.eventId === selectedEventId) ??
    filteredActivity[0];
  const summary = createSummary(activity);
  const selectedExplorerUrl = createExplorerMessageUrl(explorerUrl, selectedEvent?.transactionHash);

  return (
    <main className="page page-activity">
      <section className="page-header page-header-with-actions">
        <div>
          <div className="page-kicker">
            <Activity size={16} />
            <span>Activity</span>
          </div>
          <h1 className="page-title">Activity</h1>
          <p className="page-copy">
            Timeline for storage, payments, Passkey Session, verification, and network events on {networkLabel}.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} />
          <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </section>

      <section className="data-toolbar">
        <select
          className="select-field"
          value={activityFilter}
          onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
          aria-label="Filter activity by type"
        >
          {Object.entries(filterLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="select-field"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
          aria-label="Filter activity by source"
        >
          <option value="all">All sources</option>
          <option value="chain">Chain-backed</option>
          <option value="simulation">Simulation</option>
        </select>
        <button type="button" className="secondary-button">
          <CalendarDays size={16} />
          <span>May 6 – May 13, 2025</span>
        </button>
        <label className="search-field search-field--compact">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events"
          />
        </label>
      </section>

      <section className="content-with-rail">
        <article className="panel">
          <div className="activity-timeline">
            {filteredActivity.map((event) => {
              const Icon = iconForKind(event.kind);
              const tone = eventTone(event);

              return (
                <button
                  type="button"
                  key={event.eventId}
                  className={`activity-timeline-row ${selectedEvent?.eventId === event.eventId ? 'activity-timeline-row--selected' : ''}`}
                  onClick={() => setSelectedEventId(event.eventId)}
                >
                  <span className={`activity-timeline-icon activity-timeline-icon--${tone}`}>
                    <Icon size={16} />
                  </span>
                  <span className="activity-timeline-body">
                    <span className="activity-title-line">
                      <strong>{event.title}</strong>
                      <small>{formatRelativeTime(event.createdAt)}</small>
                    </span>
                    <span>{event.detail}</span>
                    <span className="tag-row">
                      <span className="tag">{networkLabel}</span>
                      <span className={`tag tag--${sourceTone(event.source)}`}>{sourceLabel(event.source)}</span>
                      {event.transactionHash ? <span className="tag">Tx: {shortId(event.transactionHash, 8, 6)}</span> : null}
                      {event.provider ? <span className="tag">Provider: {event.provider}</span> : null}
                      {event.pieceCid ? <span className="tag">PieceCID: {shortId(event.pieceCid, 8, 6)}</span> : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {filteredActivity.length === 0 ? (
            <div className="empty-state">
              <strong>{query.trim() ? 'No matching events' : 'No activity found'}</strong>
              <p>
                {query.trim()
                  ? 'Try a different file, dataset, provider, or transaction search.'
                  : 'The selected network returned no events for this source and filter.'}
              </p>
            </div>
          ) : null}
        </article>

        <aside className="detail-rail">
          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Activity summary</h2>
              <span className="panel-meta">{activity.length.toLocaleString()} events</span>
            </div>
            <dl className="status-list">
              <SummaryRow icon={<CloudUpload size={16} />} label="Uploads" value={summary.uploads} />
              <SummaryRow icon={<CheckCircle2 size={16} />} label="Files committed or indexed" value={summary.filesCommitted} />
              <SummaryRow icon={<DollarSign size={16} />} label="Payments" value={summary.payments} />
              <SummaryRow icon={<Fingerprint size={16} />} label="Passkey events" value={summary.passkey} />
              <SummaryRow icon={<ShieldAlert size={16} />} label="Verification failures" value={summary.failures} />
              <SummaryRow icon={<ShieldAlert size={16} />} label="Readback warnings" value={summary.readbackWarnings} />
              <SummaryRow icon={<Globe2 size={16} />} label="Network switches" value={summary.network} />
            </dl>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Selected event</h2>
              <span className={`badge ${selectedEvent ? sourceTone(selectedEvent.source) : 'warning'}`}>
                {selectedEvent ? sourceLabel(selectedEvent.source) : 'None'}
              </span>
            </div>
            {selectedEvent ? (
              <>
                <div className="detail-hero">
                  <span className={`detail-hero-icon detail-hero-icon--${eventTone(selectedEvent)}`}>
                    {renderKindIcon(selectedEvent.kind)}
                  </span>
                  <div>
                    <strong>{selectedEvent.title}</strong>
                    <p>{activityKindLabel(selectedEvent.kind)}</p>
                  </div>
                </div>
                <dl className="status-list">
                  <StatusRow label="Created" value={formatDate(selectedEvent.createdAt)} />
                  <StatusRow label="Network" value={`${networkLabel} (${chainId})`} />
                  <StatusRow label="Dataset" value={shortId(selectedEvent.datasetId)} />
                  <StatusRow label="File" value={shortId(selectedEvent.fileId)} />
                  <StatusRow label="Provider" value={selectedEvent.provider ?? 'Unknown'} />
                  <StatusRow label="Amount" value={selectedEvent.amountLabel ?? 'Not applicable'} />
                  <StatusRow label="Actor" value={selectedEvent.actor ?? 'Unknown'} />
                </dl>
                {selectedExplorerUrl ? (
                  <a className="secondary-button" href={selectedExplorerUrl} target="_blank" rel="noreferrer">
                    View on explorer
                  </a>
                ) : null}
              </>
            ) : (
              <p className="panel-copy">Select an event to inspect references.</p>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Advanced references</h2>
              <span className="panel-meta">One click away</span>
            </div>
            {selectedEvent ? (
              <dl className="status-list">
                <StatusRow label="Transaction" value={shortId(selectedEvent.transactionHash, 10, 8)} />
                <StatusRow label="PieceCID" value={shortId(selectedEvent.pieceCid, 12, 10)} />
                <StatusRow label="Provider address" value={shortId(selectedEvent.providerAddress, 10, 8)} />
                {Object.entries(selectedEvent.metadata ?? {}).map(([key, value]) => (
                  <StatusRow key={key} label={key} value={String(value)} />
                ))}
              </dl>
            ) : (
              <p className="panel-copy">No protocol references are selected.</p>
            )}
          </article>
        </aside>
      </section>
    </main>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="status-row">
      <dt>
        {icon}
        {label}
      </dt>
      <dd>{value.toLocaleString()}</dd>
    </div>
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

function createSummary(events: ActivityEvent[]) {
  return {
    uploads: events.filter((event) => event.kind === 'upload').length,
    filesCommitted: events.filter((event) => event.kind === 'piece-added' || event.kind === 'file-indexed').length,
    payments: events.filter((event) => event.kind === 'payment-approved').length,
    passkey: events.filter((event) => event.kind === 'session-authorized' || event.kind === 'session-revoked').length,
    failures: events.filter((event) => event.kind === 'verification-failed').length,
    readbackWarnings: events.filter((event) => event.kind === 'readback-incomplete').length,
    network: events.filter((event) => event.kind === 'network-switched').length,
  };
}

function groupForKind(kind: ActivityKind): ActivityFilter {
  if (kind === 'payment-approved') {
    return 'payments';
  }

  if (kind === 'session-authorized' || kind === 'session-revoked') {
    return 'passkey';
  }

  if (kind === 'verification' || kind === 'verification-failed') {
    return 'verification';
  }

  if (kind === 'readback-incomplete') {
    return 'storage';
  }

  if (kind === 'network-switched') {
    return 'network';
  }

  return 'storage';
}

function iconForKind(kind: ActivityKind): LucideIcon {
  if (kind === 'payment-approved') {
    return DollarSign;
  }

  if (kind === 'session-authorized' || kind === 'session-revoked') {
    return Fingerprint;
  }

  if (kind === 'verification-failed' || kind === 'readback-incomplete') {
    return ShieldAlert;
  }

  if (kind === 'verification') {
    return ShieldCheck;
  }

  if (kind === 'network-switched') {
    return Globe2;
  }

  if (kind === 'dataset-created' || kind === 'dataset-indexed') {
    return Database;
  }

  return CloudUpload;
}

function renderKindIcon(kind: ActivityKind) {
  const Icon = iconForKind(kind);
  return <Icon size={22} />;
}

function eventTone(event: ActivityEvent): 'success' | 'warning' | 'info' | 'danger' {
  if (event.severity === 'error') {
    return 'danger';
  }

  if (event.severity === 'warning' || event.kind === 'verification-failed') {
    return 'warning';
  }

  if (event.kind === 'piece-added' || event.kind === 'dataset-created' || event.kind === 'verification') {
    return 'success';
  }

  return 'info';
}
