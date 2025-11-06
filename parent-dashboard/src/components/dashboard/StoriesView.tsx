import { useState } from 'react';
import { useStorySummaries } from '../../hooks/useStorySummaries';
import { useConversations } from '../../hooks/useConversations';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../common/Card';
import { formatRelativeTime, formatDuration } from '../../utils/dateFormatters';
import type { StorySummary } from '../../services/mockData.service';

export function StoriesView() {
  const { data: stories, isLoading: storiesLoading } = useStorySummaries();
  const { data: sessions } = useConversations();
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (storiesLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
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
    <div className="space-y-6">
      {stories.map((story) => {
        const storySessions = sessions?.filter(s => s.storyTitle === story.storyTitle) || [];
        const isExpanded = expandedStory === story.storyId;

        return (
          <Card key={story.storyId} className="!p-0 overflow-hidden">
            {/* Story Header */}
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedStory(isExpanded ? null : story.storyId)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{story.storyTitle}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {story.keyThemes.map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Story Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{story.totalSessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Questions Asked</p>
                  <p className="text-2xl font-bold text-gray-900">{story.totalInterruptions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Listened</p>
                  <p className="text-lg font-semibold text-gray-900">{formatRelativeTime(story.lastListened)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-2xl font-bold text-green-600">High</p>
                </div>
              </div>

              {/* High-Level Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Overall Summary</p>
                <p className="text-gray-800">{story.overallSummary}</p>
              </div>
            </div>

            {/* Expanded Sessions */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-4">Listening Sessions</h4>
                {storySessions.map((session) => {
                  const sessionExpanded = expandedSession === session.id;
                  
                  return (
                    <div key={session.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Session Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedSession(sessionExpanded ? null : session.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎧</span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatRelativeTime(session.startTime)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {session.interruptionCount} questions • {formatDuration(session.duration)}
                              </p>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${sessionExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Session Summary */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-purple-900 mb-1">Session Summary</p>
                          <p className="text-sm text-gray-700">
                            Asked {session.interruptionCount} questions about{' '}
                            {session.utterances.map(u => u.topicTags[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Full Conversation */}
                      {sessionExpanded && (
                        <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Full Conversation</p>
                          {session.utterances.map((utterance) => (
                            <div key={utterance.id} className="space-y-2">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs font-medium text-blue-900 mb-1">Child:</p>
                                <p className="text-gray-800">{utterance.childSpeech}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-1">{session.characterName}:</p>
                                <p className="text-gray-800">{utterance.aiResponse}</p>
                              </div>
                              {utterance.topicTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pl-3">
                                  {utterance.topicTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
