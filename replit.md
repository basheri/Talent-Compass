# Misbar - Career Discovery (مسبار - اكتشاف المهنة)

## Overview

A chat-based AI career discovery tool where "Misbar" (مسبار), a Saudi Career Coach AI, interviews the user to discover their strengths and passion, then auto-generates a professional A4 PDF report. The app is fully client-side with no backend, respecting user privacy.

## User Preferences

- Preferred communication style: Simple, everyday language
- Primary language: Arabic with Saudi dialect
- Privacy-focused: All data stays in browser localStorage

## System Architecture

### Technical Stack
- **Framework:** React + Vite (Fast & Lightweight)
- **Styling:** Tailwind CSS with "Calm & Minimalist" theme (Sage Green, Soft White, Dark Grey)
- **Language:** Fully Right-to-Left (RTL) for Arabic, with English toggle

### Data Privacy (Strict Constraints)
- **NO Backend:** Client-side only architecture
- **API Keys:** Stored ONLY in `localStorage` (separate keys for each provider)
- **Chat History:** Kept in component state

### AI Integration
- **Supported Providers:** OpenAI (GPT-4o-mini) and Google Gemini (2.0-flash)
- **Provider Selection:** User can switch between providers in Settings
- **Character:** "Misbar" (مسبار) - Expert Saudi Career Coach
- **Dialect:** Natural Saudi dialect (e.g., 'حياك الله', 'وش اللي يخليك تبدع؟')
- **Behavior:** Asks ONE open-ended question at a time, digs deep into 'Why' and 'How'
- **Auto-Termination:** AI decides when to stop based on gathered data for Strengths, Passion, and Career Paths
- **Output Protocol:** Returns JSON with `status: "complete"` when finished

### Application Flow
1. **Landing:** Clean welcome screen with "Start Journey" button
2. **Setup:** Prompt user for API Key if not found (via Settings modal with provider selection)
3. **Chat Phase:** AI conducts interview, one question at a time, with typing indicators
4. **Report Phase:** When valid JSON detected with `"status": "complete"`, hide chat and render Report View
5. **PDF Export:** Download professional A4 career report using html2pdf.js

### Key Files
- `client/src/pages/home.tsx` - Main application page with state management
- `client/src/lib/types.ts` - TypeScript types including AIProvider, JSON sanitization utilities
- `client/src/lib/ai-service.ts` - Unified AI service for OpenAI and Gemini with prompts
- `client/src/components/conversation.tsx` - Chat interface with auto-completion detection
- `client/src/components/results-display.tsx` - Report view with PDF export
- `client/src/components/settings-modal.tsx` - Provider selection and API key configuration
- `client/src/index.css` - Sage Green theme colors

### Features
- **Multi-Provider Support:** OpenAI and Google Gemini with easy switching
- **JSON Sanitization:** Strips markdown code blocks before parsing AI response
- **Error Handling:** Toast notifications for API errors, auto-opens Settings for key issues
- **Theme Support:** Light/Dark mode toggle
- **Bilingual:** Arabic (default) and English with RTL/LTR support

## External Dependencies

### AI/ML Services
- **OpenAI API:** User provides their own API key, stored in browser localStorage only
- **Google Gemini API:** User provides their own API key, stored in browser localStorage only

### Frontend Libraries
- **html2pdf.js:** Dynamic import for PDF generation
- **Radix UI:** Accessible component primitives
- **Lucide React:** Icon library
