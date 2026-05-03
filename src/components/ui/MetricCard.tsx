import * as React from 'react';
import Card from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  delta?: string;
  deltaDirection?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  delta,
  deltaDirection
}) => {
  return (
    <Card className="flex flex-col justify-between min-h-[140px]">
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</span>
          <span className="text-xl text-gray-300 dark:text-gray-500">{icon}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl text-gray-900 dark:text-white">{value}</span>
          {delta && (
            <span className={`text-sm font-medium ${deltaDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {delta}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MetricCard; 