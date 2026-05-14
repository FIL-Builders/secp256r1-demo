import type { ReactNode } from 'react';
import { Bell, CheckCircle2, ChevronDown, Circle, Fingerprint, FlaskConical, Clock3, Info, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
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
      return CheckCircle2;
  }
}

export function TopNavbar({
  network,
  onNetworkChange,
  passkeyUploadAvailability,
  walletLabel,
  passkeySessionLabel,
  walletControls,
  className,
  activeItemId,
}: TopNavbarProps) {
  const UploadIcon = uploadAvailabilityIcon(passkeyUploadAvailability);
  const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Calibration';
  const networkDetail = network === 'mainnet' ? 'Filecoin Mainnet · 314' : 'Filecoin Testnet · 314159';
  const networkChainId = network === 'mainnet' ? '314' : '314159';
  const showPasskeyUploads = activeItemId === 'files';
  const showPrecompileStatus = activeItemId !== 'files';
  const showNetworkDetail = activeItemId === 'upload';
  const showNetworkInline = activeItemId === 'activity';
  const walletFirst = activeItemId === 'upload' || activeItemId === 'datasets';
  const showBell = activeItemId !== 'files' && activeItemId !== 'activity';
  const showAvatar = activeItemId !== 'activity';
  const precompileLabel = activeItemId === 'activity' ? 'P-256 Precompile' : activeItemId === 'upload' ? 'P-256 Precompile' : 'P256VERIFY';
  const precompileDetail = activeItemId === 'activity' ? 'Available' : activeItemId === 'datasets' ? '0x0100' : activeItemId === 'upload' ? 'Detected at 0x0100' : '0x0100';
  const PrecompileIcon = activeItemId === 'datasets' ? undefined : activeItemId === 'upload' ? CheckCircle2 : activeItemId === 'activity' ? CheckCircle2 : ShieldCheck;
  const passkeySessionPill = (
    <StatusPill
      className={classNames(
        'shell-status-pill--passkey-session',
        activeItemId === 'upload' && 'shell-status-pill--passkey-session-upload',
        activeItemId === 'activity' && 'shell-status-pill--passkey-session-activity',
      )}
      tone="neutral"
      icon={Fingerprint}
      label="Passkey Session"
      detail={passkeySessionLabel}
    />
  );

  if (activeItemId === 'home') {
    return (
      <header className={classNames('shell-navbar shell-navbar--home', className)}>
        <div className="shell-home-network-toggle" role="group" aria-label="Network selection">
          {(['mainnet', 'calibration'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={classNames(option === network && 'is-active')}
              aria-pressed={option === network}
              onClick={() => onNetworkChange(option)}
            >
              {option === 'mainnet' ? 'Mainnet' : 'Calibration'}
            </button>
          ))}
        </div>

        <div className="shell-home-navbar-actions">
          <div className="shell-home-precompile">
            <span><CheckCircle2 size={22} /></span>
            <strong>P256VERIFY</strong>
            <small>Available</small>
            <Info size={13} />
          </div>
          <button type="button" className="shell-home-wallet">
            <span><WalletCards size={19} /></span>
            <strong>{walletLabel}</strong>
            <small>Root Wallet</small>
            <ChevronDown size={15} />
          </button>
          <button type="button" className="shell-home-passkey">
            <span><Fingerprint size={20} /></span>
            <strong>Passkey Session</strong>
            <small>{passkeySessionLabel}</small>
            <ChevronDown size={15} />
          </button>
          <span className="shell-home-divider" />
          <button type="button" className="shell-home-bell" aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className={classNames('shell-navbar', className)}>
      <div className="shell-navbar__primary">
        <label className={classNames('shell-network-select', showNetworkDetail && 'shell-network-select--detailed', showNetworkInline && 'shell-network-select--inline')}>
          <Circle className="shell-network-select__dot" aria-hidden="true" />
          <span className="shell-network-select__copy">
            <span>{networkLabel}</span>
            {showNetworkDetail ? <small>{networkDetail}</small> : null}
            {showNetworkInline ? <small>{networkChainId}</small> : null}
          </span>
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
        {showPrecompileStatus ? (
          <StatusPill
            className={classNames(
              'shell-status-pill--precompile',
              (activeItemId === 'activity' || activeItemId === 'datasets') && 'shell-status-pill--precompile-available',
              activeItemId === 'datasets' && 'shell-status-pill--precompile-dataset',
            )}
            tone={activeItemId === 'upload' || activeItemId === 'activity' || activeItemId === 'datasets' ? 'success' : 'neutral'}
            icon={PrecompileIcon}
            label={precompileLabel}
            detail={precompileDetail}
          />
        ) : null}
      </div>

      <div className="shell-navbar__secondary">
        {walletFirst ? walletControls : passkeySessionPill}
        {walletFirst ? passkeySessionPill : walletControls}
        {showBell ? (
          <button type="button" className="shell-icon-control" aria-label="Notifications">
            <Bell size={17} />
          </button>
        ) : null}
        {showAvatar ? (
          <button type="button" className={classNames('shell-avatar-control', activeItemId === 'files' && 'shell-avatar-control--icon')} aria-label="Account menu">
            {activeItemId === 'files' ? <UserRound size={18} /> : 'MS'}
            {activeItemId === 'files' ? null : <ChevronDown size={14} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </header>
  );
}
