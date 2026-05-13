import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  RefreshCw,
  Unplug,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { ShellButton, StatusPill, classNames } from '../shell';

export interface WalletConnectionButtonProps {
  isConnected: boolean;
  isConnecting?: boolean;
  shortAddress?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
  className?: string;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled' | 'onClick' | 'type'>;
}

export function WalletConnectionButton({
  isConnected,
  isConnecting = false,
  shortAddress,
  onConnect,
  onDisconnect,
  className,
  buttonProps,
}: WalletConnectionButtonProps) {
  if (isConnected) {
    return (
      <ShellButton
        {...buttonProps}
        type="button"
        variant="secondary"
        leadingIcon={Unplug}
        className={className}
        onClick={onDisconnect}
        disabled={!onDisconnect}
      >
        Disconnect {shortAddress ? shortAddress : 'wallet'}
      </ShellButton>
    );
  }

  return (
    <ShellButton
      {...buttonProps}
      type="button"
      variant="primary"
      leadingIcon={isConnecting ? RefreshCw : Link2}
      className={className}
      onClick={onConnect}
      disabled={isConnecting}
      aria-busy={isConnecting || undefined}
    >
      {isConnecting ? 'Connecting' : 'Connect wallet'}
    </ShellButton>
  );
}

export interface WalletNetworkSwitchButtonProps {
  isConnected: boolean;
  isSwitchingNetwork?: boolean;
  selectedNetworkLabel: string;
  hasChainMismatch?: boolean;
  onSwitchNetwork?: () => void;
  className?: string;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled' | 'onClick' | 'type'>;
}

export function WalletNetworkSwitchButton({
  isConnected,
  isSwitchingNetwork = false,
  selectedNetworkLabel,
  hasChainMismatch = false,
  onSwitchNetwork,
  className,
  buttonProps,
}: WalletNetworkSwitchButtonProps) {
  if (!isConnected || !hasChainMismatch) {
    return null;
  }

  return (
    <ShellButton
      {...buttonProps}
      type="button"
      variant="secondary"
      leadingIcon={RefreshCw}
      className={className}
      onClick={onSwitchNetwork}
      disabled={isSwitchingNetwork || !onSwitchNetwork}
      aria-busy={isSwitchingNetwork || undefined}
    >
      {isSwitchingNetwork ? 'Switching network' : `Switch to ${selectedNetworkLabel}`}
    </ShellButton>
  );
}

export interface WalletNetworkStatusProps extends HTMLAttributes<HTMLDivElement> {
  isConnected: boolean;
  isConnecting?: boolean;
  isSwitchingNetwork?: boolean;
  shortAddress?: string;
  selectedNetworkLabel: string;
  walletNetworkLabel?: string;
  hasChainMismatch?: boolean;
  error?: string | null;
}

export function WalletNetworkStatus({
  isConnected,
  isConnecting = false,
  isSwitchingNetwork = false,
  shortAddress,
  selectedNetworkLabel,
  walletNetworkLabel,
  hasChainMismatch = false,
  error,
  className,
  ...rest
}: WalletNetworkStatusProps) {
  const connectionLabel = isConnected ? (shortAddress ?? 'Wallet connected') : 'Wallet not connected';
  const connectionDetail = isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Required for live actions';

  return (
    <div {...rest} className={classNames('wallet-status', className)}>
      <StatusPill
        tone={isConnected ? 'success' : isConnecting ? 'info' : 'neutral'}
        icon={isConnected ? Wallet : WifiOff}
        label={connectionLabel}
        detail={connectionDetail}
      />
      {isConnected ? (
        <StatusPill
          tone={hasChainMismatch ? 'warning' : 'success'}
          icon={hasChainMismatch ? AlertTriangle : CheckCircle2}
          label={walletNetworkLabel ?? 'Unknown wallet network'}
          detail={hasChainMismatch ? `Expected ${selectedNetworkLabel}` : 'Wallet network'}
        />
      ) : null}
      {isSwitchingNetwork ? <StatusPill tone="info" icon={RefreshCw} label="Switching network" /> : null}
      {error ? <StatusPill tone="danger" icon={AlertTriangle} label="Wallet error" detail={error} /> : null}
    </div>
  );
}

export interface WalletControlsProps extends HTMLAttributes<HTMLDivElement> {
  isConnected: boolean;
  isConnecting?: boolean;
  isSwitchingNetwork?: boolean;
  shortAddress?: string;
  selectedNetworkLabel: string;
  walletNetworkLabel?: string;
  hasChainMismatch?: boolean;
  error?: string | null;
  onConnect: () => void;
  onDisconnect?: () => void;
  onSwitchNetwork?: () => void;
}

export function WalletControls({
  isConnected,
  isConnecting = false,
  isSwitchingNetwork = false,
  shortAddress,
  selectedNetworkLabel,
  walletNetworkLabel,
  hasChainMismatch = false,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  className,
  ...rest
}: WalletControlsProps) {
  return (
    <div {...rest} className={classNames('wallet-controls', className)}>
      <WalletNetworkStatus
        isConnected={isConnected}
        isConnecting={isConnecting}
        isSwitchingNetwork={isSwitchingNetwork}
        shortAddress={shortAddress}
        selectedNetworkLabel={selectedNetworkLabel}
        walletNetworkLabel={walletNetworkLabel}
        hasChainMismatch={hasChainMismatch}
        error={error}
      />
      <WalletNetworkSwitchButton
        isConnected={isConnected}
        isSwitchingNetwork={isSwitchingNetwork}
        selectedNetworkLabel={selectedNetworkLabel}
        hasChainMismatch={hasChainMismatch}
        onSwitchNetwork={onSwitchNetwork}
      />
      <WalletConnectionButton
        isConnected={isConnected}
        isConnecting={isConnecting}
        shortAddress={shortAddress}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </div>
  );
}
