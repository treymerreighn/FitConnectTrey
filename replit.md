# FitConnect - Social Fitness Platform

## Overview
FitConnect is a social fitness platform designed to connect fitness enthusiasts, enable sharing of workouts and nutrition plans, and track progress collaboratively. It aims to provide a real-time social experience alongside comprehensive fitness tracking capabilities, leveraging modern full-stack technologies. The project envisions a broad market potential by offering a dedicated space for fitness communities to thrive, with ambitions to become a leading platform for social fitness engagement and personalized health management.

## Recent Breakthrough (August 2025)
**POSTING SYSTEM FULLY OPERATIONAL** - Successfully resolved critical React Query configuration issues and React hooks violations. The social feed now displays all posts correctly, including user workout posts. Community meal sharing and workout posting features are fully functional with proper data flow from backend API through React Query to frontend display.

**AI PROGRESS INSIGHTS FEATURE IMPLEMENTED** - Successfully created comprehensive AI-powered progress photo analysis system using OpenAI vision capabilities. This premium feature allows users to upload progress photos for detailed fitness insights including muscle definition scoring, posture analysis, body composition assessment, and personalized recommendations. Includes photo comparison functionality and complete storage system with API endpoints.

## User Preferences
Preferred communication style: Simple, everyday language.
Target platform: Mobile app store deployment (iOS/Android)

## System Architecture

### UI/UX Decisions
- Comprehensive design system based on shadcn/ui
- Mobile-first responsive design
- Dark mode support
- Custom fitness-themed color palette

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui, TanStack Query for server state, Wouter for routing, React Hook Form with Zod for forms, Vite as build tool.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL with Drizzle ORM (using Neon Database for serverless), Connect-pg-simple for session management.
- **Data Storage**: PostgreSQL with Drizzle ORM (schema-first approach), Drizzle Kit for migrations.
- **API Endpoints**: Standard RESTful API for user, post, and interaction management (e.g., `GET /api/users`, `POST /api/posts`, `POST /api/posts/:id/like`).
- **Data Flow**: Client requests via TanStack Query -> Express API layer -> Drizzle ORM for DB interaction -> JSON responses.

### Feature Specifications
- **User Management**: User profiles (avatars, bios, goals), social features (followers, following, discovery), authentication system.
- **Content Management**: Three post types (workout, nutrition, progress) with rich data structures and image support.
- **Social Features**: Feed-based content discovery, user search/follow, comments, stories-like feature.
- **Fitness Tracking**: Comprehensive exercise library, advanced workout logging with intelligent exercise selection, progress tracking with photo uploads, nutrition posting and tracking.
- **AI Integration**: AI-powered exercise sequencing, dynamic difficulty adjustment, predictive recovery analytics, intelligent exercise substitution, personalized meal plan generation, food photo analysis, performance-based nutrition adjustments, progress photo analysis with detailed fitness insights.
- **Monetization**: Premium AI features like advanced recipe regeneration and progress photo insights with subscription tiers (free, premium, pro).
- **Mobile Readiness**: PWA capabilities (manifest, service worker), mobile-optimized touch interactions, safe area support.

## External Dependencies
- **Database**: @neondatabase/serverless (for PostgreSQL), drizzle-orm, drizzle-kit.
- **UI Components**: Radix UI (underpins shadcn/ui).
- **State Management**: @tanstack/react-query.
- **Forms & Validation**: react-hook-form, @hookform/resolvers, zod.
- **Styling**: tailwindcss, class-variance-authority.
- **Cloud Storage**: AWS S3 (for image uploads).
- **AI**: OpenAI API.
- **Development Tools**: Vite, tsx.
- **Mobile Deployment (Hybrid Options)**: Capacitor (Ionic), Cordova.