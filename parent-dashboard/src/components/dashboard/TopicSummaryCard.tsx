import type { TopicSummary } from '../../types/conversation.types';
import { formatRelativeTime } from '../../utils/dateFormatters';
import { Card } from '../common/Card';

interface TopicSummaryCardProps {
  summary: TopicSummary;
  onClick: (summary: TopicSummary) => void;
}

const categoryConfig = {
  friends: { icon: '👥', color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Friends' },
  emotions: { icon: '💭', color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Emotions' },
  characters: { icon: '📖', color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Characters' },
  learning: { icon: '🎓', color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Learning' },
  curiosity: { icon: '🤔', color: 'bg-green-100 text-green-800 border-green-200', label: 'Curiosity' },
};

export function TopicSummaryCard({ summary, onClick }: TopicSummaryCardProps) {
  const config = categoryConfig[summary.category];

  return (
    <Card onClick={() => onClick(summary)} className="hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-gray-900 font-medium mb-2">{summary.summary}</p>
          <div className="flex flex-col gap-1 text-sm text-gray-600">
            <span className="flex items-center gap-1 truncate">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="truncate">{summary.storyTitle}</span>
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatRelativeTime(summary.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
