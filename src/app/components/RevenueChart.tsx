import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface ReportData extends Array<ReportRow | { header: any } | { footer: any }> {}

interface RevenueChartProps {
  data: ReportData | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  if (!data || !Array.isArray(data)) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Filter out header and footer objects and get only row objects
  const rows = data.filter((item): item is ReportRow => 'row' in item).map(item => item.row);

  if (rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No data available for the selected date range</p>
      </div>
    );
  }

  console.log('Chart data rows:', rows);

  const chartData = rows.map(row => {
    const revenue = row.metricValues?.ESTIMATED_EARNINGS?.microsValue 
      ? parseFloat(row.metricValues.ESTIMATED_EARNINGS.microsValue) / 1000000 
      : 0;
    const impressions = row.metricValues?.IMPRESSIONS?.integerValue 
      ? parseInt(row.metricValues.IMPRESSIONS.integerValue) 
      : 0;
    const clicks = row.metricValues?.CLICKS?.integerValue 
      ? parseInt(row.metricValues.CLICKS.integerValue) 
      : 0;

    return {
      date: row.dimensionValues.DATE.value,
      revenue,
      impressions,
      clicks,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow-lg border">
          <p className="text-sm font-semibold mb-2">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-green-600">
            Impressions: {payload[1].value.toLocaleString()}
          </p>
          <p className="text-sm text-yellow-600">
            Clicks: {payload[2].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString();
          }}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="#8884d8"
          name="Revenue"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="impressions"
          stroke="#82ca9d"
          name="Impressions"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="clicks"
          stroke="#ffc658"
          name="Clicks"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart; 