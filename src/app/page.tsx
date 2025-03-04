'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { format, subDays } from 'date-fns';

const RevenueChart = dynamic(() => import('./components/RevenueChart'), {
  ssr: false,
});

const AdMobTable = dynamic(() => import('./components/AdMobTable'), {
  ssr: false,
});

interface DimensionValue {
  value: string;
  displayLabel?: string;
}

interface MetricValue {
  microsValue?: string;
  integerValue?: string;
}

interface Row {
  dimensionValues: {
    DATE: DimensionValue;
    COUNTRY?: DimensionValue;
    APP?: DimensionValue;
  };
  metricValues: {
    ESTIMATED_EARNINGS: MetricValue;
    IMPRESSIONS: MetricValue;
    CLICKS: MetricValue;
  };
}

interface ReportRow {
  row: Row;
}

type ReportData = Array<ReportRow | { header: Record<string, unknown> } | { footer: Record<string, unknown> }>;

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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get AdMob account
      const accountResponse = await fetch('/api/admob/accounts');
      const accountData = await accountResponse.json();

      if (!accountData.account) {
        throw new Error('No AdMob account found');
      }

      // Get report data
      const reportResponse = await fetch('/api/admob/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accountData.account,
        }),
      });

      const data = await reportResponse.json();

      if (!data) {
        throw new Error('No report data received');
      }

      setReportData(data as ReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Revenue Overview</h2>
          <div className="bg-white rounded-lg shadow p-6 h-[400px]">
            <RevenueChart data={reportData} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Detailed Report</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <AdMobTable data={reportData} isLoading={isLoading} />
          </div>
        </section>
      </div>
    </main>
  );
}
