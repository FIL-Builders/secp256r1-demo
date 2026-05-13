import {
  Activity,
  Database,
  FileText,
  Fingerprint,
  Globe2,
  Home,
  CreditCard,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { classNames } from './utils';
import type { SidebarItemId } from './types';

export interface SidebarProps {
  activeItemId?: SidebarItemId;
  onNavigate?: (itemId: SidebarItemId) => void;
  showVerificationChecks?: boolean;
  className?: string;
}

const items: Array<{
  id: SidebarItemId;
  label: string;
  icon: typeof Home;
  developerOnly?: boolean;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'datasets', label: 'Datasets', icon: Database },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'network-states', label: 'Network States', icon: Globe2 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'passkey-session', label: 'Passkey Session', icon: Fingerprint },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'verification-checks', label: 'Verification Checks', icon: ShieldCheck, developerOnly: true },
];

export function Sidebar({
  activeItemId,
  onNavigate,
  showVerificationChecks = false,
  className,
}: SidebarProps) {
  const visibleItems = items.filter((item) => !item.developerOnly || showVerificationChecks);

  return (
    <aside className={classNames('shell-sidebar', className)}>
      <div className="shell-sidebar__brand">
        <div className="shell-sidebar__brand-kicker">Synapse</div>
        <div className="shell-sidebar__brand-title">P-256 Demo</div>
      </div>

      <nav className="shell-sidebar__nav" aria-label="Primary">
        {visibleItems.map((item) => {
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
    </aside>
  );
}
