import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export default function StatsChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: item.count,
    amount: item.amount,
  }));

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Invoice Status Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'amount') return `$${value.toLocaleString()}`;
              return value;
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}