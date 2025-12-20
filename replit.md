# OPA Life Architect (مهندس الحياة)

## Overview

A chat-based AI life coaching tool based on Anthony Robbins' "Time of Your Life" methodology. The OPA Life Architect rejects traditional time management (to-do lists) and enforces Life Management through the O.P.A. framework: Outcome, Purpose, Action. The AI coach is energetic, challenging, and empowering.

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
- **Character:** "OPA Life Architect" - Expert AI Coach based on Tony Robbins
- **Methodology:** Anthony Robbins' "Time of Your Life" O.P.A. Framework
  - **Outcome (O):** What is the specific result you want?
  - **Purpose (P):** Why do you want it? (Emotional fuel)
  - **Action (A):** The Massive Action Plan (MAP)
- **Operational Rules:**
  - **Chunking:** Groups scattered tasks into OPA Blocks based on common outcomes
  - **80/20 Filter:** Marks 20% high-impact actions as MUSTS, rest as SHOULDS
  - **Identity & Roles:** Uses empowering labels (e.g., "Physical Vitality" not "Diet")
  - **Time Zones:** Warns about "Dimension of Delusion" (urgent but unimportant), guides to "The Zone" (important but not urgent)
- **Behavior:** Energetic, challenging, empowering. Asks ONE question at a time.
- **Auto-Termination:** AI decides when to stop based on gathered Outcome, Purpose, and Action Plan
- **Output Protocol:** Returns raw JSON (no markdown) with `status: "complete"` when finished

### Application Flow
1. **Landing:** Clean welcome screen with "Start Now" button
2. **Chat Phase:** AI conducts O.P.A. interview, processing user input through the framework
3. **Report Phase:** When valid JSON detected with `"status": "complete"`, hide chat and render OPA Plan View
4. **PDF Export:** Download professional A4 life plan using html2pdf.js

### Key Files
- `client/src/pages/home.tsx` - Main application page with state management
- `client/src/lib/types.ts` - TypeScript types (OPAResult) and JSON sanitization utilities
- `client/src/lib/ai-service.ts` - Frontend service that calls backend API
- `server/routes.ts` - Backend API route for Gemini chat with O.P.A. system prompts
- `client/src/components/conversation.tsx` - Chat interface with auto-completion detection
- `client/src/components/results-display.tsx` - OPA Plan view with PDF export (Outcome, Purpose, Role, MUSTs, SHOULDs)
- `client/src/index.css` - Sage Green theme colors

### Environment Variables
- **GEMINI_API_KEY:** Google Gemini API key (stored as secret)

### Features
- **Secure Backend:** API key stored server-side as secret
- **O.P.A. Framework:** Anthony Robbins' "Time of Your Life" methodology
- **Chunking:** Groups tasks into outcome-based blocks
- **80/20 Filter:** Prioritizes high-impact actions as MUSTS
- **Empowering Identity:** Transforms boring labels into empowering roles
- **JSON Sanitization:** Strips markdown code blocks before parsing AI response
- **Error Handling:** Toast notifications for API errors
- **Theme Support:** Light/Dark mode toggle
- **Bilingual:** Arabic (default) and English with RTL/LTR support

## External Dependencies

### AI/ML Services
- **Google Gemini:** gemini-2.5-flash model via @google/genai SDK

### Frontend Libraries
- **html2pdf.js:** Dynamic import for PDF generation
- **Radix UI:** Accessible component primitives
- **Lucide React:** Icon library
