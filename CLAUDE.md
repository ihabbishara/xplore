# CLAUDE.md - Xplore Project Documentation

## 🚀 Project Overview

**Xplore** is a comprehensive cross-platform exploration application that serves as a digital companion for travelers, adventurers, and relocators. It combines intelligent trip planning, real-time journaling, property discovery, weather intelligence, smart checklists, and community features in one unified experience.

### Vision Statement
Transform how people explore, experience, and connect with places by providing an intelligent, unified platform that guides users from dreaming about a destination to making life-changing relocation decisions.

## 🎯 Target Users & Core Personas

### 1. **Marie Chen - Relocation Explorer** (Primary Focus)
- **Profile**: 32, Software Engineer from Toronto
- **Goal**: Relocate to France within 6 months
- **Journey**: Discovery → Planning → 20-day exploration → Property research → Decision
- **Key Needs**: Route planning, property import, weather analysis, decision analytics

### 2. **Alex Rodriguez - Weekend Traveler**
- **Profile**: 28, Marketing Manager
- **Goal**: Create memorable weekend experiences and share with friends
- **Journey**: Quick planning → Experience → Document → Share
- **Key Needs**: Fast planning, journaling, private sharing, templates

### 3. **Jordan Kim - Outdoor Adventurer**
- **Profile**: 35, Freelance Designer
- **Goal**: Plan and execute safe, well-documented outdoor adventures
- **Journey**: Route planning → Gear preparation → Adventure → Documentation
- **Key Needs**: Trail planning, safety features, gear checklists, offline functionality

## 🏗️ Technical Architecture

### **Technology Stack**
```
Frontend:
- Mobile: React Native with TypeScript
- Web: Next.js with TypeScript
- State Management: Redux Toolkit / Zustand
- Styling: Tailwind CSS / NativeWind

Backend:
- Runtime: Node.js with Express.js
- Database: PostgreSQL with PostGIS for location data
- Caching: Redis for sessions and API responses
- File Storage: Cloudflare R2 / AWS S3
- Real-time: Socket.io for collaboration features

APIs & Integrations:
- Maps: Mapbox (primary) with Google Maps fallback
- Weather: OpenWeatherMap (primary), AccuWeather (secondary), WeatherAPI (tertiary)
- Authentication: JWT with refresh tokens
- Location Services: Mapbox Geocoding + Google Places
- Voice Transcription: Whisper API / Google Speech-to-Text
- Email: SendGrid / AWS SES

Development Tools:
- Package Manager: pnpm
- Build Tools: Vite (web), Metro (mobile)
- Testing: Jest, React Testing Library, Detox (mobile)
- CI/CD: GitHub Actions
- Deployment: Vercel (web), App Store + Google Play (mobile)
```

### **Core Data Models**
```sql
-- Users & Authentication
users → user_profiles → user_weather_preferences

-- Location & Geography
locations → user_saved_locations → location_analytics
climate_zones → historical_climate_data

-- Trip Planning & Management
trips → trip_destinations → route_segments
trip_collaborators → trip_weather_summaries

-- Journaling & Documentation
journal_entries → journal_media → voice_transcriptions

-- Property Management
properties → user_saved_properties → property_price_history

-- Weather Intelligence
weather_data → weather_alerts → weather_providers

-- Checklist Management
checklist_templates → checklists → checklist_items
checklist_collaborators → checklist_activities

-- Analytics & Insights
exploration_insights → location_comparisons → dashboard_cache
```

## 📋 Development Process & Linear Integration

### **CRITICAL: Linear MCP Integration**
All development work is tracked in Linear MCP. For each issue you implement:

1. **Before Starting:**
   ```bash
   # Get issue details
   Linear:get_issue id="ISSUE_ID"
   
   # Add implementation comment
   Linear:create_comment issueId="ISSUE_ID" body="🚧 Starting implementation..."
   ```

2. **During Development:**
   ```bash
   # Update progress
   Linear:create_comment issueId="ISSUE_ID" body="✅ Completed: [feature] \n🚧 In Progress: [next_feature]"
   ```

3. **After Completion:**
   ```bash
   # Mark as completed with summary
   Linear:update_issue id="ISSUE_ID" description="[Updated description with implementation notes]"
   Linear:create_comment issueId="ISSUE_ID" body="✅ COMPLETED: [Comprehensive implementation summary]"
   ```

### **Issue Priority & Dependencies**
```
Phase 1 - Foundation (Must Complete First):
├── PER-11: User Registration & Profile Creation
├── PER-12: Location Discovery & Wishlist Management
└── PER-17: Comprehensive Weather & Climate Integration

Phase 2 - Core Features (Parallel Development):
├── PER-13: Multi-Day Route Planning & Optimization
├── PER-14: Real-Time Journal Creation & Documentation
├── PER-15: Property URL Import & Management System
└── PER-18: Smart CheckList Management System

Phase 3 - Intelligence & Analytics:
└── PER-16: Exploration Analysis Dashboard
```

## 🌟 Core Features & Implementation Priorities

### **1. Intelligent Trip Planning**
- **Multi-day route optimization** with drag-and-drop interface
- **Weather-aware suggestions** for timing and activities
- **Collaborative planning** with real-time updates
- **Smart checklist generation** based on trip context
- **Offline capabilities** for remote area planning

### **2. Real-Time Documentation**
- **Rich journaling** with photos, voice notes, and location data
- **Instagram-style feed** with privacy controls
- **Voice-to-text transcription** for hands-free documentation
- **Automatic location tagging** and weather context
- **Cross-device sync** with offline support

### **3. Property Intelligence**
- **URL-based import** from global real estate platforms
- **Smart data extraction** with 95%+ accuracy
- **Integration with exploration routes** and journal entries
- **Price monitoring** and market trend analysis
- **Comparison tools** for decision making

### **4. Weather & Climate Intelligence**
- **Automatic weather fetching** for all destinations
- **Climate compatibility scoring** based on user preferences
- **Seasonal optimization** recommendations
- **Weather-aware activity suggestions**
- **Real-time alerts** and updates

### **5. Smart Checklist Management**
- **Context-aware suggestions** (weather, location, activities)
- **50+ pre-built templates** for different trip types
- **Real-time collaboration** with task assignment
- **Progress tracking** and completion celebrations
- **Community template sharing** and rating

### **6. Analytics & Decision Support**
- **Comprehensive dashboard** with location comparisons
- **Sentiment analysis** of journal entries
- **Cost analysis** and affordability insights
- **AI-powered recommendations** for relocation decisions
- **Exportable reports** for documentation

## 🔧 Development Guidelines

### **Code Quality Standards**
```typescript
// File naming convention
components/      # React components (PascalCase)
services/       # Business logic (camelCase)
utils/          # Helper functions (camelCase)
types/          # TypeScript definitions (PascalCase)
hooks/          # Custom React hooks (use prefix)

// Component structure
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
   // 1. Hooks
   // 2. Local state
   // 3. Effects
   // 4. Event handlers
   // 5. Render
};

export default ComponentName;
```

### **Database Conventions**
```sql
-- Table naming: snake_case, plural
CREATE TABLE user_saved_locations (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                     created_at TIMESTAMP DEFAULT NOW(),
                                     updated_at TIMESTAMP DEFAULT NOW()
);

-- Always include:
-- - UUID primary keys
-- - Foreign key constraints with proper CASCADE
-- - created_at and updated_at timestamps
-- - Appropriate indexes for performance
```

### **API Design Patterns**
```typescript
// RESTful endpoints
GET    /api/resource              # List with pagination
   GET    /api/resource/:id          # Get single item
POST   /api/resource              # Create new
PUT    /api/resource/:id          # Update existing
DELETE /api/resource/:id          # Delete item

// Response format
{
   data: T | T[],                  # Actual data
   meta?: {                        # Metadata
   pagination?: PaginationMeta,
           total?: number
},
   error?: string                  # Error message if any
}
```

### **Error Handling**
```typescript
// Frontend error boundaries
class ErrorBoundary extends React.Component {
   // Catch and display user-friendly errors
}

// Backend error middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
   logger.error(error);
   res.status(500).json({ error: 'Internal server error' });
});
```

## 🚦 Performance Requirements

### **Response Time Targets**
- API responses: < 500ms (95th percentile)
- Page load time: < 3 seconds on 3G
- Search autocomplete: < 300ms
- Weather data updates: < 2 seconds
- Real-time collaboration: < 500ms latency

### **Offline Support Requirements**
- Essential features work offline (journaling, checklists, maps)
- Smart sync when connection restored
- Conflict resolution for concurrent edits
- Progressive web app capabilities

### **Mobile Performance**
- App bundle size: < 50MB initial download
- 60fps animations and scrolling
- Memory usage: < 200MB peak
- Battery optimization for location services

## 🔒 Security & Privacy

### **Authentication & Authorization**
```typescript
// JWT-based authentication with refresh tokens
interface AuthTokens {
   accessToken: string;   // 15 minutes expiry
   refreshToken: string;  // 7 days expiry
}

// Role-based permissions
enum UserRole {
   USER = 'user',
   PREMIUM = 'premium',
   ADMIN = 'admin'
}
```

### **Data Protection**
- **GDPR Compliance**: User data control and export
- **Privacy Controls**: Granular sharing permissions
- **Data Encryption**: Sensitive data encrypted at rest
- **Rate Limiting**: API protection against abuse
- **Input Validation**: All user inputs sanitized

### **Location Privacy**
- **Opt-in Location Services**: User controls location sharing
- **Data Anonymization**: Location patterns anonymized for analytics
- **Selective Sharing**: Users choose what location data to share

## 🌍 Internationalization & Accessibility

### **Multi-language Support**
```typescript
// i18n structure
const translations = {
   en: { /* English translations */ },
   fr: { /* French translations */ },
   es: { /* Spanish translations */ },
   de: { /* German translations */ }
};

// Currency and units
const formatCurrency = (amount: number, currency: string) => {
   return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
   }).format(amount);
};
```

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Screen reader support
- **Keyboard Navigation**: Full app navigable without mouse
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Indicators**: Clear focus states for all interactive elements
- **Alternative Text**: All images have descriptive alt text

## 📊 Analytics & Monitoring

### **Key Metrics to Track**
```typescript
// User engagement
- Daily/Monthly Active Users
- Session duration and frequency
- Feature adoption rates
- User retention (D1, D7, D30)

// Feature-specific metrics
- Trip completion rates
- Journal entry frequency
- Property save-to-visit conversion
- Weather accuracy satisfaction
- Checklist completion rates

// Performance metrics
- API response times
- Error rates and crash reports
- User-reported issues
- App store ratings and reviews
```

### **Error Tracking & Logging**
```typescript
// Structured logging
logger.info('User action', {
   userId,
   action: 'trip_created',
   metadata: { destination_count: 5, duration_days: 10 }
});

// Error tracking with context
Sentry.captureException(error, {
   user: { id: userId },
   extra: { feature: 'route_planning', action: 'optimization' }
});
```

## 🧪 Testing Strategy

### **Test Coverage Requirements**
```typescript
// Unit tests: > 80% coverage
describe('WeatherService', () => {
   it('should fetch weather data for location', async () => {
      // Test weather API integration
   });
});

// Integration tests
describe('Trip Planning API', () => {
   it('should create trip with destinations', async () => {
      // Test end-to-end trip creation
   });
});

// E2E tests (Detox for mobile)
describe('User Journey', () => {
   it('should complete relocation explorer flow', async () => {
      // Test complete user flow
   });
});
```

### **Testing Environments**
- **Development**: Local development with mock data
- **Staging**: Production-like environment for integration testing
- **Production**: Live environment with monitoring

## 📦 Deployment & DevOps

### **Deployment Strategy**
```yaml
# GitHub Actions workflow
name: Deploy Xplore
on:
   push:
      branches: [main]

jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - name: Deploy Web
           run: vercel --prod

         - name: Deploy Mobile
           run: eas build --platform all
```

### **Environment Configuration**
```typescript
// Environment variables
interface Config {
   DATABASE_URL: string;
   REDIS_URL: string;
   OPENWEATHER_API_KEY: string;
   MAPBOX_ACCESS_TOKEN: string;
   CLOUDFLARE_R2_BUCKET: string;
   JWT_SECRET: string;
}
```

## 🎨 Design System & UI Guidelines

### **Design Tokens**
```typescript
// Color palette
const colors = {
   primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a'
   },
   semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
   }
};

// Typography scale
const typography = {
   h1: { fontSize: '2.5rem', fontWeight: '700' },
   h2: { fontSize: '2rem', fontWeight: '600' },
   body: { fontSize: '1rem', fontWeight: '400' },
   caption: { fontSize: '0.875rem', fontWeight: '400' }
};
```

### **Component Library**
- **Consistent spacing**: 4px grid system
- **Responsive design**: Mobile-first approach
- **Interactive states**: Hover, focus, active, disabled
- **Loading states**: Skeleton screens and spinners
- **Empty states**: Helpful illustrations and CTAs

## 🔄 Data Flow & State Management

### **Global State Structure**
```typescript
interface AppState {
   auth: AuthState;
   trips: TripsState;
   locations: LocationsState;
   weather: WeatherState;
   checklists: ChecklistsState;
   journal: JournalState;
   properties: PropertiesState;
   ui: UIState;
}
```

### **Real-time Features**
```typescript
// Socket.io integration
const socket = io('/namespace');
socket.on('trip_updated', (data) => {
   // Update local state
   dispatch(updateTrip(data));
});
```

## 📈 Future Roadmap & Extensibility

### **Phase 4 - Advanced Features (6-12 months)**
- **AR Integration**: Location discovery through augmented reality
- **AI Travel Assistant**: ChatGPT-like planning assistant
- **Social Features**: Community trip sharing and recommendations
- **Marketplace Integration**: Book accommodations and activities
- **Wearable Support**: Apple Watch and Android Wear integration

### **Phase 5 - Enterprise Features (12+ months)**
- **Business Travel Tools**: Expense tracking and corporate integrations
- **Event Planning**: Conference and event exploration features
- **Educational Programs**: Study abroad and educational travel
- **Immigration Support**: Visa tracking and relocation services

## 🎯 Success Metrics & KPIs

### **Launch Targets (6 months)**
- 10,000+ registered users
- 70%+ user retention at 30 days
- 4.5+ app store rating
- < 3% crash rate
- 80%+ feature completion rate for first trip

### **Growth Targets (12 months)**
- 100,000+ active users
- 15+ supported countries for property import
- 85%+ weather prediction accuracy
- $500K+ ARR (if freemium model implemented)
- 95% uptime SLA

---

## 🏗️ Initial Project Setup & Architecture

### **CRITICAL: Project Structure Setup**

Before implementing any features, establish the complete project structure. This ensures proper domain separation, scalability, and maintainability.

#### **1. Repository Structure**
```
xplore/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Web-specific utilities
│   │   │   └── styles/        # CSS/Tailwind styles
│   │   ├── public/            # Static assets
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── mobile/                # React Native application
│   │   ├── src/
│   │   │   ├── screens/       # Screen components
│   │   │   ├── components/    # React Native components
│   │   │   ├── navigation/    # Navigation configuration
│   │   │   ├── hooks/         # Custom hooks
│   │   │   └── lib/           # Mobile-specific utilities
│   │   ├── android/           # Android-specific files
│   │   ├── ios/               # iOS-specific files
│   │   ├── package.json
│   │   └── metro.config.js
│   │
│   └── api/                   # Node.js backend API
│       ├── src/
│       │   ├── controllers/   # Route handlers
│       │   ├── services/      # Business logic
│       │   ├── models/        # Database models
│       │   ├── middleware/    # Express middleware
│       │   ├── routes/        # API routes
│       │   ├── utils/         # Utilities
│       │   ├── config/        # Configuration
│       │   └── types/         # TypeScript types
│       ├── migrations/        # Database migrations
│       ├── seeds/             # Database seed files
│       ├── tests/             # Backend tests
│       └── package.json
│
├── packages/                  # Shared packages
│   ├── shared/                # Shared utilities and types
│   │   ├── src/
│   │   │   ├── types/         # Shared TypeScript definitions
│   │   │   ├── utils/         # Cross-platform utilities
│   │   │   ├── constants/     # Application constants
│   │   │   └── validations/   # Shared validation schemas
│   │   └── package.json
│   │
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── icons/         # Icon components
│   │   │   ├── hooks/         # UI-related hooks
│   │   │   └── styles/        # Shared styles
│   │   └── package.json
│   │
│   └── database/              # Database package
│       ├── src/
│       │   ├── client.ts      # Database client
│       │   ├── schema.ts      # Database schema
│       │   └── migrations/    # Migration files
│       └── package.json
│
├── tools/                     # Development tools
│   ├── scripts/               # Build and deployment scripts
│   └── configs/               # Shared configurations
│
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── deployment/            # Deployment guides
│   └── architecture/          # Architecture decisions
│
├── pnpm-workspace.yaml        # Monorepo configuration
├── package.json               # Root package.json
├── turbo.json                 # Turborepo configuration
├── .env.example               # Environment variables template
└── CLAUDE.md                  # This documentation file
```

#### **2. Domain-Driven Design Structure**

Each domain should be organized consistently across all apps:

```
src/
├── domains/
│   ├── auth/                  # Authentication & User Management
│   │   ├── components/        # Auth-specific components
│   │   ├── services/          # Auth business logic
│   │   ├── types/             # Auth TypeScript types
│   │   ├── hooks/             # Auth-related hooks
│   │   └── utils/             # Auth utilities
│   │
│   ├── locations/             # Location Discovery & Management
│   │   ├── components/        # Location components
│   │   ├── services/          # Location services
│   │   ├── types/             # Location types
│   │   ├── hooks/             # Location hooks
│   │   └── utils/             # Location utilities
│   │
│   ├── trips/                 # Trip Planning & Route Management
│   │   ├── components/        # Trip planning components
│   │   ├── services/          # Trip business logic
│   │   ├── types/             # Trip types
│   │   ├── hooks/             # Trip hooks
│   │   └── utils/             # Trip utilities
│   │
│   ├── journal/               # Journaling & Documentation
│   │   ├── components/        # Journal components
│   │   ├── services/          # Journal services
│   │   ├── types/             # Journal types
│   │   ├── hooks/             # Journal hooks
│   │   └── utils/             # Journal utilities
│   │
│   ├── properties/            # Property Discovery & Management
│   │   ├── components/        # Property components
│   │   ├── services/          # Property services
│   │   ├── types/             # Property types
│   │   ├── hooks/             # Property hooks
│   │   └── utils/             # Property utilities
│   │
│   ├── weather/               # Weather Intelligence
│   │   ├── components/        # Weather components
│   │   ├── services/          # Weather services
│   │   ├── types/             # Weather types
│   │   ├── hooks/             # Weather hooks
│   │   └── utils/             # Weather utilities
│   │
│   ├── checklists/            # CheckList Management
│   │   ├── components/        # Checklist components
│   │   ├── services/          # Checklist services
│   │   ├── types/             # Checklist types
│   │   ├── hooks/             # Checklist hooks
│   │   └── utils/             # Checklist utilities
│   │
│   └── analytics/             # Analytics & Insights
│       ├── components/        # Analytics components
│       ├── services/          # Analytics services
│       ├── types/             # Analytics types
│       ├── hooks/             # Analytics hooks
│       └── utils/             # Analytics utilities
│
├── shared/                    # Cross-domain shared code
│   ├── components/            # Generic UI components
│   ├── hooks/                 # Generic hooks
│   ├── utils/                 # Generic utilities
│   ├── services/              # Cross-domain services
│   └── types/                 # Generic types
│
└── lib/                       # External integrations
    ├── api/                   # API client configuration
    ├── auth/                  # Authentication setup
    ├── database/              # Database configuration
    ├── storage/               # File storage setup
    └── monitoring/            # Error tracking & analytics
```

#### **3. Package Configuration**

**Root `package.json`:**
```json
{
  "name": "xplore",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "cd apps/api && pnpm db:migrate",
    "db:seed": "cd apps/api && pnpm db:seed",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "@turbo/gen": "^1.11.2",
    "turbo": "^1.11.2",
    "typescript": "^5.3.3",
    "prettier": "^3.1.1",
    "eslint": "^8.56.0"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
```

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### **4. Database Setup & Migrations**

**Database package structure:**
```
packages/database/
├── src/
│   ├── client.ts              # Database client setup
│   ├── schema.ts              # Prisma/Drizzle schema
│   └── migrations/            # SQL migration files
├── package.json
└── README.md
```

**Migration naming convention:**
```
migrations/
├── 001_initial_setup.sql
├── 002_add_weather_tables.sql
├── 003_add_checklist_tables.sql
└── 004_add_analytics_tables.sql
```

#### **5. Shared Types Package**

**`packages/shared/src/types/`:**
```typescript
// Core domain types
export * from './auth.types';
export * from './locations.types';
export * from './trips.types';
export * from './journal.types';
export * from './properties.types';
export * from './weather.types';
export * from './checklists.types';
export * from './analytics.types';

// Common types
export * from './common.types';
export * from './api.types';
```

#### **6. Environment Configuration**

**`.env.example`:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/xplore_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# External APIs
OPENWEATHER_API_KEY="your-openweather-api-key"
ACCUWEATHER_API_KEY="your-accuweather-api-key"
MAPBOX_ACCESS_TOKEN="your-mapbox-token"
GOOGLE_PLACES_API_KEY="your-google-places-key"

# File Storage
CLOUDFLARE_R2_BUCKET="your-r2-bucket"
CLOUDFLARE_R2_ACCESS_KEY="your-r2-access-key"
CLOUDFLARE_R2_SECRET_KEY="your-r2-secret-key"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@xplore.app"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
MIXPANEL_TOKEN="your-mixpanel-token"

# App Configuration
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
```

## 🏁 Getting Started

### **Step 1: Initial Setup**
```bash
# Create monorepo structure
mkdir xplore && cd xplore

# Initialize pnpm workspace
echo 'packages:\n  - "apps/*"\n  - "packages/*"' > pnpm-workspace.yaml

# Create package.json (use configuration above)
npm init -y

# Install development tools
pnpm add -D turbo typescript prettier eslint

# Create apps and packages directories
mkdir -p apps/{web,mobile,api} packages/{shared,ui,database} tools/{scripts,configs} docs/{api,deployment,architecture}
```

### **Step 2: Backend API Setup**
```bash
cd apps/api

# Initialize package.json
npm init -y

# Install core dependencies
pnpm add express cors helmet morgan compression
pnpm add express-rate-limit express-validator
pnpm add jsonwebtoken bcryptjs
pnpm add prisma @prisma/client
pnpm add redis socket.io
pnpm add axios cheerio puppeteer
pnpm add multer sharp

# Install development dependencies
pnpm add -D @types/node @types/express @types/cors
pnpm add -D @types/jsonwebtoken @types/bcryptjs
pnpm add -D @types/multer nodemon ts-node
pnpm add -D jest @types/jest supertest @types/supertest

# Initialize TypeScript
npx tsc --init

# Setup Prisma
npx prisma init
```

### **Step 3: Web App Setup**
```bash
cd apps/web

# Create Next.js app with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install additional dependencies
pnpm add @reduxjs/toolkit react-redux
pnpm add @hookform/resolvers yup react-hook-form
pnpm add axios swr
pnpm add mapbox-gl @mapbox/mapbox-gl-geocoder
pnpm add socket.io-client
pnpm add framer-motion
pnpm add recharts
```

### **Step 4: Mobile App Setup**
```bash
cd apps/mobile

# Initialize React Native with TypeScript
npx react-native@latest init XploreMobile --template react-native-template-typescript

# Install additional dependencies
pnpm add @reduxjs/toolkit react-redux
pnpm add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context
pnpm add react-native-maps react-native-geolocation-service
pnpm add react-native-image-picker react-native-fs
pnpm add react-native-voice react-native-sound
pnpm add socket.io-client
pnpm add react-native-async-storage
```

### **Step 5: Shared Packages Setup**
```bash
# Setup shared package
cd packages/shared
npm init -y
pnpm add typescript zod

# Setup UI package  
cd ../ui
npm init -y
pnpm add react react-native
pnpm add -D typescript @types/react

# Setup database package
cd ../database
npm init -y
pnpm add prisma @prisma/client
pnpm add -D typescript
```

### **Step 6: Database Initialization**
```bash
cd apps/api

# Create initial migration
npx prisma migrate dev --name initial_setup

# Generate Prisma client
npx prisma generate

# Seed database
pnpm db:seed
```

### **MANDATORY: Domain Structure Implementation**

**When implementing each Linear issue, ALWAYS:**

1. **Create domain folder** if it doesn't exist:
   ```bash
   mkdir -p src/domains/{domain-name}/{components,services,types,hooks,utils}
   ```

2. **Follow naming conventions**:
   ```typescript
   // Services: {Domain}Service.ts
   export class LocationService { }
   
   // Types: {domain}.types.ts
   export interface Location { }
   
   // Hooks: use{Domain}Hook.ts
   export function useLocationSearch() { }
   
   // Components: {ComponentName}.tsx
   export const LocationCard: React.FC = () => { }
   ```

3. **Maintain separation of concerns**:
   - **Components**: UI only, no business logic
   - **Services**: Business logic, API calls, data processing
   - **Hooks**: React state management and side effects
   - **Types**: TypeScript definitions
   - **Utils**: Pure functions and helpers

4. **Always update Linear** with architecture decisions:
   ```bash
   Linear:create_comment issueId="PER-XX" body="
   🏗️ ARCHITECTURE UPDATE
   
   Created domain structure:
   - src/domains/{domain}/
   - Added services: {ServiceName}
   - Added types: {TypeName}
   - Added components: {ComponentName}
   
   Follows DDD principles and monorepo structure.
   "
   ```

This structured approach ensures scalability, maintainability, and clear domain boundaries as the application grows!

### **First Implementation Steps**
1. **Start with PER-11**: User Registration & Profile Creation
2. **Update Linear issue** with progress comments
3. **Follow TDD approach**: Write tests first
4. **Implement incrementally**: One feature at a time
5. **Test thoroughly**: Unit, integration, and E2E tests
6. **Update documentation**: Keep Claude.md current

### **When You Complete an Issue**
```bash
# Always update Linear with implementation summary
Linear:create_comment issueId="PER-XX" body="
✅ IMPLEMENTATION COMPLETE

## What was built:
- [Feature 1 with details]
- [Feature 2 with details]

## Technical decisions:
- [Key architecture choices]
- [Trade-offs made]

## Testing:
- [Test coverage achieved]
- [Manual testing completed]

## Next steps:
- [Any follow-up items]
- [Dependencies for other issues]
"
```

Remember: This is a comprehensive, user-focused application that will help people make life-changing decisions about where to live and explore. Build with care, attention to detail, and always consider the human impact of every feature you create.

Happy coding! 🚀