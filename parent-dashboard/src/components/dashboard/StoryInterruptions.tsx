import { useStoryInterruptions } from '../../hooks/useStoryInterruptions';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../common/Card';
import { formatDuration } from '../../utils/dateFormatters';

export function StoryInterruptions() {
  const { data: stories, isLoading, error } = useStoryInterruptions();

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
        <p className="text-red-800">Failed to load story data. Please try again.</p>
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600">No stories listened to yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <Card key={story.storyId}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">{story.storyTitle}</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Listening Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDuration(story.totalListeningTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interruptions</p>
                  <p className="text-lg font-semibold text-gray-900">{story.interruptionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-lg font-semibold text-gray-900">{story.sessions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-lg font-semibold text-gray-900">{story.engagementScore}/100</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${story.engagementScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
