import { useState } from 'react';
import type { HeadsUpAlert } from '../../types/conversation.types';
import { formatRelativeTime } from '../../utils/dateFormatters';
import { useAcknowledgeAlert } from '../../hooks/useHeadsUp';

interface HeadsUpCardProps {
  alert: HeadsUpAlert;
  onViewDetails: (alert: HeadsUpAlert) => void;
}

const categoryColors = {
  death: 'bg-red-100 text-red-800 border-red-200',
  violence: 'bg-red-100 text-red-800 border-red-200',
  bullying: 'bg-orange-100 text-orange-800 border-orange-200',
  fear: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sadness: 'bg-blue-100 text-blue-800 border-blue-200',
  conflict: 'bg-purple-100 text-purple-800 border-purple-200',
  curiosity: 'bg-green-100 text-green-800 border-green-200',
  learning: 'bg-blue-100 text-blue-800 border-blue-200',
  emotions: 'bg-purple-100 text-purple-800 border-purple-200',
};

const categoryIcons = {
  death: '💭',
  violence: '⚠️',
  bullying: '😔',
  fear: '😰',
  sadness: '😢',
  conflict: '💢',
  curiosity: '🌟',
  learning: '📚',
  emotions: '💭',
};

const isPositiveCategory = (category: string) => {
  return ['curiosity', 'learning'].includes(category);
};

export function HeadsUpCard({ alert, onViewDetails }: HeadsUpCardProps) {
  const acknowledgeMutation = useAcknowledgeAlert();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAcknowledging(true);
    try {
      await acknowledgeMutation.mutateAsync(alert.id);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const positive = isPositiveCategory(alert.category);

  return (
    <div
      className={`border-l-4 ${
        alert.acknowledged 
          ? 'border-gray-300 bg-gray-50' 
          : positive 
            ? 'border-green-500 bg-white' 
            : 'border-red-500 bg-white'
      } rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onViewDetails(alert)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryIcons[alert.category]}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors[alert.category]}`}
            >
              {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
            </span>
            {alert.acknowledged && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Reviewed
              </span>
            )}
          </div>

          <p className="text-gray-900 font-medium mb-2">{alert.summary}</p>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {alert.storyTitle}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatRelativeTime(alert.timestamp)}
            </span>
          </div>
        </div>

        {!alert.acknowledged && (
          <button
            onClick={handleAcknowledge}
            disabled={isAcknowledging}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isAcknowledging ? 'Marking...' : 'Mark as Reviewed'}
          </button>
        )}
      </div>
    </div>
  );
}
