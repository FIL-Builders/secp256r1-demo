import type { ButtonHTMLAttributes } from 'react';
import { CheckCircle2, FlaskConical, Globe } from 'lucide-react';
import { classNames } from './utils';
import type { NetworkMode } from './types';

export interface NetworkToggleProps {
  value: NetworkMode;
  onChange: (value: NetworkMode) => void;
  className?: string;
  disabled?: boolean;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'type'>;
}

const options: Array<{ value: NetworkMode; label: string; icon: typeof Globe }> = [
  { value: 'mainnet', label: 'Mainnet', icon: Globe },
  { value: 'calibration', label: 'Calibration', icon: FlaskConical },
];

export function NetworkToggle({ value, onChange, className, disabled, buttonProps }: NetworkToggleProps) {
  return (
    <div className={classNames('shell-toggle shell-toggle--network', className)} role="group" aria-label="Network selection">
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

