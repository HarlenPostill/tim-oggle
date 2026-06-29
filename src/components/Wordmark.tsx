import logoUrl from '../assets/logo.svg';

// Heights per size (the logo keeps its own aspect ratio via w-auto).
const SIZES = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16 sm:h-20',
  xl: 'h-24 sm:h-32',
};

interface Props {
  size?: keyof typeof SIZES;
  className?: string;
}

/** The Tim-oggle logo. */
export default function Wordmark({ size = 'lg', className = '' }: Props) {
  return (
    <img
      src={logoUrl}
      alt="Tim-oggle"
      className={`w-auto select-none drop-shadow-[0_3px_12px_rgba(12,83,207,0.25)] ${SIZES[size]} ${className}`}
    />
  );
}
