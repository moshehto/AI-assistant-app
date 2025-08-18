# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is an Electron-based AI assistant application with a React frontend. The application uses a multi-window architecture where different components are rendered in separate Electron windows based on URL parameters.

### Core Structure

- **Root**: Contains main Electron configuration and package scripts
- **frontend/**: React application built with Vite, serves multiple window types via URL routing
- **electron/**: Contains Electron main process (`main.js`) and preload scripts

### Multi-Window Architecture

The application uses a single React app with URL parameter-based routing to render different components in separate Electron windows:

- `main`: Authentication screen → FloatingBar (after auth)
- `chatbot`: AI chat interface
- `conversation-manager`: Conversation management
- `file-manager`: File handling interface  
- `admin-dashboard`: Administrative interface

Window creation is handled in `electron/main.js` with each window loading the same URL but different `?window=` parameters.

### State Management

Centralized state is managed via React Context in `frontend/src/contexts/AppContext.jsx`:
- Authentication state (token, user data)
- Conversations list and current conversation
- Files and loading/error states
- API functions for external service communication

The context provides shared API functions that all windows can use, with automatic auth header injection.

### Authentication Flow

1. Main window shows AuthScreen component
2. On successful auth, Electron window resizes from 900x600 to 520x70
3. Auth token stored in localStorage for persistence
4. IPC message `auth-success` triggers window resize

## Development Commands

```bash
# Install dependencies (run from root)
npm install

# Start development server with hot reload
npm run dev
# This runs frontend dev server and launches Electron concurrently

# Frontend-only development (from frontend/ directory)
npm run dev

# Build application
npm run build
# Builds frontend and packages with electron-builder

# Lint frontend code
cd frontend && npm run lint

# Start Electron in production mode
npm start
```

## Key Development Patterns

### Window Communication
- Windows communicate via Electron IPC (main process handles `ipcMain` events)
- Each window type renders appropriate React component based on URL params
- Conversations managed centrally and persisted to `electron/conversations.json`

### Component Structure
- Components located in `frontend/src/components/`
- Matching CSS files in `frontend/src/styling/`
- All components access shared state via `useApp()` hook

### Styling Architecture
- Component-specific CSS files in `styling/` directory
- CSS imported directly into components or App.jsx
- Uses CSS classes with BEM-like naming (`app--${windowType}`)

## Global Shortcuts

- `Command+Shift+H`: Toggle chatbot window visibility

## Testing & Quality

The project uses ESLint for code quality. Always run `npm run lint` from the frontend directory before committing changes.

Note: No test framework is currently configured. Check with the project maintainer before adding testing infrastructure.