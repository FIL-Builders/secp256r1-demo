import type { ReactNode } from 'react';
import { Bell, ChevronDown, Circle, Fingerprint, FlaskConical, Clock3, ShieldCheck } from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode, RuntimeMode, SidebarItemId, UploadAvailability } from './types';
import { StatusPill } from './StatusPill';

export interface TopNavbarProps {
  network: NetworkMode;
  onNetworkChange: (value: NetworkMode) => void;
  runtimeMode: RuntimeMode;
  onRuntimeModeChange: (value: RuntimeMode) => void;
  passkeyUploadAvailability: UploadAvailability;
  walletLabel: string;
  passkeySessionLabel: string;
  walletControls?: ReactNode;
  className?: string;
  activeItemId?: SidebarItemId;
  showVerificationChecks?: boolean;
}

function uploadAvailabilityTone(value: UploadAvailability) {
  switch (value) {
    case 'available':
      return 'success';
    case 'pending-network':
      return 'warning';
    case 'unavailable':
      return 'danger';
    case 'simulation':
      return 'success';
  }
}

function uploadAvailabilityLabel(value: UploadAvailability) {
  switch (value) {
    case 'available':
      return 'Available';
    case 'pending-network':
      return 'Pending network';
    case 'unavailable':
      return 'Unavailable';
    case 'simulation':
      return 'Simulation';
  }
}

function uploadAvailabilityIcon(value: UploadAvailability) {
  switch (value) {
    case 'available':
      return ShieldCheck;
    case 'pending-network':
      return Clock3;
    case 'unavailable':
      return FlaskConical;
    case 'simulation':
      return FlaskConical;
  }
}

export function TopNavbar({
  network,
  onNetworkChange,
  passkeyUploadAvailability,
  passkeySessionLabel,
  walletControls,
  className,
  activeItemId,
}: TopNavbarProps) {
  const UploadIcon = uploadAvailabilityIcon(passkeyUploadAvailability);
  const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Calibration';
  const showPasskeyUploads = activeItemId === 'files';

  return (
    <header className={classNames('shell-navbar', className)}>
      <div className="shell-navbar__primary">
        <label className="shell-network-select">
          <Circle className="shell-network-select__dot" aria-hidden="true" />
          <span>{networkLabel}</span>
          <ChevronDown size={15} aria-hidden="true" />
          <select
            value={network}
            onChange={(event) => onNetworkChange(event.target.value as NetworkMode)}
            aria-label="Network selection"
          >
            <option value="mainnet">Mainnet</option>
            <option value="calibration">Calibration</option>
          </select>
        </label>
        {showPasskeyUploads ? (
          <StatusPill
            tone={uploadAvailabilityTone(passkeyUploadAvailability)}
            icon={UploadIcon}
            label="Passkey uploads available"
            detail={passkeyUploadAvailability === 'simulation' ? undefined : uploadAvailabilityLabel(passkeyUploadAvailability)}
          />
        ) : null}
        <StatusPill
          className="shell-status-pill--precompile"
          tone="neutral"
          icon={ShieldCheck}
          label="P256VERIFY"
          detail="0x0100"
        />
      </div>

      <div className="shell-navbar__secondary">
        <StatusPill tone="neutral" icon={Fingerprint} label="Passkey Session" detail={passkeySessionLabel} />
        {walletControls}
        <button type="button" className="shell-icon-control" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <button type="button" className="shell-avatar-control" aria-label="Account menu">
          MS
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
