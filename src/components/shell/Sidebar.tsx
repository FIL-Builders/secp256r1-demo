import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Database,
  FileText,
  Fingerprint,
  FlaskConical,
  Globe2,
  HelpCircle,
  Home,
  CreditCard,
  RefreshCw,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode, RuntimeMode, SidebarItemId } from './types';
import { RuntimeModeToggle } from './RuntimeModeToggle';

export interface SidebarProps {
  activeItemId?: SidebarItemId;
  onNavigate?: (itemId: SidebarItemId) => void;
  showVerificationChecks?: boolean;
  network?: NetworkMode;
  onNetworkChange?: (value: NetworkMode) => void;
  runtimeMode?: RuntimeMode;
  onRuntimeModeChange?: (value: RuntimeMode) => void;
  storageBalance?: {
    value: string;
    detail: string;
  };
  walletLabel?: string;
  walletConnected?: boolean;
  className?: string;
}

const items: Array<{
  id: SidebarItemId;
  label: string;
  icon: typeof Home;
  secondary?: boolean;
  developerOnly?: boolean;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'datasets', label: 'Datasets', icon: Database },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'network-states', label: 'Network States', icon: Globe2, secondary: true },
  { id: 'payments', label: 'Payments', icon: CreditCard, secondary: true },
  { id: 'passkey-session', label: 'Passkey Session', icon: Fingerprint, secondary: true },
  { id: 'settings', label: 'Settings', icon: Settings, secondary: true },
  { id: 'verification-checks', label: 'Verification Checks', icon: ShieldCheck, secondary: true, developerOnly: true },
];

export function Sidebar({
  activeItemId,
  onNavigate,
  showVerificationChecks = false,
  network = 'calibration',
  onNetworkChange,
  runtimeMode = 'pending-network',
  onRuntimeModeChange,
  storageBalance,
  walletLabel = 'Not connected',
  walletConnected = false,
  className,
}: SidebarProps) {
  const visibleItems = items.filter((item) => !item.developerOnly || showVerificationChecks);
  const primaryItems = visibleItems.filter((item) => !item.secondary);
  const secondaryItems = visibleItems.filter((item) => item.secondary);
  const selectedNetworkLabel = network === 'mainnet' ? 'Mainnet' : 'Calibration';
  const selectedNetworkDetail = network === 'mainnet' ? 'Filecoin mainnet · 314' : 'Filecoin testnet · 314159';
  const isFilesPage = activeItemId === 'files';
  const isDatasetsPage = activeItemId === 'datasets';
  const isActivityPage = activeItemId === 'activity';
  const isUploadPage = activeItemId === 'upload';
  const networkCard = (
    <section key="network" className={classNames('shell-sidebar__card', isActivityPage && 'shell-sidebar__network-card--activity')}>
      <div className="shell-sidebar__card-head">
        <span className="shell-sidebar__card-label">Network</span>
        <Globe2 size={14} />
      </div>
      <div className="shell-sidebar__choices" role="group" aria-label="Network selection">
        {(['mainnet', 'calibration'] as const).map((option) => {
          const selected = option === network;
          const Icon = option === 'mainnet' ? Globe2 : FlaskConical;

          return (
            <button
              key={option}
              type="button"
              className={classNames('shell-sidebar__choice', selected && 'shell-sidebar__choice--selected')}
              aria-pressed={selected}
              onClick={() => onNetworkChange?.(option)}
            >
              {isFilesPage && selected ? <span className="shell-sidebar__choice-dot" /> : <Icon size={16} />}
              <span>
                <strong>{option === 'mainnet' ? 'Mainnet' : 'Calibration'}</strong>
                <small>{option === 'mainnet' ? 'Filecoin mainnet · 314' : 'Filecoin testnet · 314159'}</small>
              </span>
              {selected ? <CheckCircle2 size={15} /> : null}
            </button>
          );
        })}
      </div>
      {isActivityPage ? (
        <button type="button" className="shell-sidebar__switch-button" onClick={() => onNetworkChange?.(network === 'mainnet' ? 'calibration' : 'mainnet')}>
          <RefreshCw size={14} />
          <span>Switch Network</span>
        </button>
      ) : null}
    </section>
  );
  const walletCard = (
    <section
      key="wallet"
      className={classNames(
        'shell-sidebar__card',
        isDatasetsPage && 'shell-sidebar__wallet-card--datasets',
        isUploadPage && 'shell-sidebar__wallet-card--upload',
        isFilesPage && 'shell-sidebar__wallet-card--files',
        isActivityPage && 'shell-sidebar__wallet-card--activity',
      )}
    >
      <div className="shell-sidebar__card-head">
        <span className="shell-sidebar__card-label">Connected Wallet</span>
        {isFilesPage || isUploadPage || isDatasetsPage ? null : <ChevronRight size={15} />}
      </div>
      <div className="shell-sidebar__wallet">
        <span
          className={classNames(
            isFilesPage || isActivityPage || isDatasetsPage ? 'shell-sidebar__wallet-avatar' : 'shell-sidebar__wallet-dot',
            !isFilesPage && !isActivityPage && !isDatasetsPage && walletConnected && 'shell-sidebar__wallet-dot--connected',
          )}
        />
        <div>
          <strong>{walletLabel}</strong>
          {isFilesPage || isUploadPage ? null : <small>{walletConnected ? 'Root Wallet' : 'Wallet not connected'}</small>}
        </div>
        {isFilesPage || isActivityPage || isUploadPage || isDatasetsPage ? <Copy className="shell-sidebar__wallet-copy" size={14} /> : null}
      </div>
      {isFilesPage ? (
        <a className="shell-sidebar__wallet-link" href="https://filfox.info/" target="_blank" rel="noreferrer">
          View on Explorer
        </a>
      ) : isUploadPage ? (
        <span className="shell-sidebar__connected-pill">Connected</span>
      ) : isActivityPage || isDatasetsPage ? (
        <span className="shell-sidebar__connected-pill">Connected</span>
      ) : (
        <small>{selectedNetworkLabel} scope · {selectedNetworkDetail}</small>
      )}
    </section>
  );
  const footerCards = activeItemId === 'files' ? [networkCard, walletCard] : [walletCard, networkCard];

  return (
    <aside className={classNames('shell-sidebar', className)}>
      <div className="shell-sidebar__brand">
        <span className="shell-sidebar__brand-mark">
          <SynapseBrandMark />
        </span>
        <div>
          <div className="shell-sidebar__brand-title">Synapse</div>
          <div className="shell-sidebar__brand-kicker">P-256 passkey demo</div>
        </div>
      </div>

      <nav className="shell-sidebar__nav" aria-label="Primary">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const selected = item.id === activeItemId;

          return (
            <button
              key={item.id}
              type="button"
              className={classNames(
                'shell-sidebar__item',
                selected && 'shell-sidebar__item--active',
              )}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <Icon className="shell-sidebar__item-icon" aria-hidden="true" />
              <span className="shell-sidebar__item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="shell-sidebar__footer">
        <section className="shell-sidebar__card shell-sidebar__balance">
          <span className="shell-sidebar__card-label">Storage Balance</span>
          <strong>{storageBalance?.value ?? 'Readiness pending'}</strong>
          <small>{storageBalance?.detail ?? 'Connect a Root Wallet to check funds.'}</small>
          <button type="button" className="shell-sidebar__card-action">
            <CircleDollarSign size={16} />
            <span>Add Funds</span>
          </button>
        </section>

        {footerCards}

      </div>

      {isActivityPage ? (
        <div className="shell-sidebar__version-footer">
          <span><SynapseBrandMark /> Synapse v0.9.0</span>
          <a href="https://docs.filecoin.io/" target="_blank" rel="noreferrer"><HelpCircle size={14} /> Help &amp; Docs</a>
        </div>
      ) : isDatasetsPage ? (
        <div className="shell-sidebar__datasets-help">
          <span><HelpCircle size={16} /> Need help?</span>
          <ChevronRight size={15} />
        </div>
      ) : (
        <section className="shell-sidebar__card shell-sidebar__help-card">
          <div className="shell-sidebar__card-head">
            <span className="shell-sidebar__card-label">Need help?</span>
            <HelpCircle size={14} />
          </div>
          <small>Read docs or contact support.</small>
          <a href="https://docs.filecoin.io/" target="_blank" rel="noreferrer">Documentation</a>
          <a href="https://github.com/FilOzone/synapse-sdk" target="_blank" rel="noreferrer">Support</a>
        </section>
      )}

      <nav className="shell-sidebar__nav shell-sidebar__secondary-nav" aria-label="Secondary">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const selected = item.id === activeItemId;

          return (
            <button
              key={item.id}
              type="button"
              className={classNames(
                'shell-sidebar__item',
                selected && 'shell-sidebar__item--active',
              )}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <Icon className="shell-sidebar__item-icon" aria-hidden="true" />
              <span className="shell-sidebar__item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="shell-sidebar__card shell-sidebar__mode-card">
        <span className="shell-sidebar__card-label">Runtime Mode</span>
        <RuntimeModeToggle
          value={runtimeMode}
          onChange={(value) => onRuntimeModeChange?.(value)}
          className="shell-sidebar__runtime-toggle"
        />
      </section>
    </aside>
  );
}

function SynapseBrandMark() {
  return (
    <svg viewBox="0 0 44 32" role="img" aria-label="Synapse">
      <path
        d="M16 25.5h-4.1a8 8 0 0 1-1.5-15.9 10.2 10.2 0 0 1 19.5.9 7.7 7.7 0 0 1 2.4-.4 7.7 7.7 0 1 1 0 15.4h-3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
      />
      <path
        d="M19 19.2h8.3v7.3H19zM20.8 19.2v-2.4a2.4 2.4 0 0 1 4.8 0v2.4M23.1 22v1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}
