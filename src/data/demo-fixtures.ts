import type { ActivityEvent, DatasetSummary, FileSummary, StorageUploadReceipt } from '../lib/types';

const baseTime = Date.UTC(2026, 4, 12, 15, 0, 0);

export const SIMULATED_DATASETS: DatasetSummary[] = [
  {
    network: 'calibration',
    chainId: 314159,
    datasetId: 'dataset-demo-calibration-001',
    label: 'Calibration demo dataset',
    fileCount: 2,
    pieceCount: 2,
    source: 'simulation',
    createdAt: baseTime,
  },
  {
    network: 'mainnet',
    chainId: 314,
    datasetId: 'dataset-demo-mainnet-001',
    label: 'Mainnet demo dataset',
    fileCount: 1,
    pieceCount: 1,
    source: 'simulation',
    createdAt: baseTime - 86_400_000,
  },
];

export const SIMULATED_FILES: FileSummary[] = [
  {
    network: 'calibration',
    chainId: 314159,
    fileId: 'file-demo-calibration-001',
    datasetId: 'dataset-demo-calibration-001',
    name: 'synapse-design-notes.pdf',
    size: 1_248_301,
    mimeType: 'application/pdf',
    source: 'simulation',
    createdAt: baseTime,
  },
  {
    network: 'calibration',
    chainId: 314159,
    fileId: 'file-demo-calibration-002',
    datasetId: 'dataset-demo-calibration-001',
    name: 'activation-checklist.md',
    size: 18_944,
    mimeType: 'text/markdown',
    source: 'simulation',
    createdAt: baseTime + 60_000,
  },
  {
    network: 'mainnet',
    chainId: 314,
    fileId: 'file-demo-mainnet-001',
    datasetId: 'dataset-demo-mainnet-001',
    name: 'mainnet-receipt.png',
    size: 314_159,
    mimeType: 'image/png',
    source: 'simulation',
    createdAt: baseTime - 86_400_000,
  },
];

export const SIMULATED_ACTIVITY: ActivityEvent[] = [
  {
    network: 'calibration',
    chainId: 314159,
    eventId: 'activity-demo-calibration-001',
    kind: 'session-authorized',
    title: 'Passkey session authorized',
    detail: 'Demo data: calibration passkey authorization recorded for the selected root wallet.',
    simulated: true,
    source: 'simulation',
    createdAt: baseTime - 120_000,
  },
  {
    network: 'calibration',
    chainId: 314159,
    eventId: 'activity-demo-calibration-002',
    kind: 'verification',
    title: 'P256VERIFY proof accepted',
    detail: 'Demo data: simulated verifier accepted the detection vector and marked the receipt as simulation data.',
    simulated: true,
    source: 'simulation',
    createdAt: baseTime - 60_000,
  },
  {
    network: 'calibration',
    chainId: 314159,
    eventId: 'activity-demo-calibration-003',
    kind: 'upload',
    title: 'Upload committed',
    detail: 'Demo data: calibration dataset and piece entries were reconstructed from fixture chain state.',
    simulated: true,
    source: 'simulation',
    createdAt: baseTime,
  },
  {
    network: 'mainnet',
    chainId: 314,
    eventId: 'activity-demo-mainnet-001',
    kind: 'payment-approved',
    title: 'Payment readiness confirmed',
    detail: 'Demo data: mainnet payment surface shown as ready for presenter mode.',
    simulated: true,
    source: 'simulation',
    createdAt: baseTime - 86_400_000,
  },
];

export const SIMULATED_UPLOAD_RECEIPT: StorageUploadReceipt = {
  network: 'calibration',
  chainId: 314159,
  receiptMode: 'simulation',
  simulated: true,
  datasetId: 'dataset-demo-calibration-001',
  pieceCids: ['bafybeigdyrzt5qj4u5q5t7j4u4z5h3ux2nq2u6y6z5m7x4d6a3m6y2xqvu'],
  provider: 'Demo Provider 1',
  transactionHash: '0xsimulated-calibration-upload-0001',
  title: 'Simulation receipt',
  summary: 'Demo data: simulated upload receipt for the Calibration presenter flow.',
  createdAt: baseTime,
  labels: ['Simulation', 'Demo data', 'Fixture receipt'],
};

