#!/usr/bin/env node
import { Synapse, calibration, formatUnits, mainnet } from '@filoz/synapse-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const NETWORKS = {
  mainnet: {
    chain: mainnet,
    label: 'Mainnet',
    rpcUrl: process.env.FILECOIN_MAINNET_RPC_URL ?? 'https://api.node.glif.io/rpc/v1',
  },
  calibration: {
    chain: calibration,
    label: 'Calibration',
    rpcUrl:
      process.env.FILECOIN_CALIBRATION_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1',
  },
};
const PRIVATE_KEY_ENV_CANDIDATES = {
  mainnet: ['SYNAPSE_MAINNET_PRIVATE_KEY', 'SYNAPSE_PRIVATE_KEY'],
  calibration: ['SYNAPSE_CALIBRATION_PRIVATE_KEY', 'SYNAPSE_PRIVATE_KEY', 'RECALL_PRIVATE_KEY'],
};
const SAMPLE_UPLOAD_SIZE_BYTES = 1_048_576n;

function parseNetwork() {
  const networkArgIndex = process.argv.findIndex((arg) => arg === '--network');
  if (networkArgIndex >= 0) {
    return process.argv[networkArgIndex + 1];
  }

  const inlineNetworkArg = process.argv.find((arg) => arg.startsWith('--network='));
  if (inlineNetworkArg) {
    return inlineNetworkArg.slice('--network='.length);
  }

  return 'calibration';
}

function privateKeyFromEnv(network) {
  const invalidEnvNames = [];

  for (const envName of PRIVATE_KEY_ENV_CANDIDATES[network]) {
    const value = process.env[envName];
    const normalized = normalizePrivateKey(value);
    if (normalized) {
      return {
        envName,
        value: normalized,
      };
    }

    if (value) {
      invalidEnvNames.push(envName);
    }
  }

  return { invalidEnvNames };
}

function normalizePrivateKey(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const withoutPrefix = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]{64}$/.test(withoutPrefix)) {
    return `0x${withoutPrefix}`;
  }

  try {
    const decoded = Buffer.from(trimmed.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
    if (decoded.byteLength === 32) {
      return `0x${decoded.toString('hex')}`;
    }
  } catch {
    return null;
  }

  return null;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatToken(value) {
  return formatUnits(value, 18);
}

function safeRpcLabel(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '[custom RPC URL]';
  }
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  let output = message;

  for (const config of Object.values(NETWORKS)) {
    output = output.replaceAll(config.rpcUrl, safeRpcLabel(config.rpcUrl));
  }

  return output.replace(/https?:\/\/[^\s)]+/g, (match) => safeRpcLabel(match));
}

async function main() {
  const network = parseNetwork();
  const config = NETWORKS[network];
  if (!config) {
    console.error(`Unsupported network "${network}". Use "mainnet" or "calibration".`);
    process.exitCode = 1;
    return;
  }

  const privateKey = privateKeyFromEnv(network);
  if ('invalidEnvNames' in privateKey) {
    const envNames = PRIVATE_KEY_ENV_CANDIDATES[network].join(', ');
    const suffix =
      privateKey.invalidEnvNames.length > 0
        ? ` Found env var(s) with unsupported format: ${privateKey.invalidEnvNames.join(', ')}.`
        : '';
    console.error(
      `Missing private key env var. Set one of ${envNames} to a 32-byte hex or base64 private key.${suffix}`,
    );
    process.exitCode = 1;
    return;
  }

  const account = privateKeyToAccount(privateKey.value);
  const synapse = Synapse.create({
    account,
    chain: config.chain,
    source: 'secp256r1-demo',
    transport: http(config.rpcUrl),
  });

  console.log(`${config.label} Synapse readiness`);
  console.log(`  RPC: ${safeRpcLabel(config.rpcUrl)}`);
  console.log(`  Wallet: ${shortAddress(account.address)} (${privateKey.envName})`);

  const [
    blockNumber,
    activeProviderCount,
    providerCount,
    accountInfo,
    filBalance,
    usdfcBalance,
    uploadCosts,
  ] = await Promise.all([
    synapse.client.getBlockNumber({ cacheTime: 0 }),
    synapse.providers.activeProviderCount(),
    synapse.providers.getProviderCount(),
    synapse.payments.accountInfo(),
    synapse.payments.walletBalance(),
    synapse.payments.walletBalance({ token: 'USDFC' }),
    synapse.storage.getUploadCosts({
      dataSize: SAMPLE_UPLOAD_SIZE_BYTES,
      isNewDataSet: true,
      withCDN: false,
    }),
  ]);

  console.log(`  Block: ${blockNumber.toString()}`);
  console.log(`  Providers: ${activeProviderCount.toString()} active / ${providerCount.toString()} total`);
  console.log(`  Wallet FIL: ${formatToken(filBalance)}`);
  console.log(`  Wallet USDFC: ${formatToken(usdfcBalance)}`);
  console.log(`  Payment funds: ${formatToken(accountInfo.funds)} USDFC`);
  console.log(`  Payment available: ${formatToken(accountInfo.availableFunds)} USDFC`);
  console.log(`  Sample upload: ${SAMPLE_UPLOAD_SIZE_BYTES.toString()} bytes`);
  console.log(`  Deposit needed: ${formatToken(uploadCosts.depositNeeded)} USDFC`);
  console.log(`  FWSS approval needed: ${uploadCosts.needsFwssMaxApproval ? 'yes' : 'no'}`);
  console.log(`  Ready: ${uploadCosts.ready && activeProviderCount > 0n ? 'yes' : 'no'}`);
}

main().catch((error) => {
  console.error(safeErrorMessage(error));
  process.exitCode = 1;
});
