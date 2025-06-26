# Telegram Bot + Convex Backend Setup Guide

This guide will help you set up a centralized Docker environment that connects your Golang Telegram bot with a Convex backend database.

## 🏗️ Architecture Overview

The setup includes:
- **Convex Backend**: Self-hosted Convex database with HTTP API endpoints
- **Convex Dashboard**: Web interface for managing your database
- **Golang Telegram Bot**: Bot that receives messages and saves them to Convex
- **Centralized Docker Compose**: Single file to manage all services

## 📋 Prerequisites

1. **Docker & Docker Compose** installed on your system
2. **Telegram Bot Token** from [@BotFather](https://t.me/botfather)
3. **pnpm** (for Convex function deployment)

## 🚀 Quick Start

The setup process has been automated with a single command:

```bash
pnpm setup-init
```

This script will:
1. Create `.env` file from template if it doesn't exist
2. Prompt for your Telegram bot token if not configured
3. Start the Convex backend and generate admin key
4. Deploy Convex functions
5. Start all services

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

1. Send a message to your Telegram bot
2. Check the logs: `docker compose logs telegram-bot`
3. Verify the message was saved by checking: `curl "http://localhost:3211/api/telegram/messages"`

### 3. Access Convex Dashboard

Open your browser and go to: http://localhost:6791

## 📊 API Endpoints

Your Convex backend exposes these HTTP endpoints:

- `POST /api/telegram/messages` - Save a new message
- `GET /api/telegram/messages` - Get all messages
- `GET /api/telegram/messages?chatId=123` - Get messages for specific chat
- `GET /api/health` - Health check

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

# Restart a specific service
docker compose restart telegram-bot

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
│   └── golang-telegram-bot/    # Telegram bot
│       ├── main.go             # Bot implementation
│       └── Dockerfile          # Bot container
└── SETUP.md                    # This file
```