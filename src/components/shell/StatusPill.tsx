import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { classNames } from './utils';
import type { StatusTone } from './types';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'shell-status-pill--neutral',
  info: 'shell-status-pill--info',
  success: 'shell-status-pill--success',
  warning: 'shell-status-pill--warning',
  danger: 'shell-status-pill--danger',
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  label: string;
  detail?: string;
  icon?: LucideIcon;
  leadingContent?: ReactNode;
}

export function StatusPill({
  tone = 'neutral',
  label,
  detail,
  icon: Icon,
  leadingContent,
  className,
  ...rest
}: StatusPillProps) {
  return (
    <span
      {...rest}
      className={classNames('shell-status-pill', toneClasses[tone], className)}
    >
      {leadingContent}
      {Icon ? <Icon className="shell-status-pill__icon" aria-hidden="true" /> : null}
      <span className="shell-status-pill__label">{label}</span>
      {detail ? <span className="shell-status-pill__detail">{detail}</span> : null}
    </span>
  );
}

