import type { ReactNode } from 'react';
import { Fingerprint, FlaskConical, Clock3, ShieldCheck } from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode, RuntimeMode, UploadAvailability } from './types';
import { NetworkToggle } from './NetworkToggle';
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

  return (
    <header className={classNames('shell-navbar', className)}>
      <div className="shell-navbar__primary">
        <NetworkToggle value={network} onChange={onNetworkChange} />
        <StatusPill
          tone={uploadAvailabilityTone(passkeyUploadAvailability)}
          icon={UploadIcon}
          label="Passkey uploads available"
          detail={uploadAvailabilityLabel(passkeyUploadAvailability)}
        />
      </div>

      <div className="shell-navbar__secondary">
        <StatusPill tone="neutral" icon={Fingerprint} label={passkeySessionLabel} detail="Passkey Session" />
        {walletControls}
      </div>
    </header>
  );
}
