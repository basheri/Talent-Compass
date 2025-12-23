# Sanad - Elite Strategic Career Consultant (سند - المستشار الاستراتيجي)

## Overview

A chat-based AI career consulting tool. Sanad (سند - meaning "support" in Arabic) is an Elite Strategic Career Consultant that upgrades user thinking rather than just repeating what they say. Uses gap analysis, reality checks, and counter-intuitive strategies to provide actionable insights.

## User Preferences

- Preferred communication style: Energetic, challenging, empowering
- Primary language: Arabic with English toggle
- Privacy-focused: Chat data stays in browser session

## System Architecture

### Technical Stack
- **Framework:** React + Vite (Frontend) + Express (Backend)
- **AI:** Google Gemini 2.5-flash via backend proxy with GEMINI_API_KEY secret
- **Styling:** Tailwind CSS with "Calm & Minimalist" theme (Sage Green, Soft White, Dark Grey)
- **Language:** Fully Right-to-Left (RTL) for Arabic, with English toggle

### AI Integration
- **Provider:** Google Gemini via @google/genai SDK
- **Model:** gemini-2.5-flash
- **Character:** "Sanad" (سند) - Elite Strategic Career Consultant
- **Analysis Protocols:**
  - **No Echoing:** Never just rephrase user input; elevate their ambition
  - **Gap Analysis:** Analyze gap between current state and ambition
  - **Reality Check:** Challenge unrealistic goals politely but firmly
  - **Insight Factor:** Provide strategies the user didn't mention
  - **Mental Models:** Uses 80/20 Rule, Blue Ocean Strategy, etc.
- **Behavior:** Asks ONE question at a time, upgrades thinking
- **Auto-Termination:** AI decides when to stop based on gathered strategic info
- **Output Protocol:** Returns raw JSON (no markdown) with `status: "complete"` when finished

### JSON Output Schema
```json
{
  "status": "complete",
  "strengths": ["Hidden Strength (Inferred)", "Visible Strength"],
  "passion": "Deep psychological analysis of WHY they want this",
  "career_paths": [
    "Path 1: The Safe Route (Low Risk)",
    "Path 2: The Aggressive Growth Route (High Reward)",
    "Path 3: The Blue Ocean Niche (Unique)"
  ],
  "reliability_score": 85,
  "advice": "Strategic insight bridging current reality and dream"
}
```

### Application Flow
1. **Landing:** Clean welcome screen with "Start Now" button
2. **Chat Phase:** AI conducts strategic interview, upgrading user thinking
3. **Report Phase:** When valid JSON detected with `"status": "complete"`, hide chat and render Strategic Analysis View
4. **PDF Export:** Download professional A4 career plan using @react-pdf/renderer with Cairo Arabic font

### Key Files
- `client/src/pages/home.tsx` - Main application page with state management
- `client/src/pages/admin.tsx` - Admin dashboard with analytics and prompt editor
- `client/src/lib/types.ts` - TypeScript types (OPAResult with strengths, passion, career_paths, reliability_score, advice)
- `client/src/lib/ai-service.ts` - Frontend service that calls backend API with session tracking
- `client/src/lib/session.ts` - Session ID management for analytics
- `server/routes.ts` - Backend API routes for chat, auth, and admin
- `server/storage.ts` - Database storage for prompts, sessions, and analytics
- `shared/schema.ts` - Drizzle schema for system_prompts, chat_sessions, chat_messages
- `client/src/components/conversation.tsx` - Chat interface with auto-completion detection
- `client/src/components/results-display.tsx` - Strategic Analysis view with PDF export
- `client/src/components/sanad-report-pdf.tsx` - PDF report component using @react-pdf/renderer
- `client/src/index.css` - Sage Green theme colors

### Environment Variables
- **GEMINI_API_KEY:** Google Gemini API key (stored as secret)
- **DATABASE_URL:** PostgreSQL connection string (auto-configured)
- **SESSION_SECRET:** Session encryption key (auto-configured)
- **ADMIN_EMAIL:** Admin email for dashboard access (default: m.basheri@gmail.com)

### Features
- **Secure Backend:** API key stored server-side as secret
- **Strategic Analysis:** Gap analysis, reality checks, counter-intuitive strategies
- **Career Paths:** Safe, Growth, and Blue Ocean niche options
- **Strengths Discovery:** Infers hidden strengths from conversation
- **JSON Sanitization:** Strips markdown code blocks before parsing AI response
- **Error Handling:** Toast notifications for API errors
- **Theme Support:** Light/Dark mode toggle
- **Bilingual:** Arabic (default) and English with RTL/LTR support
- **Admin Dashboard:** `/admin` route with analytics and prompt editor
- **Session Analytics:** Tracks unique users, total messages, active users (24h)
- **Dynamic System Prompt:** Editable from admin dashboard, stored in PostgreSQL
- **Replit Auth:** OAuth login for admin access
- **Database Resilience:** Retry logic for transient DNS/network errors (5 attempts, exponential backoff 500ms-8s with jitter)
- **Health Endpoints:** `/api/health` and `/health/db` for monitoring database connectivity

### Database Configuration
- **Connection:** Uses DATABASE_URL only (ignores PGHOST, PGUSER, etc.)
- **SSL:** Auto-detection for Neon databases
- **Retry Logic:** Transient errors (EAI_AGAIN, ECONNRESET, ETIMEDOUT) trigger retries; SQL/constraint errors do not
- **Error Handling:** DatabaseTemporaryError with type='DB_TEMPORARY_FAILURE' returns HTTP 503

## External Dependencies

### AI/ML Services
- **Google Gemini:** gemini-2.5-flash model via @google/genai SDK

### Frontend Libraries
- **@react-pdf/renderer:** PDF generation with Cairo Arabic font for proper RTL
- **react-markdown:** Markdown rendering in chat with @tailwindcss/typography
- **Radix UI:** Accessible component primitives
- **Lucide React:** Icon library
