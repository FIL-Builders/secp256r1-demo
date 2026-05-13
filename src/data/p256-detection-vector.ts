import type { Hex } from '../lib/types';

export const P256_VERIFY_ADDRESS = '0x0000000000000000000000000000000000000100' as const;

// Fixed detection vector fixture used to probe P256VERIFY.
// This is not a user credential and is only meant for feature detection.
export const P256_DETECTION_MESSAGE =
  'Synapse P256VERIFY detection vector fixture';

export const P256_DETECTION_PRIVATE_JWK = {
  key_ops: ['sign'],
  ext: true,
  kty: 'EC',
  x: 'KPZw4TY1Dt6Nlvy6hvIjue05NEhPphaRd4-wtwiIPVk',
  y: 'hH_mbO9UnopC6o0GkAqEnNsNUbNctsVUmw1PXV552ZY',
  crv: 'P-256',
  d: 'fXh90TgFgqtb_0Wwl9cOBsAW-zcBF6DmhFgQO4UHQW4',
} as const satisfies JsonWebKey;

export const P256_DETECTION_FIXTURE_LABEL =
  'Deterministic detection vector fixture for P256VERIFY feature detection';

export const P256_TRUE_RETURN: Hex = '0x0000000000000000000000000000000000000000000000000000000000000001';
