# FitConnect - Social Fitness Platform

A comprehensive fitness social media mobile application with AI-powered workout generation, muscle group-based exercise library, and real-time social interactions.

## 🚀 Features

### Core Functionality
- **Social Feed**: Share workouts, nutrition plans, and progress updates
- **Workout Builder**: Create custom workouts with muscle group organization
- **Exercise Library**: 18+ exercises organized by muscle groups with alphabetical sorting
- **Progress Tracking**: Log workouts with photo uploads and AI insights
- **User Profiles**: Follow friends, track achievements, and build communities

### Advanced Features
- **AI Workout Generation**: Personalized workout plans based on goals and preferences
- **Muscle Group Navigation**: Anatomical organization (Chest, Back, Shoulders, etc.)
- **Cloud Storage**: AWS S3 integration for secure image uploads
- **Real-time Updates**: Live feed updates and social interactions
- **Mobile-First Design**: PWA-ready for app store deployment

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** + Zod validation

### Backend
- **Node.js** + Express.js
- **PostgreSQL** with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **AWS S3** for file storage
- **OpenAI API** for AI features

### Development
- **Vite** for build tooling
- **TypeScript** with strict configuration
- **ESLint** + Prettier for code quality

## 📱 Mobile App Store Ready

### PWA Capabilities
- ✅ App manifest with proper icons
- ✅ Service worker for offline functionality
- ✅ Mobile-optimized touch targets (44px minimum)
- ✅ Safe area support for notched devices
- ✅ Native-like installation experience

### Deployment Options
1. **Progressive Web App (PWA)** - Deploy directly to web
2. **Hybrid App (Capacitor/Cordova)** - Package for iOS/Android app stores
3. **React Native** - Full native conversion

## 🏗 Architecture

```
FitConnect/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and configurations
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   ├── db.ts           # Database configuration
│   └── replitAuth.ts   # Authentication setup
├── shared/              # Shared types and schemas
│   └── schema.ts       # Database schema definitions
└── public/             # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (optional, for image uploads)
- OpenAI API key (optional, for AI features)

### Environment Variables
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/fitconnect
SESSION_SECRET=your-session-secret
AWS_ACCESS_KEY_ID=your-aws-key (optional)
AWS_SECRET_ACCESS_KEY=your-aws-secret (optional)
AWS_REGION=us-east-1 (optional)
OPENAI_API_KEY=your-openai-key (optional)
```

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/fitconnect.git
cd fitconnect

# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## 📊 Database Schema

### Core Tables
- **users**: User profiles and authentication
- **posts**: Social feed content (workouts, nutrition, progress)
- **exercises**: Exercise library with muscle group organization
- **workouts**: Saved workout plans and sessions
- **comments**: Social interactions and engagement
- **connections**: User following/follower relationships

## 🎯 Key Features Implemented

### Exercise Library System
- **Muscle Group Organization**: 11 major muscle groups
- **Alphabetical Sorting**: Exercises sorted A-Z within each group
- **Smart Filtering**: Find exercises by muscle group targeting
- **Professional Data**: Comprehensive exercise instructions and tips

### Workout Builder
- **Drag & Drop Interface**: Easy exercise ordering
- **Set/Rep Configuration**: Customizable workout parameters
- **Duration Estimation**: Automatic workout time calculation
- **Social Sharing**: Post workouts to community feed

### Social Features
- **Activity Feed**: Real-time updates from followed users
- **Progress Tracking**: Photo uploads with AI insights
- **Community Challenges**: Group fitness goals
- **Professional Network**: Connect with trainers and nutritionists

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push database schema changes
npm run db:studio    # Open database admin panel
```

### Code Quality
- TypeScript strict mode enabled
- ESLint with React/TypeScript rules
- Prettier for consistent formatting
- Husky for pre-commit hooks

## 🚀 Deployment

### Replit Deployment
1. Connect to Replit
2. Set environment variables
3. Click "Deploy" button
4. Your app will be live at `your-app.replit.app`

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy to your hosting provider
3. Set up PostgreSQL database
4. Configure environment variables
5. Run database migrations: `npm run db:push`

## 📈 Roadmap

### Planned Features
- [ ] Video exercise demonstrations
- [ ] Nutrition tracking with barcode scanning
- [ ] Wearable device integration
- [ ] Advanced analytics dashboard
- [ ] Group workout challenges
- [ ] Marketplace for trainers/nutritionists

### Technical Improvements
- [ ] Redis caching for performance
- [ ] WebSocket real-time notifications
- [ ] GraphQL API migration
- [ ] Enhanced PWA capabilities
- [ ] Automated testing suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Replit** for the development platform
- **Neon** for serverless PostgreSQL
- **OpenAI** for AI-powered features
- **Unsplash** for stock exercise images

---

Built with ❤️ for the fitness community