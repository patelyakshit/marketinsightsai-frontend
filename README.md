# MarketInsightsAI Frontend

<div align="center">

**React + TypeScript frontend for MarketInsightsAI**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

[Backend Repo](https://github.com/patelyakshit/marketinsightsai-backend) | [Live Demo](https://marketinsightsai.vercel.app)

</div>

---

## Overview

Frontend application for MarketInsightsAI - an autonomous AI agent platform for location intelligence. Built with React 19, TypeScript, and Tailwind CSS.

## Features

- **AI Chat Interface** - Conversational UI with file upload support
- **Tapestry Reports** - View and download generated PDF reports
- **Marketing Studio** - AI-generated social media content
- **ArcGIS Map** - Interactive map with geocoding
- **Knowledge Base** - Document management interface

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Styling |
| TanStack Query | 5 | Data fetching |
| React Router | 7 | Routing |
| ArcGIS Maps SDK | 4.34 | Mapping |
| Lucide React | - | Icons |

## Quick Start

### Prerequisites
- Node.js >= 22.x

### Installation

```bash
# Clone the repo
git clone https://github.com/patelyakshit/marketinsightsai-frontend.git
cd marketinsightsai-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Environment

The API URL is auto-detected:
- Development: `http://localhost:8000`
- Production: Same origin (configured in Vercel)

## Project Structure

```
src/
├── app/                    # Application code
│   ├── layout/             # Layout components
│   │   ├── AppLayout.tsx   # Main layout wrapper
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── Header.tsx      # Top header
│   └── routes/             # Page components
│       ├── AiChat/         # Chat interface
│       ├── TapestryReport/ # Report viewer
│       └── KnowledgeBase/  # KB management
├── shared/                 # Shared code
│   ├── components/         # Reusable components
│   │   └── ui/             # Base UI components
│   ├── hooks/              # Custom hooks
│   │   ├── useApi.ts       # API client hook
│   │   └── queryClient.ts  # TanStack Query setup
│   ├── types/              # TypeScript types
│   │   └── index.ts        # All type definitions
│   ├── contexts/           # React contexts
│   └── utils/              # Utility functions
├── App.tsx                 # Root component with routes
├── main.tsx                # Entry point
└── index.css               # Global styles + Tailwind
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables if needed

### Manual

```bash
npm run build
# Deploy contents of dist/ to any static host
```

## API Integration

This frontend connects to the [MarketInsightsAI Backend](https://github.com/patelyakshit/marketinsightsai-backend).

### Key Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat/with-file` | AI chat with file upload |
| `POST /api/chat/image` | Image generation |
| `GET /api/kb/documents` | List knowledge base |
| `POST /api/auth/google` | Authentication |

See [Backend API Docs](https://github.com/patelyakshit/marketinsightsai-backend/blob/main/docs/api/README.md) for full reference.

## Related

- **Backend**: [marketinsightsai-backend](https://github.com/patelyakshit/marketinsightsai-backend)
- **Documentation**: See backend repo `/docs` folder

## License

Private - All rights reserved
