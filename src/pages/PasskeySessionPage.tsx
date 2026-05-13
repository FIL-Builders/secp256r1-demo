import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Fingerprint,
  KeyRound,
  Link2,
  Network,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Trash2,
} from 'lucide-react';

import type {
  DemoNetwork,
  DemoRuntimeMode,
  PasskeyAuthorizationRecord,
  PasskeyProbeResult,
  StoredPasskeyCredential,
} from '../lib';

export interface PasskeySessionPageProps {
  runtimeMode: DemoRuntimeMode;
  network: DemoNetwork;
  networkLabel: string;
  walletLabel: string;
  walletConnected: boolean;
  walletReady: boolean;
  walletRequirementDetail: string;
  p256Available: boolean;
  passkeySupported: boolean;
  credential: StoredPasskeyCredential | null;
  authorization: PasskeyAuthorizationRecord | null;
  testResult: PasskeyProbeResult | null;
  busyLabel?: string;
  error?: string | null;
  onCreatePasskey: () => void | Promise<void>;
  onTestPasskey: () => void | Promise<void>;
  onSimulateAuthorize: () => void | Promise<void>;
  onRevokeAuthorization: () => void | Promise<void>;
  onRemovePasskey: () => void | Promise<void>;
}

const runtimeCopy: Record<DemoRuntimeMode, string> = {
  live: 'Live mode can only mark this device ready when browser passkey assertion and the real P256VERIFY path are available.',
  'pending-network':
    'Pending Network Mode can prepare the browser passkey, but device authorization remains unavailable until P256VERIFY is live.',
  simulation:
    'Simulation Mode labels authorization as local fixture behavior. It must not be read as live on-chain verification.',
};

const networkNames: Record<DemoNetwork, string> = {
  mainnet: 'Mainnet',
  calibration: 'Calibration',
};

export function PasskeySessionPage({
  runtimeMode,
  network,
  networkLabel,
  walletLabel,
  walletConnected,
  walletReady,
  walletRequirementDetail,
  p256Available,
  passkeySupported,
  credential,
  authorization,
  testResult,
  busyLabel,
  error,
  onCreatePasskey,
  onTestPasskey,
  onSimulateAuthorize,
  onRevokeAuthorization,
  onRemovePasskey,
}: PasskeySessionPageProps) {
  const busy = Boolean(busyLabel);
  const authorizationState = getAuthorizationState({ runtimeMode, p256Available, authorization });
  const assertionReady = Boolean(testResult?.challengeMatches);
  const uploadsReady = Boolean(credential) && walletReady && authorizationState.ready && assertionReady;
  const progress = [
    {
      label: 'Create passkey',
      complete: Boolean(credential),
      detail: credential ? credential.label : 'No browser credential stored.',
    },
    {
      label: 'Authorize this device',
      complete: authorizationState.ready,
      detail: authorizationState.detail,
    },
    {
      label: 'Passkey Uploads Ready',
      complete: uploadsReady,
      detail: uploadsReady
        ? runtimeMode === 'simulation'
          ? 'Credential, simulated authorization, and assertion test are present.'
          : 'Credential, authorization, and assertion test are present.'
        : !walletReady
          ? walletRequirementDetail
          : 'Waiting on setup checks.',
    },
  ];

  return (
    <main className="page page-passkey-session">
      <section className="page-header">
        <div className="page-kicker">
          <Fingerprint size={16} />
          <span>Passkey Session</span>
        </div>
        <h1 className="page-title">Passkey session</h1>
        <p className="page-copy">{runtimeCopy[runtimeMode]}</p>
      </section>

      <section className="page-grid page-grid-primary">
        <article className={`info-card ${runtimeMode === 'simulation' ? 'is-simulation' : p256Available ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <Network size={16} />
              Network scope
            </span>
            <strong>{networkLabel}</strong>
          </div>
          <p className="info-card-copy">
            Mainnet and Calibration authorizations are separate records. This page is showing the {networkNames[network]} scope only.
          </p>
        </article>

        <article className={`info-card ${passkeySupported ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <KeyRound size={16} />
              Browser passkey
            </span>
            <strong>{passkeySupported ? 'Supported' : 'Unavailable'}</strong>
          </div>
          <p className="info-card-copy">
            {passkeySupported
              ? 'WebAuthn and local passkey assertion APIs are available in this browser context.'
              : 'This browser context cannot create or test the Synapse demo passkey.'}
          </p>
        </article>

        <article className={`info-card ${walletReady ? 'is-live' : 'is-pending'}`}>
          <div className="info-card-head">
            <span className="info-card-label">
              <ShieldCheck size={16} />
              Root wallet
            </span>
            <strong>{walletReady ? 'Ready' : 'Required'}</strong>
          </div>
          <p className="info-card-copy">{walletRequirementDetail}</p>
        </article>
      </section>

      {error ? (
        <section className="callout warning">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </section>
      ) : null}

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Setup progress</h2>
            <span className="panel-meta">{uploadsReady ? 'Ready' : 'Incomplete'}</span>
          </div>
          <dl className="status-list">
            {progress.map((item) => (
              <div className="status-row" key={item.label}>
                <dt>
                  {item.complete ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                  {item.label}
                </dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="panel-note">
            {runtimeMode === 'pending-network'
              ? 'Authorization is pending because P256VERIFY is not available for a live device session.'
              : runtimeMode === 'simulation'
                ? 'Simulated authorization can unlock demo UI, but it is not live on-chain verification.'
                : 'Ready status requires a credential, assertion test, and live-capable authorization path.'}
          </p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Actions</h2>
            <span className="panel-meta">{busyLabel ?? 'Idle'}</span>
          </div>
          <button type="button" className="primary-action" onClick={onCreatePasskey} disabled={busy || !passkeySupported}>
            <Fingerprint size={16} />
            <span>{credential ? 'Replace passkey' : 'Create passkey'}</span>
          </button>
          <button type="button" className="secondary-button" onClick={onTestPasskey} disabled={busy || !credential || !passkeySupported}>
            <ShieldCheck size={16} />
            <span>Test assertion</span>
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onSimulateAuthorize}
            disabled={busy || !credential || runtimeMode !== 'simulation' || !walletReady}
          >
            <Sparkles size={16} />
            <span>Simulate authorization</span>
          </button>
          <button type="button" className="secondary-button" onClick={onRevokeAuthorization} disabled={busy || !authorization}>
            <ShieldX size={16} />
            <span>Revoke authorization</span>
          </button>
          <button type="button" className="secondary-button" onClick={onRemovePasskey} disabled={busy || !credential}>
            <Trash2 size={16} />
            <span>Remove passkey</span>
          </button>
          <p className="panel-note">
            {busyLabel ?? 'Live authorization remains disabled unless the runtime can prove P256VERIFY support.'}
          </p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Credential</h2>
            <span className="panel-meta">{credential ? 'Stored locally' : 'Missing'}</span>
          </div>
          <dl className="status-list">
            <StatusRow label="Label" value={credential?.label ?? 'None'} />
            <StatusRow label="Public key fingerprint" value={credential?.publicKeyFingerprint ?? 'Not derived'} />
            <StatusRow label="Synthetic signer" value={credential?.syntheticSigner ?? 'Not derived'} />
            <StatusRow label="RP ID" value={credential?.rpId ?? 'Unavailable'} />
            <StatusRow label="Origin" value={credential?.origin ?? 'Unavailable'} />
            <StatusRow label="Created" value={credential?.createdAt ? formatDate(credential.createdAt) : 'Unavailable'} />
          </dl>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Authorization record</h2>
            <span className="panel-meta">{authorization?.status ?? 'None'}</span>
          </div>
          <dl className="status-list">
            <StatusRow label="Wallet" value={walletConnected ? walletLabel : 'Not connected'} />
            <StatusRow label="Network" value={authorization ? networkNames[authorization.network] : networkLabel} />
            <StatusRow label="Chain ID" value={authorization?.chainId ? String(authorization.chainId) : 'Unavailable'} />
            <StatusRow label="Root" value={authorization?.rootAddress ?? 'Unavailable'} />
            <StatusRow label="Permissions" value={formatPermissions(authorization)} />
            <StatusRow label="Expires" value={authorization?.expiresAt ? formatDate(authorization.expiresAt) : 'Not set'} />
            <StatusRow label="Mode" value={authorizationModeLabel(runtimeMode, authorization)} />
          </dl>
          <p className="panel-note">
            Mainnet authorization cannot be reused on Calibration, and Calibration authorization cannot be reused on Mainnet.
          </p>
        </article>
      </section>

      <section className="page-grid page-grid-secondary">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Assertion shape</h2>
            <span className="panel-meta">{testResult ? 'Present' : 'Not tested'}</span>
          </div>
          <dl className="status-list">
            <StatusRow label="Challenge" value={testResult ? (testResult.challengeMatches ? 'Matches' : 'Mismatch') : 'Unavailable'} />
            <StatusRow label="Client data type" value={testResult?.clientDataType ?? 'Unavailable'} />
            <StatusRow label="Origin" value={testResult?.origin ?? 'Unavailable'} />
            <StatusRow label="Authenticator bytes" value={formatNumber(testResult?.authenticatorDataLength)} />
            <StatusRow label="Client JSON bytes" value={formatNumber(testResult?.clientDataJSONLength)} />
            <StatusRow label="Signature bytes" value={formatNumber(testResult?.signatureLength)} />
            <StatusRow label="Signature format" value={testResult?.signatureFormat ?? 'Unavailable'} />
          </dl>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Verification boundary</h2>
            <span className="panel-meta">{runtimeMode}</span>
          </div>
          <p className="panel-copy">
            {runtimeMode === 'pending-network'
              ? 'P256VERIFY is pending for this mode, so authorization is displayed as unavailable instead of live.'
              : runtimeMode === 'simulation'
                ? 'The simulated authorization path is clearly labeled and does not claim live on-chain verification.'
                : 'Live labels should only appear when the selected network has P256VERIFY available.'}
          </p>
          <div className={`status-pill ${uploadsReady ? 'success' : runtimeMode === 'simulation' ? 'simulation' : 'pending'}`}>
            {uploadsReady ? <Link2 size={14} /> : <RotateCcw size={14} />}
            <span>
              {uploadsReady
                ? runtimeMode === 'simulation'
                  ? 'Simulation passkey uploads ready'
                  : 'Passkey uploads ready'
                : 'Passkey uploads not ready'}
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function getAuthorizationState({
  runtimeMode,
  p256Available,
  authorization,
}: {
  runtimeMode: DemoRuntimeMode;
  p256Available: boolean;
  authorization: PasskeyAuthorizationRecord | null;
}) {
  const expired = isAuthorizationExpired(authorization);

  if (expired) {
    return {
      ready: false,
      tone: 'is-pending',
      label: 'Expired',
      detail: 'The authorization record is expired. Re-authorize this device before uploading.',
    };
  }

  if (runtimeMode === 'pending-network') {
    return {
      ready: false,
      tone: 'is-pending',
      label: 'Pending P256VERIFY',
      detail: 'Authorization is unavailable in Pending Network Mode because P256VERIFY is not live.',
    };
  }

  if (runtimeMode === 'simulation') {
    const ready = authorization?.status === 'simulation-authorized';
    return {
      ready,
      tone: 'is-simulation',
      label: ready ? 'Simulated' : 'Not simulated',
      detail: ready
        ? 'This is a simulated authorization record, not live on-chain verification.'
        : 'Run simulated authorization to exercise the local demo session path.',
    };
  }

  if (!p256Available) {
    return {
      ready: false,
      tone: 'is-pending',
      label: 'Unavailable',
      detail: 'Live authorization is blocked until P256VERIFY is available on the selected network.',
    };
  }

  const ready = Boolean(authorization && !authorization.simulated && authorization.status === 'authorized');
  return {
    ready,
    tone: ready ? 'is-live' : 'is-pending',
    label: ready ? 'Authorized' : 'Not authorized',
    detail: ready
      ? 'A scoped authorization record is present for this network.'
      : 'No live on-chain authorization record is present for this network.',
  };
}

function isAuthorizationExpired(authorization: PasskeyAuthorizationRecord | null) {
  return typeof authorization?.expiresAt === 'number' && authorization.expiresAt <= Date.now();
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function formatPermissions(authorization: PasskeyAuthorizationRecord | null) {
  if (!authorization || authorization.permissions.length === 0) {
    return 'None';
  }

  return authorization.permissions.join(', ');
}

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? value.toLocaleString() : 'Unavailable';
}

function authorizationModeLabel(
  runtimeMode: DemoRuntimeMode,
  authorization: PasskeyAuthorizationRecord | null,
) {
  if (!authorization) {
    return 'No record';
  }

  if (runtimeMode === 'pending-network' || authorization.status === 'pending-network') {
    return 'Pending P256VERIFY';
  }

  if (authorization.simulated) {
    return 'Simulated authorization';
  }

  return 'Live authorization record';
}
