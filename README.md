# Xplore - Your Exploration Companion

A comprehensive cross-platform exploration application for travelers, adventurers, and relocators. Xplore combines intelligent trip planning, real-time journaling, property discovery, weather intelligence, smart checklists, and community features in one unified experience.

## 🚀 Quick Start

```bash
# Run the automated setup script
./scripts/setup-local.sh

# Or manually:
pnpm install
docker-compose up -d
cd apps/api && npx prisma migrate deploy
cd ../.. && pnpm dev
```

## 📚 Documentation

- [Local Development Setup](./docs/LOCAL_SETUP.md) - Detailed setup instructions
- [Project Documentation](./CLAUDE.md) - Complete project overview and architecture

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React Native, TypeScript, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM, Redis
- **Infrastructure**: Docker, pnpm workspaces, Turborepo
- **APIs**: Mapbox, OpenWeatherMap, Google Places

## 🏗️ Project Structure

```
xplore/
├── apps/
│   ├── api/          # Express.js backend
│   ├── web/          # Next.js web app
│   └── mobile/       # React Native app (coming soon)
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── ui/           # Shared UI components (coming soon)
│   └── database/     # Database package (coming soon)
├── docs/             # Documentation
└── scripts/          # Development scripts
```

## 🔧 Development

```bash
# Start all services
pnpm dev

# Run specific app
cd apps/web && pnpm dev
cd apps/api && pnpm dev

# Database management
cd apps/api
npx prisma studio     # GUI for database
npx prisma migrate dev # Create migrations

# Testing
pnpm test
pnpm lint
pnpm type-check
```

## 🌟 Features

- **User Authentication**: JWT-based auth with refresh tokens
- **Location Discovery**: Search and save locations with Mapbox integration
- **Wishlist Management**: Save, organize, and annotate favorite locations
- **Trip Planning**: Multi-day route optimization (coming soon)
- **Real-time Journaling**: Document your adventures (coming soon)
- **Property Intelligence**: Import and track real estate (coming soon)
- **Weather Intelligence**: Climate analysis and recommendations (coming soon)
- **Smart Checklists**: Context-aware travel preparation (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 🎯 Roadmap

See [CLAUDE.md](./CLAUDE.md) for the complete roadmap and feature planning.

---

Built with ❤️ by the Xplore team