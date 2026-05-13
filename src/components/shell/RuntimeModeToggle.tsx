import type { ButtonHTMLAttributes } from 'react';
import { Activity, CheckCircle2, Clock3, TriangleAlert } from 'lucide-react';
import { classNames } from './utils';
import type { RuntimeMode } from './types';

export interface RuntimeModeToggleProps {
  value: RuntimeMode;
  onChange: (value: RuntimeMode) => void;
  className?: string;
  disabled?: boolean;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'type'>;
}

const options: Array<{ value: RuntimeMode; label: string; icon: typeof Activity }> = [
  { value: 'live', label: 'Live', icon: Activity },
  { value: 'pending-network', label: 'Pending', icon: Clock3 },
  { value: 'simulation', label: 'Simulation', icon: TriangleAlert },
];

export function RuntimeModeToggle({ value, onChange, className, disabled, buttonProps }: RuntimeModeToggleProps) {
  return (
    <div className={classNames('shell-toggle shell-toggle--runtime', className)} role="group" aria-label="Runtime mode">
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            {...buttonProps}
            className={classNames(
              'shell-toggle__option',
              selected && 'shell-toggle__option--selected',
              disabled && 'shell-toggle__option--disabled',
              buttonProps?.className,
            )}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
          >
            <Icon className="shell-toggle__icon" aria-hidden="true" />
            <span className="shell-toggle__label">{label}</span>
            {selected ? <CheckCircle2 className="shell-toggle__selected-icon" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

