# Career & Talent Discovery

## Overview

A single-page AI-powered career counseling and talent discovery application. Users complete a multi-step assessment form about their background, skills, interests, and goals. The app then engages them in an AI-powered conversation to explore their career potential, ultimately generating a comprehensive career analysis report that can be exported as PDF. Supports both English and Arabic with full RTL layout support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React useState/useEffect for local state, TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with HMR support

### UI Component System
- Uses shadcn/ui components built on Radix UI primitives
- Custom theme provider supporting light/dark modes
- CSS variables for theming defined in `client/src/index.css`
- Design follows Linear/Notion-inspired minimalist aesthetic per `design_guidelines.md`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Build**: esbuild for production bundling with selective dependency bundling

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated via drizzle-kit to `./migrations`
- **Current Storage**: In-memory storage class (`MemStorage`) for development, designed to be swapped with database implementation

### AI Integration
- **Provider**: OpenAI API (client-side integration)
- **API Key Storage**: localStorage (user provides their own key)
- **Features**: Conversational career counseling, assessment analysis, report generation

### Internationalization
- Bilingual support: English and Arabic
- RTL layout support with `dir="rtl"` attribute
- Font stack: Inter for Latin, Noto Sans Arabic for Arabic text
- Language preference persisted to localStorage

### Key Application Flow
1. **Welcome/Hero** → User sees landing page with CTA
2. **Assessment** → Multi-step form collecting user profile data
3. **Conversation** → AI-powered chat exploring career interests
4. **Results** → Generated career analysis with PDF export capability

### File Structure Pattern
- `client/` - React frontend application
- `server/` - Express backend
- `shared/` - Shared types and database schema
- `script/` - Build scripts

## External Dependencies

### AI/ML Services
- **OpenAI API**: Used for conversational AI and career analysis generation. Users must provide their own API key stored in browser localStorage.

### Database
- **PostgreSQL**: Primary database (Drizzle configured for PostgreSQL dialect). Connection via `DATABASE_URL` environment variable.

### Frontend Libraries
- **Radix UI**: Accessible component primitives for all interactive UI elements
- **TanStack React Query**: Data fetching and caching
- **Embla Carousel**: Carousel functionality
- **Recharts**: Chart/data visualization components
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

### Development Tools
- **Vite**: Development server with HMR
- **Replit Plugins**: Dev banner, cartographer, runtime error overlay for Replit environment