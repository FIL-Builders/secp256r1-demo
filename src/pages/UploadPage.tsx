import {
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Database,
  ExternalLink,
  FileArchive,
  FileUp,
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
          <PasskeyCloudIllustration />
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
            <FileUp size={20} />
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
              <strong className="upload-detail-select">
                <span><LockKeyhole size={15} /> Private</span>
                <ChevronDown size={14} />
              </strong>
            </div>
            <div>
              <span>Storage Provider</span>
              <strong className="upload-detail-select">
                <span><span className="green-dot" /> Glif Storage</span>
                <ChevronDown size={14} />
              </strong>
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
          <span><LockKeyhole size={15} /> You will be asked to confirm with your device.</span>
          <span>Use Face ID, Touch ID, Windows Hello, Android unlock, or a security key.</span>
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
              <dd className="upload-session-expiry">
                <span>May 18, 2025 at 10:24 AM</span>
                <span className="badge success">7 days left</span>
              </dd>
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

function PasskeyCloudIllustration() {
  return (
    <div className="passkey-illustration" aria-hidden="true">
      <svg viewBox="0 0 260 150">
        <defs>
          <linearGradient id="passkey-cloud-fill" x1="64" y1="28" x2="188" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#f0ecff" />
          </linearGradient>
          <linearGradient id="passkey-lock" x1="100" y1="65" x2="156" y2="124" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c4dff" />
            <stop offset="1" stopColor="#5834ee" />
          </linearGradient>
        </defs>
        <ellipse cx="130" cy="116" rx="96" ry="22" fill="#ede9ff" opacity="0.66" />
        <path
          d="M54 104h132c18 0 32-14 32-31 0-16-13-30-30-30-4 0-8 1-12 2-8-25-31-42-58-42-30 0-55 22-59 52-17 1-31 15-31 32 0 9 4 17 10 23"
          fill="url(#passkey-cloud-fill)"
          stroke="#8b5cf6"
          strokeWidth="1.8"
        />
        <path d="M64 85h42M58 97h28M74 73h24" stroke="#b6a7ff" strokeLinecap="round" strokeWidth="1.6" />
        <rect x="105" y="74" width="62" height="56" rx="10" fill="url(#passkey-lock)" />
        <path d="M119 74V58c0-12 8-20 18-20s18 8 18 20v16" fill="none" stroke="#5b3df5" strokeLinecap="round" strokeWidth="6" />
        <circle cx="136" cy="101" r="7" fill="#ffffff" />
        <path d="M136 107v11" stroke="#ffffff" strokeLinecap="round" strokeWidth="5" />
        <rect x="176" y="94" width="52" height="52" rx="10" fill="#ffffff" stroke="#b6a7ff" strokeWidth="1.5" />
        <path
          d="M202 122c0-8 5-13 12-13 6 0 10 4 10 10m-32 7c0-14 9-23 22-23 10 0 18 7 18 17m-32 10c0-5 3-9 8-9 4 0 7 3 7 8m-23 6c-2-4-3-8-3-13 0-17 11-29 26-29 13 0 23 9 25 22"
          fill="none"
          stroke="#6d4aff"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
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
