import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './utils';

export interface ShellCardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

export function ShellCard({
  title,
  eyebrow,
  description,
  actions,
  className,
  children,
  ...rest
}: ShellCardProps) {
  return (
    <section {...rest} className={classNames('shell-card', className)}>
      {(eyebrow || title || description || actions) ? (
        <header className="shell-card__header">
          <div className="shell-card__heading-group">
            {eyebrow ? <div className="shell-card__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="shell-card__title">{title}</h2> : null}
            {description ? <p className="shell-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="shell-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children ? <div className="shell-card__body">{children}</div> : null}
    </section>
  );
}

