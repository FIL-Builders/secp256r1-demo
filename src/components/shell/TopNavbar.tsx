import { CreditCard, Fingerprint, FlaskConical, Globe, Clock3, ShieldCheck } from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode, RuntimeMode, UploadAvailability } from './types';
import { NetworkToggle } from './NetworkToggle';
import { RuntimeModeToggle } from './RuntimeModeToggle';
import { StatusPill } from './StatusPill';

export interface TopNavbarProps {
  network: NetworkMode;
  onNetworkChange: (value: NetworkMode) => void;
  runtimeMode: RuntimeMode;
  onRuntimeModeChange: (value: RuntimeMode) => void;
  passkeyUploadAvailability: UploadAvailability;
  walletLabel: string;
  passkeySessionLabel: string;
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
      return 'info';
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

function networkLabel(value: NetworkMode) {
  return value === 'mainnet' ? 'Mainnet' : 'Calibration';
}

function networkIcon(value: NetworkMode) {
  return value === 'mainnet' ? Globe : FlaskConical;
}

export function TopNavbar({
  network,
  onNetworkChange,
  runtimeMode,
  onRuntimeModeChange,
  passkeyUploadAvailability,
  walletLabel,
  passkeySessionLabel,
  className,
  showVerificationChecks = false,
}: TopNavbarProps) {
  const NetworkIcon = networkIcon(network);
  const UploadIcon = uploadAvailabilityIcon(passkeyUploadAvailability);

  return (
    <header className={classNames('shell-navbar', className)}>
      <div className="shell-navbar__primary">
        <div className="shell-navbar__title-group">
          <div className="shell-navbar__eyebrow">App shell</div>
          <div className="shell-navbar__title">Synapse P-256 Demo</div>
        </div>

        <div className="shell-navbar__network">
          <StatusPill
            tone="neutral"
            icon={NetworkIcon}
            label={networkLabel(network)}
            detail="Network"
          />
          <NetworkToggle value={network} onChange={onNetworkChange} />
        </div>

        <div className="shell-navbar__runtime">
          <StatusPill
            tone={runtimeMode === 'live' ? 'success' : runtimeMode === 'pending-network' ? 'warning' : 'info'}
            label={
              runtimeMode === 'live'
                ? 'Live'
                : runtimeMode === 'pending-network'
                  ? 'Pending network'
                  : 'Simulation'
            }
            detail="Runtime"
          />
          <RuntimeModeToggle value={runtimeMode} onChange={onRuntimeModeChange} />
        </div>
      </div>

      <div className="shell-navbar__secondary">
        <StatusPill
          tone={uploadAvailabilityTone(passkeyUploadAvailability)}
          icon={UploadIcon}
          label={uploadAvailabilityLabel(passkeyUploadAvailability)}
          detail="Passkey upload"
        />
        <StatusPill tone="neutral" icon={CreditCard} label={walletLabel} detail="Wallet" />
        <StatusPill tone="neutral" icon={Fingerprint} label={passkeySessionLabel} detail="Passkey session" />
        {showVerificationChecks ? (
          <StatusPill tone="info" icon={ShieldCheck} label="Verification checks enabled" detail="Developer mode" />
        ) : null}
      </div>
    </header>
  );
}
