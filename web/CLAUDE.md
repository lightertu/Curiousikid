# Product Requirements Document: Interactive Podcast Player Frontend

## 1. Overview

**"Hold On"** is an interactive podcast player web application that transforms passive audio listening into an active, conversational learning experience. This frontend provides the user interface for browsing, playing, and **interrupting** podcast episodes to ask real-time questions to an AI representation of the host.

### Key Differentiator
Unlike traditional podcast players, this application features a **glowing interrupt button** that pauses playback and initiates a low-latency voice conversation with a context-aware AI agent.

---

## 2. Core User Experience

### Primary User Flows

#### 2.1 Browse & Discover
```
Landing Page → Podcast Albums Grid → Album Detail → Episode List
```

**Components Needed**:
- Album grid/list view with cover art
- Album detail page with episode list
- Episode side bar metadata display (title, duration, description)

#### 2.2 Standard Playback
```
Episode Selected → Audio Player Loads → Playback Controls Active → Persistent Bottom Bar
```

**Features**:
- Standard podcast player controls (play/pause, seek, speed)
- Progress bar with timestamp display
- Persistent playback bar at bottom of page (sticks across navigation)
- Background playback state management

#### 2.3 Interactive Interruption ⭐ Core Innovation
```
User Listening → Clicks Glowing Button on the Episode side bar metadata → Playback Pauses →
Context Sent to Backend → LiveKit Session Initializes → Voice Conversation Begins
```

**Critical Flow Details**:
1. **Trigger**: User clicks interrupt button (or uses wake word - future)
2. **Immediate Feedback**: Visual indication of interruption state
3. **Context Capture**: Frontend packages and sends to backend:
   ```javascript
   {
     track_id: currentEpisode.id,
     timestamp: currentPlaybackTime,
     episode_metadata: {
       title, description, album_id, etc.
     }
   }
   ```
4. **Session Initialization**: Backend returns LiveKit credentials
5. **WebRTC Connection**: Frontend connects to LiveKit room
6. **Voice UI**: Show active conversation interface
7. **Resume**: After conversation ends, return to playback at interrupted position

---

## 3. Technical Architecture

### 3.1 Frontend Stack
- **Framework**: React/Next.js (assumed based on typical structure)
- **Real-Time Communication**:
  - **LiveKit Client SDK**: For WebRTC voice sessions
  - **WebSocket**: For playback state sync with backend
- **Audio Playback**: HTML5 Audio API or Howler.js
- **State Management**: Context API / Redux / Zustand (TBD)

### 3.2 Key Integrations

#### Frontend API Routes (Next.js)

The frontend exposes these API routes that proxy to the backend:

**Podcast Endpoints**:
```
GET  /api/podcasts                  # Get all podcasts with creator and episodes
GET  /api/podcasts/[id]             # Get specific podcast by ID with full details
```

**Audio Serving**:
```
GET  /api/audio/[filename]          # Serve audio files from local tracks/ directory
```

**Implementation**:
- Routes located in `app/api/podcasts/` and `app/api/audio/`
- Proxy requests to backend (configured via `NEXT_PUBLIC_API_URL`)
- Backend default: `http://localhost:8000`
- Follows Next.js App Router conventions

**Voice Interaction Endpoints** (To Be Implemented):
```
POST /api/sessions/interrupt        # Initialize voice interaction session
GET  /api/sessions/{id}/status      # Get session status
DELETE /api/sessions/{id}           # End voice session
```

**Data Types**:
```typescript
interface PodcastCreator {
  name: string;
  img: string;
}

interface Episode {
  id: string;
  name: string;
  desc: string;
  thumbnail: string;
  creator_id: string;
  type: string;
  duration: number;          // in seconds
  file: string;              // audio file path/URL
  created_at: string;
  updated_at: string;
}

interface Podcast {
  id: string;
  name: string;
  desc: string;
  thumbnail: string;
  creator_id: string;
  tags: string[];
  type: string;
  category: string;
  views: number;
  episodes: Episode[];
  created_at: string;
  updated_at: string;
  creator?: PodcastCreator;
}

#### WebSocket Connection
```javascript
// Real-time bidirectional communication
ws://backend/ws/playback

// Messages sent TO backend
{
  type: 'INTERRUPT_REQUEST',
  payload: { track_id, timestamp, metadata }
}

{
  type: 'PLAYBACK_STATE_UPDATE',
  payload: { track_id, position, playing }
}

// Messages received FROM backend
{
  type: 'SESSION_READY',
  payload: { livekit_token, room_name, agent_id }
}

{
  type: 'CONTEXT_LOADED',
  payload: { status: 'ready' }
}
```

#### PodcastClient (API Abstraction)

Frontend uses a dedicated API client class located at [lib/api/podcast-client.ts](lib/api/podcast-client.ts):

```typescript
import { PodcastClient } from '@/lib/api/podcast-client';

const client = new PodcastClient();

// Usage examples:
const allPodcasts = await client.getAllPodcasts();  // Fetches from /api/podcasts
const podcast = await client.getPodcastById('podcast-id');  // Fetches from /api/podcasts/[id]
```

**Architecture**:
- Client calls Next.js API routes (not backend directly)
- Next.js routes proxy requests to backend
- Automatic error handling and logging
- Type-safe responses with TypeScript interfaces
- No environment variables needed in client code

#### LiveKit Client (To Be Implemented)

```javascript
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(livekitUrl, token);

// Handle audio tracks from AI agent
room.on('trackSubscribed', (track) => {
  if (track.kind === 'audio') {
    track.attach(audioElement);
  }
});
```

---

## 4. UI/UX Requirements

### 4.1 Page Layout

#### Home Page
```
┌────────────────────────────────────────┐
│  [Logo]  Hold On        [User Menu]    │
├────────────────────────────────────────┤
│                                        │
│                                        │
│  All Albums (Grid)                     │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │     │ │     │ │     │               │
│  └─────┘ └─────┘ └─────┘               │
│                                        │
└────────────────────────────────────────┘
│ ▶️ Now Playing: [Episode]    🔊 [—■—]  │ ← Persistent Bar
└────────────────────────────────────────┘
```

#### Album Detail Page
```
┌────────────────────────────────────────┐
│  ← Back                                 │
├────────────────────────────────────────┤
│  ┌──────┐                              │
│  │      │  Album Title                 │
│  │ Art  │  By Creator Name             │
│  │      │  X episodes                  │
│  └──────┘                              │
│                                         │
│  Episodes                              │
│  ┌─────────────────────────────────┐  │
│  │ 1. Episode Title        [45:23] │  │
│  │    Brief description...         │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ 2. Episode Title        [52:10] │  │
│  └─────────────────────────────────┘  │
│                                         │
└────────────────────────────────────────┘
│ ▶️ Now Playing: [Episode]    🔊 [—■—]  │
└────────────────────────────────────────┘
```


### 4.2 Visual Design Principles
#### The "Interrupt Button"
- **Visual Treatment**: Glowing, pulsing effect to draw attention
- **Positioning**: Prominently displayed during playback (center or bottom-center)
- **States**:
  - `idle`: Gentle pulsing glow
  - `hover`: Increased brightness
  - `active`: Solid bright state during conversation
  - `loading`: Spinner while initializing session
- **Animation**: Smooth fade-in when playback starts

#### Color Palette (Suggested)
- **Primary**: Vibrant accent for interrupt button (e.g., electric blue/purple)
- **Background**: Dark theme for audio focus (optional light mode)
- **Text**: High contrast for readability
- **Waveforms**: Dynamic color during voice activity

---

## 5. Component Architecture
TODO

### 5.2 State Management

#### Global State
```javascript
// Playback State
{
  currentEpisode: Episode | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  playbackRate: 1.0,
  volume: 0.8
}

// Voice Session State
{
  isSessionActive: boolean,
  sessionId: string | null,
  livekitRoom: Room | null,
  conversationHistory: Message[],
  isAgentSpeaking: boolean
}

// Catalog State
{
  albums: Album[],
  currentAlbum: Album | null,
  episodes: Episode[]
}
```

---

## 6. Critical User Interactions

### 6.1 Interrupt Flow (Detailed)

```javascript
// User clicks interrupt button
async function handleInterruptClick() {
  // 1. Capture current state
  const context = {
    track_id: currentEpisode.id,
    timestamp: audioPlayer.currentTime,
    episode_metadata: {
      title: currentEpisode.title,
      album_id: currentEpisode.albumId,
      // ... other metadata
    }
  };

  // 2. Pause playback immediately
  audioPlayer.pause();
  setPlaybackPaused(true);

  // 3. Show loading state
  setInterruptState('initializing');

  // 4. Send to backend via WebSocket
  websocket.send({
    type: 'INTERRUPT_REQUEST',
    payload: context
  });

  // 5. Wait for backend to respond with LiveKit credentials
  // (handled by WebSocket message listener)
}

// WebSocket message handler
websocket.on('message', async (message) => {
  if (message.type === 'SESSION_READY') {
    // 6. Connect to LiveKit room
    const { livekit_token, room_name } = message.payload;
    await connectToLiveKit(livekit_token, room_name);

    // 7. Show conversation UI
    setInterruptState('active');
    navigateToConversationView();
  }
});

// End conversation
async function handleEndConversation() {
  // 1. Disconnect from LiveKit
  await livekitRoom.disconnect();

  // 2. Notify backend
  websocket.send({ type: 'SESSION_END' });

  // 3. Return to player view
  setInterruptState('idle');

  // 4. Resume playback from interrupted position
  audioPlayer.play();
}
```

### 6.2 Persistent Playback

**Requirement**: Playback state persists across page navigation

**Implementation Approach**:
- Global audio player instance (not recreated on navigation)
- Persistent playback bar component (outside route-specific content)
- Local storage for playback position (resume on reload)

```javascript
// Save playback position periodically
useEffect(() => {
  const interval = setInterval(() => {
    if (currentEpisode && !isSessionActive) {
      localStorage.setItem('lastPlayback', JSON.stringify({
        episodeId: currentEpisode.id,
        position: audioPlayer.currentTime,
        timestamp: Date.now()
      }));
    }
  }, 5000); // Save every 5 seconds

  return () => clearInterval(interval);
}, [currentEpisode, isSessionActive]);
```

---

## 7. Performance Requirements

### 7.1 Latency Targets

| Action | Target | Maximum |
|--------|--------|---------|
| Interrupt button click → Playback pause | < 100ms | 200ms |
| Context sent → Session ready | < 500ms | 1000ms |
| Session ready → LiveKit connected | < 500ms | 1000ms |
| User speaks → AI first response | < 1000ms | 2000ms |

### 7.2 Responsive Design
- Mobile-first design (primary use case)
- Tablet support
- Desktop support (larger screens)

---

## 8. Development Phases

### Phase 1: MVP 🚧 In Progress

**✅ Completed**:
- [x] Podcast catalog API client (`PodcastClient`)
- [x] Backend API integration for podcast data
- [x] Local audio file serving (`/api/audio/[filename]`)
- [x] TypeScript interfaces for Podcast, Episode, Creator
- [x] Core podcast retrieval (all podcasts + by ID)

**🚧 In Progress**:
- [ ] Standard audio playback with controls
- [ ] Persistent playback bar UI
- [ ] Album grid and episode list views

**📋 To Do**:
- [ ] Interrupt button UI (glowing effect)
- [ ] WebSocket connection to backend
- [ ] LiveKit client integration
- [ ] Basic conversation interface
- [ ] Playback context capture and transmission
- [ ] Session state management

### Phase 2: Enhanced Experience
- [ ] Visual audio waveforms during conversation
- [ ] Conversation history display
- [ ] Playback speed controls
- [ ] Sleep timer
- [ ] Favorites/bookmarks

### Phase 3: Advanced Features
- [ ] Wake word support ("Hey [name]")
- [ ] Offline playback
- [ ] Social features (share conversations)
- [ ] Multi-language support

---

## 9. Current Implementation Notes

### API Client Architecture

**Location**: [lib/api/podcast-client.ts](lib/api/podcast-client.ts)

The frontend uses a class-based API client with Next.js API route pattern:

- **Client Layer**: `PodcastClient` class calls frontend API routes (`/api/podcasts`)
- **API Route Layer**: Next.js routes in `app/api/podcasts/` proxy to backend
- **Backend Layer**: Python backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

**Benefits of this architecture**:

- Separation of concerns (client doesn't know about backend URL)
- Server-side API calls (can add auth, caching, rate limiting)
- Type-safe responses with TypeScript interfaces
- Built-in error handling with console logging
- Uses native `fetch` API (no external HTTP libraries)
- Follows Next.js App Router best practices

### Audio File Handling

**Current Implementation**: Audio files are served from a local `tracks/` directory via Next.js API route

**Route**: [app/api/audio/[filename]/route.ts](app/api/audio/[filename]/route.ts)

**Details**:
- Reads files from `{projectRoot}/tracks/` directory
- Sets `Content-Type: audio/mpeg`
- Returns 404 for missing files
- Suitable for development/MVP

**Production Considerations**:
- Should migrate to CDN (S3, Cloudflare R2, etc.)
- Implement streaming for large files
- Add authentication/authorization if needed
- Consider HLS for adaptive bitrate streaming

### Server Actions

**Location**: [app/actions.ts](app/actions.ts)

Currently all server actions are commented out, but stubs exist for:
- Playlist management (create, update, delete)
- Track updates
- File uploads (covers, images)

These suggest future features for user-generated content and personalization.

---

## 10. Integration Checklist

### Backend Dependencies

**✅ Implemented**:
- [x] Podcast catalog endpoints (list all + get by ID)
- [x] Episode metadata with creator info included

**📋 Still Needed**:
- [ ] WebSocket server for real-time communication
- [ ] LiveKit session initialization endpoint
- [ ] Context processing and AI agent management
- [ ] Transcript/content retrieval for context-aware responses

### Third-Party Services

**📋 Required**:
- [ ] LiveKit Cloud account + credentials
- [ ] Audio hosting/CDN for podcast files (production)
- [ ] Analytics (optional - Mixpanel, Amplitude, etc.)

### Environment Variables

**Current**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API base URL
```

**Will Need**:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://...          # LiveKit server URL
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws  # WebSocket endpoint
```

---

## 11. Testing Strategy

### User Flow Tests
- Browse → Select → Play → Interrupt → Converse → Resume
- Network interruption during voice session
- Rapid interrupt/resume cycles
- Background playback while navigating

### Edge Cases
- Interrupt at episode start (timestamp = 0)
- Interrupt at episode end
- Multiple rapid taps on interrupt button
- WebSocket disconnection during session
- LiveKit connection failures

---

## 12. Accessibility

- Keyboard navigation for all controls
- Screen reader support for playback state
- High contrast mode support
- Captions for AI responses (future)

---

## 13. Open Questions

- [ ] Should interrupt button always be visible, or only during playback?
- [ ] Should conversation history be saved/persistent?
- [ ] Should users be able to replay AI responses?
- [ ] How to handle background/locked screen scenarios on mobile?

---

**Last Updated**: 2025-11-03
**Related Documents**:
- Backend CLAUDE.md: [../backend/CLAUDE.md](../backend/CLAUDE.md)
- Design System: TBD
- API Contract: TBD

**Status**: Living Document - Phase 1 Development
