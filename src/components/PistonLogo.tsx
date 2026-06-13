interface PistonLogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    mark: 'h-8 w-8',
    word: 'text-xl tracking-[0.34em]',
    gap: 'gap-2',
  },
  md: {
    mark: 'h-10 w-10',
    word: 'text-2xl tracking-[0.36em]',
    gap: 'gap-3',
  },
  lg: {
    mark: 'h-14 w-14',
    word: 'text-4xl tracking-[0.38em]',
    gap: 'gap-4',
  },
};

function PistonMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 96"
      role="img"
      aria-label="PISTON mark"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 8h28l3 6v16l-5 5v19c0 8 7 13 7 23 0 12-8 20-19 20S13 89 13 77c0-10 7-15 7-23V35l-5-5V14l3-6Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M15 18h34M15 28h34M26 42v24M38 42v24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="77" r="11" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="23" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 58v10M8 74v5M56 58v10M56 74v5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function PistonLogo({ variant = 'full', size = 'md', className = '' }: PistonLogoProps) {
  const selected = sizes[size];

  if (variant === 'mark') {
    return (
      <div className={`text-brand-orange ${className}`}>
        <PistonMark className={selected.mark} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${selected.gap} ${className}`}>
      <PistonMark className={`${selected.mark} text-brand-orange drop-shadow-[0_0_16px_rgba(232,93,4,0.28)]`} />
      <span className={`font-display leading-none text-white ${selected.word}`}>PISTON</span>
    </div>
  );
}
