import { QueryClient } from '@tanstack/react-query';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { filecoin, filecoinCalibration } from 'viem/chains';
import { NETWORK_CONFIGS } from './lib/network';

export const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [filecoin, filecoinCalibration],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [filecoin.id]: http(NETWORK_CONFIGS.mainnet.rpcUrl),
    [filecoinCalibration.id]: http(NETWORK_CONFIGS.calibration.rpcUrl),
  },
});
