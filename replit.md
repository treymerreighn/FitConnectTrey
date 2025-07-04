# FitConnect - Social Fitness Platform

## Overview

FitConnect is a social fitness platform that allows users to connect with fitness enthusiasts, share workouts, nutrition plans, and track progress together. The application is built using a modern full-stack architecture with React frontend and Express backend, featuring real-time social interactions and fitness tracking capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development**: Hot reload with Vite middleware integration

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration**: Drizzle Kit for database migrations
- **Temporary Storage**: In-memory storage implementation for development with seeded data

## Key Components

### User Management
- User profiles with avatars, bios, and fitness goals
- Social features: followers, following, and user discovery
- Authentication system (structure in place)

### Content Management
- Three post types: workout, nutrition, and progress
- Rich data structures for each post type with specific metadata
- Image support for posts
- Social interactions: likes, comments, and sharing

### Social Features
- Feed-based content discovery
- User search and follow functionality
- Comments and engagement system
- Stories-like feature for recent activity

### UI Components
- Comprehensive design system based on shadcn/ui
- Mobile-first responsive design
- Dark mode support
- Custom fitness-themed color palette

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle CRUD operations and business logic
3. **Data Layer**: Drizzle ORM manages database interactions
4. **Response**: JSON responses with proper error handling
5. **State Management**: TanStack Query caches and synchronizes server state

### API Endpoints
- `GET /api/users` - Fetch all users
- `GET /api/users/:id` - Fetch specific user
- `POST /api/users` - Create new user
- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike posts
- `GET /api/posts/:id/comments` - Fetch post comments

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-kit for database management
- **UI**: Extensive Radix UI component library
- **State**: @tanstack/react-query for server state management
- **Forms**: react-hook-form with @hookform/resolvers
- **Validation**: zod for schema validation
- **Styling**: tailwindcss with class-variance-authority

### Development Tools
- **Build**: Vite with React plugin
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Custom Vite plugins for Replit environment
- **Type Checking**: TypeScript with strict configuration

## Deployment Strategy

### Development Environment
- Vite dev server with Express middleware integration
- Hot module replacement for frontend
- TypeScript compilation on-the-fly
- Environment-specific configurations

### Production Environment
- Frontend: Vite build with static file serving
- Backend: Bundled with esbuild for optimal performance
- Database: Neon PostgreSQL with connection pooling
- Environment variables for database and configuration

### Build Process
1. Frontend assets compiled with Vite
2. Backend bundled with esbuild
3. TypeScript compilation and type checking
4. Database migrations applied via Drizzle Kit

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```