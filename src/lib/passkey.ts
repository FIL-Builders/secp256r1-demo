import type { Address, DemoNetwork, Hex } from './types';
import { getNetworkConfig } from './network';

const PASSKEY_CREDENTIAL_KEY = 'synapse-demo:passkey-credential';
const PASSKEY_AUTHORIZATIONS_KEY = 'synapse-demo:passkey-authorizations';
const PASSKEY_RP_NAME = 'Synapse Passkey Demo';
const PASSKEY_USER_NAME = 'synapse-demo-user';

export type PasskeyAuthorizationStatus =
  | 'not-authorized'
  | 'pending-network'
  | 'authorized'
  | 'simulation-authorized'
  | 'revoked';

export interface StoredPasskeyCredential {
  id: string;
  rawId: string;
  label: string;
  createdAt: number;
  rpId: string;
  origin: string;
  transports: string[];
  publicKeyX?: Hex;
  publicKeyY?: Hex;
  publicKeyFingerprint?: string;
  syntheticSigner?: Address;
}

export interface PasskeyAuthorizationRecord {
  credentialId: string;
  network: DemoNetwork;
  chainId: number;
  rootAddress: Address;
  status: PasskeyAuthorizationStatus;
  permissions: string[];
  authorizedAt?: number;
  expiresAt?: number;
  revokedAt?: number;
  simulated: boolean;
}

export interface PasskeyProbeResult {
  testedAt: number;
  credentialId: string;
  challengeMatches: boolean;
  clientDataType: string;
  origin: string;
  authenticatorDataLength: number;
  clientDataJSONLength: number;
  signatureLength: number;
  signatureFormat: 'der' | 'unknown';
}

export interface CreatePasskeyOptions {
  label?: string;
  rootAddress?: Address;
}

export interface TestPasskeyOptions {
  credential: StoredPasskeyCredential;
}

interface CborBytes {
  type: 'bytes';
  value: Uint8Array;
}

interface CborText {
  type: 'text';
  value: string;
}

type CborValue = number | bigint | boolean | null | CborBytes | CborText | CborValue[] | Map<CborValue, CborValue>;

function hasWebAuthn(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof PublicKeyCredential === 'function' &&
    typeof AuthenticatorAttestationResponse === 'function' &&
    typeof AuthenticatorAssertionResponse === 'function' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

function getRpId(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }

  return window.location.hostname;
}

function getOrigin(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost';
  }

  return window.location.origin;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function hex(bytes: Uint8Array): Hex {
  let output = '0x';
  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, '0');
  }
  return output as Hex;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', toArrayBuffer(bytes)));
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Passkey metadata is optional local state; ignore storage failures.
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Passkey metadata is optional local state; ignore storage failures.
  }
}

function readCborLength(bytes: Uint8Array, offset: number, additional: number): { length: number; offset: number } {
  if (additional < 24) {
    return { length: additional, offset };
  }

  if (additional === 24) {
    return { length: bytes[offset], offset: offset + 1 };
  }

  if (additional === 25) {
    return { length: (bytes[offset] << 8) | bytes[offset + 1], offset: offset + 2 };
  }

  if (additional === 26) {
    return {
      length:
        (bytes[offset] * 0x1000000) +
        ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]),
      offset: offset + 4,
    };
  }

  throw new Error('Unsupported CBOR length encoding.');
}

function decodeCbor(bytes: Uint8Array, offset = 0): { value: CborValue; offset: number } {
  const head = bytes[offset];
  const major = head >> 5;
  const additional = head & 0x1f;
  let cursor = offset + 1;

  if (major === 0 || major === 1) {
    const result = readCborLength(bytes, cursor, additional);
    cursor = result.offset;
    return { value: major === 0 ? result.length : -1 - result.length, offset: cursor };
  }

  if (major === 2 || major === 3) {
    const result = readCborLength(bytes, cursor, additional);
    cursor = result.offset;
    const payload = bytes.slice(cursor, cursor + result.length);
    cursor += result.length;

    if (major === 2) {
      return { value: { type: 'bytes', value: payload }, offset: cursor };
    }

    return { value: { type: 'text', value: new TextDecoder().decode(payload) }, offset: cursor };
  }

  if (major === 4) {
    const result = readCborLength(bytes, cursor, additional);
    cursor = result.offset;
    const items: CborValue[] = [];

    for (let index = 0; index < result.length; index += 1) {
      const item = decodeCbor(bytes, cursor);
      items.push(item.value);
      cursor = item.offset;
    }

    return { value: items, offset: cursor };
  }

  if (major === 5) {
    const result = readCborLength(bytes, cursor, additional);
    cursor = result.offset;
    const map = new Map<CborValue, CborValue>();

    for (let index = 0; index < result.length; index += 1) {
      const key = decodeCbor(bytes, cursor);
      const value = decodeCbor(bytes, key.offset);
      map.set(key.value, value.value);
      cursor = value.offset;
    }

    return { value: map, offset: cursor };
  }

  if (major === 6) {
    const tag = readCborLength(bytes, cursor, additional);
    return decodeCbor(bytes, tag.offset);
  }

  if (major === 7) {
    if (additional === 20) {
      return { value: false, offset: cursor };
    }

    if (additional === 21) {
      return { value: true, offset: cursor };
    }

    if (additional === 22) {
      return { value: null, offset: cursor };
    }
  }

  throw new Error('Unsupported CBOR value.');
}

function getCborMapTextValue(map: Map<CborValue, CborValue>, key: string): CborValue | undefined {
  for (const [entryKey, value] of map.entries()) {
    if (typeof entryKey === 'object' && entryKey !== null && 'type' in entryKey) {
      if (entryKey.type === 'text' && entryKey.value === key) {
        return value;
      }
    }
  }

  return undefined;
}

function getCoseBytes(map: Map<CborValue, CborValue>, key: number): Uint8Array | undefined {
  const value = map.get(key);
  if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'bytes') {
    return value.value;
  }

  return undefined;
}

function parseAttestationPublicKey(attestationObject: ArrayBuffer): { x?: Hex; y?: Hex } {
  const decoded = decodeCbor(new Uint8Array(attestationObject)).value;
  if (!(decoded instanceof Map)) {
    return {};
  }

  const authData = getCborMapTextValue(decoded, 'authData');
  if (typeof authData !== 'object' || authData === null || !('type' in authData) || authData.type !== 'bytes') {
    return {};
  }

  const authDataBytes = authData.value;
  const flags = authDataBytes[32];
  const hasAttestedCredentialData = (flags & 0x40) !== 0;

  if (!hasAttestedCredentialData) {
    return {};
  }

  const credentialIdLengthOffset = 32 + 1 + 4 + 16;
  const credentialIdLength =
    (authDataBytes[credentialIdLengthOffset] << 8) | authDataBytes[credentialIdLengthOffset + 1];
  const coseOffset = credentialIdLengthOffset + 2 + credentialIdLength;
  const coseKey = decodeCbor(authDataBytes, coseOffset).value;

  if (!(coseKey instanceof Map)) {
    return {};
  }

  const x = getCoseBytes(coseKey, -2);
  const y = getCoseBytes(coseKey, -3);

  return {
    x: x ? hex(x) : undefined,
    y: y ? hex(y) : undefined,
  };
}

function ensure32Bytes(value: Uint8Array): Uint8Array {
  const stripped = value[0] === 0 ? value.slice(1) : value;
  if (stripped.length === 32) {
    return stripped;
  }

  if (stripped.length > 32) {
    throw new Error(`ECDSA integer is ${stripped.length} bytes; expected at most 32.`);
  }

  const output = new Uint8Array(32);
  output.set(stripped, 32 - stripped.length);
  return output;
}

function detectDerEcdsaSignature(signature: Uint8Array): 'der' | 'unknown' {
  try {
    if (signature[0] !== 0x30) {
      return 'unknown';
    }

    let cursor = 2;
    if (signature[1] & 0x80) {
      const lengthBytes = signature[1] & 0x7f;
      cursor = 2 + lengthBytes;
    }

    if (signature[cursor] !== 0x02) {
      return 'unknown';
    }

    const rLength = signature[cursor + 1];
    const r = signature.slice(cursor + 2, cursor + 2 + rLength);
    cursor = cursor + 2 + rLength;

    if (signature[cursor] !== 0x02) {
      return 'unknown';
    }

    const sLength = signature[cursor + 1];
    const s = signature.slice(cursor + 2, cursor + 2 + sLength);

    ensure32Bytes(r);
    ensure32Bytes(s);
    return 'der';
  } catch {
    return 'unknown';
  }
}

async function derivePublicKeyMetadata(input: {
  rawId: string;
  publicKeyX?: Hex;
  publicKeyY?: Hex;
}): Promise<Pick<StoredPasskeyCredential, 'publicKeyFingerprint' | 'syntheticSigner'>> {
  const keyMaterial = utf8(`${input.rawId}:${input.publicKeyX ?? ''}:${input.publicKeyY ?? ''}`);
  const digest = await sha256(keyMaterial);
  return {
    publicKeyFingerprint: base64UrlEncode(digest.slice(0, 12)),
    syntheticSigner: hex(digest.slice(-20)) as Address,
  };
}

export function isPasskeySupported(): boolean {
  return (
    hasWebAuthn() &&
    typeof globalThis.crypto?.getRandomValues === 'function' &&
    Boolean(globalThis.crypto?.subtle)
  );
}

export function readStoredPasskeyCredential(): StoredPasskeyCredential | null {
  const raw = readStorage(PASSKEY_CREDENTIAL_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredPasskeyCredential;
  } catch {
    return null;
  }
}

export function saveStoredPasskeyCredential(credential: StoredPasskeyCredential): void {
  writeStorage(PASSKEY_CREDENTIAL_KEY, JSON.stringify(credential));
}

export function removeStoredPasskeyCredential(): void {
  removeStorage(PASSKEY_CREDENTIAL_KEY);
}

export function readPasskeyAuthorizations(): PasskeyAuthorizationRecord[] {
  const raw = readStorage(PASSKEY_AUTHORIZATIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PasskeyAuthorizationRecord[];
  } catch {
    return [];
  }
}

export function writePasskeyAuthorizations(records: readonly PasskeyAuthorizationRecord[]): void {
  writeStorage(PASSKEY_AUTHORIZATIONS_KEY, JSON.stringify(records));
}

export function clearPasskeyAuthorizations(): void {
  removeStorage(PASSKEY_AUTHORIZATIONS_KEY);
}

export function getPasskeyAuthorization(input: {
  credentialId?: string;
  network: DemoNetwork;
  rootAddress?: Address;
}): PasskeyAuthorizationRecord | null {
  if (!input.credentialId || !input.rootAddress) {
    return null;
  }

  return (
    readPasskeyAuthorizations().find(
      (record) =>
        record.credentialId === input.credentialId &&
        record.network === input.network &&
        record.rootAddress === input.rootAddress,
    ) ?? null
  );
}

export function savePasskeyAuthorization(record: PasskeyAuthorizationRecord): void {
  const records = readPasskeyAuthorizations().filter(
    (item) =>
      !(
        item.credentialId === record.credentialId &&
        item.network === record.network &&
        item.rootAddress === record.rootAddress
      ),
  );
  records.push(record);
  writePasskeyAuthorizations(records);
}

export function revokePasskeyAuthorization(input: {
  credentialId: string;
  network: DemoNetwork;
  rootAddress: Address;
}): PasskeyAuthorizationRecord {
  const existing =
    getPasskeyAuthorization({
      credentialId: input.credentialId,
      network: input.network,
      rootAddress: input.rootAddress,
    }) ?? null;
  const config = getNetworkConfig(input.network);
  const revoked: PasskeyAuthorizationRecord = {
    credentialId: input.credentialId,
    network: input.network,
    chainId: config.chainId,
    rootAddress: input.rootAddress,
    status: 'revoked',
    permissions: existing?.permissions ?? [],
    authorizedAt: existing?.authorizedAt,
    expiresAt: existing?.expiresAt,
    revokedAt: Date.now(),
    simulated: existing?.simulated ?? false,
  };
  savePasskeyAuthorization(revoked);
  return revoked;
}

export function simulatePasskeyAuthorization(input: {
  credential: StoredPasskeyCredential;
  network: DemoNetwork;
  rootAddress: Address;
  durationDays?: number;
}): PasskeyAuthorizationRecord {
  const config = getNetworkConfig(input.network);
  const now = Date.now();
  const durationDays = input.durationDays ?? 30;
  const record: PasskeyAuthorizationRecord = {
    credentialId: input.credential.id,
    network: input.network,
    chainId: config.chainId,
    rootAddress: input.rootAddress,
    status: 'simulation-authorized',
    permissions: ['create dataset', 'add pieces', 'schedule removals', 'delete dataset'],
    authorizedAt: now,
    expiresAt: now + durationDays * 24 * 60 * 60 * 1000,
    simulated: true,
  };
  savePasskeyAuthorization(record);
  return record;
}

export async function createPasskeyCredential(options: CreatePasskeyOptions = {}): Promise<StoredPasskeyCredential> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not available in this browser context.');
  }

  const challenge = randomBytes(32);
  const userId = options.rootAddress ? utf8(options.rootAddress).slice(0, 64) : randomBytes(32);
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: toArrayBuffer(challenge),
      rp: {
        name: PASSKEY_RP_NAME,
        id: getRpId(),
      },
      user: {
        id: toArrayBuffer(userId),
        name: options.rootAddress ?? PASSKEY_USER_NAME,
        displayName: options.label ?? 'Synapse Demo User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 90_000,
      attestation: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    },
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Browser did not return a public key credential.');
  }

  const response = credential.response;
  if (!(response instanceof AuthenticatorAttestationResponse)) {
    throw new Error('Browser did not return an attestation response.');
  }

  const publicKey = parseAttestationPublicKey(response.attestationObject);
  const rawId = base64UrlEncode(credential.rawId);
  const metadata = await derivePublicKeyMetadata({
    rawId,
    publicKeyX: publicKey.x,
    publicKeyY: publicKey.y,
  });
  const transports =
    typeof response.getTransports === 'function' ? Array.from(response.getTransports()) : [];

  const stored: StoredPasskeyCredential = {
    id: credential.id,
    rawId,
    label: options.label ?? 'This device passkey',
    createdAt: Date.now(),
    rpId: getRpId(),
    origin: getOrigin(),
    transports,
    publicKeyX: publicKey.x,
    publicKeyY: publicKey.y,
    publicKeyFingerprint: metadata.publicKeyFingerprint,
    syntheticSigner: metadata.syntheticSigner,
  };

  saveStoredPasskeyCredential(stored);
  return stored;
}

export async function testPasskeyCredential(options: TestPasskeyOptions): Promise<PasskeyProbeResult> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not available in this browser context.');
  }

  const challenge = randomBytes(32);
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: toArrayBuffer(challenge),
      rpId: options.credential.rpId,
      allowCredentials: [
        {
          id: toArrayBuffer(base64UrlDecode(options.credential.rawId)),
          type: 'public-key',
          transports: options.credential.transports as AuthenticatorTransport[],
        },
      ],
      timeout: 90_000,
      userVerification: 'required',
    },
  });

  if (!(assertion instanceof PublicKeyCredential)) {
    throw new Error('Browser did not return a public key credential assertion.');
  }

  const response = assertion.response;
  if (!(response instanceof AuthenticatorAssertionResponse)) {
    throw new Error('Browser did not return an assertion response.');
  }

  const clientData = JSON.parse(new TextDecoder().decode(response.clientDataJSON)) as {
    type?: string;
    challenge?: string;
    origin?: string;
  };
  const signature = new Uint8Array(response.signature);
  const signatureFormat = detectDerEcdsaSignature(signature);

  return {
    testedAt: Date.now(),
    credentialId: assertion.id,
    challengeMatches: clientData.challenge === base64UrlEncode(challenge),
    clientDataType: clientData.type ?? 'unknown',
    origin: clientData.origin ?? 'unknown',
    authenticatorDataLength: response.authenticatorData.byteLength,
    clientDataJSONLength: response.clientDataJSON.byteLength,
    signatureLength: response.signature.byteLength,
    signatureFormat,
  };
}
