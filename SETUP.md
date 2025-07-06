# Telegram Bot + Convex Backend Setup Guide

This guide will help you set up a centralized Docker environment that connects your Golang Telegram bot with a Convex backend database.

## 🏗️ Architecture Overview

The setup includes:
- **Convex Backend**: Self-hosted Convex database with HTTP API endpoints
- **Convex Dashboard**: Web interface for managing your database
- **Golang Telegram Bot**: Bot that receives messages and saves them to Convex
- **Vector Convert LLM**: Python service providing text embeddings using Hugging Face transformers
- **Web Dashboard**: Next.js web interface for viewing messages and data
- **Centralized Docker Compose**: Single file to manage all services

## 📋 Prerequisites

1. **Docker & Docker Compose** installed on your system
2. **Telegram Bot Token** from [@BotFather](https://t.me/botfather)
3. **Telegram Bot Username** (the username you chose when creating the bot, ending with `_bot`)
4. **pnpm** (for Convex function deployment)

## 🚀 Quick Start

The setup process has been automated with a single command:

```bash
pnpm setup-init
```

This script will:
1. Create `.env` file from template if it doesn't exist
2. Prompt for your Telegram bot token if not configured
3. Prompt for your Telegram bot username if not configured
4. Start the Convex backend and generate admin key
5. Deploy Convex functions
6. Start all services

The script provides feedback at each step and will notify you when setup is complete.

## 🔍 Verify Setup

### 1. Check Service Health

```bash
# Check if all services are running
docker compose ps

# Test Convex API health
curl http://localhost:3211/api/health
```

### 2. Test Telegram Bot

1. **Access your bot**: If you configured the bot username during setup, you can access your bot at:
   ```
   https://t.me/your_bot_username_here
   ```
   Or search for `@your_bot_username_here` in Telegram

2. **Send a message** to your Telegram bot
3. **Check the logs**: `docker compose logs telegram-bot`
4. **Verify the message was saved**: `curl "http://localhost:3211/api/telegram/messages"`

### 3. Access Convex Dashboard

Open your browser and go to: http://localhost:6791

### 4. Monitor with Docker Desktop

1. **Open Docker Desktop** application on your computer
2. **Navigate to the 'Containers' tab**
3. **Look for your containers**:
   - `telegram-bot-convex-backend-1`
   - `telegram-bot-telegram-bot-1`
   - `telegram-bot-vector-convert-llm-1`
   - `telegram-bot-web-dashboard-1`
4. **Use Docker Desktop to**:
   - View real-time logs
   - Restart containers
   - Monitor resource usage
   - Stop/start services

### 5. Vector Convert LLM Service Setup

The `setup.sh` script now includes the Vector Convert LLM service that provides text embeddings using Hugging Face transformers. This service will be available within your Docker Compose setup.

To ensure the Vector Convert LLM service is built and ready:
- The service uses the `sentence-transformers/all-distilroberta-v1` model for generating 768-dimensional embeddings
- Verify the service is running using `docker compose ps` and look for `vector-convert-llm`
- Test the service: `curl http://localhost:8081/health`

## 🗄️ Database Management

Your Convex database provides a powerful web interface for:

- **Real-time data viewing and editing**
- **Data import/export capabilities**
- **Database backup creation**
- **Schema management**
- **Performance monitoring**

**Access Information:**
- **Dashboard URL**: http://localhost:6791
- **Deployment URL**: http://localhost:3210
- **Admin Key**: Generated during setup (saved in `apps/docker-convex/admin-key/`)

## 📊 API Endpoints

### Convex Backend (Port 3211)
- `POST /api/telegram/messages` - Save a new message
- `GET /api/telegram/messages` - Get all messages
- `GET /api/telegram/messages?chatId=123` - Get messages for specific chat
- `GET /api/health` - Health check

### Vector Convert LLM Service (Port 8081)
- `GET /health` - Health check
- `POST /embed` - Generate text embeddings
- `POST /similarity` - Calculate text similarity
- `POST /search` - Perform semantic search

## 🗂️ Database Schema

The `telegram_messages` table includes:
- `messageId` - Telegram message ID
- `chatId` - Chat ID where message was sent
- `userId` - User ID who sent the message
- `username` - Username of sender
- `firstName` - First name of sender
- `lastName` - Last name of sender
- `text` - Message content
- `messageType` - Type of message (text, photo, etc.)
- `timestamp` - When message was sent (Unix timestamp)
- `createdAt` - When record was created in DB

## 🛠️ Development Commands

```bash
# View logs for specific service
docker compose logs -f telegram-bot
docker compose logs -f convex-backend
docker compose logs -f vector-convert-llm
docker compose logs -f web-dashboard

# Restart a specific service
docker compose restart telegram-bot
docker compose restart vector-convert-llm
docker compose restart web-dashboard

# Stop all services
docker compose down

# Rebuild and restart (after code changes)
docker compose up --build -d

# Reset everything (including volumes)
docker compose down -v
docker system prune -af
```

## 🔧 Troubleshooting

### Bot Not Connecting to Convex
1. Check if Convex backend is healthy: `curl http://localhost:3211/api/health`
2. Verify network connectivity: `docker compose exec telegram-bot ping convex-backend`
3. Check environment variables: `docker compose exec telegram-bot env | grep CONVEX`

### Convex Functions Not Working
1. Ensure admin key was generated: `ls -la apps/docker-convex/admin-key/`
2. Redeploy functions: `cd apps/docker-convex && pnpm convex dev --once`
3. Check Convex logs: `docker compose logs convex-backend`

### Messages Not Saving
1. Check bot logs: `docker compose logs telegram-bot`
2. Test API directly: `curl -X POST http://localhost:3211/api/telegram/messages -H "Content-Type: application/json" -d '{"messageId":1,"chatId":123,"text":"test"}'`
3. Verify schema is deployed: Check dashboard at http://localhost:6791

### Vector Convert LLM Service Issues
1. Check Vector Convert LLM service logs: `docker compose logs vector-convert-llm`
2. Verify Vector Convert LLM service health: `curl http://localhost:8081/health`
3. Test text embedding: `curl -X POST http://localhost:8081/embed -H "Content-Type: application/json" -d '{"text":"Hello world"}'`
4. Check if the model is loading properly (may take time on first startup)

## 🔒 Security Notes

- Change `CONVEX_INSTANCE_SECRET` in production
- Keep your `TELEGRAM_TOKEN` secure
- The admin key file contains sensitive credentials
- Consider using Docker secrets for production deployments

## 📁 Project Structure

```
.
├── docker-compose.yml          # Centralized Docker setup
├── .env.example                # Environment template
├── apps/
│   ├── docker-convex/          # Convex backend
│   │   ├── convex/
│   │   │   ├── schema.ts       # Database schema
│   │   │   ├── telegram.ts     # Telegram-related functions
│   │   │   └── http.ts         # HTTP API routes
│   │   └── docker-compose.yml  # Original Convex setup
│   ├── vector-convert-llm/     # Vector Convert LLM Service
│   │   ├── main.py             # Python Flask API for embeddings
│   │   ├── requirements.txt    # Python dependencies
│   │   └── Dockerfile          # LLM service container
│   ├── golang-telegram-bot/    # Telegram bot
│   │   ├── main.go             # Bot implementation
│   │   └── Dockerfile          # Bot container
│   └── web/                    # Next.js Web Dashboard
│       ├── app/                # Next.js app directory
│       └── Dockerfile          # Web dashboard container
│   └── Mobile/                 # React Native app (without Expo)
│       ├── ios
│       └── android
├── setup-mobile.sh             # Mobile app setup script
└── SETUP.md                    # This file
```