export type NetworkMode = 'mainnet' | 'calibration';

export type RuntimeMode = 'live' | 'pending-network' | 'simulation';

export type UploadAvailability = 'available' | 'pending-network' | 'unavailable' | 'simulation';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarItemId =
  | 'home'
  | 'upload'
  | 'datasets'
  | 'files'
  | 'activity'
  | 'network-states'
  | 'payments'
  | 'passkey-session'
  | 'settings'
  | 'verification-checks';
