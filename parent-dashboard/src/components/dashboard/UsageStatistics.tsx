import { useUsageStats } from '../../hooks/useUsageStats';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../common/Card';
import { formatDuration } from '../../utils/dateFormatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

export function UsageStatistics() {
  const { data: stats, isLoading, error } = useUsageStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load usage statistics. Please try again.</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const dailyUsageData = stats.dailyUsage.map((day) => ({
    date: format(day.date, 'MMM d'),
    minutes: day.minutes,
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total Listening Time</p>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalListeningTime)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Unique Stories</p>
          <p className="text-2xl font-bold text-gray-900">{stats.uniqueStoriesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Avg Interruptions</p>
          <p className="text-2xl font-bold text-gray-900">{stats.averageInterruptionsPerSession.toFixed(1)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Time Range</p>
          <p className="text-2xl font-bold text-gray-900 capitalize">{stats.timeRange}</p>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage (Minutes)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyUsageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Topics Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Topics</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.topTopics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
