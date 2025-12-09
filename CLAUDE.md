# MarketInsightsAI Frontend - CLAUDE.md

You are Claude Code working inside the **MarketInsightsAI Frontend** repository.

This is the **React + TypeScript frontend** for MarketInsightsAI. The backend is in a separate repository.

---

## 1. Project Overview

### What is this?

This is the frontend application for **MarketInsightsAI** - an autonomous AI agent platform for location intelligence. It provides:

- AI Chat interface with file upload
- Tapestry report viewer
- Marketing content studio
- ArcGIS map integration
- Knowledge base management

### Related Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| **This Repo** | Frontend (React) | marketinsightsai-frontend |
| **Backend** | API (FastAPI) | [marketinsightsai-backend](https://github.com/patelyakshit/marketinsightsai-backend) |

### Deployment

- **Frontend**: Vercel (https://marketinsightsai.vercel.app)
- **Backend**: Render (https://marketinsightsai-api.onrender.com)

---

## 2. Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Styling |
| TanStack Query | 5 | Data fetching |
| React Router | 7 | Routing (import from 'react-router') |
| ArcGIS Maps SDK | 4.34 | Mapping |
| Lucide React | - | Icons |
| Sentry | - | Error monitoring |

---

## 3. Project Structure

```
src/
├── app/                      # Application code
│   ├── layout/               # Layout components
│   │   ├── AppLayout.tsx     # Main layout with sidebar
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── Header.tsx        # Top header bar
│   │   └── PublicHeader.tsx  # Header for public pages
│   └── routes/               # Page components
│       ├── AiChat/
│       │   └── AiChatPage.tsx
│       ├── TapestryReport/
│       ├── KnowledgeBase/
│       ├── Login/
│       └── Register/
├── shared/                   # Shared code
│   ├── components/           # Reusable components
│   │   └── ui/               # Base UI (Button, Card, Input)
│   ├── hooks/                # Custom hooks
│   │   ├── useApi.ts         # API client
│   │   └── queryClient.ts    # TanStack Query config
│   ├── types/                # TypeScript types
│   │   └── index.ts          # All type definitions
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   ├── LibraryContext.tsx
│   │   └── ProjectsContext.tsx
│   └── utils/                # Utility functions
│       └── cn.ts             # Tailwind class merge
├── App.tsx                   # Root component + routes
├── main.tsx                  # Entry point
└── index.css                 # Global styles + Tailwind
```

---

## 4. Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 5. Key Files

| Purpose | File |
|---------|------|
| Main chat UI | `src/app/routes/AiChat/AiChatPage.tsx` |
| API client | `src/shared/hooks/useApi.ts` |
| Type definitions | `src/shared/types/index.ts` |
| Auth context | `src/shared/contexts/AuthContext.tsx` |
| Routes config | `src/App.tsx` |
| Layout | `src/app/layout/AppLayout.tsx` |

---

## 6. API Integration

### Backend URL

```typescript
// Auto-detected in useApi.ts
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8000'
  : '';  // Same origin in production
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/with-file` | POST | Chat with file upload |
| `/api/chat/image` | POST | Generate images |
| `/api/chat/stores` | GET | Get uploaded stores |
| `/api/kb/documents` | GET | List KB documents |
| `/api/kb/search` | GET | Search KB |
| `/api/auth/google` | POST | Google OAuth |
| `/api/auth/refresh` | POST | Refresh tokens |
| `/api/auth/me` | GET | Get current user |
| `/api/reports/{file}` | GET | Download report |
| `/api/folders` | GET/POST | Folder management |

### API Types

Types are defined in `src/shared/types/index.ts`. Key types:

```typescript
interface Store {
  id: string;
  name: string;
  address?: string;
  segments: TapestrySegment[];
}

interface TapestrySegment {
  code: string;
  name: string;
  householdShare: number;
  householdCount: number;
  lifeMode?: string;
}

interface AIChatResponse {
  response: string;
  sources: string[];
  stores?: Store[];
  reportUrl?: string;
  mapAction?: MapAction;
  marketingAction?: MarketingAction;
}
```

---

## 7. State Management

### Server State (TanStack Query)

```typescript
// Example: Fetching data
const { data, isLoading } = useQuery({
  queryKey: ['stores'],
  queryFn: () => api.get('/api/chat/stores')
});
```

### Client State (React Context)

- `AuthContext` - User authentication state
- `LibraryContext` - Saved marketing posts
- `ProjectsContext` - User projects
- `FoldersContext` - Folder management

---

## 8. Styling

### Tailwind CSS 4

```tsx
// Using Tailwind classes
<div className="flex items-center gap-2 p-4 bg-background">
  <Button variant="primary">Click me</Button>
</div>
```

### Dark Mode

Dark mode is supported via `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-900">
```

### UI Components

Base components in `src/shared/components/ui/`:
- `Button` - With variants (primary, secondary, ghost)
- `Card` - Container component
- `Input` - Form input
- `Badge` - Status badges

---

## 9. Development Guidelines

### Code Style

- Functional components with hooks
- TypeScript strict mode (minimal `any`)
- Named exports for components
- PascalCase for components, camelCase for functions

### Adding a New Page

1. Create component in `src/app/routes/NewPage/`
2. Add route in `src/App.tsx`
3. Add navigation in `Sidebar.tsx`

### Adding a New Component

1. Create in `src/shared/components/`
2. Export from component file
3. Use Tailwind for styling

### API Calls

Use the `useApi` hook or direct fetch:

```typescript
// Using hook
const api = useApi();
const response = await api.post('/api/chat', { message: 'Hello' });

// Direct fetch
const response = await fetch(`${API_BASE}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});
```

---

## 10. Environment

### `.env` file

Create `.env` from `.env.example`:

```bash
# Sentry Error Monitoring (get from sentry.io)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `VITE_SENTRY_ENVIRONMENT` | No | Environment name (development/production) |
| `VITE_API_URL` | No | API URL override (auto-detected if not set) |

### API URL Detection

```typescript
// Auto-detected in useApi.ts
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8000'
  : '';  // Same origin in production
```

For production, Vercel handles the configuration.

---

## 11. Coordination with Backend

When making changes that affect the API:

1. Check backend types in `backend/app/models/schemas.py`
2. Update frontend types in `src/shared/types/index.ts`
3. Test both locally before pushing

### Type Sync Strategy

Backend uses snake_case, frontend uses camelCase. Transform in API responses:

```typescript
// Backend returns: { store_name: "..." }
// Frontend expects: { storeName: "..." }
```

The API client handles this transformation.

---

## 12. Quick Reference

### Common Tasks

| Task | Location |
|------|----------|
| Add new page | `src/app/routes/` + `App.tsx` |
| Add UI component | `src/shared/components/` |
| Add API type | `src/shared/types/index.ts` |
| Add context | `src/shared/contexts/` |
| Modify layout | `src/app/layout/` |

### Debugging

- React DevTools for component inspection
- Network tab for API calls
- Console for errors

---

*Last updated: December 9, 2024*

### Changelog
- **Fixed**: Migrated from deprecated `react-router-dom` to `react-router` (v7 standard)
- **Added**: Sentry error monitoring integration
- **Added**: `.env` file support with `.env.example` template
- **Updated**: All packages to latest versions
