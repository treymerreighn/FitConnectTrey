# FitConnect AI Agent Instructions

## Architecture Overview
FitConnect is a social fitness PWA with **3-layer monorepo architecture**:
- `client/` - React 18 + TypeScript + Vite SPA with Wouter routing
- `server/` - Express.js API with session-based auth, AI integrations (OpenAI), and AWS S3 storage
- `shared/` - Zod schemas (`schema.ts`, `workout-types.ts`) and Drizzle ORM definitions (`db-schema.ts`)

**Data flow**: Client → TanStack Query → Express routes (`server/routes.ts`) → Storage abstraction (`server/storage.ts` → `server/pg-storage.ts`) → Neon PostgreSQL

## Critical Patterns

### Schema-First Development
- **All data types derive from Zod schemas** in `shared/schema.ts` and `shared/workout-types.ts`
- TypeScript types use `z.infer<typeof schema>` - never manually define types that have schemas
- Database schema in `shared/db-schema.ts` uses Drizzle ORM with `pgTable` definitions
- Example: `User` type comes from `userSchema`, table from `users` in `db-schema.ts`

### Storage Abstraction Layer
- All DB operations go through `storage.ts` interface → `PgStorage` implementation
- `PgStorage` uses **dual storage**: PostgreSQL for core entities + in-memory Maps for features without DB tables yet
- In-memory stores: `recipes`, `workoutSessions`, `exerciseProgress`, `communityMeals`, `progressInsights`, `workoutTemplates`
- When adding DB-backed features, implement in `PgStorage` first, then update routes

### AI Feature Architecture
AI services are **class-based singletons** in `server/ai-*.ts`:
- `AIWorkoutIntelligence` - Exercise sequencing, rep/weight suggestions, form guidance
- `AINutritionCoach` - Meal analysis, macro recommendations
- `AIProgressAnalyzer` - Photo-based progress insights
- All use `requireOpenAI()` from `server/openai.ts` which gracefully handles missing keys
- AI is **optional** - features degrade gracefully when `OPENAI_API_KEY` unset

### Component Architecture
- **shadcn/ui** components in `client/src/components/ui/` - NEVER modify these directly
- Custom components use composition: import shadcn primitives, add app logic
- `@radix-ui` primitives are the foundation - understand their props before customizing
- Theme system: `ThemeProvider` from `contexts/theme-context.tsx` manages light/dark with localStorage persistence

### API Client Pattern
```typescript
// client/src/lib/api.ts exports unified API methods
import { api } from "@/lib/api";
const posts = await api.getPosts(); // All requests use apiRequest from queryClient.ts
```
- Uses `apiRequest()` helper with automatic credential inclusion
- TanStack Query manages caching/invalidation - use `queryClient.invalidateQueries()` after mutations

## Development Workflows

### Local Development
```bash
npm run dev              # Starts dev server with Vite + Express on port 5000
npm run check            # TypeScript compilation check
npm run db:push          # Push schema changes to Neon DB (requires DATABASE_URL)
```
- **Auth is disabled** in development (see `server/replitAuth.ts` - exports no-op middleware)
- Database connection optional: server falls back to in-memory when `DATABASE_URL` missing

### Adding New Features
1. **Define schema** in `shared/schema.ts` or `shared/workout-types.ts` with Zod
2. **Add DB table** to `shared/db-schema.ts` if persisting to PostgreSQL
3. **Implement storage methods** in `server/storage.ts` interface + `server/pg-storage.ts`
4. **Add API routes** in `server/routes.ts` with Zod validation
5. **Create API client methods** in `client/src/lib/api.ts`
6. **Build UI** in `client/src/pages/` with TanStack Query hooks

### Working with Exercise Library
- Exercises stored in PostgreSQL via `exercises` table
- **AI generation scripts**: `server/fresh-exercise-builder.ts`, `server/expand-exercise-library.ts`
- Don't auto-seed in production - check `server/index.ts` startup logic
- Exercise schema includes: `name`, `category`, `muscleGroups` (array), `difficulty`, `instructions` (array)

### Image Uploads
- Server uses **AWS S3** via `server/aws-config.ts` → `AWSImageService` class
- Client uses `client/src/lib/imageUpload.ts` with `uploadImage()` / `uploadMultipleImages()`
- Image validation: max 5MB, formats: JPEG/PNG/GIF/WebP
- S3 bucket auto-created on first upload if missing

## Path Aliases
```typescript
"@/*"       → "client/src/*"
"@shared/*" → "shared/*"
"@assets/*" → "attached_assets/*"
```

## Key Files for Context
- `server/routes.ts` - All API endpoints (1700+ lines - search for specific route)
- `server/pg-storage.ts` - Database operations implementation
- `client/src/App.tsx` - Routing and bottom navigation structure
- `shared/schema.ts` - Source of truth for all data types
- `server/index.ts` - Server initialization, middleware, database setup

## Gotchas
- **Module system**: ESM everywhere (`.ts` extensions required in imports on server)
- **Sessions**: Express-session with `connect-pg-simple` (PostgreSQL session store)
- **Environment variables**: `.env` file required (see `README.md` for template)
- **Drizzle migrations**: Run `npm run db:push` to sync schema changes, migrations in `migrations/`
- **TypeScript paths**: Use `@/` prefix for client imports, `@shared/` for shared types
- **shadcn components**: Installed via `npx shadcn-ui@latest add <component>`, don't hand-edit

## Testing Patterns
- No formal test suite currently configured
- Manual testing workflow: `npm run dev` → test in browser at `localhost:5000`
- Use `/api/debug/seeded-users` endpoint to inspect seeded data

## Production Considerations
- `server/production-optimizations.ts` applies compression, caching headers, graceful shutdown
- `public/sw.js` service worker for PWA offline capabilities
- Build: `npm run build` → outputs to `dist/public/` (client) + `dist/` (server)
- Start production: `npm start` (runs `dist/index.js`)
