import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

// Set up the side panel behavior to open when the extension button is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(error => console.error('Failed to set side panel behavior:', error));

// Listen for extension icon click as a fallback (in case setPanelBehavior isn't supported)
chrome.action.onClicked.addListener(async (tab) => {
  // Only proceed if we have a valid tab
  if (tab.id) {
    try {
      // Make sure the side panel is enabled for this tab
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true
      });

      // Open the side panel
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Side panel opened successfully');
    } catch (error) {
      console.error('Error opening side panel:', error);
    }
  }
});

// Get the stored theme
exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
