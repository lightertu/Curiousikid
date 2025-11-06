import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HeadsUpSection } from './HeadsUpSection';
import { StoriesView } from './StoriesView';
import { UsageStatistics } from './UsageStatistics';
import { Modal } from '../common/Modal';
import type { HeadsUpAlert } from '../../types/conversation.types';
import { useConversations } from '../../hooks/useConversations';

type Tab = 'stories' | 'stats';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stories');
  const [selectedAlert, setSelectedAlert] = useState<HeadsUpAlert | null>(null);
  const { data: sessions } = useConversations();

  const childName = user?.childProfiles[0]?.name || 'Your Child';

  const handleViewAlertDetails = (alert: HeadsUpAlert) => {
    setSelectedAlert(alert);
  };

  const getAlertConversation = () => {
    if (!selectedAlert || !sessions) return null;
    return sessions.find((s) => s.id === selectedAlert.conversationSessionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-sm text-gray-600">Monitoring {childName}'s interactions</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Heads Up Section */}
        <HeadsUpSection onViewDetails={handleViewAlertDetails} />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('stories')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stories'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Stories & Conversations
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Usage Stats
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'stories' && <StoriesView />}
            {activeTab === 'stats' && <UsageStatistics />}
          </div>
        </div>
      </main>

      {/* Alert Details Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Conversation Details"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-900 mb-2">Heads Up Alert</p>
              <p className="text-yellow-800">{selectedAlert.summary}</p>
            </div>

            {getAlertConversation()?.utterances
              .filter((u) => selectedAlert.utteranceIds.includes(u.id))
              .map((utterance) => (
                <div key={utterance.id} className="space-y-2">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">Child:</p>
                    <p className="text-gray-800">{utterance.childSpeech}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {getAlertConversation()?.characterName}:
                    </p>
                    <p className="text-gray-800">{utterance.aiResponse}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Modal>


    </div>
  );
}
