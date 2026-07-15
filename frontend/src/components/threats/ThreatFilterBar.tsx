import { useThreatStore } from '../../store/threatStore';

interface ThreatFilterBarProps {
  onFilterChange?: (category?: string, severity?: string) => void;
}

export default function ThreatFilterBar({ onFilterChange }: ThreatFilterBarProps) {
  const { fetchFeed } = useThreatStore();

  const handleCategoryChange = (category: string | null) => {
    const severity = (document.querySelector('#severity-filter') as HTMLSelectElement)?.value || '';
    onFilterChange?.(category || undefined, severity || undefined);
    if (category) {
      fetchFeed(1, 20, category, severity || undefined);
    }
  };

  const handleSeverityChange = (severity: string | null) => {
    const category = (document.querySelector('#category-filter') as HTMLSelectElement)?.value || '';
    onFilterChange?.(category || undefined, severity || undefined);
    if (severity) {
      fetchFeed(1, 20, category || undefined, severity);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
        <select
          id="category-filter"
          onChange={(e) => handleCategoryChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="advisory">Government Advisory</option>
          <option value="research">Research</option>
          <option value="breach">Breach Report</option>
          <option value="vendor">Vendor Alert</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-700 mb-1">Severity</label>
        <select
          id="severity-filter"
          onChange={(e) => handleSeverityChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={() => {
            (document.querySelector('#category-filter') as HTMLSelectElement).value = '';
            (document.querySelector('#severity-filter') as HTMLSelectElement).value = '';
            handleCategoryChange(null);
          }}
          className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
