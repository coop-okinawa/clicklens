
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
      </div>
      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
        {icon}
      </div>
    </div>
  );
};
