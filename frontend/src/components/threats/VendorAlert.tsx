import { ThreatItem } from '../../types/threat.types';

interface VendorAlertProps {
  vendors: ThreatItem[];
  loading?: boolean;
}

export default function VendorAlert({ vendors, loading }: VendorAlertProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
            <div className="h-5 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No vendor vulnerabilities at this time</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {vendors.map((vendor) => (
        <a
          key={vendor.id}
          href={vendor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition-colors group"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">🏢</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-red-900 group-hover:text-red-950">
                {vendor.source}
              </h4>
              <p className="text-xs text-red-800 line-clamp-1">{vendor.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  vendor.severity === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : vendor.severity === 'high'
                      ? 'bg-orange-200 text-orange-800'
                      : vendor.severity === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-blue-200 text-blue-800'
                }`}>
                  {vendor.severity.toUpperCase()}
                </span>
                <span className="text-xs text-red-600 font-medium">View →</span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
