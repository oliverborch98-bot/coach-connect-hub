# Platform State Overview — Coach Connect Hub

Current state mapping of the Coach Connect Hub platform (The Build Method).

## 📁 Source Structure (`src/`)

```
src/
├── components/
│   ├── coach/              # Coach-side client management tabs
│   │   ├── ClientCheckinsTab.tsx
│   │   ├── ClientDocumentsTab.tsx
│   │   ├── ClientGoalsTab.tsx
│   │   ├── ClientHabitsTab.tsx
│   │   ├── ClientMeasurementsTab.tsx
│   │   ├── ClientMessagesTab.tsx
│   │   ├── ClientNotesTab.tsx
│   │   ├── ClientNutritionTab.tsx
│   │   ├── ClientPaymentTab.tsx
│   │   ├── ClientPhotosTab.tsx
│   │   └── ClientTrainingTab.tsx
│   ├── ui/                 # Shadcn/UI components
│   ├── ClientCard.tsx
│   ├── NavLink.tsx
│   ├── NotificationBell.tsx
│   ├── PremiumCard.tsx
│   ├── RestTimer.tsx
│   └── StatCard.tsx
├── contexts/               # Auth and Theme providers
├── hooks/                  # Custom React hooks
├── integrations/
│   └── supabase/           # Supabase client and types
├── layouts/                # Coach and Client layouts
├── lib/                    # Utility functions
├── pages/
│   ├── client/             # Client-side pages/views
│   │   ├── AIChat.tsx
│   │   ├── BodyMeasurements.tsx
│   │   ├── Calls.tsx
│   │   ├── ChangePassword.tsx
│   │   ├── CheckIn.tsx
│   │   ├── ClientMessages.tsx
│   │   ├── ClientProfile.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GoalsScore.tsx
│   │   ├── Guide.tsx
│   │   ├── Habits.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── NutritionPlan.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── PhasePlan.tsx
│   │   ├── ProgressPhotos.tsx
│   │   ├── Resources.tsx
│   │   ├── Training.tsx
│   │   └── Transformation.tsx
│   ├── coach/              # Coach-side pages/views
│   │   ├── AINutritionBuilder.tsx
│   │   ├── AIProgramBuilder.tsx
│   │   ├── AccessRequests.tsx
│   │   ├── Analytics.tsx
│   │   ├── Calls.tsx
│   │   ├── ClientDetail.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExerciseLibrary.tsx
│   │   ├── Messages.tsx
│   │   ├── NewClient.tsx
│   │   ├── NutritionBuilder.tsx
│   │   ├── PaymentDashboard.tsx
│   │   ├── ProgramBuilder.tsx
│   │   ├── RecipeLibrary.tsx
│   │   └── Settings.tsx
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   └── ResetPassword.tsx
├── services/               # API and external services
├── types/                  # TypeScript definitions
├── App.tsx                 # Main routing and auth logic
├── main.tsx                # Entry point
└── index.css               # Global styles (Tailwind)
```

## 🖥️ Pages and Views

### Authentication & Public
- **Login**: Primary entry point.
- **Reset Password**: Forgot password flow.
- **Not Found**: 404 error page.

### Coach Dashboard (`/coach`)
- **Main Dashboard**: Overview of all clients and alerts.
- **Client Detail**: Individual client management (Training, Nutrition, Habits, etc.).
- **Calls**: Scheduling and managing coaching calls.
- **Analytics**: Business and client performance metrics.
- **Builders**: Program Builder, Nutrition Builder, AI Program/Nutrition Builders.
- **Libraries**: Exercise Library, Recipe Library.
- **Payments**: Subscription and payment event tracking.
- **Settings**: Coach profile and platform settings.
- **Messages**: Unified inbox for client communication.
- **Access Requests**: Managing new client signups.

### Client Dashboard (`/client`)
- **Main Dashboard**: Daily tasks, summary, and quick links.
- **Onboarding Wizard**: Initial setup for new clients.
- **Training**: Active workout programs and logging.
- **Nutrition**: Meal plans and macro tracking.
- **Check-in**: Weekly reporting flow.
- **Habits**: Daily habit tracking.
- **Photos & Measurements**: Physical progress tracking.
- **AIChat**: AI-powered coaching assistant.
- **Leaderboard**: Community competition.
- **Resources & Guide**: Coaching materials and documents.
- **Transformation**: Visual transformation timeline.

## 🗄️ Supabase Database Tables

The database schema is managed via migrations in `supabase/migrations/`.

| Table | Description |
| :--- | :--- |
| `profiles` | Core user identity (Coach/Client roles) |
| `client_profiles` | Extended client data (Package, Coach, Goals) |
| `subscriptions` | Stripe subscription state |
| `payment_events` | Record of all payment transactions |
| `exercises` | Global exercise library |
| `training_programs` | Client-specific workout programs |
| `training_days` | Structure of days within a program |
| `training_exercises` | Specific exercises assigned to days |
| `workout_logs` | Recorded sets, reps, and weight |
| `nutrition_plans` | Client-specific meal plans |
| `meals` | Individual meals within a plan |
| `weekly_checkins` | Client reports and coach feedback |
| `progress_photos` | Uploaded progress images |
| `phases` | Higher-level program progression phases |
| `goals` | Specific targets (weight, strength, etc.) |
| `milestones` | Sub-tasks for goals |
| `daily_habits` | Habit definitions per client |
| `habit_logs` | Daily habit completion state |
| `coaching_calls` | Scheduled call records |
| `coach_notes` | Internal coach observations |
| `messages` | Chat history between coach and client |
| `notifications` | In-app alerts |
| `resources` | Global coaching materials |
| `onboarding_responses` | Collected data from onboarding wizard |
| `body_measurements` | Detailed metrics tracking |
| `access_requests` | Potential client signup requests |
| `recipes` | Global recipe library |
| `coach_default_habits`| Templates for standard habits |

## 📦 Core Dependencies

From `package.json`:

- **Framework**: `react` (v18.3.1), `vite` (v5.4.11)
- **Routing**: `react-router-dom` (v6.28.0)
- **Backend**: `@supabase/supabase-js` (v2.97.0)
- **State/Data**: `@tanstack/react-query` (v5.83.0), `zod`
- **UI/UX**: `lucide-react`, `framer-motion`, `sonner`, `vaul`, `recharts`
- **Styling**: `tailwindcss`, `class-variance-authority`, `tailwind-merge`
- **Components**: Radix UI (Accordion, Dialog, Tabs, etc.)
- **Utilities**: `date-fns`, `jspdf`, `react-hook-form`
