# Product Requirements Document: Interactive Podcast Player Backend

## 1. Product Vision & Problem Statement

### Project Name
**"Hold On"** — Interrupt an Audiobook/Podcast and Talk to the Host

### Problem Statement
Audio learning is inherently passive. When listeners encounter confusion, curiosity, or need clarification during podcasts or audiobooks, they face a critical engagement barrier:
- They must break context to search for answers
- They often never return to the content
- Creators lose engagement at the moment of peak interest
- Listeners lose comprehension and learning effectiveness

### Solution
Real-time, low-latency voice interactivity that transforms passive audio consumption into a two-way conversational experience. Users can tap a button (or use a wake word) to pause any playing episode, ask a question out loud, and receive an immediate, in-character response from an AI representation of the host.

### Value Proposition
- **For Listeners**: Turn confusion into clarity without breaking flow
- **For Creators**: Capture engagement at the moment of peak curiosity
- **For Learning**: Transform passive listening into active learning

---

## 2. Product Architecture Overview

### System Components

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Web App   │ ◄─────► │   Backend    │ ◄─────► │  LiveKit    │
│  (Frontend) │         │   (Python)   │         │   Server    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
 Podcast Player          Context Management
 Playback Control        AI Agent Orchestration
 LiveKit Client          WebSocket Server
```

### Backend Responsibilities

This backend service serves as the **orchestration layer** between the web frontend and the real-time voice AI system:

1. **Podcast Content Management**
   - Serve podcast albums and episode metadata
   - Manage playback state and context

2. **Real-Time Voice Session Management**
   - Initialize LiveKit sessions with contextual awareness
   - Maintain WebSocket connections for bidirectional communication
   - Handle session lifecycle (create, maintain, terminate)

3. **Context-Aware AI Agent**
   - Receive playback context (track ID, timestamp) from frontend
   - Initialize AI agents with episode-specific knowledge
   - Orchestrate in-character responses based on content context

4. **API Layer**
   - RESTful endpoints for podcast catalog and metadata
   - WebSocket endpoints for real-time state management
   - LiveKit integration endpoints for voice session initialization

---

## 3. User Journey

### Primary User Flow

1. **Browse & Select**
   - User opens web app
   - Views list of podcast albums
   - Selects an album → views episode list
   - Selects an episode to play

2. **Passive Listening**
   - Episode plays in standard podcast player
   - Playback control bar visible at bottom of page
   - Standard play/pause/seek controls available

3. **Interrupt & Interact** ⭐ Core Innovation
   - User has a question or wants clarification
   - User clicks the **glowing interrupt button**
   - Playback immediately pauses
   - Frontend sends to backend:
     - Track ID
     - Current timestamp
     - Episode context
   - Backend initializes LiveKit session with context
   - Voice conversation begins (WebRTC-based, low latency)

4. **Conversational Q&A**
   - User asks question verbally
   - AI responds in-character as the podcast host
   - Conversation is context-aware (knows what's been discussed up to timestamp)
   - Multi-turn conversation supported

5. **Resume Playback**
   - User ends conversation
   - Playback resumes from where it was interrupted
   - Seamless return to passive listening

---

## 4. Technical Requirements

### Core Technologies
- **Language**: Python (FastAPI/Flask assumed)
- **Real-Time Communication**:
  - LiveKit (WebRTC framework for voice agents)
  - WebSocket for state management
- **AI/LLM**: Integration with voice AI models (context-aware responses)
- **Audio Processing**: Transcription, voice synthesis

### Key Technical Features

#### 4.1 Context Management
- **Playback State Tracking**
  - Current track ID
  - Timestamp position
  - Episode metadata
  - Listening history

- **Contextual AI Initialization**
  - Load episode transcript/content up to timestamp
  - Initialize AI agent with host personality/voice
  - Provide relevant context window to LLM

#### 4.2 LiveKit Session Management
- **Session Lifecycle**
  ```python
  # Pseudocode flow
  on_interrupt_button_click():
    pause_playback()
    context = {
      'track_id': current_track,
      'timestamp': current_position,
      'episode_metadata': metadata
    }
    session = create_livekit_session(context)
    return session_credentials_to_frontend()
  ```

- **Requirements**
  - Low latency initialization (< 500ms)
  - Persistent context throughout session
  - Clean teardown on session end

#### 4.3 WebSocket Protocol
- **Client → Server Messages**
  - `INTERRUPT_REQUEST`: Trigger voice session
  - `PLAYBACK_STATE_UPDATE`: Sync playback position
  - `SESSION_END`: Close voice conversation

- **Server → Client Messages**
  - `SESSION_READY`: LiveKit credentials + room info
  - `CONTEXT_LOADED`: AI agent initialized
  - `SESSION_TERMINATED`: Cleanup complete

#### 4.4 API Endpoints

**Currently Implemented** ([src/web_server/routers/podcast.py](src/web_server/routers/podcast.py)):

```
# Podcast Retrieval (Public)
GET  /api/podcasts/                 # Get all podcasts with creator & episodes
GET  /api/podcasts/get/{id}         # Get specific podcast by ID with full details

# Podcast Management (Authenticated)
POST /api/podcasts/                 # Create new podcast
POST /api/podcasts/episode          # Add episodes to existing podcast

# User Interactions (Authenticated/Public)
POST /api/podcasts/favorit          # Toggle favorite podcast
POST /api/podcasts/addview/{id}     # Increment view count

# Discovery & Search (Public)
GET  /api/podcasts/random           # Get random podcasts (up to 40)
GET  /api/podcasts/mostpopular      # Get podcasts sorted by views
GET  /api/podcasts/tags?tags={csv}  # Search by tags (comma-separated)
GET  /api/podcasts/category?q={cat} # Search by category
GET  /api/podcasts/search?q={query} # Search by podcast name
```

**Data Source**: Podcasts loaded from [src/memory/podcast/data/podcasts.yml](src/memory/podcast/data/podcasts.yml)

**To Be Implemented** (Voice Interaction):

```
POST /api/sessions/interrupt        # Initialize voice interaction session
GET  /api/sessions/{id}/status      # Session status
DELETE /api/sessions/{id}           # End session

WS   /ws/playback                   # Real-time playback state sync
```

---

## 5. Success Metrics

### User Engagement
- **Interruption Rate**: % of listening sessions where users interrupt
- **Questions per Episode**: Average number of interactions per episode
- **Resume Rate**: % of users who resume playback after interruption
- **Session Duration**: Average length of voice interactions

### Technical Performance
- **Session Initialization Latency**: Target < 500ms
- **Voice Response Latency**: Target < 1s (first token)
- **Connection Stability**: > 99% uptime during sessions
- **Context Accuracy**: Qualitative assessment of response relevance

### Learning Outcomes (Future)
- Comprehension retention tests
- User satisfaction with answers
- Comparison vs. traditional passive listening

---

## 6. Development Phases

### Phase 1: MVP (Current Focus)
- ✅ Basic podcast playback API
- ✅ LiveKit integration foundation
- ✅ WebSocket connection management
- 🚧 Context-aware session initialization
- 🚧 Simple Q&A interaction
- 🚧 Frontend-backend integration

### Phase 2: Enhanced Experience
- Multi-turn conversation memory
- Improved context window management
- Voice cloning for authentic host voice
- Analytics and usage tracking

### Phase 3: Platform Expansion
- Creator tools for content optimization
- Support for multiple content types (audiobooks, courses)
- Community features (shared questions, highlights)

---

## 7. Open Questions & Decisions Needed

### Content Strategy
- [ ] Will this work with existing podcast content, or only custom-created content?
- [ ] How do we acquire episode transcripts for context?
- [ ] Do creators need to "opt-in" or provide additional materials?

### AI Agent Design
- [ ] Single generic host voice, or per-creator voice cloning?
- [ ] Should AI answer beyond episode content, or strictly content-based?
- [ ] How to handle "I don't know" scenarios gracefully?

### Monetization (Future)
- [ ] Subscription model for listeners?
- [ ] Platform fee for creators?
- [ ] Freemium with usage limits?

---

## 8. Current Project Structure

### Backend Repository

```
backend/
├── src/
│   ├── web_server/
│   │   ├── app.py                      # FastAPI application entry point
│   │   ├── routers/
│   │   │   └── podcast.py              # Podcast API endpoints
│   │   ├── models/
│   │   │   └── models.py               # Pydantic request/response models
│   │   ├── db/
│   │   │   └── memory_db.py            # In-memory database
│   │   └── auth/
│   │       └── auth.py                 # Authentication utilities
│   │
│   ├── memory/
│   │   └── podcast/
│   │       ├── podcast.py              # PodcastService class
│   │       ├── models.py               # Podcast domain models
│   │       └── data/
│   │           └── podcasts.yml        # Podcast data (YAML)
│   │
│   └── control_server/
│       └── app.py                      # Control server (separate service)
│
├── justfile                            # Build/dev commands
└── uv.lock                             # Python dependencies
```

### Technology Stack

- **Framework**: FastAPI (Python web framework)
- **Data Storage**: In-memory database + YAML file loader
- **Authentication**: JWT-based authentication (for protected endpoints)
- **Models**: Pydantic for request/response validation
- **Service Layer**: `PodcastService` for business logic

### Data Flow

```
Frontend Request
    ↓
Next.js API Route (/api/podcasts)
    ↓
Backend FastAPI (http://localhost:8000/api/podcasts/)
    ↓
PodcastService.get_podcasts()
    ↓
Load from podcasts.yml → Return Podcast[] with Episodes + Creator
    ↓
JSON Response
```

### Related Repositories
- **web/**: Frontend React/Next.js application (podcast player UI)
- **device/**: (Recently removed) Possible hardware companion device

---

## 9. Integration Points

### Frontend → Backend
- Playback context on interrupt
- Session lifecycle management
- Real-time state synchronization

### Backend → LiveKit
- Room creation with context
- Agent initialization
- Audio streaming management

### Backend → AI/LLM
- Context-aware prompt engineering
- Episode content retrieval
- Response generation and streaming

---

## 10. Next Steps

1. **Define API Contract**: Finalize endpoint specifications between frontend and backend
2. **Context Pipeline**: Design how episode content is processed and fed to AI
3. **LiveKit Integration**: Complete session initialization with contextual parameters
4. **Testing Strategy**: Define test cases for context accuracy and latency
5. **Deployment Architecture**: Plan for scalability and real-time requirements

---

**Last Updated**: 2025-11-03
**Document Owner**: Product & Engineering Team
**Status**: Living Document - Phase 1 Development
