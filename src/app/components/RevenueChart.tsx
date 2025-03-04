import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
    DATE: DimensionValue;
  };
  metricValues: MetricValues;
}

interface ReportRow {
  row: Row;
}

interface ReportData extends Array<ReportRow | { header: Record<string, unknown> } | { footer: Record<string, unknown> }> {}

interface RevenueChartProps {
  data: ReportData | null;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  impressions: number;
  clicks: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter((item): item is ReportRow => 'row' in item)
      .map(item => {
        const row = item.row;
        const dateStr = row.dimensionValues.DATE.value;
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;

        return {
          date: formattedDate,
          revenue: parseFloat(row.metricValues.ESTIMATED_EARNINGS.microsValue || '0') / 1000000,
          impressions: parseInt(row.metricValues.IMPRESSIONS.integerValue || '0'),
          clicks: parseInt(row.metricValues.CLICKS.integerValue || '0'),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available for chart
      </div>
    );
  }

  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickFormatter={formatRevenue}
          />
          <YAxis
            yAxisId="metrics"
            orientation="right"
            tickFormatter={formatNumber}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return formatRevenue(value);
              return formatNumber(value);
            }}
          />
          <Legend />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            name="Revenue"
          />
          <Line
            yAxisId="metrics"
            type="monotone"
            dataKey="impressions"
            stroke="#82ca9d"
            name="Impressions"
          />
          <Line
            yAxisId="metrics"
            type="monotone"
            dataKey="clicks"
            stroke="#ffc658"
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart; 