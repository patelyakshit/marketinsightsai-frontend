# MarketInsightsAI Platform Upgrade Plan

## Executive Summary

Transform MarketInsightsAI from a basic chat interface into a **Manus-like autonomous AI agent platform** with real-time task execution, agent transparency, and advanced UX patterns.

### Current State
- Basic chat with file upload
- Static quick actions and suggestions
- No streaming responses
- No agent transparency
- Only ~10 of 70 backend endpoints being used
- localStorage-only persistence (no cross-device sync)
- Non-functional features: voice, regenerate, fullscreen

### Target State
- **Autonomous agent with transparent reasoning** (like Manus)
- **Real-time streaming responses** with typing animation
- **Background task execution** with progress tracking
- **Multi-model support** (GPT-4o, Claude, Gemini)
- **Direct Tapestry lookup** (no file upload required)
- **Full backend integration** (all 70 endpoints)

---

## Research Sources

- [Manus AI Context Engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
- [Agentic UX Design Patterns](https://manialabs.substack.com/p/agentic-ux-and-design-patterns)
- [Manus Architecture Analysis](https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f)

---

## Phase 1: Core UX Improvements (Week 1)

### 1.1 Streaming Responses
**Current**: Full response waits before render (feels slow)
**Upgrade**: Token-by-token streaming with typing animation

**Implementation**:
- Connect to WebSocket `/api/ws/chat/{session_id}`
- Use `StreamingMessage` component (already created)
- Show `ThinkingIndicator` during processing
- Graceful fallback for non-streaming endpoints

**Files to modify**:
- `AiChatPage.tsx` - Add WebSocket connection and streaming state
- `useApi.ts` - Add WebSocket helper functions

### 1.2 Agent Transparency Panel
**Current**: Black box - user sees input/output only
**Upgrade**: Manus-style transparency showing AI reasoning

**Implementation**:
- Add collapsible right panel showing agent steps
- Connect to `/api/agent/session/{session_id}/events`
- Show: Planning → Searching → Analyzing → Generating → Verifying
- Real-time progress updates via WebSocket

**Files to modify**:
- `AiChatPage.tsx` - Add AgentWorkspacePanel integration
- New: `useAgentEvents.ts` hook for event streaming

### 1.3 Toast Notifications
**Current**: No feedback for actions (save, copy, download)
**Upgrade**: Contextual toast notifications

**Implementation**:
- ToastProvider already integrated in App.tsx
- Add toasts for: Copy success, Save to library, Download started, Errors
- Use `useToast()` hook throughout components

**Files to modify**:
- `StudioView.tsx` - Add toasts for copy/save/download
- `AiChatPage.tsx` - Add toasts for file upload, send errors

### 1.4 Dynamic Quick Actions
**Current**: Hardcoded 4 actions with "Soon" badges
**Upgrade**: API-driven actions based on user context

**Implementation**:
- Create `/api/suggestions` endpoint (or use existing patterns)
- Show different actions based on: uploaded files, recent activity, time of day
- Enable Presentation action (backend ready)

**Files to modify**:
- `AiChatPage.tsx` - Replace hardcoded quickActions array
- Backend: Add suggestions endpoint if needed

---

## Phase 2: Full Backend Integration (Week 2)

### 2.1 Direct Tapestry Lookup
**Current**: User must upload Excel file to get tapestry data
**Upgrade**: Type address → instant tapestry data

**Implementation**:
- Add address autocomplete in chat input
- Connect to `/api/tapestry/lookup` endpoint
- Show tapestry segments inline in chat
- Use `TapestryLookupWidget` for standalone lookup

**New Features**:
- "Lookup tapestry for 123 Main St" → instant results
- Compare multiple addresses
- No file upload required for basic queries

### 2.2 Multi-Model Support
**Current**: GPT-4o only (hardcoded)
**Upgrade**: User can select Claude, Gemini, or GPT-4o

**Implementation**:
- Add `ModelSelector` to chat header
- Connect to `/api/models/` for available models
- Connect to `/api/models/chat` for model-specific chat
- Use `/api/models/recommend/{task_type}` for smart defaults

**Files to modify**:
- `AiChatPage.tsx` - Add ModelSelector component
- New: `useModels.ts` hook for model state

### 2.3 Background Task System
**Current**: All operations block UI
**Upgrade**: Long tasks run in background with progress

**Implementation**:
- Connect to `/api/tasks/` for task management
- Show `TaskProgressList` in sidebar or dedicated panel
- Support: Research tasks, Batch analysis, Report generation
- Real-time progress via `/api/agent/progress/{session_id}`

**New UI**:
- Task queue indicator in header
- Background task panel (collapsible)
- Notification when task completes

### 2.4 Research Agent Integration
**Current**: Basic web search (if any)
**Upgrade**: Deep research with source citations

**Implementation**:
- Connect to `/api/research/research` for deep research
- Connect to `/api/research/search` for quick search
- Show research steps in transparency panel
- Display sources with links

**New Features**:
- "Research competitors for car wash in Dallas" → detailed report
- Trend analysis via `/api/research/trends/{topic}`
- Competitor analysis via `/api/research/competitors/{industry}`

---

## Phase 3: Advanced Features (Week 3)

### 3.1 Session Persistence
**Current**: localStorage only (loses data across devices)
**Upgrade**: Backend-synced sessions

**Implementation**:
- Connect to `/api/sessions` for CRUD
- Sync projects with backend sessions
- Support session goals via `/api/sessions/{id}/goals`
- Track usage via `/api/sessions/{id}/usage`

### 3.2 Landing Page Generator
**Current**: Not available
**Upgrade**: One-click landing page from tapestry data

**Implementation**:
- Connect to `/api/deploy/landing-page`
- Use `/api/deploy/landing-page/tapestry` for segment-specific pages
- Preview via `/api/deploy/preview/{filename}`
- Download via `/api/deploy/download/{filename}`

### 3.3 Presentation Generation
**Current**: Modal exists but presentations are mocked
**Upgrade**: Real PowerPoint generation

**Implementation**:
- Connect to `/api/slides/generate` for general slides
- Use `/api/slides/tapestry` for segment slides
- Use `/api/slides/marketing` for campaign slides
- Download via `/api/slides/download/{filename}`

### 3.4 Knowledge Base Enhancement
**Current**: Basic document list
**Upgrade**: AI-powered document Q&A

**Implementation**:
- Better UI for `/api/kb/documents`
- Semantic search via `/api/kb/search`
- Show relevant KB docs in chat context
- Upload with `/api/kb/upload`

---

## Phase 4: Polish & Delight (Week 4)

### 4.1 Message Actions
- Copy button on each message
- Thumbs up/down feedback
- Regenerate failed responses
- Edit and resend messages

### 4.2 Voice Features
- Implement speech-to-text for mic button
- Voice response playback option
- Voice commands for quick actions

### 4.3 Keyboard Shortcuts
- `⌘/` - Focus chat input
- `⌘↵` - Send message
- `⌘E` - Toggle transparency panel
- `⌘M` - Toggle model selector
- `Esc` - Close modals/panels

### 4.4 Loading States
- Unified skeleton patterns
- Shimmer effects for content loading
- Progress indicators for all async operations

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Streaming Responses | High | Medium | P0 |
| Agent Transparency | High | Medium | P0 |
| Toast Notifications | Medium | Low | P0 |
| Tapestry Lookup | High | Low | P1 |
| Multi-Model Support | High | Medium | P1 |
| Background Tasks | Medium | Medium | P1 |
| Research Agent | High | Medium | P2 |
| Session Persistence | Medium | Medium | P2 |
| Landing Page Gen | Medium | Low | P2 |
| Presentation Gen | Medium | Medium | P2 |
| Message Actions | Low | Low | P3 |
| Voice Features | Low | High | P3 |

---

## Files to Create/Modify

### New Files
```
src/shared/hooks/
├── useWebSocket.ts          # WebSocket connection management
├── useAgentEvents.ts        # Agent event streaming
├── useModels.ts             # Model selection state
├── useTasks.ts              # Background task management
├── useStreamingChat.ts      # Streaming chat responses

src/shared/components/chat/
├── ChatMessage.tsx          # Enhanced message with actions
├── ChatInput.tsx            # Enhanced input with model selector
├── StreamingResponse.tsx    # Streaming message renderer
```

### Modified Files
```
src/app/routes/AiChat/AiChatPage.tsx    # Major refactor
src/app/layout/Sidebar.tsx              # Add task indicator
src/shared/components/StudioView.tsx    # Add toasts
src/shared/hooks/useApi.ts              # Add new endpoints
src/App.tsx                             # Add new routes if needed
```

---

## Success Metrics

1. **Response Latency Perception**: Reduce perceived wait time by 70% with streaming
2. **Feature Adoption**: 50%+ users interact with transparency panel
3. **Task Completion**: 90%+ background tasks complete successfully
4. **API Coverage**: Use 50+ of 70 backend endpoints (up from ~10)
5. **User Satisfaction**: Reduced "feels slow" feedback

---

## Getting Started

Run Phase 1 implementation:
```bash
# Start with streaming responses - highest impact
1. Implement useWebSocket hook
2. Add streaming to AiChatPage
3. Integrate ThinkingIndicator
4. Add toast notifications
5. Test end-to-end
```

---

*Created: December 2024*
*Based on: Manus AI patterns, Agentic UX research, Platform audit*
