function polling() {
  // console.log("polling");
  setTimeout(polling, 1000 * 30);
}

polling();

// Ensure the side panel opens when the action icon is clicked.
(chrome as any).sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: any) => console.error('Failed to set side panel behavior:', error));

// Listener for messages from other parts of the extension (e.g., sidebar)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === 'close_sidebar' && sender.tab?.id && sender.url?.includes("sidebar.html")) {
    // Close the side panel for the specific tab that sent the message
    console.log(`Closing sidebar for tab ${sender.tab.id}`)
      ; (chrome as any).sidePanel.setOptions({
        tabId: sender.tab.id,
        enabled: false
      }).catch((error: any) => console.error('Failed to close side panel:', error));
    sendResponse({ status: "Sidebar closing initiated" });
  }

  // Handle other message types in the future (e.g., 'get_content')

  // Return true to indicate you might send a response asynchronously
  // (although not strictly needed for this specific 'close_sidebar' message)
  return true;
});

console.log("Background service worker started.");
