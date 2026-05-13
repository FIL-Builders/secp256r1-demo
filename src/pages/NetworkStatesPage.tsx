import {
  CreditCard,
  Globe2,
  Network,
  PauseCircle,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NetworkStateVariant =
  | 'mainnet-ready'
  | 'mainnet-pending'
  | 'calibration-ready'
  | 'calibration-pending'
  | 'wrong-chain'
  | 'p256-unavailable'
  | 'provider-unavailable'
  | 'insufficient-funds';

export interface NetworkStateCard {
  variant: NetworkStateVariant;
  title: string;
  detail: string;
  status: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export interface NetworkStatesPageProps {
  states: NetworkStateCard[];
}

const variantMeta: Record<
  NetworkStateVariant,
  { icon: LucideIcon; tone: string; badge: string }
> = {
  'mainnet-ready': { icon: Globe2, tone: 'is-live', badge: 'Mainnet ready' },
  'mainnet-pending': { icon: PauseCircle, tone: 'is-pending', badge: 'Mainnet pending' },
  'calibration-ready': { icon: Network, tone: 'is-live', badge: 'Calibration ready' },
  'calibration-pending': { icon: PauseCircle, tone: 'is-pending', badge: 'Calibration pending' },
  'wrong-chain': { icon: TriangleAlert, tone: 'is-warning', badge: 'Wrong chain' },
  'p256-unavailable': { icon: ShieldAlert, tone: 'is-warning', badge: 'P256 unavailable' },
  'provider-unavailable': { icon: WifiOff, tone: 'is-warning', badge: 'Provider unavailable' },
  'insufficient-funds': { icon: CreditCard, tone: 'is-warning', badge: 'Insufficient funds' },
};

export function NetworkStatesPage({ states }: NetworkStatesPageProps) {
  return (
    <main className="page page-network-states">
      <section className="page-header">
        <div className="page-kicker">
          <Network size={16} />
          <span>Network states</span>
        </div>
        <h1 className="page-title">Capability matrix</h1>
        <p className="page-copy">
          These states are designed to represent the honest runtime conditions for
          Mainnet and Calibration, including unavailable providers, missing
          P256VERIFY support, wrong-chain errors, and insufficient funds.
        </p>
      </section>

      <section className="state-grid">
        {states.map((state) => {
          const meta = variantMeta[state.variant];
          const Icon = meta.icon;
          return (
            <article key={`${state.variant}-${state.title}`} className={`state-card ${meta.tone}`}>
              <div className="state-card-head">
                <span className="state-badge">
                  <Icon size={16} />
                  {meta.badge}
                </span>
                <strong>{state.status}</strong>
              </div>
              <h2 className="state-title">{state.title}</h2>
              <p className="state-copy">{state.detail}</p>
              <dl className="state-meta">
                {state.primaryLabel ? (
                  <div>
                    <dt>Primary</dt>
                    <dd>{state.primaryLabel}</dd>
                  </div>
                ) : null}
                {state.secondaryLabel ? (
                  <div>
                    <dt>Secondary</dt>
                    <dd>{state.secondaryLabel}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          );
        })}
      </section>
    </main>
  );
}
