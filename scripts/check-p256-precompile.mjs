#!/usr/bin/env node

import { webcrypto } from 'node:crypto';

const PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000100';
const VALID_RETURN = `0x${'0'.repeat(63)}1`;

const NETWORKS = {
  mainnet: {
    label: 'Mainnet',
    expectedChainId: 314,
    rpcUrl: process.env.FILECOIN_MAINNET_RPC_URL ?? 'https://api.node.glif.io/rpc/v1',
  },
  calibration: {
    label: 'Calibration',
    expectedChainId: 314159,
    rpcUrl:
      process.env.FILECOIN_CALIBRATION_RPC_URL ??
      'https://api.calibration.node.glif.io/rpc/v1',
  },
};

function parseArgs(argv) {
  const options = {
    network: 'all',
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--network') {
      options.network = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--network=')) {
      options.network = arg.slice('--network='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['all', ...Object.keys(NETWORKS)].includes(options.network)) {
    throw new Error(`Unsupported network "${options.network}". Use all, mainnet, or calibration.`);
  }

  return options;
}

function fromBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

function ensure32Bytes(value, label) {
  if (value.length === 32) {
    return value;
  }

  if (value.length > 32) {
    throw new Error(`${label} is ${value.length} bytes; expected at most 32 bytes.`);
  }

  return Buffer.concat([Buffer.alloc(32 - value.length), value]);
}

function hex(buffer) {
  return `0x${Buffer.from(buffer).toString('hex')}`;
}

function normalizeHex(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.toLowerCase();
}

async function rpc(rpcUrl, method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${method} HTTP ${response.status}: ${text}`);
  }

  const payload = JSON.parse(text);

  if (payload.error) {
    throw new Error(`${method} RPC error ${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result;
}

async function createP256Vector() {
  const message = Buffer.from('Synapse P256VERIFY availability check', 'utf8');
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );

  const signature = Buffer.from(
    await webcrypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      keyPair.privateKey,
      message,
    ),
  );

  if (signature.length !== 64) {
    throw new Error(`Expected raw P-256 signature to be 64 bytes; got ${signature.length}.`);
  }

  const locallyValid = await webcrypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    keyPair.publicKey,
    signature,
    message,
  );

  if (!locallyValid) {
    throw new Error('Generated P-256 signature failed local WebCrypto verification.');
  }

  const publicKey = await webcrypto.subtle.exportKey('jwk', keyPair.publicKey);
  const messageHash = Buffer.from(await webcrypto.subtle.digest('SHA-256', message));
  const r = signature.subarray(0, 32);
  const s = signature.subarray(32, 64);
  const x = ensure32Bytes(fromBase64Url(publicKey.x), 'public key x');
  const y = ensure32Bytes(fromBase64Url(publicKey.y), 'public key y');
  const validInput = Buffer.concat([messageHash, r, s, x, y]);
  const invalidHash = Buffer.from(messageHash);

  invalidHash[0] ^= 0x01;

  const invalidInput = Buffer.concat([invalidHash, r, s, x, y]);

  if (validInput.length !== 160 || invalidInput.length !== 160) {
    throw new Error('P256VERIFY calldata must be exactly 160 bytes.');
  }

  return {
    message: message.toString('utf8'),
    messageHash: hex(messageHash),
    validCalldata: hex(validInput),
    invalidCalldata: hex(invalidInput),
  };
}

function classify(validResult, invalidResult) {
  const normalizedValid = normalizeHex(validResult);
  const normalizedInvalid = normalizeHex(invalidResult);

  if (normalizedValid === VALID_RETURN && normalizedInvalid === '0x') {
    return {
      status: 'available',
      summary: 'P256VERIFY is available and rejects invalid input.',
    };
  }

  if (normalizedValid === VALID_RETURN) {
    return {
      status: 'unexpected_invalid_result',
      summary:
        'P256VERIFY accepted the valid signature, but invalid-input behavior was unexpected. Treat this network as not safe for activation.',
    };
  }

  if (normalizedValid === '0x') {
    return {
      status: 'not_available_or_not_activated',
      summary: 'Valid P-256 signature returned empty output. The precompile is not available or not activated on this chain.',
    };
  }

  return {
    status: 'unexpected_result',
    summary: 'Valid P-256 signature returned an unexpected value.',
  };
}

async function checkNetwork(key, vector) {
  const network = NETWORKS[key];
  const chainIdHex = await rpc(network.rpcUrl, 'eth_chainId');
  const blockNumberHex = await rpc(network.rpcUrl, 'eth_blockNumber');
  const chainId = Number.parseInt(chainIdHex, 16);

  const callBase = {
    to: PRECOMPILE_ADDRESS,
  };

  const validResult = await rpc(network.rpcUrl, 'eth_call', [
    {
      ...callBase,
      data: vector.validCalldata,
    },
    'latest',
  ]);

  const invalidResult = await rpc(network.rpcUrl, 'eth_call', [
    {
      ...callBase,
      data: vector.invalidCalldata,
    },
    'latest',
  ]);

  return {
    key,
    label: network.label,
    rpcUrl: network.rpcUrl,
    expectedChainId: network.expectedChainId,
    chainId,
    chainIdHex,
    blockNumber: Number.parseInt(blockNumberHex, 16),
    blockNumberHex,
    precompileAddress: PRECOMPILE_ADDRESS,
    validResult,
    invalidResult,
    ...classify(validResult, invalidResult),
  };
}

function printHuman(results) {
  for (const result of results) {
    console.log(`${result.label} (${result.chainId})`);
    console.log(`  RPC: ${result.rpcUrl}`);
    console.log(`  Block: ${result.blockNumber} (${result.blockNumberHex})`);
    console.log(`  Address: ${result.precompileAddress}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Valid signature result: ${result.validResult}`);
    console.log(`  Invalid signature result: ${result.invalidResult}`);
    console.log(`  Summary: ${result.summary}`);
    console.log('');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const selectedNetworks =
    options.network === 'all' ? Object.keys(NETWORKS) : [options.network];
  const vector = await createP256Vector();
  const results = [];

  for (const network of selectedNetworks) {
    results.push(await checkNetwork(network, vector));
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          vector: {
            message: vector.message,
            messageHash: vector.messageHash,
          },
          results,
        },
        null,
        2,
      ),
    );
    return;
  }

  printHuman(results);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
