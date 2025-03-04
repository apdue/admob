import { useState, useMemo } from 'react';
import { format, parse } from 'date-fns';

interface MetricValue {
  microsValue?: string;
  integerValue?: string;
}

interface MetricValues {
  ESTIMATED_EARNINGS: MetricValue;
  IMPRESSIONS: MetricValue;
  CLICKS: MetricValue;
}

interface DimensionValue {
  value: string;
  displayLabel?: string;
}

interface Row {
  dimensionValues: {
    COUNTRY: DimensionValue;
    APP: DimensionValue;
    DATE: DimensionValue;
  };
  metricValues: MetricValues;
}

interface ReportRow {
  row: Row;
}

interface ReportData extends Array<ReportRow | { header: any } | { footer: any }> {}

interface AdMobTableProps {
  data: ReportData | null;
}

interface Column {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  align: 'left' | 'right';
}

const formatCurrency = (microsValue: string) => {
  const dollars = parseFloat(microsValue) / 1000000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
};

const formatNumber = (value: string) => {
  return new Intl.NumberFormat('en-US').format(parseInt(value));
};

// Country code to full name mapping
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

const AdMobTable: React.FC<AdMobTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'revenue',
    direction: 'descending',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [appFilter, setAppFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<Column[]>([
    { key: 'date', label: 'Date', visible: true, sortable: true, align: 'left' },
    { key: 'country', label: 'Country', visible: true, sortable: true, align: 'left' },
    { key: 'app', label: 'App', visible: true, sortable: true, align: 'left' },
    { key: 'revenue', label: 'Revenue', visible: true, sortable: true, align: 'right' },
    { key: 'impressions', label: 'Impressions', visible: true, sortable: true, align: 'right' },
    { key: 'clicks', label: 'Clicks', visible: true, sortable: true, align: 'right' },
  ]);

  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return {
        rows: [],
        summaryByCountry: new Map(),
        summaryByApp: new Map(),
        totals: { revenue: 0, impressions: 0, clicks: 0 },
      };
    }

    const rows = data
      .filter((item): item is ReportRow => 'row' in item)
      .map(item => {
        const row = item.row;
        const countryCode = row.dimensionValues.COUNTRY.value;
        let countryName;
        try {
          countryName = countryNames.of(countryCode) || countryCode;
        } catch {
          countryName = countryCode;
        }
        
        // Parse and format date from YYYYMMDD format
        const dateStr = row.dimensionValues.DATE.value;
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date());
        const formattedDate = format(date, 'MMM d, yyyy');
        
        return {
          date: formattedDate,
          dateRaw: `${year}-${month}-${day}`, // Store in yyyy-MM-dd format for sorting
          country: countryName,
          countryCode: countryCode,
          app: row.dimensionValues.APP.displayLabel || row.dimensionValues.APP.value,
          appId: row.dimensionValues.APP.value,
          revenue: parseFloat(row.metricValues.ESTIMATED_EARNINGS.microsValue || '0') / 1000000,
          impressions: parseInt(row.metricValues.IMPRESSIONS.integerValue || '0'),
          clicks: parseInt(row.metricValues.CLICKS.integerValue || '0'),
        };
      });

    // Calculate summaries
    const summaryByCountry = new Map();
    const summaryByApp = new Map();
    const totals = { revenue: 0, impressions: 0, clicks: 0 };

    rows.forEach(row => {
      // Country summary
      if (!summaryByCountry.has(row.country)) {
        summaryByCountry.set(row.country, { revenue: 0, impressions: 0, clicks: 0 });
      }
      const countryStats = summaryByCountry.get(row.country);
      countryStats.revenue += row.revenue;
      countryStats.impressions += row.impressions;
      countryStats.clicks += row.clicks;

      // App summary
      if (!summaryByApp.has(row.app)) {
        summaryByApp.set(row.app, { revenue: 0, impressions: 0, clicks: 0 });
      }
      const appStats = summaryByApp.get(row.app);
      appStats.revenue += row.revenue;
      appStats.impressions += row.impressions;
      appStats.clicks += row.clicks;

      // Overall totals
      totals.revenue += row.revenue;
      totals.impressions += row.impressions;
      totals.clicks += row.clicks;
    });

    // Sort data
    const sortedRows = [...rows].sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'ascending'
          ? a.dateRaw.localeCompare(b.dateRaw)
          : b.dateRaw.localeCompare(a.dateRaw);
      }
      if (sortConfig.key === 'country' || sortConfig.key === 'app') {
        return sortConfig.direction === 'ascending'
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      }
      return sortConfig.direction === 'ascending'
        ? (a[sortConfig.key as keyof typeof a] as number) - (b[sortConfig.key as keyof typeof b] as number)
        : (b[sortConfig.key as keyof typeof b] as number) - (a[sortConfig.key as keyof typeof a] as number);
    });

    return {
      rows: sortedRows,
      summaryByCountry,
      summaryByApp,
      totals,
    };
  }, [data, sortConfig]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(processedData.rows.map(row => row.date))).sort((a, b) => {
      const dateA = parse(a, 'MMM d, yyyy', new Date());
      const dateB = parse(b, 'MMM d, yyyy', new Date());
      return dateB.getTime() - dateA.getTime();
    });
  }, [processedData.rows]);

  const filteredRows = useMemo(() => {
    return processedData.rows.filter(row => {
      const matchesCountry = !countryFilter || 
        row.country.toLowerCase().includes(countryFilter.toLowerCase());
      const matchesApp = !appFilter || 
        row.app.toLowerCase().includes(appFilter.toLowerCase()) ||
        row.appId.toLowerCase().includes(appFilter.toLowerCase());
      const matchesDate = !dateFilter || row.date === dateFilter;
      return matchesCountry && matchesApp && matchesDate;
    });
  }, [processedData.rows, countryFilter, appFilter, dateFilter]);

  const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(processedData.rows.map(row => row.country))).sort();
  }, [processedData.rows]);

  const uniqueApps = useMemo(() => {
    return Array.from(new Set(processedData.rows.map(row => row.app))).sort();
  }, [processedData.rows]);

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const requestSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction:
        current.key === key && current.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
  };

  if (!processedData.rows.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Filters and Column Settings */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Date Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Dates</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Country Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Country
            </label>
            <div className="relative">
              <input
                type="text"
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search country..."
              />
              {countryFilter && (
                <button
                  onClick={() => setCountryFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            <div className="mt-1">
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* App Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by App
            </label>
            <div className="relative">
              <input
                type="text"
                value={appFilter}
                onChange={(e) => {
                  setAppFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search app..."
              />
              {appFilter && (
                <button
                  onClick={() => setAppFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            <div className="mt-1">
              <select
                value={appFilter}
                onChange={(e) => {
                  setAppFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Apps</option>
                {uniqueApps.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column Settings */}
          <div className="flex-none">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Column Settings
            </label>
            <div className="relative">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Toggle Columns
              </button>
              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="p-2">
                    {columns.map(column => (
                      <label key={column.key} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumnVisibility(column.key)}
                          className="mr-2"
                        />
                        {column.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rows per page and entry count */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="mr-2">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} entries
          {(countryFilter || appFilter || dateFilter) && ' (filtered)'}
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            {columns.filter(col => col.visible).map(column => (
              <th
                key={column.key}
                className={`px-4 py-2 ${column.align === 'right' ? 'text-right' : 'text-left'} ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && requestSort(column.key)}
              >
                {column.label}
                {sortConfig.key === column.key && (
                  <span>{sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <tr
              key={`${row.dateRaw}-${row.countryCode}-${row.appId}-${index}`}
              className="border-t border-gray-100 hover:bg-gray-50"
            >
              {columns.filter(col => col.visible).map(column => (
                <td
                  key={column.key}
                  className={`px-4 py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.key === 'app' ? (
                    <div>
                      <div>{row.app}</div>
                      <div className="text-xs text-gray-500">{row.appId}</div>
                    </div>
                  ) : column.key === 'revenue' ? (
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(row.revenue)
                  ) : column.key === 'impressions' ? (
                    row.impressions.toLocaleString()
                  ) : column.key === 'clicks' ? (
                    row.clicks.toLocaleString()
                  ) : (
                    row[column.key as keyof typeof row]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-semibold">
            <td colSpan={columns.filter(col => col.visible && col.key !== 'revenue' && col.key !== 'impressions' && col.key !== 'clicks').length} className="px-4 py-2">
              Total
            </td>
            {columns.filter(col => col.visible && (col.key === 'revenue' || col.key === 'impressions' || col.key === 'clicks')).map(column => (
              <td key={column.key} className="px-4 py-2 text-right">
                {column.key === 'revenue' ? (
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(processedData.totals.revenue)
                ) : column.key === 'impressions' ? (
                  processedData.totals.impressions.toLocaleString()
                ) : (
                  processedData.totals.clicks.toLocaleString()
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex gap-2">
          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            let pageNum;
            if (pageCount <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= pageCount - 2) {
              pageNum = pageCount - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
          disabled={currentPage === pageCount}
          className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Country Summary */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Summary by Country</h3>
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Country</th>
              <th className="px-4 py-2 text-right">Revenue</th>
              <th className="px-4 py-2 text-right">Impressions</th>
              <th className="px-4 py-2 text-right">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(processedData.summaryByCountry.entries()).map(([country, stats]) => (
              <tr key={country} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{country}</td>
                <td className="px-4 py-2 text-right">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(stats.revenue)}
                </td>
                <td className="px-4 py-2 text-right">{stats.impressions.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{stats.clicks.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* App Summary */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Summary by App</h3>
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">App</th>
              <th className="px-4 py-2 text-right">Revenue</th>
              <th className="px-4 py-2 text-right">Impressions</th>
              <th className="px-4 py-2 text-right">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(processedData.summaryByApp.entries()).map(([app, stats]) => (
              <tr key={app} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{app}</td>
                <td className="px-4 py-2 text-right">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(stats.revenue)}
                </td>
                <td className="px-4 py-2 text-right">{stats.impressions.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{stats.clicks.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdMobTable; 