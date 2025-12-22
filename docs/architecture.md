# System Architecture
> Version 0.1 - Stability First

## Core Flow
The application follows a linear 3-stage flow:

1.  **Chat (Exploration Phase)**
    - User engages with "Sanad" (AI Consultant).
    - AI asks open-ended questions to gather strategic data.
    - **Goal**: Collect enough information to form a solid career strategy.

2.  **Result (Strategic Analysis)**
    - Triggered when AI determines it has enough info.
    - Returns a JSON object with:
        - Strengths (Inferred & Deep)
        - Passion (Psychological Drive)
        - Career Paths (Safe, Growth, Unique)
        - Reliability Score (Confidence)
        - Strategic Advice

3.  **PDF (Export)**
    - User downloads high-quality PDF report.
    - **CurrentEngine**: Puppeteer (Headless Chrome) for perfect Arabic font support (Cairo).

## System Prompts
The behavior of "Sanad" is controlled by two sources:

1.  **Default Prompts (Fallback)**
    - Hardcoded in `server/routes.ts`.
    - Defines the persona, analysis protocols, and JSON output format.

2.  **Database Prompts (Admin Override)**
    - Stored in PostgreSQL `system_prompts` table.
    - Editable via `/admin` dashboard.
    - **Priority**: Database prompts override defaults if present.

## Technical Stack
- **Frontend**: React + Vite + TailwindCSS.
- **Backend**: Express (Node.js).
- **AI**: Google Gemini (via `@google/genai` SDK).
- **Database**: PostgreSQL (Drizzle ORM) - *Currently optional/in-memory fallback*.
- **PDF**: Puppeteer Core + Chrome (Browserless).
