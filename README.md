# Library MVP

A web application that allows users to upload book summaries and ask questions about them using AI.

## Features

- Upload book summaries and content
- Ask questions about uploaded books
- AI-powered responses using OpenRouter
- Vector search using ChromaDB
- User authentication with Supabase

## Tech Stack

- Frontend: Next.js (React) with TypeScript
- Backend: Next.js API routes
- AI: OpenRouter
- Database & Auth: Supabase
- Vector Search: ChromaDB
- Styling: Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and configurations
- `/public` - Static assets

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint 