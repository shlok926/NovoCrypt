import { ThreatItem } from '../../types/threat.types';

interface GovernmentAdvisoryProps {
  advisories: ThreatItem[];
  loading?: boolean;
}

export default function GovernmentAdvisory({ advisories, loading }: GovernmentAdvisoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (advisories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No government advisories at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {advisories.map((advisory) => (
        <a
          key={advisory.id}
          href={advisory.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-amber-50 border border-amber-200 rounded-lg p-3 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-amber-900 group-hover:text-amber-950">
                {advisory.source}
              </h4>
              <p className="text-xs text-amber-800 line-clamp-2">{advisory.title}</p>
              <p className="text-xs text-amber-700 mt-1">{advisory.summary}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
