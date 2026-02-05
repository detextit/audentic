# Audentic

A Next.js application for creating and managing voice-enabled AI agents.

## Getting Started

1. Clone the repository
2. Request `.env.local` and fill in your API keys
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/         # Backend API endpoints
│   ├── agents/      # Agent management pages
│   └── history/     # Session history pages
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── types/           # TypeScript type definitions
└── utils/           # Helper utilities and logging
```

## Environment Variables

See `.env.example` for required environment variables including:
- AI model API keys (OpenAI, Gemini, Mistral)
- Database connection strings
- Authentication keys (Clerk)
- Payment processing (Stripe)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Neon
- **Authentication**: Clerk
- **UI**: Tailwind CSS + shadcn/ui
- **AI Models**: OpenAI, Google Gemini, Mistral
