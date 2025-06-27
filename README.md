# Telegram Bot + Convex Backend Turborepo

A [Turborepo](https://turbo.build/repo) monorepo setup that connects a Golang Telegram bot 🤖 with a self-hosted Convex database backend, and a next.js web app.

## 🧱 The building blocks ⚙️
- **🕸️ Turborepo** - A monorepo that orchestrates the project
- **🔌 a central Docker compose** - Used to define and run multi-container Docker applications (every app in the apps folder has a dockerfile 🧩 inside it)
- **🛜 a docker network** - Used to connect the containers securely (managed in the docker-compose.yaml)
- **🤖 Golang Telegram Bot** (`apps/golang-telegram-bot/`) - Receives messages and saves them to Convex
- **🗄️ Convex Backend** (`apps/docker-convex/`) - Self-hosted typescript-based database with HTTP API endpoints
- **📚 Convex console Next.js web app** (`apps/docker-convex/convex/`) - a Convex database manager app
- **🖥️ Next.js web app** (`apps/web/`) - Next.js frontend that displays messages from the Telegram bot
- **📦 Shared Packages** (`packages/`) - Shared UI components and configurations

<table>  
<tr>
<td><img src="https://turborepo.com/api/og" width="200" alt="Turborepo Logo"></td>
<td><img src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/97_Docker_logo_logos-512.png" width="100" alt="Docker Logo"></td>
<td><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUbnWC8yS9tAD43c6PFYKlZ213HbZe2GXEcg&s" width="100" alt="pnpm Logo"></td>
<td><img src="https://nodejs.org/static/logos/nodejsStackedDark.svg" width="100" alt="Node.js Logo"></td>
</tr>
</table>

<table>
<tr>
<td><img src="https://docs.convex.dev/img/convex-dark.svg" width="150" alt="Convex Logo"></td>
<td><img src="https://cdn.worldvectorlogo.com/logos/typescript.svg" width="87.5" alt="TypeScript Logo"></td>
<td><img src="https://go.dev/blog/go-brand/Go-Logo/PNG/Go-Logo_LightBlue.png" width="87.5" alt="Golang Logo"></td>
<td><img src="https://camo.githubusercontent.com/c3635f27439ecdbf20e3cbf969c156f4040f10a0c8c836cf307d916dd8f806d4/68747470733a2f2f6173736574732e76657263656c2e636f6d2f696d6167652f75706c6f61642f76313636323133303535392f6e6578746a732f49636f6e5f6461726b5f6261636b67726f756e642e706e67" width="87.5" alt="Next.js Logo"></td>
<td><img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="87.5" alt="Telegram Logo"></td>
</tr>
</table>



## 🚀 Quick Start (Docker) 🐳

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 
- [Node.js 18+](https://nodejs.org/en) and [pnpm](https://pnpm.io/installation)
- Telegram Bot _Token_ and Telegram bot _username_ from [@BotFather](https://t.me/botfather)

### Three-Command Setup
1.
```bash
# Clone and setup everything
git clone https://github.com/kessenma/go-convex-telegram-turborepo
```
2.
```bash
cd go-convex-telegram-turborepo
pnpm install
```
3.
```bash
pnpm setup-init
```

## ⚡ Turborepo & Build Caching

This project uses **Turborepo** for optimized monorepo management and intelligent build caching:

### Key Benefits
- **⚡ Lightning Fast Builds**: Skip rebuilding unchanged code
- **🔄 Incremental Development**: Only rebuild what you've modified
- **🚀 Parallel Execution**: Run tasks across all apps simultaneously
- **🧠 Smart Dependencies**: Automatic task dependency resolution
- **☁️ Remote Caching**: Share build cache across team and CI/CD

### How It Works
```bash
# First build - everything builds from scratch
pnpm run build

# Second build - only changed apps rebuild (near-instant!)
pnpm run build

# View what would be cached/rebuilt
pnpm turbo run build --dry-run
```

### Cache Configuration
- **Global dependencies**: `.env`, `.env.local`, `.env.example`
- **Environment tracking**: Automatic cache invalidation on env changes
- **Input tracking**: Source files, configs, dependencies, and more
- **Output caching**: Build artifacts, generated files, test results

## 🏃‍♂️ Local Development (Without Docker)

For local development without Docker containers, see our comprehensive guide:

📖 **[Local Setup Guide](./LOCAL-SETUP-GUIDE.md)**

This includes:
- Setting up each service individually
- Running development servers locally
- Building and testing without containers
- Turborepo commands for local development

## 🐳 Docker Development

The setup script will:
1. Create `.env` file from template
2. Start Convex backend
3. Generate admin keys
4. Deploy Convex functions
5. Start all services

see [SETUP.md](./SETUP.md) for detailed setup instructions.

## Environmnent variable management
Every app in this repo contains a readme file to run the app independently from the monorepo. However, **‼️ in order to run the apps independently locally they will need their own env file in the corresponding app folder ‼️** Getting environment variables to play nice across monorepo's can be tricky, so I prefer to use a central .env file that can be used across the monorepo. 


## 🗂️ Project Structure

```bash
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

## Docker management
```bash
pnpm docker:up          # Start all services
```

```bash
pnpm docker:down        # Stop all services
```

```bash
pnpm docker:logs        # View logs
```

```bash
pnpm docker:restart-bot # Restart just the bot
```

```bash
pnpm docker:build       # Rebuild and start
```

```bash
pnpm docker:reset       # Reset everything
```

## Convex functions
```bash
pnpm convex:deploy      # Deploy Convex functions (Convex as a database runs off typescript functions, which is one way how it is different than a traditional SQL database. you can add more functions as you need and i think of them as the "database schema".)
```

## Testing
```bash
pnpm test:api           # Test API endpoints
```

## Traditional Turborepo commands
```bash
pnpm build              # Build all packages
```

```bash
pnpm dev                # Start development servers
```
```bash
pnpm lint               # Lint all packages
```

```bash
pnpm format             # Format code
```

## 🔴----🔫 API Endpoints

The Convex backend exposes these HTTP endpoints:

- `POST /api/telegram/messages` - Save a new message
- `GET /api/telegram/messages` - Get all messages
- `GET /api/telegram/messages?chatId=123` - Get messages for specific chat
- `GET /api/health` - Health check
  
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

Common issues:

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
