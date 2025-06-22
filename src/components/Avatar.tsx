import React from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { generateAltText } from '@/utils/accessibility';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
  userName?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  fallback = '?',
  className = '',
  userName,
}) => {
  // Generate appropriate alt text if not provided
  const altText = alt || generateAltText('avatar', { userName });

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 font-bold text-gray-600 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {src ? (
        <OptimizedImage
          src={src}
          alt={altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 40px, 48px"
        />
      ) : (
        <span aria-label={altText}>{fallback}</span>
      )}
    </div>
  );
};

export { Avatar };
export default Avatar;
