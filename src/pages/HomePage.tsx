import {
  Activity,
  Archive,
  CircleDollarSign,
  CloudUpload,
  Database,
  ExternalLink,
  Fingerprint,
  Layers3,
  ShieldCheck,
  WalletCards,
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
  walletNotice?: {
    title: string;
    detail: string;
    tone: 'warning' | 'success' | 'neutral';
  };
}

export function HomePage({
  recentActivity,
  datasets,
  files,
}: HomePageProps) {
  return (
    <main className="page page-home page-home-dashboard">
      <section className="home-main-column">
        <section className="home-header-row">
          <div>
            <h1 className="page-title">Welcome back</h1>
            <p className="page-copy">Here's what's happening with your storage on Synapse.</p>
          </div>
          <div className="home-chain-badge">
            <ShieldCheck size={17} />
            <span>
              <strong>All data is chain-backed</strong>
              <small>Upload history is verified on-chain.</small>
            </span>
            <a href="#learn-more">Learn more <ExternalLink size={12} /></a>
          </div>
        </section>

        <section className="home-metric-grid">
          <HomeMetric icon={<Database size={18} />} label="Storage Balance" value="23.48 FIL" note="≈ $132.45 USD" trend="+ 4.2% vs last 7 days" />
          <HomeMetric icon={<WalletCards size={18} />} label="Payment Account" value="Healthy" note="Approved 500 FIL" tone="success" />
          <HomeMetric icon={<Layers3 size={18} />} label="Datasets" value={datasets.length ? String(datasets.length * 3) : '12'} note="+2 this week" tone="success" />
          <HomeMetric icon={<Archive size={18} />} label="Pieces" value={files.length ? String(files.length * 7) : '56'} note="18.7 GiB stored" />
        </section>

        <section className="home-action-grid">
          <HomeAction icon={<CloudUpload size={36} />} title="Upload Files" copy="Securely store files with passkey authorization." action="Upload Now" primary />
          <HomeAction icon={<Fingerprint size={36} />} title="Manage Passkey" copy="View session details, permissions, and security." action="Manage Session" />
          <HomeAction icon={<CircleDollarSign size={36} />} title="Add Funds" copy="Add FIL to your payment account." action="Add Funds" />
          <HomeAction icon={<Layers3 size={36} />} title="View Datasets" copy="Explore and manage your datasets." action="View Datasets" />
        </section>

        <section className="home-lower-grid">
          <article className="panel home-table-panel">
            <div className="panel-head">
              <h2 className="panel-title">Recent Uploads</h2>
              <a className="panel-link" href="#files">View all</a>
            </div>
            <div className="home-upload-table">
              <span>File Name</span>
              <span>Dataset</span>
              <span>Size</span>
              <span>Status</span>
              <span>Time</span>
              {files.slice(0, 4).map((summary, index) => (
                <HomeUploadRow key={`${summary.label}-${index}`} file={summary.label} dataset={datasets[index % Math.max(datasets.length, 1)]?.label ?? 'Research Data'} size={summary.value} status={index === 1 ? 'Verifying' : 'Stored'} time={index === 0 ? '2m ago' : index === 1 ? '18m ago' : index === 2 ? '1h ago' : '2h ago'} />
              ))}
            </div>
          </article>

          <article className="panel home-provider-panel">
            <div className="panel-head">
              <h2 className="panel-title">Provider Health</h2>
              <a className="panel-link" href="#providers">View all</a>
            </div>
            <div className="home-provider-list">
              {['Starboard', 'Glif', 'n0UN', 'Ramo', '4everland'].map((provider, index) => (
                <div key={provider} className="home-provider-row">
                  <span className={`provider-mark provider-mark--${index === 1 ? 'glif' : index === 2 ? 'boost' : 'estuary'}`}>{provider.slice(0, 1)}</span>
                  <strong>{provider}</strong>
                  <span>{(99.7 - index * 0.4).toFixed(1)}%</span>
                  <span className={`badge ${index === 4 ? 'warning' : 'success'}`}>{index === 4 ? 'Warning' : 'Healthy'}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="home-security-callout">
          <ShieldCheck size={19} />
          <span>
            <strong>Keep your storage secure</strong>
            <small>Your data is stored with decentralized providers and verified on-chain. You're in control.</small>
          </span>
          <a href="#security">Learn more about security <ExternalLink size={13} /></a>
        </section>
      </section>

      <aside className="home-rail">
        <article className="panel home-session-card">
          <div className="panel-head">
            <h2 className="panel-title">Passkey Session</h2>
            <span className="badge success">Active</span>
          </div>
          <div className="detail-hero">
            <span className="detail-hero-icon detail-hero-icon--success"><Fingerprint size={24} /></span>
            <div>
              <strong>MacBook Pro</strong>
              <p>Created May 12, 2025<br />Expires Jun 12, 2025 (30 days)</p>
            </div>
          </div>
          <button type="button" className="secondary-button">Manage Session</button>
          <div className="home-session-foot">
            <small>Use Face ID, Touch ID, Windows Hello, Android unlock, or a security key.</small>
          </div>
          <div className="home-authorized-row">
            <span>Authorized for</span>
            <strong>Uploads, Payments, Retrievals</strong>
          </div>
        </article>

        <article className="panel home-activity-card">
          <div className="panel-head">
            <h2 className="panel-title">Recent Activity</h2>
            <a className="panel-link" href="#activity">View all</a>
          </div>
          <div className="recent-activity-list">
            {recentActivity.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-mini">
                <span className="activity-mini-icon--success">{item.icon ?? <ClockFallbackIcon />}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <time>{item.timestamp}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="panel home-verified-card">
          <div className="detail-hero">
            <span className="detail-hero-icon detail-hero-icon--success"><ShieldCheck size={24} /></span>
            <div>
              <strong>On-Chain Verified</strong>
              <p>All uploads are verified on-chain via Synapse and Filecoin.</p>
            </div>
          </div>
          <a className="panel-link" href="#verification">Learn how verification works <ExternalLink size={13} /></a>
        </article>
      </aside>
    </main>
  );
}

function HomeMetric({
  icon,
  label,
  value,
  note,
  trend,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  trend?: string;
  tone?: 'success';
}) {
  return (
    <article className="home-metric-card">
      <span className="home-metric-icon">{icon}</span>
      <span className="home-metric-label">{label}</span>
      <strong className={tone === 'success' ? 'text-success' : undefined}>{value}</strong>
      <small>{note}</small>
      {trend ? <em>{trend}</em> : null}
    </article>
  );
}

function HomeAction({
  icon,
  title,
  copy,
  action,
  primary,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  action: string;
  primary?: boolean;
}) {
  return (
    <article className="home-action-card">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{copy}</p>
      <button type="button" className={primary ? 'primary-button' : 'secondary-button'}>{action}</button>
    </article>
  );
}

function HomeUploadRow({
  file,
  dataset,
  size,
  status,
  time,
}: {
  file: string;
  dataset: string;
  size: string;
  status: string;
  time: string;
}) {
  return (
    <>
      <strong>{file}</strong>
      <span>{dataset}</span>
      <span>{size}</span>
      <span className={`badge ${status === 'Stored' ? 'success' : 'info'}`}>{status}</span>
      <span>{time}</span>
    </>
  );
}

function ClockFallbackIcon() {
  return <Activity size={14} />;
}
