import { useConversations } from '../../hooks/useConversations';
import { ConversationSessionCard } from './ConversationSessionCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function ConversationHistory() {
  const { data: sessions, isLoading, error } = useConversations();

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
        <p className="text-red-800">Failed to load conversation history. Please try again.</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <ConversationSessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
