# DesignRef AI - Architecture Documentation

## Overview

DesignRef AI is a modern web application for collecting, organizing, and analyzing web design references using AI. The application automatically scrapes design galleries like Land-book and Muzli, analyzes designs with OpenAI's GPT-4o, and provides intelligent categorization and search capabilities.

## System Architecture

The application follows a full-stack TypeScript monorepo architecture with clear separation between client, server, and shared code:

- **Frontend**: React with Vite, TypeScript, and shadcn/ui components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for design analysis
- **Web Scraping**: Playwright for automated content collection
- **Styling**: Tailwind CSS with custom design system

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming support

### Backend Architecture
- **Server**: Express.js with TypeScript and ES modules
- **Database Layer**: Drizzle ORM with PostgreSQL (Neon Database)
- **API Design**: RESTful endpoints with comprehensive error handling
- **External Services**: 
  - OpenAI API for AI-powered design analysis
  - Playwright for web scraping automation

### Data Storage
- **Primary Database**: PostgreSQL with two main tables:
  - `references`: Stores design reference metadata, URLs, tags, and AI analysis status
  - `tags`: Manages tag taxonomy with usage counts
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Data Validation**: Zod schemas shared between client and server

## Data Flow

1. **Content Collection**: Automated scraping services collect design references from external galleries
2. **AI Analysis**: OpenAI GPT-4o analyzes designs to extract relevant tags and descriptions in Japanese
3. **Storage**: Processed references are stored in PostgreSQL with proper indexing
4. **Search & Discovery**: Users can search and filter references using the React frontend
5. **Export**: References can be copied to clipboard or exported to external tools

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm and drizzle-kit for database operations
- **AI**: OpenAI API for intelligent design analysis
- **Scraping**: Playwright for browser automation
- **UI**: Extensive Radix UI component library for accessible interfaces

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for production bundling
- **Development**: tsx for TypeScript execution, Replit integration plugins

## Deployment Strategy

The application is designed for deployment on Replit with the following considerations:

- **Development Mode**: Vite dev server with HMR for rapid iteration
- **Production Build**: 
  - Frontend: Vite builds optimized React bundle to `dist/public`
  - Backend: ESBuild compiles TypeScript server to `dist/index.js`
- **Environment Variables**: Database URL and OpenAI API key required
- **Database**: Uses Neon Database (serverless PostgreSQL) for scalability

The monorepo structure allows for unified deployment while maintaining clear separation of concerns between frontend and backend code.

## Changelog

```
Changelog:
- June 30, 2025. Initial setup with in-memory storage
- June 30, 2025. Added PostgreSQL database with Drizzle ORM
  - Created database connection in server/db.ts
  - Replaced MemStorage with DatabaseStorage
  - Migrated schema to PostgreSQL with references and tags tables
  - Implemented persistent data storage with full CRUD operations
- June 30, 2025. Completed all core functionality
  - Fixed tag filtering with proper JSONB query operators
  - Implemented manual reference addition with AI analysis
  - Created fallback scraping system (Playwright constraints resolved)
  - Added OpenAI integration for automatic tag generation
  - Deployed full Japanese UI with search, filter, and copy features
- June 30, 2025. Added user onboarding and UI optimization
  - Created comprehensive UserGuide component with tooltips and first-visit modal
  - Replaced prompt-based manual addition with proper AddReferenceDialog
  - Added ダッシュボード, コレクション, 設定 pages with full navigation
  - Simplified interface by removing redundant floating action buttons
  - Implemented guided user experience for better usability
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```