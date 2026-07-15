import { ThreatItem } from '../../types/threat.types';
import { getSeverityColor, getCategoryIcon, formatRelativeTime } from '../../hooks/useThreatFeed';

interface ThreatCardProps {
  threat: ThreatItem;
}

export default function ThreatCard({ threat }: ThreatCardProps) {
  const severityColor = getSeverityColor(threat.severity);
  const icon = getCategoryIcon(threat.category);
  const relativeTime = formatRelativeTime(threat.publishedAt);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{icon}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${severityColor}`}>
              {threat.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 font-medium">{threat.source}</span>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{threat.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{threat.summary}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{relativeTime}</span>
            <a
              href={threat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Read More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
