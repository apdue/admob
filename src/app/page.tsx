'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format, subDays } from 'date-fns';

const RevenueChart = dynamic(() => import('./components/RevenueChart'), { ssr: false });
const AdMobTable = dynamic(() => import('./components/AdMobTable'), { ssr: false });
const AuthButton = dynamic(() => import('./components/AuthButton'), { ssr: false });

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

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    console.log('Date range:', dateRange);
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch account data
      const accountResponse = await fetch('/api/admob/accounts');
      if (!accountResponse.ok) {
        throw new Error('Failed to fetch AdMob account data');
      }
      const accountResult = await accountResponse.json();
      setAccountData(accountResult);

      // Fetch report data
      const reportResponse = await fetch('/api/admob/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange),
      });
      if (!reportResponse.ok) {
        throw new Error('Failed to fetch AdMob report data');
      }
      const reportResult = await reportResponse.json();
      console.log('Report Data:', reportResult);
      setReportData(reportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!reportData || !Array.isArray(reportData)) {
      console.log('No valid report data:', reportData);
      return null;
    }
    
    // Filter out header and footer objects and get only row objects
    const rows = reportData.filter(item => item.row).map(item => item.row);
    
    if (rows.length === 0) {
      console.log('No rows found in filtered data');
      return null;
    }
    
    console.log('First row structure:', JSON.stringify(rows[0], null, 2));
    
    try {
      return rows.reduce((acc: any, row: any) => {
        // Log the structure of each row's metricValues
        console.log('Row metric values:', row.metricValues);
        
        // Safely access values with null checks
        const revenue = row.metricValues?.ESTIMATED_EARNINGS?.microsValue ? parseFloat(row.metricValues.ESTIMATED_EARNINGS.microsValue) / 1000000 : 0;
        const impressions = row.metricValues?.IMPRESSIONS?.integerValue ? parseInt(row.metricValues.IMPRESSIONS.integerValue) : 0;
        const clicks = row.metricValues?.CLICKS?.integerValue ? parseInt(row.metricValues.CLICKS.integerValue) : 0;
        
        console.log('Processing row:', { revenue, impressions, clicks });
        
        return {
          revenue: acc.revenue + revenue,
          impressions: acc.impressions + impressions,
          clicks: acc.clicks + clicks,
        };
      }, { revenue: 0, impressions: 0, clicks: 0 });
    } catch (error) {
      console.error('Error calculating totals:', error);
      return null;
    }
  };

  const totals = calculateTotals();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-red-800 text-lg font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">AdMob Dashboard</h1>
          <AuthButton />
        </div>
        
        {/* Date Range Selector */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border rounded-md p-2"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            {totals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(totals.revenue)}
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Total Impressions</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {totals.impressions.toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Total Clicks</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {totals.clicks.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Revenue Chart */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Revenue Chart</h2>
              <div className="h-[400px]">
                <RevenueChart data={reportData} />
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Detailed Report</h2>
              <AdMobTable data={reportData} />
            </div>

            {/* Account Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Details</h2>
              <pre className="bg-white p-4 rounded overflow-auto">
                {JSON.stringify(accountData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
