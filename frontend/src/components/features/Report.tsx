import React from 'react';
import { Card } from '../ui/Card';

interface ReportProps {
  id?: string;
  title: string;
  generatedAt?: string;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  summary?: string;
  recommendations?: string[];
}

export const Report: React.FC<ReportProps> = ({
  id,
  title,
  generatedAt,
  riskScore,
  riskLevel,
  summary,
  recommendations = [],
}) => {
  return (
    <div className="space-y-6 rounded-lg border border-slate-800 bg-white p-6">
      <div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {generatedAt && <p className="mt-2 text-sm text-slate-600">Generated: {generatedAt}</p>}
      </div>

      {riskScore !== undefined && (
        <Card variant={riskLevel === 'high' || riskLevel === 'critical' ? 'warning' : 'default'} className="space-y-2">
          <div className="text-sm text-slate-600">Risk Score</div>
          <div className="text-4xl font-bold text-white">{riskScore}/100</div>
          {riskLevel && <div className="text-sm font-medium capitalize text-slate-300">{riskLevel} Risk</div>}
        </Card>
      )}

      {summary && (
        <div>
          <h3 className="font-semibold text-white mb-2">Summary</h3>
          <p className="text-slate-300">{summary}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-slate-300">
                <span className="font-bold text-blue-600">{idx + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
