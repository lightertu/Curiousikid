// src/sidebar/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import SidebarApp from './SidebarApp';
import '@livekit/components-styles'; // Import LiveKit base styles

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Could not find root element to mount React app");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <SidebarApp />
    </React.StrictMode>
);

console.log("Sidebar React app loaded."); 