const SIZES = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl sm:text-7xl',
  xl: 'text-7xl sm:text-8xl',
};

interface Props {
  size?: keyof typeof SIZES;
  className?: string;
}

/** The Tim-oggle wordmark — "Tim" gets the birthday-gold gradient treatment. */
export default function Wordmark({ size = 'lg', className = '' }: Props) {
  return (
    <h1
      className={`select-none font-display font-bold leading-none tracking-tight ${SIZES[size]} ${className}`}
    >
      <span className="bg-linear-to-br from-gold via-magenta to-cyan bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(43,149,240,0.3)]">
        Tim
      </span>
      <span className="text-ink">-oggle</span>
    </h1>
  );
}
