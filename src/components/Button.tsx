import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'gold' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-linear-to-br from-magenta to-cyan text-white shadow-lg shadow-magenta/30 hover:brightness-105',
  gold: 'bg-linear-to-br from-gold to-magenta text-ink shadow-lg shadow-gold/30 hover:brightness-105',
  secondary:
    'bg-surface text-ink border-2 border-line hover:border-magenta',
  ghost: 'bg-transparent text-magenta hover:text-cyan',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`rounded-2xl px-6 py-3.5 font-display text-lg font-semibold tracking-wide transition-[filter,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
