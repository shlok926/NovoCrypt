import { ThreatLevel } from '../../types/threat.types';

interface ThreatLevelBadgeProps {
  threatLevel: ThreatLevel | null;
  loading?: boolean;
}

export default function ThreatLevelBadge({ threatLevel, loading }: ThreatLevelBadgeProps) {
  if (loading || !threatLevel) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-32"></div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const colorClass = getLevelColor(threatLevel.level);

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getLevelIcon(threatLevel.level)}</span>
          <div>
            <h3 className="font-bold uppercase text-sm">{threatLevel.level} Threat Level</h3>
            <p className="text-xs opacity-75">{threatLevel.summary}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">{threatLevel.score}/100</div>
          <div className="flex items-center gap-1 text-xs font-semibold mt-1">
            <span>{getTrendIcon(threatLevel.trend)}</span>
            <span className="capitalize">{threatLevel.trend}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-black bg-opacity-10 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            threatLevel.level === 'critical'
              ? 'bg-red-600'
              : threatLevel.level === 'high'
                ? 'bg-orange-600'
                : threatLevel.level === 'medium'
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
          }`}
          style={{ width: `${threatLevel.score}%` }}
        ></div>
      </div>
    </div>
  );
}
