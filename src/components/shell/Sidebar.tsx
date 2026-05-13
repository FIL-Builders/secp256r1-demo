import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Database,
  FileText,
  Fingerprint,
  FlaskConical,
  Globe2,
  Home,
  CreditCard,
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

  return (
    <aside className={classNames('shell-sidebar', className)}>
      <div className="shell-sidebar__brand">
        <span className="shell-sidebar__brand-mark">
          <Cloud size={22} />
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

        <section className="shell-sidebar__card">
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
                  <Icon size={16} />
                  <span>
                    <strong>{option === 'mainnet' ? 'Mainnet' : 'Calibration'}</strong>
                    <small>{option === 'mainnet' ? 'Filecoin mainnet · 314' : 'Filecoin testnet · 314159'}</small>
                  </span>
                  {selected ? <CheckCircle2 size={15} /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="shell-sidebar__card">
          <div className="shell-sidebar__card-head">
            <span className="shell-sidebar__card-label">Connected Wallet</span>
            <ChevronRight size={15} />
          </div>
          <div className="shell-sidebar__wallet">
            <span className={classNames('shell-sidebar__wallet-dot', walletConnected && 'shell-sidebar__wallet-dot--connected')} />
            <div>
              <strong>{walletLabel}</strong>
              <small>{walletConnected ? 'Root Wallet connected' : 'Wallet not connected'}</small>
            </div>
          </div>
          <small>{selectedNetworkLabel} scope · {selectedNetworkDetail}</small>
        </section>

      </div>

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
