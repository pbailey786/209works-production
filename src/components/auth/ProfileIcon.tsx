'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import { User } from 'lucide-react';

interface ProfileIconProps {
  size?: number;
  showLoadingState?: boolean;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

export default function ProfileIcon({
  size = 32,
  showLoadingState = true,
  fallbackIcon,
  className = ""
}: ProfileIconProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging for session state
  useEffect(() => {
    console.log('🔍 ProfileIcon session state:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!(session?.user as any)?.id,
      hasUserEmail: !!user?.emailAddresses?.[0]?.emailAddress,
      userName: user?.fullName,
      userEmail: user?.emailAddresses?.[0]?.emailAddress
    });
  }, [session, status]);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return showLoadingState ? (
      <div
        className={`animate-pulse rounded-full bg-gray-200 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading profile"
      />
    ) : null;
  }

  // Loading state
  if (status === 'loading') {
    return showLoadingState ? (
      <div
        className={`animate-pulse rounded-full bg-gray-200 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading profile"
      />
    ) : null;
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return fallbackIcon ? (
      <>{fallbackIcon}</>
    ) : (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-400 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Guest user"
      >
        <User size={size * 0.6} />
      </div>
    );
  }

  // Authenticated user
  const user = session.user;
  const displayName = user.name || user.email || 'User';

  // Generate initials fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(displayName);

  // If image failed to load or no image, show initials
  if (imageError || !user.image) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[#2d4a3e] text-white font-medium ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4
        }}
        aria-label={`${displayName} profile`}
      >
        {initials}
      </div>
    );
  }

  return (
    <Avatar
      src={user.image}
      alt={displayName}
      size={size}
      fallback={initials}
      className={`ring-2 ring-white ring-offset-1 ${className}`}
      userName={displayName}
    />
  );
}