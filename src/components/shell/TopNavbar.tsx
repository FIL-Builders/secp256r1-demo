import type { ReactNode } from 'react';
import { ChevronDown, Circle, Fingerprint, FlaskConical, Clock3, ShieldCheck } from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode, RuntimeMode, UploadAvailability } from './types';
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
}: TopNavbarProps) {
  const UploadIcon = uploadAvailabilityIcon(passkeyUploadAvailability);
  const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Calibration';

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
        <StatusPill
          tone={uploadAvailabilityTone(passkeyUploadAvailability)}
          icon={UploadIcon}
          label="Passkey uploads available"
          detail={passkeyUploadAvailability === 'simulation' ? undefined : uploadAvailabilityLabel(passkeyUploadAvailability)}
        />
      </div>

      <div className="shell-navbar__secondary">
        <StatusPill tone="neutral" icon={Fingerprint} label="Passkey Session" detail={passkeySessionLabel} />
        {walletControls}
      </div>
    </header>
  );
}
