import { useThreatFeed } from '../../hooks/useThreatFeed';
import ThreatLevelBadge from './ThreatLevelBadge';
import ThreatCard from './ThreatCard';
import GovernmentAdvisory from './GovernmentAdvisory';
import VendorAlert from './VendorAlert';
import ThreatFilterBar from './ThreatFilterBar';
import { useState } from 'react';

export default function ThreatFeedComponent() {
  const { feed, threatLevel, advisories, vendorAlerts, stats, loading, error, refresh } =
    useThreatFeed();
  const [page, setPage] = useState(1);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <h3 className="font-semibold">Error Loading Threats</h3>
        <p className="text-sm">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Threat Level */}
      <section>
        <h2 className="text-lg font-bold mb-4">Global Threat Status</h2>
        <ThreatLevelBadge threatLevel={threatLevel} loading={loading} />
      </section>

      {/* Statistics */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total Threats</p>
            <p className="text-3xl font-bold text-blue-900">{stats.totalThreats}</p>
          </div>

          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <p className="text-xs text-orange-600 font-semibold uppercase mb-1">High Risk</p>
            <p className="text-3xl font-bold text-orange-900">
              {stats.bySeverity.find((s: any) => s.severity === 'high')?._count || 0}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <p className="text-xs text-red-600 font-semibold uppercase mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-900">
              {stats.bySeverity.find((s: any) => s.severity === 'critical')?._count || 0}
            </p>
          </div>
        </section>
      )}

      {/* Government Advisories */}
      <section>
        <h2 className="text-lg font-bold mb-4">Government Advisories</h2>
        <GovernmentAdvisory advisories={advisories} loading={loading} />
      </section>

      {/* Vendor Alerts */}
      <section>
        <h2 className="text-lg font-bold mb-4">Vendor Vulnerability Alerts</h2>
        <VendorAlert vendors={vendorAlerts} loading={loading} />
      </section>

      {/* Threat Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Threat Feed</h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <ThreatFilterBar />

        {feed && (
          <div className="space-y-3 mt-4">
            {feed.items.map((item: any) => (
              <ThreatCard key={item.id} threat={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {feed && feed.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {feed.pages}
            </span>

            <button
              onClick={() => setPage(Math.min(feed.pages, page + 1))}
              disabled={page === feed.pages}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
