import {
  P256_DETECTION_MESSAGE,
  P256_DETECTION_PRIVATE_JWK,
  P256_VERIFY_ADDRESS,
  P256_TRUE_RETURN,
} from '../data/p256-detection-vector';
import type {
  CapabilityState,
  DemoNetwork,
  Hex,
  P256DetectionVector,
  P256PrecompileDetectionResult,
  P256VerifyInput,
  P256VerifyResult,
  P256VerifierAdapter,
} from './types';

const textEncoder = new TextEncoder();

function requireCryptoSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle crypto is required to build the P256 detection vector.');
  }
  return subtle;
}

function requireFetch(fetchImpl?: typeof fetch): typeof fetch {
  const resolved = fetchImpl ?? globalThis.fetch;
  if (!resolved) {
    throw new Error('fetch is required for the P256 precompile probe.');
  }
  return resolved.bind(globalThis);
}

function strip0x(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

function toHex(bytes: Uint8Array): Hex {
  let hex = '0x';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex as Hex;
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = globalThis.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function concatBytes(...segments: readonly Uint8Array[]): Uint8Array {
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const segment of segments) {
    output.set(segment, offset);
    offset += segment.length;
  }
  return output;
}

function normalizeHex(value: unknown): Hex {
  if (typeof value !== 'string' || value.length === 0) {
    return '0x';
  }

  return (value.startsWith('0x') ? value.toLowerCase() : `0x${value.toLowerCase()}`) as Hex;
}

async function rpcRequest<T>(
  fetchImpl: typeof fetch,
  rpcUrl: string,
  method: string,
  params: readonly unknown[] = [],
): Promise<T> {
  const response = await fetchImpl(rpcUrl, {
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

  const payload = JSON.parse(text) as {
    result?: T;
    error?: { code: number; message: string };
  };

  if (payload.error) {
    throw new Error(`${method} RPC error ${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result as T;
}

function classifyProbeResult(validResult: string, invalidResult: string): {
  state: CapabilityState;
  summary: string;
} {
  const normalizedValid = normalizeHex(validResult);
  const normalizedInvalid = normalizeHex(invalidResult);

  if (normalizedValid === P256_TRUE_RETURN && normalizedInvalid === '0x') {
    return {
      state: 'available',
      summary: 'P256VERIFY is available and rejects invalid input.',
    };
  }

  if (normalizedValid === P256_TRUE_RETURN) {
    return {
      state: 'error',
      summary:
        'P256VERIFY accepted the valid vector, but invalid-input behavior was unexpected. Treating the verifier path as unavailable.',
    };
  }

  if (normalizedValid === '0x') {
    return {
      state: 'unavailable',
      summary:
        'Valid P-256 calldata returned empty output. The precompile is not available or not activated on this chain.',
    };
  }

  return {
    state: 'error',
    summary: 'P256VERIFY returned an unexpected value for the valid detection vector.',
  };
}

async function importDetectionKey(subtle: SubtleCrypto): Promise<CryptoKey> {
  return subtle.importKey(
    'jwk',
    P256_DETECTION_PRIVATE_JWK,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign'],
  );
}

export async function createP256DetectionVector(): Promise<P256DetectionVector> {
  const subtle = requireCryptoSubtle();
  const key = await importDetectionKey(subtle);
  const messageBytes = textEncoder.encode(P256_DETECTION_MESSAGE);
  const signatureBytes = new Uint8Array(
    await subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      key,
      messageBytes,
    ),
  );

  if (signatureBytes.length !== 64) {
    throw new Error(`Expected a raw P-256 signature to be 64 bytes, received ${signatureBytes.length}.`);
  }

  const publicX = fromBase64Url(P256_DETECTION_PRIVATE_JWK.x);
  const publicY = fromBase64Url(P256_DETECTION_PRIVATE_JWK.y);
  const messageHash = new Uint8Array(await subtle.digest('SHA-256', messageBytes));
  const r = signatureBytes.slice(0, 32);
  const s = signatureBytes.slice(32);
  const validCalldata = concatBytes(messageHash, r, s, publicX, publicY);
  const invalidHash = new Uint8Array(messageHash);
  invalidHash[0] ^= 0x01;
  const invalidCalldata = concatBytes(invalidHash, r, s, publicX, publicY);

  if (validCalldata.length !== 160 || invalidCalldata.length !== 160) {
    throw new Error('P256VERIFY detection calldata must be exactly 160 bytes.');
  }

  return {
    message: P256_DETECTION_MESSAGE,
    messageHash: toHex(messageHash),
    validCalldata: toHex(validCalldata),
    invalidCalldata: toHex(invalidCalldata),
    publicKey: {
      x: toHex(publicX),
      y: toHex(publicY),
    },
    signature: {
      r: toHex(r),
      s: toHex(s),
    },
  };
}

export async function detectP256Precompile(options: {
  rpcUrl: string;
  network: DemoNetwork;
  chainId?: number;
  fetchImpl?: typeof fetch;
}): Promise<P256PrecompileDetectionResult> {
  const fetchImpl = requireFetch(options.fetchImpl);
  const vector = await createP256DetectionVector();
  const observedChainIdHex = await rpcRequest<string>(fetchImpl, options.rpcUrl, 'eth_chainId');
  const observedChainId = Number.parseInt(observedChainIdHex, 16);
  const validResult = await rpcRequest<string>(fetchImpl, options.rpcUrl, 'eth_call', [
    {
      to: P256_VERIFY_ADDRESS,
      data: vector.validCalldata,
    },
    'latest',
  ]);
  const invalidResult = await rpcRequest<string>(fetchImpl, options.rpcUrl, 'eth_call', [
    {
      to: P256_VERIFY_ADDRESS,
      data: vector.invalidCalldata,
    },
    'latest',
  ]);

  const { state, summary } = classifyProbeResult(validResult, invalidResult);
  const checkedAt = Date.now();

  if (typeof options.chainId === 'number' && observedChainId !== options.chainId) {
    return {
      chainId: options.chainId,
      network: options.network,
      rpcUrl: options.rpcUrl,
      precompileAddress: P256_VERIFY_ADDRESS,
      checkedAt,
      observedChainId,
      validResult: normalizeHex(validResult),
      invalidResult: normalizeHex(invalidResult),
      state: 'error',
      summary: `RPC chainId mismatch: expected ${options.chainId}, observed ${observedChainId}.`,
      vector,
    };
  }

  return {
    chainId: options.chainId ?? observedChainId,
    network: options.network,
    rpcUrl: options.rpcUrl,
    precompileAddress: P256_VERIFY_ADDRESS,
    checkedAt,
    observedChainId,
    validResult: normalizeHex(validResult),
    invalidResult: normalizeHex(invalidResult),
    state,
    summary,
    vector,
  };
}

export interface RpcP256VerifierAdapterOptions {
  network: DemoNetwork;
  chainId: number;
  rpcUrl: string;
  fetchImpl?: typeof fetch;
}

export function createRpcP256VerifierAdapter(options: RpcP256VerifierAdapterOptions): P256VerifierAdapter {
  const cache = new Map<number, Promise<CapabilityState>>();
  const fetchImpl = requireFetch(options.fetchImpl);

  return {
    async detect(chainId: number): Promise<CapabilityState> {
      if (chainId !== options.chainId) {
        return 'error';
      }

      const existing = cache.get(chainId);
      if (existing) {
        return existing;
      }

      const probe = detectP256Precompile({
        rpcUrl: options.rpcUrl,
        network: options.network,
        chainId,
        fetchImpl,
      }).then((result) => result.state);

      cache.set(chainId, probe);
      return probe;
    },

    async verify(input: P256VerifyInput): Promise<P256VerifyResult> {
      const checkedAt = Date.now();

      if (input.chainId !== options.chainId) {
        return {
          chainId: input.chainId,
          network: input.network,
          outcome: 'error',
          accepted: false,
          simulated: false,
          rawResult: '0x',
          checkedAt,
          summary: `RPC adapter was configured for chain ${options.chainId}, but received ${input.chainId}.`,
        };
      }

      const rawResult = await rpcRequest<string>(fetchImpl, options.rpcUrl, 'eth_call', [
        {
          to: P256_VERIFY_ADDRESS,
          data: input.calldata,
        },
        input.blockTag ?? 'latest',
      ]);

      const normalized = normalizeHex(rawResult);
      const accepted = normalized === P256_TRUE_RETURN;

      return {
        chainId: input.chainId,
        network: input.network,
        outcome: accepted ? 'verified' : 'rejected',
        accepted,
        simulated: false,
        rawResult: normalized,
        checkedAt,
        summary: accepted
          ? 'P256VERIFY accepted the submitted calldata.'
          : 'P256VERIFY rejected the submitted calldata.',
        details: input.label ? `Verification label: ${input.label}` : undefined,
      };
    },
  };
}

export function createSimulatedP256VerifierAdapter(): P256VerifierAdapter {
  return {
    async detect(): Promise<CapabilityState> {
      return 'available';
    },

    async verify(input: P256VerifyInput): Promise<P256VerifyResult> {
      const accepted = true;
      return {
        chainId: input.chainId,
        network: input.network,
        outcome: accepted ? 'simulated-verified' : 'simulated-rejected',
        accepted,
        simulated: true,
        rawResult: P256_TRUE_RETURN,
        checkedAt: Date.now(),
        summary: 'Demo data: simulated verifier accepted the fixture P256VERIFY payload.',
        details: 'Simulation mode is active; this result does not represent an on-chain proof.',
      };
    },
  };
}

export function decodeP256ReturnData(rawResult: Hex): { accepted: boolean; rawResult: Hex } {
  return {
    accepted: normalizeHex(rawResult) === P256_TRUE_RETURN,
    rawResult: normalizeHex(rawResult),
  };
}
