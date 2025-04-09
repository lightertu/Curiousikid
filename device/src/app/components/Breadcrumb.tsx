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
            case 'mainMenuBlinking':
                // Path is already ['Main Menu']
                path.push(`[${context.topMenuSelections[context.topMenuHighlightedIndex]}]`);
                break;
            case 'storiesSelection':
            case 'storiesSelectionBlinking':
                path.push(`${context.topMenuSelections[context.topMenuHighlightedIndex]}`);
                path.push(`[${context.stories[context.selectedStoryIndex].title}]`);
                break;
            case 'chatSelection':
            case 'chatSelectionBlinking':
                path.push(`${context.topMenuSelections[context.topMenuHighlightedIndex]}`);
                path.push(`[${context.characters[context.selectedCharacterIndex].name}]`);
                break;
            case 'storyIsPlaying':
            case 'storyIsPaused':
            case 'backwardPlaybackBlinking':
            case 'forwardPlaybackBlinking':
                path.push(`${context.topMenuSelections[context.topMenuHighlightedIndex]}`);
                path.push(context.currentStory?.title || 'Playback');
                break;
            case 'chatActive':
                path.push(`${context.topMenuSelections[context.topMenuHighlightedIndex]}`);
                path.push(`${context.characters[context.selectedCharacterIndex].name}`);
                break;
            default:
                break;
        }
        displayValue = path.join(' > ');
    } else {
        // Handle complex/parallel states if necessary
        displayValue = JSON.stringify(stateValue);
    }

    return (
        <div className="mb-4 border border-gray-600 bg-gray-800 px-4 py-2 rounded text-black text-center text-3xl" style={{ backgroundColor: '#ded8ce' }}>
            {/* We might need more complex logic later for actual breadcrumbs like "Main Menu > Stories" */}
            {displayValue}
        </div>
    );
};

export default Breadcrumb; 