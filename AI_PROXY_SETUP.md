# AI API Proxy Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your actual API keys:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   HUGGINGFACE_API_KEY=hf-your-huggingface-api-key-here
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   This will start both the frontend (port 3000) and backend (port 3001) concurrently.

## API Keys Setup

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

### HuggingFace API Key
1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Create a new read token
3. Add it to your `.env` file as `HUGGINGFACE_API_KEY`

## Available Endpoints

### AI Generation
- **POST** `/api/ai/generate`
- **Body:** `{ "prompt": "your art prompt", "provider": "openai" }`
- **Providers:** `openai`, `huggingface`

### Health Check
- **GET** `/api/health`
- Returns server status and available AI services

## Security Features

- ✅ API keys are server-side only
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Fallback responses on service failure
- ✅ Error handling and logging

## Development

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:3001`
- AI endpoint available at `http://localhost:3001/api/ai/generate`

## Production Deployment

For production, make sure to:
1. Set `NODE_ENV=production`
2. Configure proper `FRONTEND_URL`
3. Use environment variables for API keys
4. Set up proper monitoring and logging
5. Configure production rate limits
