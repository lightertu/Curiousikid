import { useHeadsUp } from '../../hooks/useHeadsUp';
import { HeadsUpCard } from './HeadsUpCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { HeadsUpAlert } from '../../types/conversation.types';

interface HeadsUpSectionProps {
  onViewDetails: (alert: HeadsUpAlert) => void;
}

export function HeadsUpSection({ onViewDetails }: HeadsUpSectionProps) {
  const { data: alerts, isLoading, error } = useHeadsUp();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load alerts. Please try again.</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-900">All Clear!</h3>
            <p className="text-green-700 text-sm">No heads up alerts at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort: unacknowledged first
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.acknowledged === b.acknowledged) return 0;
    return a.acknowledged ? 1 : -1;
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Heads Up!</h2>
        {unacknowledgedCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {unacknowledgedCount}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {sortedAlerts.map((alert) => (
          <HeadsUpCard key={alert.id} alert={alert} onViewDetails={onViewDetails} />
        ))}
      </div>
    </div>
  );
}
