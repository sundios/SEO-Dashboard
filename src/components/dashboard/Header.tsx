import React from 'react';
import Card from '../ui/card';

interface HeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, rightContent }) => {
  return (
    <Card className="flex items-center justify-between px-6 py-4 mb-6 border-b-0 shadow-none">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div>{rightContent}</div>
    </Card>
  );
};

export default Header; 