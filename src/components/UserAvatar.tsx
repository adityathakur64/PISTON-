import { User } from 'lucide-react';

type UserAvatarProps = {
  src?: string;
  name?: string;
  className?: string;
  iconSize?: number;
};

const getInitials = (name?: string) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

export default function UserAvatar({ src, name, className = '', iconSize = 18 }: UserAvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Profile'}
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid place-items-center bg-zinc-950 text-zinc-500 ${className}`}
      aria-label={name || 'Profile'}
      role="img"
    >
      {initials ? (
        <span className="font-display font-black uppercase tracking-wider text-current">
          {initials}
        </span>
      ) : (
        <User size={iconSize} />
      )}
    </div>
  );
}
