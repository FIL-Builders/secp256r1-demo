import type { DemoNetwork, NetworkConfig } from './types';
import { P256_VERIFY_ADDRESS } from '../data/p256-detection-vector';

export const NETWORK_CONFIGS: Record<DemoNetwork, NetworkConfig> = {
  mainnet: {
    key: 'mainnet',
    label: 'Mainnet',
    chainId: 314,
    rpcUrl: import.meta.env?.VITE_FILECOIN_MAINNET_RPC_URL ?? 'https://api.node.glif.io/rpc/v1',
    explorerUrl: 'https://filfox.info/en',
    p256VerifierAddress: P256_VERIFY_ADDRESS,
    nativeTokenSymbol: 'FIL',
  },
  calibration: {
    key: 'calibration',
    label: 'Calibration',
    chainId: 314159,
    rpcUrl:
      import.meta.env?.VITE_FILECOIN_CALIBRATION_RPC_URL ??
      'https://api.calibration.node.glif.io/rpc/v1',
    explorerUrl: 'https://calibration.filfox.info/en',
    p256VerifierAddress: P256_VERIFY_ADDRESS,
    nativeTokenSymbol: 'tFIL',
  },
};

export function isDemoNetwork(value: string): value is DemoNetwork {
  return value === 'mainnet' || value === 'calibration';
}

export function getNetworkConfig(network: DemoNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

export function getNetworkLabel(network: DemoNetwork): string {
  return NETWORK_CONFIGS[network].label;
}

