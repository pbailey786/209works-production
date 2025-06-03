import React from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  className = '',
  children,
}) => {
  return (
    <article className={`rounded-lg bg-white p-6 shadow ${className}`.trim()}>
      {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
      {children}
    </article>
  );
};

export default Card;
