import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { classNames } from './utils';

export type ShellButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ShellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ShellButtonVariant;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

export const ShellButton = forwardRef<HTMLButtonElement, ShellButtonProps>(
  function ShellButton(
    { variant = 'secondary', leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        {...rest}
        className={classNames('shell-button', `shell-button--${variant}`, className)}
      >
        {LeadingIcon ? <LeadingIcon className="shell-button__icon" aria-hidden="true" /> : null}
        <span className="shell-button__label">{children}</span>
        {TrailingIcon ? <TrailingIcon className="shell-button__icon" aria-hidden="true" /> : null}
      </button>
    );
  },
);

