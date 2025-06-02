import React from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, className = '', children }) => {
  return (
    <article className={`bg-white rounded-lg shadow p-6 ${className}`.trim()}>
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      {children}
    </article>
  );
};

export default Card; 