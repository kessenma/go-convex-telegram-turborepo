# Telegram Bot + Convex Backend Turborepo

A [Turborepo](https://turbo.build/repo) monorepo setup that connects a Golang Telegram bot 🤖 with a self-hosted Convex database backend, and a next.js web app. all orchestrated with Docker Compose and connected with a docker network.

## 🏗️ Architecture

This project consists of:
- **🕸️ Turborepo** - A monorepo that orchestrates the project
- **🔌 Docker** - Used to define and run multi-container Docker applications
- **🤖 Golang Telegram Bot** (`apps/golang-telegram-bot/`) - Receives messages and saves them to Convex
- **🗄️ Convex Backend** (`apps/docker-convex/`) - Self-hosted typescript-based database with HTTP API endpoints
- **📚 Convex console Next.js web app** (`apps/docker-convex/convex/`) - a Convex database manager app
- **🖥️ Next.js web app** (`apps/web/`) - Next.js frontend that displays messages from the Telegram bot
- **📦 Shared Packages** (`packages/`) - Shared UI components and configurations

<img src="https://www.docker.com/app/uploads/2023/08/logo-guide-logos-2.svg" width="120" alt="Docker Logo">
<img src="https://turborepo.com/api/og" width="150" alt="Turborepo Logo">
<img src="https://www.techasoft.com/blog/2019/12/1576592374.png" width="120" alt="Golang Logo">
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nextjs-logo.svg/788px-Nextjs-logo.svg.png" width="100" alt="Next.js Logo">
<img src="https://docs.convex.dev/img/convex-dark.svg" width="120" alt="Convex Logo">
<img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="50" alt="Telegram Logo">


## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 
- [Node.js 18+](https://nodejs.org/en) and [pnpm](https://pnpm.io/installation)
- Telegram Bot Token and Telegram bot username from [@BotFather](https://t.me/botfather)

### One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/kessenma/go-convex-telegram-turborepo
cd go-convex-telegram-turborepo
pnpm install
pnpm setup-init
```

The setup script will:
1. Create `.env` file from template
2. Start Convex backend
3. Generate admin keys
4. Deploy Convex functions
5. Start all services

see [SETUP.md](./SETUP.md) for detailed setup instructions.


# Docker management
pnpm docker:up          # Start all services
pnpm docker:down        # Stop all services
pnpm docker:logs        # View logs
pnpm docker:restart-bot # Restart just the bot
pnpm docker:build       # Rebuild and start
pnpm docker:reset       # Reset everything

# Convex functions
pnpm convex:deploy      # Deploy Convex functions (Convex as a database runs off typescript functions, which is one way how it is different than a traditional SQL database. you can add more functions as you need and i think of them as the "database schema".)

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
