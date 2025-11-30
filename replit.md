# Daily Spending Planner

## Overview

A utility-focused financial planning tool that helps users manage their monthly budget by calculating daily spending allowances. Users input their total monthly budget, desired savings amount, and select a month to view how much they can spend each day while meeting their savings goals. The application features a clean, design system-based interface built with React and styled using Tailwind CSS with shadcn/ui components.

## Recent Changes (November 2025)

- Implemented complete frontend with input controls, summary cards, and daily spending cards
- Added local storage persistence for all user inputs
- Implemented copy-to-clipboard functionality with toast notifications
- Added responsive grid layout (1/2/3 columns based on viewport)
- All calculations update in real-time as user types

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type safety and component-based UI
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (instead of React Router)
- TanStack Query (React Query) for state management and data fetching

**UI Framework:**
- shadcn/ui component library (headless Radix UI primitives with custom styling)
- Tailwind CSS for utility-first styling with custom design tokens
- Custom design system defined in `design_guidelines.md` focusing on clarity and readability
- Typography: Inter or SF Pro fonts for clean, modern appearance

**Component Organization:**
- Reusable UI components in `client/src/components/ui/` (buttons, cards, inputs, selects, etc.)
- Page components in `client/src/pages/` (home, not-found)
- Custom hooks in `client/src/hooks/` (use-toast, use-mobile)
- Path aliases configured for clean imports (@/, @shared/, @assets/)

**Key Design Decisions:**
- Single-column centered layout (max-width: 3xl) for focused user experience
- Responsive grid system for daily spending cards (1 column mobile, 2-3 columns desktop)
- Local storage persistence for user preferences (total amount, savings, selected month)
- No authentication or user accounts - purely client-side utility app

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- HTTP server setup with middleware for JSON parsing and request logging
- Session management infrastructure (express-session with connect-pg-simple)

**Current State:**
- Minimal backend implementation - routes placeholder in `server/routes.ts`
- In-memory storage implementation (`MemStorage`) for user data
- Database schema defined but not actively used for core functionality
- Application primarily operates as client-side tool

**Build Process:**
- Custom build script using esbuild for server bundling
- Vite for client build with SSR support in development
- Development mode uses Vite middleware for HMR
- Production mode serves pre-built static assets

### Data Storage Solutions

**Database Configuration:**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Schema defined in `shared/schema.ts` with basic user table
- Migration support via drizzle-kit

**Storage Interface:**
- Abstract `IStorage` interface for CRUD operations
- Current implementation: `MemStorage` (in-memory, non-persistent)
- Designed for future database integration without code changes

**Client-Side Persistence:**
- LocalStorage for saving planner state (budget, savings, month selection)
- Storage key: "daily-spending-planner"
- No server-side persistence currently required for core functionality

**Design Rationale:**
- Application is primarily a client-side calculator/utility
- User table schema exists but isn't actively used
- Database infrastructure prepared for future features (user accounts, saved plans, history)

### External Dependencies

**UI Component Libraries:**
- @radix-ui/* - Headless accessible UI primitives (20+ component packages)
- class-variance-authority - Type-safe variant handling for components
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality
- lucide-react - Icon library
- vaul - Drawer component primitives

**Form & Validation:**
- react-hook-form - Form state management
- @hookform/resolvers - Form validation resolvers
- zod - Schema validation
- drizzle-zod - Database schema to Zod schema conversion

**Date Handling:**
- date-fns - Date manipulation and formatting library
- Used for: calculating days in month, date formatting, month navigation

**Styling:**
- tailwindcss - Utility-first CSS framework
- tailwind-merge - Utility for merging Tailwind classes
- clsx - Conditional className utility
- autoprefixer - PostCSS plugin for vendor prefixes

**State Management:**
- @tanstack/react-query - Server state management and caching
- Custom query client configuration with no automatic refetching

**Database & ORM:**
- drizzle-orm - TypeScript ORM for SQL databases
- @neondatabase/serverless - Neon Postgres serverless driver
- connect-pg-simple - PostgreSQL session store for Express

**Development Tools:**
- @replit/vite-plugin-runtime-error-modal - Development error overlay
- @replit/vite-plugin-cartographer - Replit-specific development tooling
- @replit/vite-plugin-dev-banner - Development environment banner

**Build Tools:**
- vite - Frontend build tool and dev server
- esbuild - Fast JavaScript bundler for server code
- tsx - TypeScript execution engine

**HTTP & Server:**
- express - Web application framework
- express-session - Session middleware
- cors - CORS middleware support
- express-rate-limit - Rate limiting middleware

**Routing:**
- wouter - Minimalist routing for React (~1.2KB alternative to React Router)

**Third-Party Service Integration:**
- None currently active
- Infrastructure prepared for: authentication (passport.js), email (nodemailer), payments (stripe), AI (OpenAI, Google Generative AI)