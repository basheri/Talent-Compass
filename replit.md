# Sanad - Career Discovery (سند - اكتشاف المهنة)

## Overview

A chat-based AI career discovery tool where "Sanad" (سند), a Saudi Career Coach AI, interviews the user to discover their strengths and passion, then auto-generates a professional A4 PDF report. The app uses Replit's built-in Gemini AI integration - no API key needed.

## User Preferences

- Preferred communication style: Simple, everyday language
- Primary language: Arabic with Saudi dialect
- Privacy-focused: Chat data stays in browser session

## System Architecture

### Technical Stack
- **Framework:** React + Vite (Frontend) + Express (Backend)
- **AI:** Google Gemini 2.5-flash via Replit AI Integrations (built-in, no API key needed)
- **Styling:** Tailwind CSS with "Calm & Minimalist" theme (Sage Green, Soft White, Dark Grey)
- **Language:** Fully Right-to-Left (RTL) for Arabic, with English toggle

### AI Integration
- **Provider:** Google Gemini (via Replit AI Integrations)
- **Model:** gemini-2.5-flash
- **Character:** "Sanad" (سند) - Expert Saudi Career Coach
- **Dialect:** Natural Saudi dialect (e.g., 'حياك الله', 'وش اللي يخليك تبدع؟')
- **Behavior:** Asks ONE open-ended question at a time, digs deep into 'Why' and 'How'
- **Auto-Termination:** AI decides when to stop based on gathered data for Strengths, Passion, and Career Paths
- **Output Protocol:** Returns JSON with `status: "complete"` when finished

### Application Flow
1. **Landing:** Clean welcome screen with "Start Journey" button (no API key needed)
2. **Chat Phase:** AI conducts interview, one question at a time, with typing indicators
3. **Report Phase:** When valid JSON detected with `"status": "complete"`, hide chat and render Report View
4. **PDF Export:** Download professional A4 career report using html2pdf.js

### Key Files
- `client/src/pages/home.tsx` - Main application page with state management
- `client/src/lib/types.ts` - TypeScript types and JSON sanitization utilities
- `client/src/lib/ai-service.ts` - Frontend service that calls backend API
- `server/routes.ts` - Backend API route for Gemini chat
- `client/src/components/conversation.tsx` - Chat interface with auto-completion detection
- `client/src/components/results-display.tsx` - Report view with PDF export
- `client/src/index.css` - Sage Green theme colors

### Features
- **Built-in AI:** No API key needed - uses Replit AI Integrations
- **JSON Sanitization:** Strips markdown code blocks before parsing AI response
- **Error Handling:** Toast notifications for API errors
- **Theme Support:** Light/Dark mode toggle
- **Bilingual:** Arabic (default) and English with RTL/LTR support

## External Dependencies

### AI/ML Services
- **Replit AI Integrations (Gemini):** Built-in, charged to user's Replit credits

### Frontend Libraries
- **html2pdf.js:** Dynamic import for PDF generation
- **Radix UI:** Accessible component primitives
- **Lucide React:** Icon library
