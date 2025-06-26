# Telegram Bot + Convex Backend Turborepo

A complete monorepo setup that connects a Golang Telegram bot with a self-hosted Convex database backend, all orchestrated with Docker Compose.

## 🏗️ Architecture

This project consists of:

- **🤖 Golang Telegram Bot** (`apps/golang-telegram-bot/`) - Receives messages and saves them to Convex
- **🗄️ Convex Backend** (`apps/docker-convex/`) - Self-hosted database with HTTP API endpoints
- **🌐 Web App** (`apps/web/`) - Next.js frontend (currently not integrated)
- **📦 Shared Packages** (`packages/`) - Shared UI components and configurations

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ and pnpm
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### One-Command Setup

```bash
# Clone and setup everything
git clone <your-repo>
cd go-convex-telegram-turborepo
pnpm setup
```

The setup script will:
1. Create `.env` file from template
2. Start Convex backend
3. Generate admin keys
4. Deploy Convex functions
5. Start all services

### Manual Setup

If you prefer manual setup, see [SETUP.md](./SETUP.md) for detailed instructions.

## 📱 Usage

1. **Configure your bot token**:
   ```bash
   cp .env.example .env
   # Edit .env and add your TELEGRAM_TOKEN
   ```

2. **Start all services**:
   ```bash
   pnpm docker:up
   ```

3. **Send a message to your Telegram bot** - it will be automatically saved to the Convex database!

4. **View saved messages**:
   - Dashboard: http://localhost:6791
   - API: http://localhost:3210/api/telegram/messages

## 🛠️ Development Commands

```bash
# Setup everything
pnpm setup

# Docker management
pnpm docker:up          # Start all services
pnpm docker:down        # Stop all services
pnpm docker:logs        # View logs
pnpm docker:restart-bot # Restart just the bot
pnpm docker:build       # Rebuild and start
pnpm docker:reset       # Reset everything

# Convex functions
pnpm convex:deploy      # Deploy Convex functions

# Testing
pnpm test:api           # Test API endpoints

# Traditional Turborepo commands
pnpm build              # Build all packages
pnpm dev                # Start development servers
pnpm lint               # Lint all packages
pnpm format             # Format code
```

## 📊 API Endpoints

Your Convex backend exposes these HTTP endpoints:

- `POST /api/telegram/messages` - Save a new message
- `GET /api/telegram/messages` - Get all messages
- `GET /api/telegram/messages?chatId=123` - Get messages for specific chat
- `GET /api/health` - Health check

## 🗂️ Project Structure

```
.
├── apps/
│   ├── docker-convex/          # Convex backend
│   │   ├── convex/
│   │   │   ├── schema.ts       # Database schema
│   │   │   ├── telegram.ts     # Telegram functions
│   │   │   └── http.ts         # HTTP API routes
│   │   └── docker-compose.yml  # Original Convex setup
│   ├── golang-telegram-bot/    # Telegram bot
│   │   ├── main.go             # Bot implementation
│   │   └── Dockerfile          # Bot container
│   └── web/                    # Next.js app (not integrated yet)
├── packages/                   # Shared packages
│   ├── ui/                     # Shared UI components
│   ├── eslint-config/          # ESLint configurations
│   └── typescript-config/      # TypeScript configurations
├── docker-compose.yml          # Centralized Docker setup
├── .env.example                # Environment template
├── setup.sh                    # Automated setup script
└── SETUP.md                    # Detailed setup guide
```

## 🗄️ Database Schema

The `telegram_messages` table stores:
- Message content and metadata
- User information (ID, username, name)
- Chat information
- Timestamps

See [schema.ts](./apps/docker-convex/convex/schema.ts) for full details.

## 🔍 Monitoring & Debugging

```bash
# View service status
docker compose ps

# Check specific service logs
docker compose logs telegram-bot
docker compose logs convex-backend

# Test API health
curl http://localhost:3210/api/health

# View saved messages
curl http://localhost:3210/api/telegram/messages
```

## 🚨 Troubleshooting

Common issues and solutions:

1. **Bot not connecting to Convex**:
   - Check if Convex is healthy: `curl http://localhost:3210/api/health`
   - Verify network: `docker compose exec telegram-bot ping convex-backend`

2. **Functions not working**:
   - Redeploy: `pnpm convex:deploy`
   - Check admin key exists: `ls apps/docker-convex/admin-key/`

3. **Messages not saving**:
   - Check bot logs: `docker compose logs telegram-bot`
   - Test API directly: `curl -X POST http://localhost:3210/api/telegram/messages -H "Content-Type: application/json" -d '{"messageId":1,"chatId":123,"text":"test"}'`

For detailed troubleshooting, see [SETUP.md](./SETUP.md).

## 🔒 Security

- Change `CONVEX_INSTANCE_SECRET` for production
- Keep `TELEGRAM_TOKEN` secure
- Admin key file contains sensitive credentials
- Use Docker secrets for production

## 🤝 Contributing

This is a Turborepo monorepo with:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Docker for containerization

## 📚 Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Docker Compose](https://docs.docker.com/compose/)
