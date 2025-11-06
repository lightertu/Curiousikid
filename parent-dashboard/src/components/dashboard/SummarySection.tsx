import { useSummary } from '../../hooks/useSummary';
import { TopicSummaryCard } from './TopicSummaryCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { TopicSummary } from '../../types/conversation.types';

interface SummarySectionProps {
  onViewDetails: (summary: TopicSummary) => void;
}

export function SummarySection({ onViewDetails }: SummarySectionProps) {
  const { data: summaries, isLoading, error } = useSummary();

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
        <p className="text-red-800">Failed to load summaries. Please try again.</p>
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">No recent interactions to summarize.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Recent Topics</h2>
      <p className="text-gray-600">What your child has been exploring in the last 7 days</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((summary) => (
          <TopicSummaryCard key={summary.id} summary={summary} onClick={onViewDetails} />
        ))}
      </div>
    </div>
  );
}
