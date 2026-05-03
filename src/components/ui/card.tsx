import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
