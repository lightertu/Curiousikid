import React from 'react';
import { StateValue } from 'xstate';
import { DeviceContext } from '../DeviceStateMachine';
interface BreadcrumbProps {
    context: DeviceContext; // The current state value from useMachine
    stateValue: StateValue; // The current state value from useMachine
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ context, stateValue }) => {
    let displayValue = '';
    let path = ['Main Menu']; // Start with base path

    if (typeof stateValue === 'string') {
        switch (stateValue) {
            case 'mainMenu':
                // Path is already ['Main Menu']
                break;
            case 'storiesSelection':
                path.push('Stories');
                break;
            case 'storyIsPlaying':
            case 'storyIsPaused':
                path.push('Stories'); // Might need context to know which story
                path.push(context.currentStory?.title || 'Playback');
                break;
            case 'chatSelection':
                path.push('Chat');
                break;
            case 'chatActive':
                path.push('Chat'); // Might need context for character name
                path.push('Active');
                break;
            // Add other cases as needed
            default:
                break;
        }
        displayValue = path.join(' > ');
    } else {
        // Handle complex/parallel states if necessary
        displayValue = JSON.stringify(stateValue);
    }

    return (
        <div className="mb-4 border border-gray-600 bg-gray-800 px-4 py-2 rounded text-gray-200 text-center text-lg">
            {/* We might need more complex logic later for actual breadcrumbs like "Main Menu > Stories" */}
            {displayValue}
        </div>
    );
};

export default Breadcrumb; 