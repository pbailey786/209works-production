'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import { User } from 'lucide-react';

interface ProfileIconProps {
  size?: number;
  showLoadingState?: boolean;
  fallbackIcon?: React.ReactNode;
}

export default function ProfileIcon({ 
  size = 32, 
  showLoadingState = true,
  fallbackIcon
}: ProfileIconProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return showLoadingState ? (
      <div 
        className="animate-pulse rounded-full bg-gray-200" 
        style={{ width: size, height: size }}
      />
    ) : null;
  }

  // Loading state
  if (status === 'loading') {
    return showLoadingState ? (
      <div 
        className="animate-pulse rounded-full bg-gray-200" 
        style={{ width: size, height: size }}
      />
    ) : null;
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return fallbackIcon ? (
      <>{fallbackIcon}</>
    ) : (
      <div 
        className="flex items-center justify-center rounded-full bg-gray-100 text-gray-400"
        style={{ width: size, height: size }}
      >
        <User size={size * 0.6} />
      </div>
    );
  }

  // Authenticated user
  const user = session.user;
  const displayName = user.name || user.email || 'User';

  return (
    <Avatar
      src={user.image || undefined}
      alt={displayName}
      size={size}
      className="ring-2 ring-white ring-offset-1"
    />
  );
}