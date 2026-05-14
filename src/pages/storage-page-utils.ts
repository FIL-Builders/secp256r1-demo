import type { ActivityKind, ChainDataSource, PaymentRailStatus, VerificationStatus } from '../lib';

export function formatBytes(value: number | undefined): string {
  if (value == null) {
    return 'Unknown';
  }

  if (value === 0) {
    return '0 B';
  }

  if (value < 1_000_000) {
    return `${Math.max(1, Math.round(value / 1_000))} KB`;
  }

  if (value < 1_000_000_000) {
    return `${(value / 1_000_000).toFixed(2)} MB`;
  }

  return `${(value / 1_000_000_000).toFixed(2)} GB`;
}

export function formatDate(value: number | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelativeTime(value: number | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  const deltaMs = Date.now() - value;
  const absolute = Math.abs(deltaMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const suffix = deltaMs >= 0 ? 'ago' : 'from now';

  if (absolute < minute) {
    return 'just now';
  }

  if (absolute < hour) {
    return `${Math.round(absolute / minute)}m ${suffix}`;
  }

  if (absolute < day) {
    return `${Math.round(absolute / hour)}h ${suffix}`;
  }

  return `${Math.round(absolute / day)}d ${suffix}`;
}

export function shortId(value: string | undefined, prefixLength = 8, suffixLength = 6): string {
  if (!value) {
    return 'Unknown';
  }

  if (value.length <= prefixLength + suffixLength + 3) {
    return value;
  }

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

export function sourceLabel(source: ChainDataSource): string {
  return source === 'chain' ? 'Chain-backed' : 'Simulation';
}

export function sourceTone(source: ChainDataSource): string {
  return source === 'chain' ? 'success' : 'simulation';
}

export function verificationLabel(status: VerificationStatus | undefined): string {
  if (status === 'verified') {
    return 'Verified';
  }

  if (status === 'pending') {
    return 'Pending';
  }

  if (status === 'failed') {
    return 'Failed';
  }

  return 'Unknown';
}

export function verificationTone(status: VerificationStatus | undefined): string {
  if (status === 'verified') {
    return 'success';
  }

  if (status === 'failed') {
    return 'error';
  }

  if (status === 'pending') {
    return 'warning';
  }

  return 'simulation';
}

export function paymentRailLabel(status: PaymentRailStatus | undefined): string {
  if (status === 'paid') {
    return 'Paid';
  }

  if (status === 'due-soon') {
    return 'Due soon';
  }

  if (status === 'past-due') {
    return 'Past due';
  }

  if (status === 'not-applicable') {
    return 'Not applicable';
  }

  return 'Unknown';
}

export function paymentRailTone(status: PaymentRailStatus | undefined): string {
  if (status === 'paid') {
    return 'success';
  }

  if (status === 'due-soon') {
    return 'warning';
  }

  if (status === 'past-due') {
    return 'error';
  }

  return 'simulation';
}

export function fileKindLabel(mimeType: string): string {
  if (mimeType === 'application/x-directory') {
    return 'Folder';
  }

  if (mimeType === 'application/x-ipynb+json') {
    return 'IPYNB';
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'DOCX';
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'XLSX';
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return 'PPTX';
  }

  if (mimeType.includes('/')) {
    return mimeType.split('/').at(-1)?.toUpperCase() ?? mimeType.toUpperCase();
  }

  return mimeType.toUpperCase();
}

export function activityKindLabel(kind: ActivityKind): string {
  switch (kind) {
    case 'dataset-created':
      return 'Dataset created';
    case 'dataset-indexed':
      return 'Dataset indexed';
    case 'piece-added':
      return 'File committed';
    case 'file-indexed':
      return 'File indexed';
    case 'payment-approved':
      return 'Payment';
    case 'session-authorized':
      return 'Passkey';
    case 'session-revoked':
      return 'Session revoked';
    case 'verification':
      return 'Verification';
    case 'verification-failed':
      return 'Verification failed';
    case 'readback-incomplete':
      return 'Readback incomplete';
    case 'network-switched':
      return 'Network';
    case 'upload':
      return 'Upload';
  }
}

export function createExplorerMessageUrl(explorerUrl: string, transactionHash: string | undefined): string | undefined {
  if (!transactionHash) {
    return undefined;
  }

  return `${explorerUrl.replace(/\/$/, '')}/message/${transactionHash}`;
}
