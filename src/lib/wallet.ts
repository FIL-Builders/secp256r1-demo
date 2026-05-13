import type { Address, DemoNetwork } from './types';
import { getNetworkConfig, isDemoNetwork } from './network';

export type WalletConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
  | 'unknown';

export interface WalletViewState {
  address?: Address;
  chainId?: number;
  status: WalletConnectionStatus;
  selectedNetwork: DemoNetwork;
  selectedChainId: number;
  connectedNetwork?: DemoNetwork;
  connectedNetworkLabel: string;
  selectedNetworkLabel: string;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongChain: boolean;
}

export function shortenAddress(address: string | undefined, chars = 4): string {
  if (!address) {
    return 'Not connected';
  }

  if (address.length <= chars * 2 + 5) {
    return address;
  }

  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function networkForChainId(chainId: number | undefined): DemoNetwork | undefined {
  if (typeof chainId !== 'number') {
    return undefined;
  }

  if (chainId === getNetworkConfig('mainnet').chainId) {
    return 'mainnet';
  }

  if (chainId === getNetworkConfig('calibration').chainId) {
    return 'calibration';
  }

  return undefined;
}

export function chainIdForNetwork(network: DemoNetwork): number {
  return getNetworkConfig(network).chainId;
}

export function createWalletViewState(input: {
  address?: string;
  chainId?: number;
  status?: string;
  selectedNetwork: DemoNetwork;
}): WalletViewState {
  const selectedConfig = getNetworkConfig(input.selectedNetwork);
  const connectedNetwork = networkForChainId(input.chainId);
  const normalizedStatus: WalletConnectionStatus =
    input.status === 'connected' ||
    input.status === 'connecting' ||
    input.status === 'disconnected' ||
    input.status === 'reconnecting'
      ? input.status
      : 'unknown';
  const isConnected = normalizedStatus === 'connected' && Boolean(input.address);

  return {
    address: input.address as Address | undefined,
    chainId: input.chainId,
    status: normalizedStatus,
    selectedNetwork: input.selectedNetwork,
    selectedChainId: selectedConfig.chainId,
    connectedNetwork,
    connectedNetworkLabel: connectedNetwork
      ? getNetworkConfig(connectedNetwork).label
      : input.chainId
        ? `Unsupported chain ${input.chainId}`
        : 'No wallet chain',
    selectedNetworkLabel: selectedConfig.label,
    isConnected,
    isConnecting: normalizedStatus === 'connecting' || normalizedStatus === 'reconnecting',
    isWrongChain: isConnected && input.chainId !== selectedConfig.chainId,
  };
}

export function isSupportedWalletNetwork(value: string): value is DemoNetwork {
  return isDemoNetwork(value);
}
