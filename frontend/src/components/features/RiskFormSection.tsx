import React from 'react';

interface RiskFormSectionProps {
  title?: string;
  children: React.ReactNode;
}

export const RiskFormSection: React.FC<RiskFormSectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-white p-6">
      {title && <h3 className="font-semibold text-white">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
