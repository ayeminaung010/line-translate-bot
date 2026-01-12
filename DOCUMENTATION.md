# Line Translate Bot - Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Architecture](#architecture)
9. [How It Works](#how-it-works)
10. [Development Guide](#development-guide)

---

## Project Overview

**Line Translate Bot** is a LINE messaging bot that translates incoming text messages in real-time. Users send messages to the bot, and it responds with the translated text using Google's Gemini AI API.

The application is built as a full-stack TypeScript project using:
- **Next.js** for the server/API layer
- **tRPC** for type-safe API procedures
- **LINE Bot SDK** for LINE messaging integration
- **Google Gemini API** for translation AI

---

## Features

- ✅ **Real-time Translation**: Translates messages to English instantly
- ✅ **LINE Integration**: Seamless integration with LINE messaging platform
- ✅ **AI-Powered**: Uses Google Gemini 2.5 Flash model for accurate translations
- ✅ **Type-Safe**: Full TypeScript implementation with tRPC for end-to-end type safety
- ✅ **Webhook Handler**: Secure webhook validation using LINE's signature verification
- ✅ **Monorepo Structure**: Scalable workspace setup using npm workspaces

---

## Project Structure

```
line-translate-bot/
├── apps/
│   └── server/                    # Next.js server application
│       ├── src/
│       │   ├── app/
│       │   │   ├── route.ts       # Health check endpoint (GET /)
│       │   │   └── line-webhook/
│       │   │       └── route.ts   # LINE webhook handler (POST /line-webhook)
│       │   ├── routers/
│       │   │   └── index.ts       # tRPC router definition
│       │   ├── lib/
│       │   │   ├── context.ts     # tRPC context setup
│       │   │   └── trpc.ts        # tRPC initialization
│       │   └── middleware.ts      # Next.js middleware
│       ├── next.config.ts         # Next.js configuration
│       ├── tsconfig.json          # TypeScript configuration
│       └── package.json           # Server dependencies
├── package.json                   # Root workspace configuration
├── README.md                       # Quick start guide
├── DOCUMENTATION.md               # This file
└── API_DOCS.md                    # API endpoints documentation
```

---

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime environment | - |
| **Next.js** | Full-stack React framework | 15.3.0 |
| **TypeScript** | Type safety | ^5 |
| **tRPC** | Type-safe API layer | ^11.4.2 |
| **@line/bot-sdk** | LINE messaging integration | ^10.2.0 |
| **Gemini API** | AI-powered translation | v1beta |
| **React** | UI components | ^19.0.0 |
| **Zod** | Schema validation | ^4.0.13 |

---

## Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v11.4.2 or compatible)
- **LINE Messaging Account** with channel credentials
- **Google Cloud Account** with Gemini API enabled

### Step 1: Clone the Repository

```bash
git clone https://github.com/ayeminaung010/line-translate-bot.git
cd line-translate-bot
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (root + apps).

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `apps/server/` directory with the following variables:

```
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
GEMINI_API_KEY=your_google_gemini_api_key
```

See [Environment Variables](#environment-variables) section for details.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LINE_CHANNEL_ACCESS_TOKEN` | Line Messaging API access token | `jq1234567890abcdefg...` |
| `LINE_CHANNEL_SECRET` | Line channel secret for webhook validation | `abcdef1234567890ghijk...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyD...` |
| `GEMINI_MODEL` *(optional)* | Gemini model identifier (defaults to `gemini-1.5-flash-latest`) | `gemini-1.5-pro-latest` |
| `GOOGLE_TRANSLATE_API_KEY` *(optional)* | Google Cloud Translation API v2 key | `AIzaSyA...` |
| `TRANSLATE_TARGET_LANGUAGE_CODE` *(optional)* | ISO 639-1 code for target language (defaults to `en`) | `ja` |
| `TRANSLATE_TARGET_LANGUAGE_NAME` *(optional)* | Friendly name for target language (defaults to `English`) | `Japanese` |

### How to Obtain Credentials

#### LINE Credentials:
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new Messaging API Channel
3. In the channel settings, find:
   - **Channel Access Token** - Generate or copy existing token
   - **Channel Secret** - Found in the Basic Settings tab

#### Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy the generated key to your environment

---

## Running the Application

### Development Mode

Start the development server with hot reload enabled:

```bash
npm run dev
```

The server will start at: **http://localhost:3000**

To run only the server app:

```bash
npm run dev:server
```

### Build for Production

```bash
npm run build
```

### Start Production Server

After building:

```bash
npm start
```

### Type Checking

Validate TypeScript types across all workspaces:

```bash
npm run check-types
```

---

## Architecture

### Request Flow

```
LINE User Message
        ↓
LINE Platform (POST webhook)
        ↓
/line-webhook endpoint
        ↓
Signature Validation (validateSignature)
        ↓
Event Handler (handleEvent)
        ↓
Translation Service (translateText)
        ↓
Gemini API (Google)
        ↓
Reply Message via LINE API
        ↓
Message sent to user
```

### Component Details

#### 1. **Webhook Handler** (`/line-webhook/route.ts`)
- Receives incoming messages from LINE platform
- Validates webhook signature using channel secret
- Parses webhook events
- Routes to event handler for processing

#### 2. **Event Handler**
- Filters for text message events
- Extracts message content and reply token
- Triggers translation process
- Sends translated text back via LINE API

#### 3. **Translation Service**
- Prefers Google Cloud Translation API v2 when a `GOOGLE_TRANSLATE_API_KEY` is configured
- Falls back to Google Gemini with a translation prompt when no translation API key is available
- Handles API responses, including daily limit errors, and returns friendly fallback messages
- Delivers translated text back to the LINE user

#### 4. **tRPC Router** (`/routers/index.ts`)
- Provides health check procedure: `appRouter.healthCheck`
- Can be extended with additional type-safe procedures
- Used for inter-service communication

#### 5. **Health Check Endpoint** (`/route.ts`)
- Simple `GET /` endpoint
- Returns `{ message: "OK" }`
- Useful for monitoring and deployment checks

---

## How It Works

### Step-by-Step Flow

1. **User sends message to LINE bot**
   - User types a message in LINE chat with the bot

2. **LINE sends webhook**
   - LINE platform sends a POST request to `/line-webhook` endpoint
   - Request includes signature header for validation

3. **Signature validation**
   - Server validates the webhook signature using the channel secret
   - Ensures the request is from LINE (prevents spoofing)

4. **Message extraction**
   - Bot extracts the text message content
   - Gets the reply token for responding

5. **Translation request**
   - If `GOOGLE_TRANSLATE_API_KEY` is set, the bot calls Google Cloud Translation API v2
   - Otherwise, it constructs a Gemini prompt: "Translate [text] to {target language name}"

6. **API response**
   - Gemini API returns translated text
   - Bot extracts the translation from the response

7. **Reply to user**
   - Bot sends the translated text back to user via LINE API
   - Uses the reply token to ensure message appears in correct conversation

8. **Error handling**
   - If translation fails, sends friendly error message
   - Logs errors for debugging

---

## Development Guide

### Adding New Features

#### 1. Adding a new tRPC procedure

Edit `apps/server/src/routers/index.ts`:

```typescript
export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	// Add new procedure here
	newFeature: publicProcedure
		.input(z.object({ name: z.string() }))
		.query(({ input }) => {
			return `Hello, ${input.name}!`;
		}),
});
```

#### 2. Modifying the translation language

Edit `apps/server/src/app/line-webhook/route.ts`, in the `translateText` function:

```typescript
const targetLanguage = "Spanish"; // Change from "English"
```

#### 3. Adding custom message handling

Edit the `handleEvent` function to handle different event types:

```typescript
const handleEvent = async (event: WebhookEvent): Promise<...> => {
	if (event.type === 'message') {
		// Handle messages
	} else if (event.type === 'follow') {
		// Handle follow events
	}
	// Add more event types as needed
};
```

### Debugging Tips

1. **Check webhook signature errors**
   ```
   Invalid signature received.
   ```
   - Verify `LINE_CHANNEL_SECRET` matches the actual secret
   - Ensure the secret hasn't been regenerated

2. **Translation API failures**
   - Check `GEMINI_API_KEY` is valid and has quota
   - Verify API is enabled in Google Cloud console
   - Check network connectivity

3. **View logs in development**
   - Logs appear in terminal where `npm run dev` is running
   - Look for "Translation API call failed" or "Failed to send reply message"

4. **Test the health endpoint**
   ```bash
   curl http://localhost:3000
   ```
   Should return: `{"message":"OK"}`

### Testing the Webhook Locally

You'll need to expose your local server to the internet. Options:

1. **Using ngrok**
   ```bash
   ngrok http 3000
   ```
   Update LINE webhook URL with the ngrok URL

2. **Using Cloudflare Tunnel**
   ```bash
   cloudflared tunnel
   ```

3. **Deploy to staging environment**
   - Use platform like Vercel or Heroku
   - Update webhook URL in LINE console

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid signature" errors | Verify `LINE_CHANNEL_SECRET` in `.env.local` |
| Translation returns error message | Check `GEMINI_API_KEY` and API quota in Google Cloud |
| Bot not responding | Verify webhook URL is correct in LINE console |
| Slow responses | Check Gemini API latency, consider caching translations |
| TypeScript errors | Run `npm run check-types` to validate all types |

---

## Deployment

### Recommended Platforms

- **Vercel** - Easiest for Next.js applications
- **Railway** - Full-stack Node.js support
- **Heroku** - Traditional Node.js hosting
- **AWS Lambda** - Serverless option with API Gateway

### Pre-deployment Checklist

- [ ] Environment variables are set in production platform
- [ ] Webhook URL in LINE console points to production domain
- [ ] Database (if added) is configured
- [ ] Error logging/monitoring is set up
- [ ] HTTPS is enabled on production domain
- [ ] Rate limiting is configured if needed

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run type checking: `npm run check-types`
4. Commit and push: `git push origin feature/your-feature`
5. Create a Pull Request

---

## License

Check the LICENSE file for details.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review LINE Bot SDK documentation: https://developers.line.biz/en/reference/messaging-api/
3. Check Gemini API docs: https://ai.google.dev/api/rest

---

**Last Updated**: January 2026
