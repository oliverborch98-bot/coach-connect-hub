# Coach Connect Hub

## Project Purpose
Coach Connect Hub is a professional platform designed to bridge the gap between coaches and their clients. It provides an all-in-one workspace for managing training programs, nutrition plans, client progress tracking, and direct communication.

## Core Features
- **Program Builder**: Create and assign detailed training programs using a comprehensive exercise library.
- **Nutrition Builder**: Design personalized nutrition plans with macro-tracking and meal scheduling.
- **Client Management**: Dedicated dashboards for coaches to monitor check-ins, progress photos, and feedback.
- **Messaging System**: Built-in chat for real-time communication between coaches and clients.
- **Template Library**: Save and reuse successful programs and nutrition plans across multiple clients.
- **Notification Center**: Real-time alerts for check-ins, messages, and plan updates.

## Tech Stack
- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Icons & Animations**: Lucide React + Framer Motion
- **Backend/Database**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form + Zod

## Folder Structure
- `/src/pages`: Direct routes and main view components.
- `/src/components`: Reusable UI components (shadcn components + custom features).
- `/src/layouts`: Global layouts for Coach and Client views.
- `/src/hooks`: Custom React hooks for shared logic and Supabase queries.
- `/src/integrations`: Supabase client initialization and API configurations.
- `/supabase/migrations`: SQL migration files for database schema management.
- `/supabase/functions`: Deno-based Edge Functions for backend logic.

## Coding Rules
- **Component-Driven**: Build reusable, modular components.
- **Type Safety**: Strictly use TypeScript interfaces and types for all data structures.
- **UI Consistency**: Use shadcn/ui tokens and Tailwind CSS for all styling.
- **Semantic HTML**: Ensure accessibility and SEO best practices.

## Deployment Rules
- **Branch Strategy**: `main` for Production, `ai-dev` for Development/AI experiments.
- **Auto-Push Policy**: All AntiGravity-generated code is automatically pushed to `ai-dev`.
- **Sync Workflow**: 
  1. Local File Update
  2. Automated Stage + Commit
  3. Automatic Push to GitHub
  4. Vercel Preview/Production Build
