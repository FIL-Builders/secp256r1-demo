import {
  CheckCircle2,
  Cloud,
  CloudUpload,
  Database,
  ExternalLink,
  FileArchive,
  Fingerprint,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';

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

export function UploadPage({ ctaState }: UploadPageProps) {
  const disabled = ctaState === 'disabled';

  return (
    <main className="page page-upload page-upload-passkey">
      <section className="upload-main">
        <div className="upload-hero-row">
          <div>
            <h1 className="page-title">Upload with Passkey</h1>
            <p className="page-copy">Secure, fast storage authorization with your device.</p>
          </div>
          <div className="passkey-illustration" aria-hidden="true">
            <Cloud size={118} />
            <span>
              <LockKeyhole size={44} />
            </span>
          </div>
        </div>

        <div className="feature-row">
          <span><ShieldCheck size={22} /> Your data, your control</span>
          <span><Fingerprint size={22} /> Passkey protected</span>
          <span><CheckCircle2 size={22} /> On-chain verified</span>
        </div>

        <section className="drop-zone drop-zone--passkey">
          <CloudUpload size={52} />
          <strong>Drag and drop files here</strong>
          <span>or click to browse</span>
          <button type="button" className="primary-button">Choose Files</button>
          <small>Max file size: 50 GB</small>
        </section>

        <section className="upload-file-row">
          <span className="resource-icon resource-icon--archive">
            <FileArchive size={20} />
          </span>
          <div>
            <strong>research-dataset.zip</strong>
            <small>2.45 GB</small>
          </div>
          <span className="badge success"><CheckCircle2 size={14} /> Ready</span>
          <button type="button" aria-label="Remove file"><X size={18} /></button>
        </section>

        <section className="panel upload-details-panel">
          <div className="panel-head">
            <h2 className="panel-title">Upload Details</h2>
            <button type="button" className="secondary-button"><Settings size={15} /> Edit</button>
          </div>
          <div className="upload-detail-grid">
            <div>
              <span>Dataset Name</span>
              <strong>research-dataset</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong><LockKeyhole size={15} /> Private</strong>
            </div>
            <div>
              <span>Storage Provider</span>
              <strong><span className="green-dot" /> Glif Storage</strong>
            </div>
            <div>
              <span>Estimated Cost</span>
              <strong>0.072 FIL</strong>
              <small>~= $0.56 USD</small>
            </div>
          </div>
          <div className="dataset-id-strip">
            <span>Dataset ID (pending):</span>
            <strong>baga6ea4seaq...p3466w2</strong>
          </div>
        </section>

        <button type="button" className="upload-primary-cta" disabled={disabled}>
          <Fingerprint size={20} />
          <span>Authorize &amp; Upload with Passkey</span>
        </button>

        <p className="upload-help-text">
          <LockKeyhole size={15} /> You will be asked to confirm with your device.
        </p>

        <section className="upload-bottom-note">
          <ShieldCheck size={20} />
          <span>Your files are stored with Filecoin storage providers. The blockchain records verify your uploads and data integrity.</span>
          <a href="https://docs.filecoin.io/" target="_blank" rel="noreferrer">Learn more <ExternalLink size={13} /></a>
        </section>
      </section>

      <aside className="upload-rail">
        <article className="panel passkey-session-card">
          <div className="panel-head">
            <h2 className="panel-title">Passkey Session</h2>
            <span className="badge success">Active</span>
          </div>
          <div className="detail-hero">
            <span className="detail-hero-icon detail-hero-icon--success">
              <Fingerprint size={24} />
            </span>
            <div>
              <strong>This device</strong>
              <p>MacBook Pro (macOS)</p>
              <small>Created May 11, 2025</small>
            </div>
          </div>
          <dl className="status-list">
            <div className="status-row">
              <dt>Expires</dt>
              <dd>May 18, 2025</dd>
            </div>
          </dl>
          <button type="button" className="secondary-button"><Settings size={16} /> Manage Session</button>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Recent Activity</h2>
          </div>
          <div className="recent-activity-list">
            <ActivityMini icon={<CloudUpload size={15} />} title="Upload Initiated" detail="research-dataset.zip" time="2m ago" />
            <ActivityMini icon={<FileArchive size={15} />} title="File Prepared" detail="research-dataset.zip" time="2m ago" />
            <ActivityMini icon={<ShieldCheck size={15} />} title="Payment Confirmed" detail="0.072 FIL" time="1m ago" />
            <ActivityMini icon={<Fingerprint size={15} />} title="Passkey Session Active" detail="This device" time="1m ago" />
          </div>
          <a className="panel-link" href="#activity">View all activity <ExternalLink size={13} /></a>
        </article>

        <article className="panel upload-verified-card">
          <div className="detail-hero">
            <span className="detail-hero-icon detail-hero-icon--success">
              <CheckCircle2 size={24} />
            </span>
            <div>
              <strong>On-Chain Verified</strong>
              <p>All uploads are verified on-chain via Synapse and Filecoin.</p>
            </div>
          </div>
          <a className="panel-link" href="https://docs.filecoin.io/" target="_blank" rel="noreferrer">
            Learn how verification works <ExternalLink size={13} />
          </a>
          <footer>Verified by P256VERIFY at 0x0100</footer>
        </article>
      </aside>
    </main>
  );
}

function ActivityMini({
  icon,
  title,
  detail,
  time,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="activity-mini">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <time>{time}</time>
    </div>
  );
}
